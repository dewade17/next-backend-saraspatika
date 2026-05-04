import React from 'react';
import dayjs from 'dayjs';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';
import { ABSENSI_MODEL, normalizeAbsensiRow, sortAbsensiRows } from '../_utils/absensiHelpers.js';

const ABSENSI_ENDPOINTS = [
  { path: '/api/absensi', model: ABSENSI_MODEL.SEKOLAH },
  { path: '/api/absensi-wfh', model: ABSENSI_MODEL.WFH },
];

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

  const fetchAbsensiRows = React.useCallback(
    async ({ start_date, end_date, q, limit = 3000 } = {}) => {
      const params = new URLSearchParams();
      if (role) params.set('role', role);
      if (start_date) params.set('start_date', start_date);
      if (end_date) params.set('end_date', end_date);
      if (q) params.set('q', String(q));
      params.set('limit', String(limit));

      const query = params.toString();
      const responses = await Promise.all(ABSENSI_ENDPOINTS.map((endpoint) => client.get(`${endpoint.path}?${query}`, { cache: 'no-store' })));

      const rows = responses.flatMap((res, endpointIndex) => {
        const endpoint = ABSENSI_ENDPOINTS[endpointIndex];
        const data = Array.isArray(res?.data) ? res.data : [];
        return data.map((row, rowIndex) =>
          normalizeAbsensiRow(row, {
            model: endpoint.model,
            index: rowIndex,
          }),
        );
      });

      return sortAbsensiRows(rows);
    },
    [client, role],
  );

  const fetchAbsensi = React.useCallback(
    async ({ q } = {}) => {
      setLoading(true);
      try {
        const start_date = toDateParam(range?.[0]);
        const end_date = toDateParam(range?.[1]);

        const data = await fetchAbsensiRows({ start_date, end_date, q, limit: 3000 });
        setRows(data);
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memuat data absensi.' });
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchAbsensiRows, message, range],
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
    fetchAbsensiRows,
    client,
    message,
  };
}
