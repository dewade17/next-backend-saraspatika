import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useFetchAgenda() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchAgenda = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/agenda', { cache: 'no-store' });
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data agenda' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  return {
    rows,
    loading,
    fetchAgenda,
    client,
    message,
  };
}
