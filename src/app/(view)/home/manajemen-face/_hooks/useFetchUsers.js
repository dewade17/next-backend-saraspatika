import React from 'react';
import { createHttpClient } from '@/lib/http_client.js'; //
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

const DEFAULT_PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export function useFetchUsers() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = React.useState(0);
  const debouncedQ = useDebouncedValue(q, SEARCH_DEBOUNCE_MS);
  const requestSeqRef = React.useRef(0);

  const updateQuery = React.useCallback((next) => {
    setQ(String(next ?? ''));
    setPage(1);
  }, []);

  const fetchRows = React.useCallback(async () => {
    const seq = (requestSeqRef.current += 1);
    setLoading(true);
    try {
      const res = await client.get('/api/faces', {
        cache: 'no-store',
        query: {
          q: debouncedQ || undefined,
          page,
          limit: pageSize,
        },
      });
      if (seq !== requestSeqRef.current) return;

      const payload = Array.isArray(res?.data) ? res.data : [];
      const meta = res?.meta || {};
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
      setTotal(Number.isFinite(meta.total) ? meta.total : payload.length);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      message.errorFrom(err, { fallback: 'Gagal memuat data face' });
      setRows([]);
      setTotal(0);
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  }, [client, debouncedQ, message, page, pageSize]);

  React.useEffect(() => {
    if (q !== debouncedQ) return;
    fetchRows();
  }, [debouncedQ, fetchRows, q]);

  const handlePageChange = React.useCallback((nextPage, nextPageSize) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  }, []);

  return {
    rows,
    loading,
    q,
    setQ: updateQuery,
    page,
    pageSize,
    total,
    handlePageChange,
    refresh: fetchRows,
  };
}
