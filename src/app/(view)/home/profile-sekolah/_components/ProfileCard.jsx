import React from 'react';
import { BankOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, PhoneOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppSpace from '@/app/(view)/components_shared/AppSpace.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

function FieldRow({ icon, label, value }) {
  return (
    <AppFlex
      align='flex-start'
      gap={8}
      style={{ minWidth: 0 }}
    >
      <span style={{ lineHeight: 1, opacity: 0.85, marginTop: 2 }}>{icon}</span>
      <AppTypography
        as='text'
        style={{ lineHeight: 1.5, wordBreak: 'break-word' }}
      >
        <strong>{label}</strong>: {value || '-'}
      </AppTypography>
    </AppFlex>
  );
}

export default function ProfileCard({ item, onEdit, onDelete, deleting }) {
  return (
    <AppCard
      bordered
      style={{
        borderRadius: 12,
        borderColor: '#8f8f8f',
        overflow: 'hidden',
        height: '100%',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: 14 }}>
        <AppSpace
          direction='vertical'
          size={8}
          style={{ width: '100%' }}
        >
          <FieldRow
            icon={<BankOutlined />}
            label='Nama Sekolah'
            value={item?.nama_sekolah}
          />
          <FieldRow
            icon={<EnvironmentOutlined />}
            label='Alamat'
            value={item?.alamat_sekolah}
          />
          <FieldRow
            icon={<SafetyCertificateOutlined />}
            label='NPSN'
            value={item?.npsn}
          />
          <FieldRow
            icon={<PhoneOutlined />}
            label='No Telepon'
            value={item?.no_telepon}
          />
        </AppSpace>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderTop: '1px solid #8f8f8f',
        }}
      >
        <AppButton
          type='primary'
          icon={<EditOutlined />}
          onPress={() => onEdit(item)}
          fullWidth
          style={{ borderRadius: 0 }}
        >
          Edit
        </AppButton>

        <AppButton
          type='primary'
          danger
          icon={<DeleteOutlined />}
          loading={deleting}
          confirm='Yakin ingin menghapus profile sekolah ini?'
          onPress={() => onDelete(item)}
          fullWidth
          style={{ borderRadius: 0 }}
        >
          Delete
        </AppButton>
      </div>
    </AppCard>
  );
}
