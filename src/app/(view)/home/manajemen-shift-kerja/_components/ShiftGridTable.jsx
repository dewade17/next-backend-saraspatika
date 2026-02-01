'use client';

import React from 'react';
import dayjs from 'dayjs';
import { Checkbox, Empty, Skeleton, Typography } from 'antd';

import ScheduleCellCard from './ScheduleCellCard.jsx';
import UserRowHeader from './UserRowHeader.jsx';
import { formatHeaderID, toDateKey } from '../_utils/date.js';

const { Text } = Typography;

function getUserId(u) {
  return String(u?.id_user ?? '');
}

function isPast(date) {
  return dayjs(date).startOf('day').isBefore(dayjs().startOf('day'), 'day');
}

export default function ShiftGridTable({ weekDates, users, patterns, loadingUsers, loadingPatterns, loadingAssignments, assignments, repeatByUser, onToggleRepeat, onChangeAssignment }) {
  const gridTemplateColumns = React.useMemo(() => {
    // Left column sticky + 7 day columns
    return '360px repeat(7, 280px)';
  }, []);

  const header = (
    <div
      className='sticky top-0 z-20 bg-white border-b border-slate-200'
      style={{ display: 'grid', gridTemplateColumns }}
    >
      <div className='sticky left-0 z-30 bg-white border-r border-slate-200 px-4 py-3'>
        <Text className='font-semibold text-slate-800'>Nama Karyawan</Text>
      </div>

      {weekDates.map((d) => (
        <div
          key={toDateKey(d)}
          className='px-4 py-3 border-r border-slate-100'
        >
          <div className='text-slate-800 font-semibold text-sm truncate'>{formatHeaderID(d)}</div>
        </div>
      ))}
    </div>
  );

  const body = (() => {
    if (loadingUsers || loadingPatterns || loadingAssignments) {
      return (
        <div className='p-4'>
          <Skeleton
            active
            paragraph={{ rows: 8 }}
          />
        </div>
      );
    }

    if (!users?.length) {
      return (
        <div className='p-8'>
          <Empty description='Tidak ada karyawan' />
        </div>
      );
    }

    return (
      <div className='divide-y divide-slate-100'>
        {users.map((u, rowIdx) => {
          const userId = getUserId(u);
          const repeatOn = !!repeatByUser.get(userId);
          const isEven = rowIdx % 2 === 0;
          const rowBgColor = isEven ? 'bg-[#f8fafc]' : 'bg-white';
          return (
            <div
              key={userId}
              className={rowBgColor}
              style={{ display: 'grid', gridTemplateColumns }}
            >
              <div className={`sticky left-0 z-10 border-r border-slate-200 px-4 py-4 ${rowBgColor}`}>
                <UserRowHeader user={u} />

                <div className='mt-3'>
                  <Checkbox
                    checked={repeatOn}
                    onChange={(e) => onToggleRepeat(userId, e.target.checked)}
                  >
                    <span className='text-xs text-slate-600'>Ulangi minggu ini sampai akhir bulan</span>
                  </Checkbox>
                </div>
              </div>

              {weekDates.map((d) => {
                const dateKey = toDateKey(d);
                const mapKey = `${userId}::${dateKey}`;
                const assigned = assignments.get(mapKey) || null;

                return (
                  <div
                    key={mapKey}
                    className='px-4 py-4 border-r border-slate-100'
                  >
                    <ScheduleCellCard
                      date={d}
                      isPast={isPast(d)}
                      patterns={patterns}
                      valuePatternId={assigned?.id_pola_kerja ?? null}
                      onChange={(nextPatternId) => {
                        onChangeAssignment({
                          userId,
                          date: d,
                          patternId: nextPatternId,
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  })();

  return (
    <div className='w-full'>
      <div className='w-full overflow-auto max-h-[calc(100vh-220px)]'>
        <div className='min-w-[2320px]'>
          {header}
          {body}
        </div>
      </div>
    </div>
  );
}
