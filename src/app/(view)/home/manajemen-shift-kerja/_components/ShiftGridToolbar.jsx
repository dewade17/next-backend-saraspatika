'use client';

import React from 'react';
import dayjs from 'dayjs';
import { Select, DatePicker } from 'antd';

import AppButton from '@/app/(view)/components_shared/AppButton.jsx';

function buildMonthOptions(anchor) {
  const base = dayjs(anchor || dayjs());
  const year = base.year();
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return months.map((m, idx) => ({
    value: `${year}-${String(idx + 1).padStart(2, '0')}`,
    label: m,
  }));
}

export default function ShiftGridToolbar({ monthAnchor, onPickMonth, onPrevWeek, onNextWeek, weekStart, weekDates }) {
  const monthOptions = React.useMemo(() => buildMonthOptions(monthAnchor), [monthAnchor]);

  return (
    <div className='w-full'>
      {/* 1. PENYESUAIAN GRID: Sekarang lebih sederhana karena filter hilang */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        {/* Navigasi Minggu */}
        <div className='flex items-center gap-2'>
          <AppButton
            size='middle'
            onClick={onPrevWeek}
          >
            <span className='px-2'>‹</span> Minggu sebelumnya
          </AppButton>

          <AppButton
            size='middle'
            type='primary'
            onClick={onNextWeek}
          >
            Minggu berikutnya <span className='px-2'>›</span>
          </AppButton>
        </div>

        {/* Pemilih Bulan */}
        <DatePicker
          picker='month'
          value={dayjs(monthAnchor)}
          onChange={(v) => {
            if (!v) return;
            onPickMonth(dayjs(v).startOf('month'));
          }}
          className='w-full md:w-auto md:min-w-[140px]'
          format='YYYY-MM'
          size='middle'
        />
      </div>
    </div>
  );
}
