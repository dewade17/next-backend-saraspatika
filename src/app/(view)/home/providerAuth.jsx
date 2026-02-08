'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppNotification } from '@/app/(view)/components_shared/AppNotification.jsx';
import { clearClientAccessToken } from '@/lib/client_token_for_delete_face_only.js';

const AuthContext = React.createContext(null);

const AUTH_STORAGE_KEYS = Object.freeze({
  id_user: 'id_user',
});

function safeSetLocalStorage(key, value) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function safeRemoveLocalStorage(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

function clearAuthStorage() {
  safeRemoveLocalStorage(AUTH_STORAGE_KEYS.id_user);
  clearClientAccessToken();
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <ProviderAuth />');
  return ctx;
}

export default function ProviderAuth({ children, initialUser = null, initialPerms = [] }) {
  const router = useRouter();
  const notify = useAppNotification();

  const [user, setUser] = React.useState(initialUser);
  const [perms, setPerms] = React.useState(Array.isArray(initialPerms) ? initialPerms : []);
  const [isLoadingUser, setIsLoadingUser] = React.useState(!initialUser);

  const isActiveRef = React.useRef(true);
  const isLoadingRef = React.useRef(false);

  const setAuthState = React.useCallback((data) => {
    const nextPerms = Array.isArray(data?.permissions) ? data.permissions : [];
    setUser(data ?? null);
    setPerms(nextPerms);

    const id_user = data?.id_user;
    if (id_user != null) safeSetLocalStorage(AUTH_STORAGE_KEYS.id_user, String(id_user));
    else clearAuthStorage();
  }, []);

  React.useEffect(() => {
    if (initialUser?.id_user != null) safeSetLocalStorage(AUTH_STORAGE_KEYS.id_user, String(initialUser.id_user));
  }, [initialUser]);

  const loadUser = React.useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const res = await fetch('/api/auth/getdataprivate', { cache: 'no-store' });

      if (res.status === 401) {
        clearAuthStorage();
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error('Failed to load user');

      const data = await res.json();
      if (!isActiveRef.current) return;

      setAuthState(data);
    } catch (error) {
      clearAuthStorage();
      notify.error('Sesi Berakhir', 'Silakan login kembali.');
      router.push('/login');
    } finally {
      if (isActiveRef.current) setIsLoadingUser(false);
      isLoadingRef.current = false;
    }
  }, [notify, router, setAuthState]);

  React.useEffect(() => {
    isActiveRef.current = true;

    if (!initialUser && !user) loadUser();

    return () => {
      isActiveRef.current = false;
    };
  }, [initialUser, user, loadUser]);

  const logout = React.useCallback(async () => {
    let logoutFailed = false;

    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) logoutFailed = true;
    } catch {
      logoutFailed = true;
    } finally {
      clearAuthStorage();
      setUser(null);
      setPerms([]);

      if (logoutFailed) {
        notify.error('Gagal Logout', 'Sesi lokal sudah dibersihkan, silakan login kembali.');
      }

      router.push('/login');
    }
  }, [notify, router]);

  const value = React.useMemo(
    () => ({
      user,
      perms,
      isLoadingUser,
      id_user: user?.id_user ?? null,
      refreshUser: loadUser,
      logout,
      clearAuthStorage,
    }),
    [user, perms, isLoadingUser, loadUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
