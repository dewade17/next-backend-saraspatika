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
