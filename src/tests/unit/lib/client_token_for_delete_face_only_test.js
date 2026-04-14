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
    };
    window.localStorage.clear();
  });

  it('stores token in localStorage', () => {
    setClientAccessToken('Bearer token-1');

    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('token-1');
    expect(getClientAccessToken()).toBe('token-1');
  });

  it('setClientAccessToken: ignores empty token', () => {
    setClientAccessToken('   ');

    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getClientAccessToken()).toBeNull();
  });

  it('clearClientAccessToken: removes token from localStorage', () => {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'local-token');

    clearClientAccessToken();

    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getClientAccessToken()).toBeNull();
  });
});
