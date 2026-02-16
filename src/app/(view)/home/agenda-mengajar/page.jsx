'use client';

import React from 'react';
import AgendaTablePage from '@/app/(view)/home/(agenda)/AgendaTablePage.jsx';

export default function AgendaMengajarPage() {
  return (
    <AgendaTablePage
      pageTitle='Agenda Mengajar'
      pageSubtitle='Daftar agenda mengajar Anda.'
      kategoriFilter='MENGAJAR'
      nameColumnTitle='Nama Guru'
    />
  );
}
