export const AUTH_TOKEN_STORAGE_KEY = 'access_token';

function getStorage(storageType) {
  if (typeof window === 'undefined') return null;
  return storageType === 'session' ? window.sessionStorage ?? null : window.localStorage ?? null;
}

function safeGetStorage(storageType, key) {
  try {
    return getStorage(storageType)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSetStorage(storageType, key, value) {
  try {
    getStorage(storageType)?.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveStorage(storageType, key) {
  try {
    getStorage(storageType)?.removeItem(key);
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
  return safeGetStorage('session', AUTH_TOKEN_STORAGE_KEY) ?? safeGetStorage('local', AUTH_TOKEN_STORAGE_KEY);
}

export function setClientAccessToken(token, options = {}) {
  const t = normalizeJwtToken(token);
  if (!t) return;
  clearClientAccessToken();
  safeSetStorage(options?.rememberMe === true ? 'local' : 'session', AUTH_TOKEN_STORAGE_KEY, t);
}

export function clearClientAccessToken() {
  safeRemoveStorage('session', AUTH_TOKEN_STORAGE_KEY);
  safeRemoveStorage('local', AUTH_TOKEN_STORAGE_KEY);
}
