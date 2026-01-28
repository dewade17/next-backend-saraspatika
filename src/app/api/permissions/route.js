import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { getUserPermissionMatrix, updateUserPermissionOverrides } from '@/services/permissions/permissions_service.js';

export const runtime = 'nodejs';

async function requirePerm(resource, action) {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch (err) {
    throw unauthorized('Token tidak valid', { code: 'token_invalid', cause: err });
  }

  const id_user = String(payload?.sub || '').trim();
  if (!id_user) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  const perms = payload?.perms || [];
  let allowed = canFromClaims(perms, resource, action);

  if (!allowed) {
    const set = await getPermSet(id_user);
    allowed = set.has(`${String(resource).toLowerCase()}:${String(action).toLowerCase()}`);
  }

  if (!allowed) throw forbidden('Forbidden', { code: 'forbidden' });

  return { id_user };
}

export const GET = apiRoute(async (req) => {
  await requirePerm('pengguna', 'read');

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  const data = userId ? await getUserPermissionMatrix(userId) : null;

  return NextResponse.json(
    { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const PUT = apiRoute(async (req) => {
  await requirePerm('pengguna', 'update');

  const body = await req.json();
  const result = await updateUserPermissionOverrides(body?.userId, body?.permissions);

  return NextResponse.json(
    { ok: true, data: result },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

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
