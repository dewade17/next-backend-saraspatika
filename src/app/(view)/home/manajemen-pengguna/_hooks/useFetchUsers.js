import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

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

  const [users, setUsers] = React.useState([]);
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

  const fetchUsers = React.useCallback(async () => {
    const seq = (requestSeqRef.current += 1);
    setLoading(true);
    try {
      const res = await client.get('/api/users', {
        cache: 'no-store',
        query: {
          q: debouncedQ || undefined,
          page,
          limit: pageSize,
        },
      });
      if (seq !== requestSeqRef.current) return;

      const data = Array.isArray(res?.data) ? res.data : [];
      const meta = res?.meta || {};
      const nextTotal = Number.isFinite(meta.total) ? meta.total : data.length;
      const nextPage = Number.isFinite(meta.page) && meta.page > 0 ? meta.page : page;
      const nextLimit = Number.isFinite(meta.limit) && meta.limit > 0 ? meta.limit : pageSize;

      setUsers(data);
      setTotal(nextTotal);
      setPage(nextPage);
      setPageSize(nextLimit);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      message.errorFrom(err, { fallback: 'Gagal memuat data pengguna' });
      setUsers([]);
      setTotal(0);
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  }, [client, debouncedQ, message, page, pageSize]);

  React.useEffect(() => {
    if (q !== debouncedQ) return;
    fetchUsers();
  }, [debouncedQ, fetchUsers, q]);

  const handlePageChange = React.useCallback((nextPage, nextPageSize) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  }, []);

  return {
    users,
    loading,
    q,
    setQ: updateQuery,
    debouncedQ,
    page,
    pageSize,
    total,
    setPage,
    setPageSize,
    handlePageChange,
    fetchUsers,
    client,
    message,
  };
}
