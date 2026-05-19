import React from 'react';
import { createHttpClient } from '@/lib/http_client.js';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

const DEFAULT_PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function buildMonthQuery(month) {
  if (!month?.isValid?.()) return {};
  return {
    start_date: month.startOf('month').format('YYYY-MM-DD'),
    end_date: month.endOf('month').format('YYYY-MM-DD'),
  };
}

export function useManajemenVerifikasi() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [summaryRows, setSummaryRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState(null);
  const [q, setQ] = React.useState('');
  const [month, setMonth] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = React.useState(0);
  const debouncedQ = useDebouncedValue(q, SEARCH_DEBOUNCE_MS);
  const requestSeqRef = React.useRef(0);

  const updateQuery = React.useCallback((next) => {
    setQ(String(next ?? ''));
    setPage(1);
  }, []);

  const updateMonth = React.useCallback((next) => {
    setMonth(next ?? null);
    setPage(1);
  }, []);

  const fetchRows = React.useCallback(async () => {
    const seq = (requestSeqRef.current += 1);
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        client.get('/api/pengajuan-absensi', {
          cache: 'no-store',
          query: {
            q: debouncedQ || undefined,
            ...buildMonthQuery(month),
            page,
            limit: pageSize,
          },
        }),
        client.get('/api/pengajuan-absensi', {
          cache: 'no-store',
          query: {
            status: 'MENUNGGU',
            page: 1,
            limit: 3,
          },
        }),
      ]);
      if (seq !== requestSeqRef.current) return;

      const data = Array.isArray(listRes?.data) ? listRes.data : [];
      const meta = listRes?.meta || {};
      setRows(data);
      setTotal(Number.isFinite(meta.total) ? meta.total : data.length);
      setSummaryRows(Array.isArray(summaryRes?.data) ? summaryRes.data : []);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      message.errorFrom(err, { fallback: 'Gagal memuat daftar pengajuan' });
      setRows([]);
      setSummaryRows([]);
      setTotal(0);
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  }, [client, debouncedQ, message, month, page, pageSize]);

  const updateStatus = React.useCallback(
    async (item, nextStatus, adminNote) => {
      const id = item?.id_pengajuan;
      if (!id) return;

      setBusyId(id);
      try {
        const payload = {
          status: nextStatus,
          admin_note: adminNote == null ? undefined : String(adminNote),
        };

        await client.patch(`/api/pengajuan-absensi/${encodeURIComponent(String(id))}`, {
          json: payload,
        });

        message.success(`Pengajuan berhasil ${nextStatus === 'SETUJU' ? 'disetujui' : 'ditolak'}`);
        await fetchRows();
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memproses pengajuan' });
      } finally {
        setBusyId(null);
      }
    },
    [client, fetchRows, message],
  );

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
    summaryRows,
    loading,
    busyId,
    q,
    setQ: updateQuery,
    month,
    setMonth: updateMonth,
    page,
    pageSize,
    total,
    handlePageChange,
    updateStatus,
    fetchRows,
  };
}
