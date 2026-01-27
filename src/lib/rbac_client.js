/**
 * Client-safe RBAC helpers (NO Prisma / NO DB / NO Node modules).
 * Permission key format: "resource:action" (lowercase).
 */

/**
 * @param {any} v
 * @returns {string}
 */
function norm(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase();
}

/**
 * @param {string} resource
 * @param {string} action
 * @returns {string} normalized key "resource:action" or "" if invalid
 */
export function permKey(resource, action) {
  const r = norm(resource);
  const a = norm(action);
  if (!r || !a) return '';
  return `${r}:${a}`;
}

const EMPTY_SET = new Set();
const _weakSetCache = new WeakMap();

/**
 * Accepts perms as Array<string> or Set<string>. Returns Set<string> lowercased.
 * Uses WeakMap cache for array identity.
 *
 * @param {string[] | Set<string> | null | undefined} perms
 * @returns {Set<string>}
 */
export function toPermSet(perms) {
  if (!perms) return EMPTY_SET;

  if (perms instanceof Set) {
    if (perms.size === 0) return EMPTY_SET;
    // Ensure normalized (but avoid copying if already looks normalized)
    let needsNormalize = false;
    for (const p of perms) {
      const s = String(p ?? '');
      if (s !== s.toLowerCase()) {
        needsNormalize = true;
        break;
      }
    }
    if (!needsNormalize) return perms;

    const out = new Set();
    for (const p of perms) {
      const s = norm(p);
      if (s) out.add(s);
    }
    return out;
  }

  if (!Array.isArray(perms) || perms.length === 0) return EMPTY_SET;

  const cached = _weakSetCache.get(perms);
  if (cached) return cached;

  const out = new Set();
  for (const p of perms) {
    const s = norm(p);
    if (s) out.add(s);
  }

  _weakSetCache.set(perms, out);
  return out;
}

/**
 * Check single permission against claims.
 * @param {string[] | Set<string>} perms
 * @param {string} resource
 * @param {string} action
 * @returns {boolean}
 */
export function canFromClaims(perms, resource, action) {
  const k = permKey(resource, action);
  if (!k) return false;
  return toPermSet(perms).has(k);
}

/**
 * All requirements must pass.
 * @param {string[] | Set<string>} perms
 * @param {{resource:string, action:string}[]} requirements
 */
export function canAllFromClaims(perms, requirements) {
  if (!Array.isArray(requirements) || requirements.length === 0) return true;
  const set = toPermSet(perms);
  for (const req of requirements) {
    const k = permKey(req?.resource, req?.action);
    if (!k || !set.has(k)) return false;
  }
  return true;
}

/**
 * Any requirement passes.
 * @param {string[] | Set<string>} perms
 * @param {{resource:string, action:string}[]} requirements
 */
export function canAnyFromClaims(perms, requirements) {
  if (!Array.isArray(requirements) || requirements.length === 0) return false;
  const set = toPermSet(perms);
  for (const req of requirements) {
    const k = permKey(req?.resource, req?.action);
    if (k && set.has(k)) return true;
  }
  return false;
}

/**
 * Convenience builder: returns stable checker functions.
 * @param {string[] | Set<string>} perms
 */
export function createPermissionChecker(perms) {
  const set = toPermSet(perms);
  return {
    can: (resource, action) => {
      const k = permKey(resource, action);
      return !!k && set.has(k);
    },
    canAll: (requirements) => canAllFromClaims(set, requirements),
    canAny: (requirements) => canAnyFromClaims(set, requirements),
    set,
  };
}
