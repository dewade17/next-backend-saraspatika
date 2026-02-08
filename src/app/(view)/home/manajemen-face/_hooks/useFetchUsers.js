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
      const res = await client.get('/api/faces', { cache: 'no-store' });
      const payload = Array.isArray(res?.data) ? res.data : [];
      const normalized = payload.map((item) => {
        const user = item?.user || {};
        return {
          ...user,
          ...item,
          id_user: item?.id_user ?? user?.id_user,
          face_registered_at: item?.created_at,
        };
      });
      setRows(normalized);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data face' });
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
