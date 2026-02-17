'use client';

import React from 'react';

import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

import { buildOsmEmbedUrl } from '../_utils/absensiHelpers.js';

export default function LocationMapModal({ open, onOpenChange, title, lokasiName, latitude, longitude }) {
  const embedUrl = React.useMemo(() => buildOsmEmbedUrl(latitude, longitude), [latitude, longitude]);

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title || 'Lokasi Absensi'}
      size='lg'
      footer={null}
    >
      <AppFlex
        direction='column'
        gap={10}
        style={{ width: '100%' }}
      >
        <div>
          <AppTypography
            as='text'
            strong
          >
            {lokasiName || 'Koordinat'}
          </AppTypography>
        </div>

        {embedUrl ? (
          <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
            <iframe
              title='OpenStreetMap'
              src={embedUrl}
              style={{ width: '100%', height: 420, border: 0 }}
              loading='lazy'
            />
          </div>
        ) : (
          <AppTypography
            as='text'
            tone='secondary'
          >
            Koordinat belum tersedia.
          </AppTypography>
        )}
      </AppFlex>
    </AppModal>
  );
}
