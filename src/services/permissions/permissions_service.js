import { badRequest } from '@/lib/error.js';
import { clearPermCache } from '@/lib/rbac_server.js';
import { findAllPermissions, findAllRolesWithPermissions, updateRolePermissions } from '@/repositories/permissions/permissions_repo.js';

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
