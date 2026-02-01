'use client';

import React from 'react';
import { Avatar, Typography } from 'antd';

import { toDateKey } from '../_utils/date.js';

const { Text } = Typography;

function getUserName(u) {
  return String(u?.name ?? 'Tanpa Nama');
}

function getStatus(u) {
  return String(u?.status ?? '').trim();
}

function avatarSrc(u) {
  return u?.foto_profil_url ? String(u.foto_profil_url) : null;
}

function dayLabelFromDate(d) {
  const labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return labels[d.day()] || '';
}

function formatPatternLabel(pattern) {
  if (!pattern) return '-';
  const name = String(pattern.nama_pola_kerja ?? '').trim();
  const start = String(pattern.jam_mulai_kerja ?? '').trim();
  const end = String(pattern.jam_selesai_kerja ?? '').trim();
  if (name && start && end) return `${name} ${start} - ${end}`;
  if (name) return name;
  if (start && end) return `${start} - ${end}`;
  return '-';
}

export default function UserRowHeader({ user, weekDates, assignments, patterns }) {
  const name = getUserName(user);
  const status = getStatus(user);
  const userId = String(user?.id_user ?? '');

  const patternById = React.useMemo(() => {
    const next = new Map();
    for (const item of patterns || []) {
      const id = String(item?.id_pola_kerja ?? '');
      if (id) next.set(id, item);
    }
    return next;
  }, [patterns]);

  const weeklySummary = React.useMemo(() => {
    if (!Array.isArray(weekDates)) return [];
    return weekDates.map((d) => {
      const dateKey = toDateKey(d);
      const mapKey = `${userId}::${dateKey}`;
      const assigned = assignments?.get?.(mapKey) || null;
      const patternId = assigned?.id_pola_kerja ? String(assigned.id_pola_kerja) : '';
      const pattern = patternId ? patternById.get(patternId) : null;
      const label = formatPatternLabel(pattern);
      return {
        key: dateKey,
        dayLabel: dayLabelFromDate(d),
        label,
        isOff: label === '-',
      };
    });
  }, [assignments, patternById, userId, weekDates]);

  return (
    <div className='w-full'>
      <div className='flex items-center gap-3'>
        <Avatar
          size={44}
          src={avatarSrc(user)}
          style={{ backgroundColor: '#e5e7eb', color: '#111827' }}
        >
          {name?.[0]?.toUpperCase?.() || 'U'}
        </Avatar>

        <div className='min-w-0'>
          <div className='font-semibold text-slate-800 truncate'>{name}</div>
          <div className='text-xs text-slate-500 truncate'>{status ? ` ${status}` : ''}</div>
        </div>
      </div>

      <div className='mt-3'>
        <Text className='text-xs text-slate-600 font-semibold'>Ringkasan Per Minggu:</Text>

        <div className='mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs'>
          {weeklySummary.map((item) => (
            <React.Fragment key={item.key}>
              <div className='text-slate-500'>{item.dayLabel}:</div>
              <div className={item.isOff ? 'text-red-500 font-semibold' : 'text-blue-600'}>{item.label}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
