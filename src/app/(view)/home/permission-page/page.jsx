// src/app/(view)/home/permission-page/page.jsx
'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import { AppFlex } from '@/app/(view)/components_shared/AppFlex.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

import { usePermissionMatrix } from './_hooks/usePermisssionMatrix.js';
import { usePermissionEditor } from './_hooks/usePermissionEditor.js';
import { formatUserLabel, formatRoleLabel } from './_utils/permissionHelpers';

export default function PermissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { matrix, isLoading, fetchMatrix, updateUserPermission } = usePermissionMatrix();

  const userId = React.useMemo(() => {
    const raw = searchParams?.get('userId');
    return String(raw || '').trim() || null;
  }, [searchParams]);

  const { rows, columns, isSaving, handleSave, selectedUserId, roleLabels } = usePermissionEditor({
    matrix,
    isLoading,
    fetchMatrix,
    updateUserPermission,
    userId,
    router,
  });

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: 16 }}>
        <AppCard
          bordered
          style={{ borderRadius: 10 }}
        >
          <AppFlex
            align='center'
            justify='space-between'
            wrap
            gap='sm'
            style={{ marginBottom: 12 }}
          >
            <AppTypography
              as='title'
              level={4}
              style={{ margin: 0, fontWeight: 700 }}
            >
              Manajemen Permission Pengguna
            </AppTypography>
            <AppButton
              type='primary'
              onClick={handleSave}
              loading={isSaving}
              disabled={isLoading || isSaving || rows.length === 0 || !selectedUserId}
            >
              Simpan Perubahan
            </AppButton>
          </AppFlex>

          <AppFlex
            align='center'
            wrap
            gap='sm'
            style={{ marginBottom: 12 }}
          >
            <AppTypography
              as='text'
              weight='semibold'
              style={{ minWidth: 120 }}
            >
              User Aktif
            </AppTypography>
            <AppTypography
              as='text'
              size='sm'
              tone='secondary'
              style={{ flex: 1 }}
            >
              {matrix.user ? formatUserLabel(matrix.user) : selectedUserId ? `User ID: ${selectedUserId}` : '-'}
            </AppTypography>
            {roleLabels.length > 0 && (
              <AppTypography
                as='text'
                size='sm'
                tone='secondary'
              >
                Role: {roleLabels.map(formatRoleLabel).join(', ')}
              </AppTypography>
            )}
          </AppFlex>

          {isLoading && rows.length === 0 ? (
            <AppSkeleton active />
          ) : !selectedUserId ? (
            <AppTypography
              as='text'
              tone='secondary'
            >
              User tidak ditemukan. Mengarahkan ke manajemen pengguna.
            </AppTypography>
          ) : rows.length === 0 ? (
            <AppTypography
              as='text'
              tone='secondary'
            >
              Tidak ada permission yang tersedia.
            </AppTypography>
          ) : (
            <AppTable
              columns={columns}
              dataSource={rows}
              rowKey='id_permission'
              pagination={false}
              size='middle'
              scroll={{ x: 'max-content' }}
            />
          )}
        </AppCard>
      </div>
    </div>
  );
}
