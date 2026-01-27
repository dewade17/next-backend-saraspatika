'use client';

import React from 'react';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

export default function PermissionPage() {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: 16 }}>
        <AppCard
          bordered
          style={{ borderRadius: 10 }}
        >
          <AppTypography
            as='title'
            level={4}
            style={{ marginTop: 0, marginBottom: 8, fontWeight: 700 }}
          >
            Permission Page
          </AppTypography>
          <AppTypography
            as='text'
            tone='secondary'
          >
            Halaman ini masih placeholder. Nanti bisa diisi UI untuk pengaturan role/permission.
          </AppTypography>
        </AppCard>
      </div>
    </div>
  );
}
