'use client';

import React from 'react';
import { Avatar, Typography, Checkbox } from 'antd';

const { Text } = Typography;

function getUserName(u) {
  return String(u?.name ?? 'Tanpa Nama');
}

function getRole(u) {
  return String(u?.role ?? '').trim();
}

function getStatus(u) {
  return String(u?.status ?? '').trim();
}

function avatarSrc(u) {
  return u?.foto_profil_url ? String(u.foto_profil_url) : null;
}

export default function UserRowHeader({ user }) {
  const name = getUserName(user);
  const role = getRole(user);
  const status = getStatus(user);

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
          {[
            ['Sen', 'Standar 09:00 - 18:00'],
            ['Sel', 'Standar 09:00 - 18:00'],
            ['Rab', 'Standar 09:00 - 18:00'],
            ['Kam', 'Standar 09:00 - 18:00'],
            ['Jum', 'Standar 09:00 - 18:00'],
            ['Sab', 'Libur'],
            ['Min', 'Libur'],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <div className='text-slate-500'>{k}:</div>
              <div className={v === 'Libur' ? 'text-red-500 font-semibold' : 'text-blue-600'}>{v}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
