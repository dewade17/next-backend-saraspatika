import React from 'react';
import { EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import { safeText } from '../_utils/userHelpers';

export default function UserCard({ user, onEdit, onDelete, onPermission, isDeleting }) {
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <AppButton
          type='default'
          size='small'
          icon={<KeyOutlined />}
          onClick={() => onPermission?.(user)}
        >
          Permission
        </AppButton>
      </div>

      <div style={{ display: 'flex', width: '100%', overflow: 'hidden', borderRadius: 8 }}>
        <AppButton
          type='primary'
          icon={<EditOutlined />}
          block
          style={{ flex: 1, borderRadius: '8px 0 0 8px' }}
          onClick={() => onEdit?.(user)}
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
            title: 'Hapus pengguna ini?',
            okText: 'Hapus',
            cancelText: 'Batal',
          }}
          onClick={() => onDelete?.(user)}
        >
          Delete
        </AppButton>
      </div>
    </AppCard>
  );
}
