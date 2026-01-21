import { vi } from 'vitest';

// --- Mock cookies() dari next/headers ---
const cookieData = new Map();
let lastSet = null;

const cookieStore = {
  get: vi.fn((name) => {
    const val = cookieData.get(name);
    if (val == null) return undefined;
    return { name, value: val };
  }),
  set: vi.fn((name, value, opts) => {
    cookieData.set(name, value);
    lastSet = { name, value, opts };
  }),
};

function __resetCookies() {
  cookieData.clear();
  lastSet = null;
  cookieStore.get.mockClear();
  cookieStore.set.mockClear();
}

function __setCookie(name, value) {
  cookieData.set(name, value);
}

function __getLastSet() {
  return lastSet;
}

function __getCookieData() {
  return cookieData;
}

vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
  __resetCookies,
  __setCookie,
  __getLastSet,
  __getCookieData,
}));

// --- Mock NextResponse dari next/server ---
vi.mock('next/server', () => {
  const json = (body, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify(body), { status: init.status ?? 200, headers });
  };

  const redirect = (url, init = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set('Location', url.toString());
    return new Response(null, { status: init.status ?? 307, headers });
  };

  const next = () => new Response(null, { status: 200 });

  return { NextResponse: { json, redirect, next } };
});
