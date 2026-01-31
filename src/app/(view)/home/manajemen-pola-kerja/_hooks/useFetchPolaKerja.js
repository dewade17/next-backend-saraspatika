import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useFetchPolaKerja() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchPolaKerja = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/pola-kerja', { cache: 'no-store' });
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data pola kerja' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchPolaKerja();
  }, [fetchPolaKerja]);

  return {
    rows,
    loading,
    fetchPolaKerja,
    client,
    message,
  };
}
