import React from 'react';
import { createHttpClient } from '@/lib/http_client.js'; //
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

export function useFetchUsers() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/users', { cache: 'no-store' });
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data pengguna' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  // Logika Filter yang dipindahkan dari page.jsx
  const filtered = React.useMemo(() => {
    const s = String(q || '')
      .trim()
      .toLowerCase();
    if (!s) return rows;

    return rows.filter((user) => {
      const hay = [user?.name, user?.email, user?.nip, user?.nomor_handphone, user?.role, user?.status].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(s);
    });
  }, [rows, q]);

  React.useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return {
    rows: filtered,
    loading,
    q,
    setQ,
    refresh: fetchRows,
  };
}
