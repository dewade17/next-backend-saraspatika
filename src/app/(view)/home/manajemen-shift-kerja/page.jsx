'use client';

import React from 'react';
import dayjs from 'dayjs';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);
import ShiftGridToolbar from './_components/ShiftGridToolbar.jsx';
import ShiftGridTable from './_components/ShiftGridTable.jsx';
import { useShiftGridData } from './_hooks/useShiftGridData.js';
import { useShiftAssignments } from './_hooks/useShiftAssignments.js';
import { buildWeekDates, startOfWeekMonday, toDateKey } from './_utils/date.js';

function endOfMonth(d) {
  return d.endOf('month').startOf('day');
}

function applyRepeatUntilEndOfMonth({ weekStart, pickedDate, userId, patternId, setAssignments }) {
  const start = dayjs(weekStart).startOf('day');
  const eom = endOfMonth(pickedDate);
  const targetDow = pickedDate.day();

  setAssignments((prev) => {
    const next = new Map(prev);

    let cursor = start.clone();
    while (cursor.isSameOrBefore(eom, 'day')) {
      if (cursor.day() === targetDow) {
        const key = `${String(userId)}::${toDateKey(cursor)}`;
        if (patternId) next.set(key, { id_pola_kerja: patternId });
        else next.delete(key);
      }
      cursor = cursor.add(1, 'day');
    }

    return next;
  });
}

