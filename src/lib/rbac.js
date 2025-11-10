import { prisma } from '@/src/lib/db.js';
const TTL = 60_000;
const cache = new Map(); // id_user -> { set:Set<string>, at:number }
const VALID = new Set(['create', 'read', 'update', 'delete']);
const key = (r, a) => `${r.toLowerCase()}:${a.toLowerCase()}`;

async function fetchSet(id_user) {
  const roles = await prisma.userRole.findMany({
    where: { id_user },
    select: {
      role: {
        select: {
          role_permissions: {
            select: { permission: { select: { resource: true, action: true } } },
          },
        },
      },
    },
  });
  const overrides = await prisma.userPermissionOverride.findMany({
    where: { id_user },
    select: { grant: true, permission: { select: { resource: true, action: true } } },
  });

  const set = new Set(roles.flatMap((r) => r.role.role_permissions.map((g) => key(g.permission.resource, g.permission.action)).filter((k) => VALID.has(k.split(':')[1]))));
  for (const o of overrides) {
    const k = key(o.permission.resource, o.permission.action);
    if (!VALID.has(k.split(':')[1])) continue;
    o.grant ? set.add(k) : set.delete(k);
  }
  return set;
}

export async function getPermSet(id_user) {
  const hit = cache.get(id_user),
    now = Date.now();
  if (hit && now - hit.at < TTL) return hit.set;
  const set = await fetchSet(id_user);
  cache.set(id_user, { set, at: now });
  return set;
}
export async function can(id_user, resource, action) {
  const set = await getPermSet(id_user);
  return set.has(key(resource, action));
}
export function canFromClaims(perms, resource, action) {
  return Array.isArray(perms) && perms.includes(key(resource, action));
}
