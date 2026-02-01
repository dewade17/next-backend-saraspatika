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

export default function ShiftGridToolbar({ monthAnchor, onPickMonth, onPrevWeek, onNextWeek, weekStart, weekDates, divisiOptions, jabatanOptions, selectedDivisi, selectedJabatan, setSelectedDivisi, setSelectedJabatan }) {
  const monthOptions = React.useMemo(() => buildMonthOptions(monthAnchor), [monthAnchor]);

  return (
    <div className='w-full'>
      <div className='grid w-full grid-cols-1 gap-2 md:grid-cols-[minmax(0,320px)_auto] md:grid-rows-2 md:items-center md:gap-x-6'>
        {/* Row 1 - Col 1 */}
        <Select
          value={selectedDivisi}
          onChange={setSelectedDivisi}
          options={divisiOptions}
          className='w-full md:col-start-1 md:row-start-1 md:min-w-[260px]'
          size='middle'
        />

        {/* Row 2 - Col 1 */}
        <Select
          value={selectedJabatan}
          onChange={setSelectedJabatan}
          options={jabatanOptions}
          className='w-full md:col-start-1 md:row-start-2 md:min-w-[260px]'
          size='middle'
        />

        {/* Row 1 - Col 2 */}
        <div className='flex flex-wrap items-center gap-2 md:col-start-2 md:row-start-1 md:justify-self-end'>
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

        {/* Row 2 - Col 2 */}
        <DatePicker
          picker='month'
          value={dayjs(monthAnchor)}
          onChange={(v) => {
            if (!v) return;
            onPickMonth(dayjs(v).startOf('month'));
          }}
          className='w-full md:w-auto md:min-w-[140px] md:col-start-2 md:row-start-2 md:justify-self-end'
          format='YYYY-MM'
          size='middle'
        />
      </div>
    </div>
  );
}
