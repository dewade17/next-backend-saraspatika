import React from 'react';
import AppImage from '@/app/(view)/components_shared/AppImage.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

export default function LoginHeader() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 18 }}>
      <AppImage
        src='/assets/images/logo_saraspatika.png'
        alt='Logo'
        preview={false}
        width={44}
        style={{ marginBottom: 10 }}
      />

      <AppTypography
        as='title'
        level={3}
        align='center'
        style={{ marginBottom: 4, fontWeight: 700 }}
      >
        Selamat Datang Sistem Absensi Saraspatika
      </AppTypography>
    </div>
  );
}
