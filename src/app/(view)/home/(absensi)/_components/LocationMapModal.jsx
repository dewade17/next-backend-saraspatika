'use client';

import React from 'react';
import { Typography } from 'antd';

import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';

import { buildOsmEmbedUrl, buildOsmLink } from '../_utils/absensiHelpers.js';

const { Text } = Typography;

export default function LocationMapModal({ open, onOpenChange, title, lokasiName, latitude, longitude }) {
  const embedUrl = React.useMemo(() => buildOsmEmbedUrl(latitude, longitude), [latitude, longitude]);
  const linkUrl = React.useMemo(() => buildOsmLink(latitude, longitude), [latitude, longitude]);

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
          <Text strong>{lokasiName || 'Koordinat'}</Text>
          <div style={{ marginTop: 4 }}>
            <Text type='secondary'>
              Latitude: {latitude ?? '-'} | Longitude: {longitude ?? '-'}
            </Text>
          </div>
        </div>

        {linkUrl ? (
          <AppButton
            type='link'
            onClick={() => window.open(linkUrl, '_blank', 'noopener,noreferrer')}
          >
            Buka di OpenStreetMap
          </AppButton>
        ) : null}

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
          <Text type='secondary'>Koordinat belum tersedia.</Text>
        )}
      </AppFlex>
    </AppModal>
  );
}
