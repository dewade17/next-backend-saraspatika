import React from 'react';
import { createHttpClient } from '@/lib/http_client.js';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export function useFetchFaceResetRequests() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = React.useState(0);
  const [pendingCount, setPendingCount] = React.useState(0);
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
      const [res, pendingRes] = await Promise.all([
        client.get('/api/face-reset-request', {
          cache: 'no-store',
          query: {
            q: debouncedQ || undefined,
            page,
            limit: pageSize,
          },
        }),
        client.get('/api/face-reset-request', {
          cache: 'no-store',
          query: {
            status: 'MENUNGGU',
            page: 1,
            limit: 1,
          },
        }),
      ]);
      if (seq !== requestSeqRef.current) return;

      const payload = Array.isArray(res?.data) ? res.data : [];
      const meta = res?.meta || {};
      setRows(payload);
      setTotal(Number.isFinite(meta.total) ? meta.total : payload.length);
      setPendingCount(Number.isFinite(pendingRes?.meta?.total) ? pendingRes.meta.total : 0);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      message.errorFrom(err, { fallback: 'Gagal memuat data reset face' });
      setRows([]);
      setTotal(0);
      setPendingCount(0);
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
    pendingCount,
    handlePageChange,
    refresh: fetchRows,
  };
}
