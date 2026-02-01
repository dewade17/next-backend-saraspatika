'use client';

import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useShiftGridData() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [users, setUsers] = React.useState([]);
  const [patterns, setPatterns] = React.useState([]);

  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [loadingPatterns, setLoadingPatterns] = React.useState(true);

  const fetchUsers = React.useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await client.get('/api/users', { cache: 'no-store' });
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data karyawan' });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [client, message]);

  const fetchPatterns = React.useCallback(async () => {
    setLoadingPatterns(true);
    try {
      const res = await client.get('/api/pola-kerja', { cache: 'no-store' });
      setPatterns(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data pola jam kerja' });
      setPatterns([]);
    } finally {
      setLoadingPatterns(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchUsers();
    fetchPatterns();
  }, [fetchUsers, fetchPatterns]);

  return {
    client,
    message,
    users,
    patterns,
    loadingUsers,
    loadingPatterns,
    refetch: async () => {
      await Promise.all([fetchUsers(), fetchPatterns()]);
    },
  };
}
