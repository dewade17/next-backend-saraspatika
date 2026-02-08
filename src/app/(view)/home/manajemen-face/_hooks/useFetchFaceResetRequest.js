import React from 'react';
import { createHttpClient } from '@/lib/http_client.js';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

export function useFetchFaceResetRequests() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/face-reset-request', { cache: 'no-store' });
      const payload = Array.isArray(res?.data) ? res.data : [];
      setRows(payload);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data reset face' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return {
    rows,
    loading,
    refresh: fetchRows,
  };
}
