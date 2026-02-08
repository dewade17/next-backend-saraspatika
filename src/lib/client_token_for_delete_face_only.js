export const AUTH_TOKEN_STORAGE_KEY = 'access_token';

function safeGetLocalStorage(key) {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSetLocalStorage(key, value) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveLocalStorage(key) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
}

export function normalizeJwtToken(token) {
  const t = String(token || '').trim();
  if (!t) return null;
  return t.toLowerCase().startsWith('bearer ') ? t.slice(7).trim() : t;
}

export function getClientAccessToken() {
  return safeGetLocalStorage(AUTH_TOKEN_STORAGE_KEY);
}

export function setClientAccessToken(token) {
  const t = normalizeJwtToken(token);
  if (!t) return;
  safeSetLocalStorage(AUTH_TOKEN_STORAGE_KEY, t);
}

export function clearClientAccessToken() {
  safeRemoveLocalStorage(AUTH_TOKEN_STORAGE_KEY);
}
