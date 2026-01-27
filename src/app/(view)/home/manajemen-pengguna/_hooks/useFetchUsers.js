import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useFetchUsers() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/users', { cache: 'no-store' });
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data pengguna' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    q,
    setQ,
    fetchUsers,
    client,
    message,
  };
}