function buildRepeatWeekUpdates({ weekStart, weekDates, userId, assignments }) {
  const uId = String(userId);
  const start = dayjs(weekStart).startOf('day');

  const updates = [];
  const seen = new Set();

  for (const d of weekDates) {
    const baseKey = `${uId}::${toDateKey(d)}`;
    const assigned = assignments.get(baseKey) || null;

    // Safer default: only repeat days that are filled in this week (avoid wiping future schedules).
    const patternId = assigned?.id_pola_kerja ? String(assigned.id_pola_kerja) : null;
    if (!patternId) continue;

    const targetDow = dayjs(d).day();
    const eom = endOfMonth(dayjs(d));

    let cursor = start.clone();
    while (cursor.isSameOrBefore(eom, 'day')) {
      if (cursor.day() === targetDow) {
        const tanggal = toDateKey(cursor);
        const dedupeKey = `${uId}::${tanggal}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          updates.push({
            id_user: uId,
            tanggal,
            id_pola_kerja: patternId,
          });
        }
      }
      cursor = cursor.add(1, 'day');
    }
  }

  return updates;
}

export default function ManajemenShiftKerjaPage() {
  const [monthAnchor, setMonthAnchor] = React.useState(() => dayjs().startOf('month'));
  const [weekStart, setWeekStart] = React.useState(() => startOfWeekMonday(dayjs()));

  const [repeatByUser, setRepeatByUser] = React.useState(() => new Map());
  const [repeatSavingByUser, setRepeatSavingByUser] = React.useState(() => new Map());

  const { users, patterns, loadingUsers, loadingPatterns, message } = useShiftGridData();
  const { assignments, setAssignments, loadingAssignments, saveAssignments, refetchAssignments } = useShiftAssignments({ weekStart });
  const weekDates = React.useMemo(() => buildWeekDates(weekStart), [weekStart]);

  function handlePrevWeek() {
    setWeekStart((prev) => dayjs(prev).subtract(7, 'day'));
  }

  function handleNextWeek() {
    setWeekStart((prev) => dayjs(prev).add(7, 'day'));
  }

  function handlePickMonth(newMonth) {
    const anchor = dayjs(newMonth).startOf('month');
    setMonthAnchor(anchor);
    setWeekStart(startOfWeekMonday(anchor));
  }

  async function handleToggleRepeat(userId, nextVal) {
    const uId = String(userId);

    setRepeatByUser((prev) => {
      const m = new Map(prev);
      m.set(uId, !!nextVal);
      return m;
    });

    // Connect checkbox to API:
    // When turned ON, repeat the current week's filled patterns until end-of-month via bulk API call.
    if (!nextVal) return;

    const alreadySaving = !!repeatSavingByUser.get(uId);
    if (alreadySaving) return;

    const updates = buildRepeatWeekUpdates({
      weekStart,
      weekDates,
      userId: uId,
      assignments,
    });

    if (!updates.length) {
      message.warning('Pilih setidaknya satu pola kerja di minggu ini terlebih dahulu untuk diulangi.');

      // Reset checkbox kembali ke OFF karena tidak ada data yang bisa diproses
      setRepeatByUser((prev) => {
        const m = new Map(prev);
        m.set(uId, false);
        return m;
      });
      return;
    }

    setRepeatSavingByUser((prev) => {
      const m = new Map(prev);
      m.set(uId, true);
      return m;
    });

    try {
      await saveAssignments(updates);
      await refetchAssignments();
    } catch {
      await refetchAssignments();
    } finally {
      setRepeatSavingByUser((prev) => {
        const m = new Map(prev);
        m.delete(uId);
        return m;
      });
    }
  }

  async function handleChangeAssignment({ userId, date, patternId }) {
    const uId = String(userId);
    const dateKey = toDateKey(date);
    const mapKey = `${uId}::${dateKey}`;

    const isRepeatOn = !!repeatByUser.get(uId);

    if (isRepeatOn) {
      const updates = [];
      const start = dayjs(weekStart).startOf('day');
      const eom = endOfMonth(dayjs(date));
      const targetDow = dayjs(date).day();

      applyRepeatUntilEndOfMonth({
        weekStart,
        pickedDate: dayjs(date).startOf('day'),
        userId: uId,
        patternId: patternId ? String(patternId) : null,
        setAssignments,
      });

      let cursor = start.clone();
      while (cursor.isSameOrBefore(eom, 'day')) {
        if (cursor.day() === targetDow) {
          updates.push({
            id_user: uId,
            tanggal: toDateKey(cursor),
            id_pola_kerja: patternId ? String(patternId) : null,
          });
        }
        cursor = cursor.add(1, 'day');
      }

      try {
        await saveAssignments(updates);
        await refetchAssignments();
      } catch {
        await refetchAssignments();
      }
      return;
    }

    setAssignments((prev) => {
      const next = new Map(prev);
      if (patternId) next.set(mapKey, { id_pola_kerja: String(patternId) });
      else next.delete(mapKey);
      return next;
    });

    try {
      await saveAssignments([
        {
          id_user: uId,
          tanggal: dateKey,
          id_pola_kerja: patternId ? String(patternId) : null,
        },
      ]);
      await refetchAssignments();
    } catch {
      await refetchAssignments();
    }
  }

  return (
    <div className='w-full min-h-[calc(100vh-88px)] '>
      <AppFlex
        direction='column'
        gap={12}
        style={{ width: '100%' }}
      >
        <div className='px-3 pt-3'>
          <AppFlex
            direction='column'
            gap={10}
            style={{ width: '100%' }}
          >
            <H2 style={{ margin: 0 }}>Manajemen Jadwal Guru dan Pegawai</H2>
          </AppFlex>
        </div>

        <div className='px-3 pt-3'>
          <AppCard
            style={{ width: '100%' }}
            padding='sm'
          >
            <AppFlex
              direction='column'
              gap={10}
              style={{ width: '100%' }}
            >
              <ShiftGridToolbar
                monthAnchor={monthAnchor}
                onPickMonth={handlePickMonth}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                weekStart={weekStart}
                weekDates={weekDates}
                loadingPatterns={loadingPatterns}
              />
            </AppFlex>
          </AppCard>
        </div>

        <div className='px-3 pb-4'>
          <AppCard
            style={{ width: '100%' }}
            padding='none'
            styles={{ body: { padding: 0 } }}
          >
            <ShiftGridTable
              weekStart={weekStart}
              weekDates={weekDates}
              users={users}
              patterns={patterns}
              loadingUsers={loadingUsers}
              loadingPatterns={loadingPatterns}
              assignments={assignments}
              repeatByUser={repeatByUser}
              repeatSavingByUser={repeatSavingByUser}
              onToggleRepeat={handleToggleRepeat}
              onChangeAssignment={handleChangeAssignment}
              loadingAssignments={loadingAssignments}
            />
          </AppCard>
        </div>
      </AppFlex>
    </div>
  );
}
