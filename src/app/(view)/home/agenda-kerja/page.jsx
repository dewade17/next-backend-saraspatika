'use client';

import React from 'react';
import AgendaTablePage from '@/app/(view)/home/(agenda)/AgendaTablePage.jsx';

export default function AgendaKerjaPage() {
  return (
    <AgendaTablePage
      pageTitle='Agenda Kerja'
      pageSubtitle='Daftar agenda kerja Anda.'
      kategoriFilter='KERJA'
      nameColumnTitle='Nama Pegawai'
    />
  );
}
