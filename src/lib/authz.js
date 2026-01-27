import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt.js';
import { getPermSet, canFromClaims } from '@/lib/rbac_server.js';

async function ctx() {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) return { id_user: null, perms: [] };
  try {
    const p = await verifyAccessToken(token);
    return { id_user: p.sub, perms: p.perms || [] };
  } catch {
    return { id_user: null, perms: [] };
  }
}

export function requireCrud(resource, action, handler) {
  return async (req) => {
    const { id_user, perms } = await ctx();
    if (!id_user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    let allowed = canFromClaims(perms, resource, action);
    if (!allowed) {
      const set = await getPermSet(id_user);
      allowed = set.has(`${resource}:${action}`);
    }
    if (!allowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    return handler(req, { id_user });
  };
}
