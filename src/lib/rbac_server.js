import { prisma } from '@/lib/db.js';

const TTL = 60_000;
const cache = new Map(); // id_user -> { set:Set<string>, at:number }

const key = (r, a) => `${String(r).toLowerCase()}:${String(a).toLowerCase()}`;

async function fetchSet(id_user) {
  const set = new Set();

  // Role-derived permissions
  const roles = await prisma.userRole.findMany({
    where: { id_user },
    select: {
      role: {
        select: {
          role_permissions: {
            select: {
              permission: { select: { resource: true, action: true } },
            },
          },
        },
      },
    },
  });

  for (const ur of roles) {
    const perms = ur?.role?.role_permissions || [];
    for (const rp of perms) {
      const p = rp?.permission;
      if (p?.resource && p?.action) set.add(key(p.resource, p.action));
    }
  }

  // Per-user overrides (grant=true adds, grant=false removes)
  const overrides = await prisma.userPermissionOverride.findMany({
    where: { id_user },
    select: {
      grant: true,
      permission: { select: { resource: true, action: true } },
    },
  });

  for (const o of overrides) {
    const p = o?.permission;
    if (!p?.resource || !p?.action) continue;
    const k = key(p.resource, p.action);
    if (o.grant) set.add(k);
    else set.delete(k);
  }

  return set;
}

export async function getPermSet(id_user) {
  const now = Date.now();
  const hit = cache.get(id_user);
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

export function clearPermCache(id_user) {
  if (id_user) cache.delete(id_user);
  else cache.clear();
}
