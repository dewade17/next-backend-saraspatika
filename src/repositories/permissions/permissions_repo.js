import { prisma } from '@/lib/db.js';

export async function findAllRolesWithPermissions() {
  return await prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: {
      role_permissions: {
        include: { permission: true },
      },
    },
  });
}

export async function findAllPermissions() {
  return await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });
}

export async function updateRolePermissions(id_role, permissionIds) {
  return await prisma.$transaction(async (tx) => {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      await tx.rolePermission.deleteMany({ where: { id_role } });
      return;
    }

    await tx.rolePermission.deleteMany({
      where: {
        id_role,
        NOT: {
          id_permission: { in: permissionIds },
        },
      },
    });

    const data = permissionIds.map((id_permission) => ({ id_role, id_permission }));
    await tx.rolePermission.createMany({ data, skipDuplicates: true });
  });
}

export async function findUserRolesWithPermissions(id_user) {
  return await prisma.userRole.findMany({
    where: { id_user },
    select: {
      role: {
        select: {
          id_role: true,
          name: true,
          role_permissions: {
            select: {
              permission: {
                select: {
                  id_permission: true,
                  resource: true,
                  action: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function findUserPermissionOverrides(id_user) {
  return await prisma.userPermissionOverride.findMany({
    where: { id_user },
    select: {
      id_permission: true,
      grant: true,
    },
  });
}

export async function replaceUserPermissionOverrides(id_user, overrides) {
  return await prisma.$transaction(async (tx) => {
    if (!Array.isArray(overrides) || overrides.length === 0) {
      await tx.userPermissionOverride.deleteMany({ where: { id_user } });
      return;
    }

    const ids = overrides.map((override) => override.id_permission);
    await tx.userPermissionOverride.deleteMany({
      where: {
        id_user,
        NOT: {
          id_permission: { in: ids },
        },
      },
    });

    await Promise.all(
      overrides.map((override) =>
        tx.userPermissionOverride.upsert({
          where: {
            id_user_id_permission: {
              id_user,
              id_permission: override.id_permission,
            },
          },
          update: { grant: override.grant },
          create: {
            id_user,
            id_permission: override.id_permission,
            grant: override.grant,
          },
        }),
      ),
    );
  });
}
