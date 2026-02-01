'use client';

import React from 'react';
import dayjs from 'dayjs';
import { Checkbox, Select, Typography, Tooltip } from 'antd';

const { Text } = Typography;

function formatTimeRange(p) {
  const start = p?.jam_mulai_kerja ? String(p.jam_mulai_kerja).slice(0, 5) : '';
  const end = p?.jam_selesai_kerja ? String(p.jam_selesai_kerja).slice(0, 5) : '';
  if (!start && !end) return '';
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

function pastelById(id) {
  const s = String(id ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const palette = [
    { bg: '#EFF6FF', border: '#2563EB' },
    { bg: '#FFF7ED', border: '#F97316' },
    { bg: '#ECFDF5', border: '#10B981' },
    { bg: '#F5F3FF', border: '#7C3AED' },
    { bg: '#FDF2F8', border: '#DB2777' },
    { bg: '#F0FDFA', border: '#14B8A6' },
    { bg: '#FEFCE8', border: '#CA8A04' },
  ];
  return palette[h % palette.length];
}

function inferDotColorByName(name, fallback) {
  const n = String(name ?? '').toLowerCase();
  if (n.includes('pagi')) return '#2563EB';
  if (n.includes('malam')) return '#F97316';
  if (n.includes('siang')) return '#10B981';
  if (n.includes('sore')) return '#7C3AED';
  return fallback;
}

export default function ScheduleCellCard({ date, isPast, patterns, valuePatternId, onChange }) {
  const options = React.useMemo(() => {
    const base = Array.isArray(patterns) ? patterns : [];
    return base.map((p) => {
      const range = formatTimeRange(p);
      const label = range ? `${p?.nama_pola_kerja} (${range})` : String(p?.nama_pola_kerja ?? '');
      return { value: String(p?.id_pola_kerja), label };
    });
  }, [patterns]);

  const selected = React.useMemo(() => {
    if (!valuePatternId) return null;
    return (patterns || []).find((p) => String(p?.id_pola_kerja) === String(valuePatternId)) || null;
  }, [patterns, valuePatternId]);

  const color = selected ? pastelById(selected.id_pola_kerja) : { bg: '#F8FAFC', border: '#E2E8F0' };
  const dot = selected ? inferDotColorByName(selected.nama_pola_kerja, color.border) : '#94A3B8';

  const disabled = !!isPast;

  return (
    <div
      className='rounded-xl border bg-white shadow-sm'
      style={{ borderColor: color.border, backgroundColor: disabled ? '#FAFAFA' : color.bg }}
    >
      <div className='px-3 pt-3'>
        <div className='text-xs text-slate-500'>Jadwal (riwayat)</div>

        <Select
          size='middle'
          className='w-full mt-2'
          placeholder='Standar (09:00 – 18:00)'
          value={valuePatternId ? String(valuePatternId) : undefined}
          onChange={(v) => onChange(v)}
          allowClear
          disabled={disabled}
          options={options}
        />

        <div className='mt-2 flex items-center gap-2'>
          <span
            className='inline-block h-2 w-2 rounded-full'
            style={{ backgroundColor: dot }}
          />
          <Tooltip title={selected?.nama_pola_kerja || ''}>
            <Text className='text-xs text-slate-600 truncate'>{selected ? `${selected.nama_pola_kerja} • ${formatTimeRange(selected) || '—'}` : '—'}</Text>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
