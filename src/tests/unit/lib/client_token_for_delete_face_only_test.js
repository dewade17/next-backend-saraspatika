import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_TOKEN_STORAGE_KEY, clearClientAccessToken, getClientAccessToken, setClientAccessToken } from '@/lib/client_token_for_delete_face_only.js';

function createStorageMock() {
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };
}

describe('lib/client_token_for_delete_face_only', () => {
  beforeEach(() => {
    globalThis.window = {
      localStorage: createStorageMock(),
      sessionStorage: createStorageMock(),
    };
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores token in sessionStorage by default', () => {
    setClientAccessToken('Bearer token-1');

    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('token-1');
    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getClientAccessToken()).toBe('token-1');
  });

  it('stores token in localStorage when rememberMe enabled', () => {
    setClientAccessToken('token-2', { rememberMe: true });

    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('token-2');
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getClientAccessToken()).toBe('token-2');
  });

  it('clearClientAccessToken: removes token from both storages', () => {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'local-token');
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'session-token');

    clearClientAccessToken();

    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getClientAccessToken()).toBeNull();
  });
});
