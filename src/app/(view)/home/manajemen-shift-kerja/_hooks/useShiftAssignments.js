'use client';

import React from 'react';
import dayjs from 'dayjs';

import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';
import { toDateKey } from '../_utils/date.js';

function buildMap(rows) {
  const next = new Map();
  for (const row of rows || []) {
    const idUser = String(row?.id_user ?? '');
    const dateValue = dayjs(row?.tanggal);
    if (!dateValue.isValid()) continue;
    const dateKey = toDateKey(dateValue);
    if (!idUser || !dateKey) continue;
    next.set(`${idUser}::${dateKey}`, {
      id_jadwal_shift: row?.id_jadwal_shift ?? null,
      id_pola_kerja: row?.id_pola_kerja ?? null,
    });
  }
  return next;
}

export function useShiftAssignments({ weekStart }) {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [assignments, setAssignments] = React.useState(() => new Map());
  const [loadingAssignments, setLoadingAssignments] = React.useState(true);

  const fetchAssignments = React.useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const start = dayjs(weekStart).startOf('day').format('YYYY-MM-DD');
      const end = dayjs(weekStart).add(6, 'day').startOf('day').format('YYYY-MM-DD');
      const res = await client.get('/api/jadwal-shift-kerja', {
        query: { start_date: start, end_date: end },
        cache: 'no-store',
      });
      const rows = Array.isArray(res?.data) ? res.data : [];
      setAssignments(buildMap(rows));
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat jadwal shift' });
      setAssignments(new Map());
    } finally {
      setLoadingAssignments(false);
    }
  }, [client, message, weekStart]);

  const saveAssignments = React.useCallback(
    async (items) => {
      if (!Array.isArray(items) || items.length === 0) return;
      try {
        await client.post('/api/jadwal-shift-kerja', {
          json: { assignments: items },
        });
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal menyimpan jadwal shift' });
      }
    },
    [client, message],
  );

  React.useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    setAssignments,
    loadingAssignments,
    refetchAssignments: fetchAssignments,
    saveAssignments,
  };
}
