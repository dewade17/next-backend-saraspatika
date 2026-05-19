import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';
import { mapLocationFromApi } from '../_utils/locationHelpers';

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

export function useFetchLocations() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [locations, setLocations] = React.useState([]);
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

  const fetchLocations = React.useCallback(async () => {
    const seq = (requestSeqRef.current += 1);
    setLoading(true);
    try {
      const res = await client.get('/api/lokasi', {
        cache: 'no-store',
        query: {
          q: debouncedQ || undefined,
          page,
          limit: pageSize,
        },
      });
      if (seq !== requestSeqRef.current) return;

      const rows = Array.isArray(res?.data) ? res.data : [];
      const meta = res?.meta || {};
      setLocations(rows.map(mapLocationFromApi).filter(Boolean));
      setTotal(Number.isFinite(meta.total) ? meta.total : rows.length);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      message.errorFrom(err, { fallback: 'Gagal memuat data lokasi.' });
      setLocations([]);
      setTotal(0);
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  }, [client, debouncedQ, message, page, pageSize]);

  React.useEffect(() => {
    if (q !== debouncedQ) return;
    fetchLocations();
  }, [debouncedQ, fetchLocations, q]);

  const handlePageChange = React.useCallback((nextPage, nextPageSize) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  }, []);

  return {
    locations,
    setLocations,
    loading,
    q,
    setQ: updateQuery,
    page,
    pageSize,
    total,
    handlePageChange,
    fetchLocations,
    message,
    client,
  };
}
