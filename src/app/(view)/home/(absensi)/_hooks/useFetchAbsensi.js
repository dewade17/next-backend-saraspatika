import React from 'react';
import dayjs from 'dayjs';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

function toDateParam(d) {
  if (!d) return null;
  const x = dayjs(d);
  return x.isValid() ? x.format('YYYY-MM-DD') : null;
}

export function useFetchAbsensi({ role }) {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const [range, setRange] = React.useState(() => {
    const start = dayjs().startOf('day');
    const end = dayjs().endOf('day');
    return [start, end];
  });

  const fetchAbsensi = React.useCallback(
    async ({ q } = {}) => {
      setLoading(true);
      try {
        const start_date = toDateParam(range?.[0]);
        const end_date = toDateParam(range?.[1]);

        const params = new URLSearchParams();
        if (role) params.set('role', role);
        if (start_date) params.set('start_date', start_date);
        if (end_date) params.set('end_date', end_date);
        if (q) params.set('q', String(q));
        params.set('limit', '3000');

        const res = await client.get(`/api/absensi?${params.toString()}`, { cache: 'no-store' });
        const data = Array.isArray(res?.data) ? res.data : [];
        setRows(data);
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memuat data absensi.' });
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [client, message, range, role],
  );

  React.useEffect(() => {
    fetchAbsensi();
  }, [fetchAbsensi]);

  return {
    rows,
    loading,
    range,
    setRange,
    fetchAbsensi,
    client,
    message,
  };
}
  