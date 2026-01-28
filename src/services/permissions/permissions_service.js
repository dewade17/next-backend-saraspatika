import { badRequest } from '@/lib/error.js';
import { clearPermCache } from '@/lib/rbac_server.js';
import { getUserById } from '@/repositories/users/user_repo.js';
import { findAllPermissions, findAllRolesWithPermissions, findUserPermissionOverrides, findUserRolesWithPermissions, replaceUserPermissionOverrides, updateRolePermissions } from '@/repositories/permissions/permissions_repo.js';

function norm(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase();
}

const ACTION_ORDER = ['create', 'read', 'update', 'delete'];

function actionRank(action) {
  const idx = ACTION_ORDER.indexOf(action);
  return idx >= 0 ? idx : ACTION_ORDER.length;
}

function sortActions(a, b) {
  const ar = actionRank(a.action);
  const br = actionRank(b.action);
  if (ar !== br) return ar - br;
  return a.action.localeCompare(b.action);
}

export async function getPermissionMatrix() {
  try {
    const [roles, permissions] = await Promise.all([findAllRolesWithPermissions(), findAllPermissions()]);

    const rolePermMap = new Map();
    for (const role of roles) {
      const set = new Set();
      for (const rp of role.role_permissions || []) {
        if (rp?.permission?.id_permission) set.add(rp.permission.id_permission);
      }
      rolePermMap.set(role.id_role, set);
    }

    const resourceMap = new Map();
    for (const perm of permissions) {
      const resource = norm(perm.resource);
      const action = norm(perm.action);

      const entry = resourceMap.get(resource) || { resource, actions: [] };
      const rolesStatus = {};

      for (const role of roles) {
        const set = rolePermMap.get(role.id_role);
        rolesStatus[role.id_role] = set ? set.has(perm.id_permission) : false;
      }

      entry.actions.push({
        id_permission: perm.id_permission,
        action,
        roles: rolesStatus,
      });

      resourceMap.set(resource, entry);
    }

    const resources = Array.from(resourceMap.values()).map((entry) => ({
      resource: entry.resource,
      actions: entry.actions.sort(sortActions),
    }));

    resources.sort((a, b) => a.resource.localeCompare(b.resource));

    return {
      roles: roles.map((role) => ({
        id_role: role.id_role,
        name: role.name,
        description: role.description,
      })),
      resources,
    };
  } catch (err) {
    throw err;
  }
}

export async function updatePermission(roleId, permissions) {
  try {
    const id_role = String(roleId || '').trim();
    if (!id_role) throw badRequest('Role tidak valid', { code: 'role_invalid' });

    if (!Array.isArray(permissions)) {
      throw badRequest('Permissions harus berupa array', { code: 'permissions_invalid' });
    }

    const desiredIds = Array.from(new Set(permissions.map((id) => String(id || '').trim()).filter(Boolean)));

    const roles = await findAllRolesWithPermissions();
    const role = roles.find((r) => r.id_role === id_role);
    if (!role) throw badRequest('Role tidak ditemukan', { code: 'role_not_found', status: 404 });

    const existingPerms = await findAllPermissions();
    const existingIds = new Set(existingPerms.map((p) => p.id_permission));
    const unknownIds = desiredIds.filter((id) => !existingIds.has(id));

    if (unknownIds.length > 0) {
      throw badRequest('Terdapat permission tidak dikenal', { code: 'permission_unknown', errors: { ids: unknownIds } });
    }

    await updateRolePermissions(id_role, desiredIds);
    clearPermCache();

    return { id_role, count: desiredIds.length };
  } catch (err) {
    throw err;
  }
}

function normalizePermissionOverrides(overrides) {
  if (!Array.isArray(overrides)) return [];

  const map = new Map();
  for (const override of overrides) {
    const id_permission = String(override?.id_permission ?? override?.id ?? '').trim();
    if (!id_permission) continue;
    map.set(id_permission, { id_permission, grant: Boolean(override?.grant) });
  }
  return Array.from(map.values());
}

export async function getUserPermissionMatrix(userId) {
  try {
    const id_user = String(userId || '').trim();
    if (!id_user) throw badRequest('User tidak valid', { code: 'user_invalid' });

    const user = await getUserById(id_user);
    if (!user) throw badRequest('User tidak ditemukan', { code: 'user_not_found', status: 404 });

    const [userRoles, permissions, overrides] = await Promise.all([findUserRolesWithPermissions(id_user), findAllPermissions(), findUserPermissionOverrides(id_user)]);

    const rolePermissionIds = new Set();
    const roleList = [];
    for (const entry of userRoles) {
      const role = entry?.role;
      if (!role) continue;
      roleList.push({
        id_role: role.id_role,
        name: role.name,
      });
      for (const rp of role.role_permissions || []) {
        const perm = rp?.permission;
        if (perm?.id_permission) rolePermissionIds.add(perm.id_permission);
      }
    }

    const overrideMap = new Map();
    for (const override of overrides) {
      if (!override?.id_permission) continue;
      overrideMap.set(override.id_permission, Boolean(override.grant));
    }

    const resourceMap = new Map();
    for (const perm of permissions) {
      const resource = norm(perm.resource);
      const action = norm(perm.action);
      const baseGranted = rolePermissionIds.has(perm.id_permission);
      const overrideValue = overrideMap.has(perm.id_permission) ? overrideMap.get(perm.id_permission) : null;

      const entry = resourceMap.get(resource) || { resource, actions: [] };
      entry.actions.push({
        id_permission: perm.id_permission,
        action,
        granted: overrideValue === null ? baseGranted : overrideValue,
        fromRole: baseGranted,
        override: overrideValue === null ? null : { grant: overrideValue },
      });
      resourceMap.set(resource, entry);
    }

    const resources = Array.from(resourceMap.values()).map((entry) => ({
      resource: entry.resource,
      actions: entry.actions.sort(sortActions),
    }));

    resources.sort((a, b) => a.resource.localeCompare(b.resource));

    return {
      user: {
        id_user: user.id_user,
        name: user.name,
        email: user.email,
      },
      roles: roleList,
      resources,
    };
  } catch (err) {
    throw err;
  }
}

export async function updateUserPermissionOverrides(userId, permissions) {
  try {
    const id_user = String(userId || '').trim();
    if (!id_user) throw badRequest('User tidak valid', { code: 'user_invalid' });

    const user = await getUserById(id_user);
    if (!user) throw badRequest('User tidak ditemukan', { code: 'user_not_found', status: 404 });

    if (!Array.isArray(permissions)) {
      throw badRequest('Permissions harus berupa array', { code: 'permissions_invalid' });
    }

    const overrides = normalizePermissionOverrides(permissions);

    const existingPerms = await findAllPermissions();
    const existingIds = new Set(existingPerms.map((perm) => perm.id_permission));
    const unknownIds = overrides.map((override) => override.id_permission).filter((id) => !existingIds.has(id));

    if (unknownIds.length > 0) {
      throw badRequest('Terdapat permission tidak dikenal', { code: 'permission_unknown', errors: { ids: unknownIds } });
    }

    await replaceUserPermissionOverrides(id_user, overrides);
    clearPermCache(id_user);

    return { id_user, count: overrides.length };
  } catch (err) {
    throw err;
  }
}
