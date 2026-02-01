import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';

function InfoRow({ label, value, noWrap = false, marginBottom = 6 }) {
  const valueText = value == null ? '-' : String(value);

  return (
    <AppTypography
      as='text'
      style={{
        display: 'flex',
        alignItems: 'baseline',
        marginBottom,
        ...(noWrap ? { whiteSpace: 'nowrap' } : null),
      }}
    >
      <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ margin: '0 6px', whiteSpace: 'nowrap' }}>:</span>

      <span
        title={valueText}
        style={{
          flex: 1,
          minWidth: 0,
          ...(noWrap
            ? {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }
            : null),
        }}
      >
        {valueText}
      </span>
    </AppTypography>
  );
}

export default function LocationCard({ loc, onEdit, onDelete, isDeleting }) {
  return (
    <AppCard
      bordered
      style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }}
      styles={{ body: { padding: 14 } }}
    >
      <div style={{ paddingBottom: 10 }}>
        <InfoRow
          label='Nama lokasi'
          value={loc?.name || '-'}
          noWrap
        />
        <InfoRow
          label='Latitude'
          value={loc?.latitude}
        />
        <InfoRow
          label='Longitude'
          value={loc?.longitude}
        />
        <InfoRow
          label='Radius'
          value={loc?.radius}
          marginBottom={0}
        />
      </div>

      <div style={{ display: 'flex', width: '100%', overflow: 'hidden', borderRadius: 8 }}>
        <AppButton
          type='primary'
          icon={<EditOutlined />}
          block
          style={{ flex: 1, borderRadius: '8px 0 0 8px' }}
          onClick={() => onEdit?.(loc)}
        >
          Edit
        </AppButton>

        <AppButton
          type='primary'
          danger
          icon={<DeleteOutlined />}
          block
          loading={isDeleting}
          style={{ flex: 1, borderRadius: '0 8px 8px 0' }}
          confirm={{
            title: 'Hapus lokasi?',
            description: 'Aksi ini tidak bisa dibatalkan.',
            okText: 'Hapus',
            cancelText: 'Batal',
            okButtonProps: { danger: true },
          }}
          onClick={() => onDelete?.(loc)}
        >
          Delete
        </AppButton>
      </div>
    </AppCard>
  );
}
