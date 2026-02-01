'use client';

import React from 'react';
import dayjs from 'dayjs';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';

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

export default function ManajemenShiftKerjaPage() {
  const [monthAnchor, setMonthAnchor] = React.useState(() => dayjs().startOf('month'));
  const [weekStart, setWeekStart] = React.useState(() => startOfWeekMonday(dayjs()));

  const [selectedDivisi, setSelectedDivisi] = React.useState('ALL');
  const [selectedJabatan, setSelectedJabatan] = React.useState('ALL');

  const [repeatByUser, setRepeatByUser] = React.useState(() => new Map());

  const { users, patterns, loadingUsers, loadingPatterns } = useShiftGridData();
  const { assignments, setAssignments, loadingAssignments, saveAssignments } = useShiftAssignments({ weekStart });
  const weekDates = React.useMemo(() => buildWeekDates(weekStart), [weekStart]);

  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(users)) return [];

    return users.filter((u) => {
      const role = String(u?.role ?? '');
      const divisiProxy = String(u?.status ?? '');
      const matchDivisi = selectedDivisi === 'ALL' ? true : divisiProxy === selectedDivisi;
      const matchJabatan = selectedJabatan === 'ALL' ? true : role === selectedJabatan;
      return matchDivisi && matchJabatan;
    });
  }, [users, selectedDivisi, selectedJabatan]);

  const divisiOptions = React.useMemo(() => {
    const set = new Set();
    for (const u of users || []) {
      const v = String(u?.status ?? '').trim();
      if (v) set.add(v);
    }
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [{ value: 'ALL', label: 'Semua Tim/Divisi' }, ...arr.map((v) => ({ value: v, label: v }))];
  }, [users]);

  const jabatanOptions = React.useMemo(() => {
    const set = new Set();
    for (const u of users || []) {
      const v = String(u?.role ?? '').trim();
      if (v) set.add(v);
    }
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [{ value: 'ALL', label: 'Filter Jabatan' }, ...arr.map((v) => ({ value: v, label: v }))];
  }, [users]);

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

  function handleToggleRepeat(userId, nextVal) {
    setRepeatByUser((prev) => {
      const m = new Map(prev);
      m.set(String(userId), !!nextVal);
      return m;
    });
  }

  function handleChangeAssignment({ userId, date, patternId }) {
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

      saveAssignments(updates);
      return;
    }

    setAssignments((prev) => {
      const next = new Map(prev);
      if (patternId) next.set(mapKey, { id_pola_kerja: String(patternId) });
      else next.delete(mapKey);
      return next;
    });
    saveAssignments([
      {
        id_user: uId,
        tanggal: dateKey,
        id_pola_kerja: patternId ? String(patternId) : null,
      },
    ]);
  }

  return (
    <div className='w-full min-h-[calc(100vh-88px)] bg-sky-100'>
      <AppFlex
        direction='column'
        gap={12}
        style={{ width: '100%' }}
      >
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
              <H2 style={{ margin: 0 }}>Manajemen Jadwal Guru dan Pegawai</H2>

              <ShiftGridToolbar
                monthAnchor={monthAnchor}
                onPickMonth={handlePickMonth}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                weekStart={weekStart}
                weekDates={weekDates}
                divisiOptions={divisiOptions}
                jabatanOptions={jabatanOptions}
                selectedDivisi={selectedDivisi}
                selectedJabatan={selectedJabatan}
                setSelectedDivisi={setSelectedDivisi}
                setSelectedJabatan={setSelectedJabatan}
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
              users={filteredUsers}
              patterns={patterns}
              loadingUsers={loadingUsers}
              loadingPatterns={loadingPatterns}
              assignments={assignments}
              repeatByUser={repeatByUser}
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
