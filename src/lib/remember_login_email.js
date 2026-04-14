export const REMEMBER_LOGIN_EMAIL_STORAGE_KEY = 'remembered_login_email';

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

function normalizeEmail(email) {
  const value = String(email ?? '').trim();
  return value || null;
}

export function loadRememberedLoginEmail() {
  return normalizeEmail(safeGetLocalStorage(REMEMBER_LOGIN_EMAIL_STORAGE_KEY));
}

export function saveRememberedLoginEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    clearRememberedLoginEmail();
    return null;
  }

  safeSetLocalStorage(REMEMBER_LOGIN_EMAIL_STORAGE_KEY, normalizedEmail);
  return normalizedEmail;
}

export function clearRememberedLoginEmail() {
  safeRemoveLocalStorage(REMEMBER_LOGIN_EMAIL_STORAGE_KEY);
}
