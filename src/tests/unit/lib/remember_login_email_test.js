import { beforeEach, describe, expect, it } from 'vitest';
import {
  REMEMBER_LOGIN_EMAIL_STORAGE_KEY,
  clearRememberedLoginEmail,
  loadRememberedLoginEmail,
  saveRememberedLoginEmail,
} from '@/lib/remember_login_email.js';

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

describe('lib/remember_login_email', () => {
  beforeEach(() => {
    globalThis.window = {
      localStorage: createStorageMock(),
    };
    window.localStorage.clear();
  });

  it('saveRememberedLoginEmail: trims and stores email', () => {
    const saved = saveRememberedLoginEmail('  user@example.com  ');

    expect(saved).toBe('user@example.com');
    expect(window.localStorage.getItem(REMEMBER_LOGIN_EMAIL_STORAGE_KEY)).toBe('user@example.com');
    expect(loadRememberedLoginEmail()).toBe('user@example.com');
  });

  it('saveRememberedLoginEmail: clears storage when email empty', () => {
    window.localStorage.setItem(REMEMBER_LOGIN_EMAIL_STORAGE_KEY, 'user@example.com');

    const saved = saveRememberedLoginEmail('   ');

    expect(saved).toBeNull();
    expect(window.localStorage.getItem(REMEMBER_LOGIN_EMAIL_STORAGE_KEY)).toBeNull();
    expect(loadRememberedLoginEmail()).toBeNull();
  });

  it('clearRememberedLoginEmail: removes stored email', () => {
    window.localStorage.setItem(REMEMBER_LOGIN_EMAIL_STORAGE_KEY, 'user@example.com');

    clearRememberedLoginEmail();

    expect(window.localStorage.getItem(REMEMBER_LOGIN_EMAIL_STORAGE_KEY)).toBeNull();
    expect(loadRememberedLoginEmail()).toBeNull();
  });
});
