import React from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import { safeText } from '../_utils/userHelpers';

export default function UserCard({ user, onEdit, onDelete, isDeleting }) {
  return (
    <AppCard
      bordered
      style={{ borderRadius: 10, overflow: 'hidden' }}
      styles={{ body: { padding: 14 } }}
    >
      <div style={{ paddingBottom: 10 }}>
        <AppTypography
          as='text'
          style={{ display: 'block', marginBottom: 6 }}
        >
          <span style={{ fontWeight: 700 }}>Nama</span> : {safeText(user?.name)}
        </AppTypography>
        <AppTypography
          as='text'
          style={{ display: 'block', marginBottom: 6 }}
        >
          <span style={{ fontWeight: 700 }}>Email</span> : {safeText(user?.email)}
        </AppTypography>
        <AppTypography
          as='text'
          style={{ display: 'block', marginBottom: 6 }}
        >
          <span style={{ fontWeight: 700 }}>Nip</span> : {safeText(user?.nip)}
        </AppTypography>
        <AppTypography
          as='text'
          style={{ display: 'block' }}
        >
          <span style={{ fontWeight: 700 }}>No.HP</span> : {safeText(user?.nomor_handphone)}
        </AppTypography>
      </div>

      <div style={{ display: 'flex', gap: 0, width: '100%', overflow: 'hidden', borderRadius: 8 }}>
        <AppButton
          type='primary'
          icon={<EditOutlined />}
          block
          style={{ borderRadius: 0, flex: 1 }}
          onClick={() => onEdit(user)}
        >
          Edit
        </AppButton>
        <AppButton
          type='primary'
          danger
          icon={<DeleteOutlined />}
          block
          loading={isDeleting}
          style={{ borderRadius: 0, flex: 1 }}
          confirm={{
            title: 'Hapus pengguna ini?',
            okText: 'Hapus',
            cancelText: 'Batal',
          }}
          onClick={() => onDelete(user)}
        >
          Delete
        </AppButton>
      </div>
    </AppCard>
  );
}
