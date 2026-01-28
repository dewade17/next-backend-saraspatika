'use client';

import React from 'react';
import { Checkbox } from 'antd';

import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import { AppFlex } from '@/app/(view)/components_shared/AppFlex.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { usePermissionMatrix } from './_hooks/usePermisssionMatrix.js';

function titleize(value) {
  return String(value || '')
    .trim()
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatRoleLabel(name) {
  return titleize(name);
}

export default function PermissionPage() {
  const message = useAppMessage();
  const { matrix, isLoading, fetchMatrix, updateRolePermission } = usePermissionMatrix();

  const [isSaving, setIsSaving] = React.useState(false);
  const [draftMatrix, setDraftMatrix] = React.useState(new Map());

  const rows = React.useMemo(() => {
    const output = [];
    for (const resource of matrix.resources || []) {
      const resourceLabel = titleize(resource.resource);
      for (const action of resource.actions || []) {
        output.push({
          key: action.id_permission,
          id_permission: action.id_permission,
          resource: resource.resource,
          action: action.action,
          label: `${resourceLabel} - ${titleize(action.action)}`,
        });
      }
    }
    return output;
  }, [matrix]);

  React.useEffect(() => {
    const next = new Map();
    for (const role of matrix.roles || []) {
      const set = new Set();
      for (const resource of matrix.resources || []) {
        for (const action of resource.actions || []) {
          if (action?.roles?.[role.id_role]) set.add(action.id_permission);
        }
      }
      next.set(role.id_role, set);
    }
    setDraftMatrix(next);
  }, [matrix]);

  const handleToggle = React.useCallback((roleId, permissionId, checked) => {
    setDraftMatrix((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(roleId) || []);
      if (checked) set.add(permissionId);
      else set.delete(permissionId);
      next.set(roleId, set);
      return next;
    });
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!matrix.roles?.length) return;
    setIsSaving(true);
    try {
      for (const role of matrix.roles) {
        const ids = Array.from(draftMatrix.get(role.id_role) || []);
        await updateRolePermission(role.id_role, ids);
      }
      message.success('Permission berhasil disimpan');
      await fetchMatrix();
    } catch (err) {
      // error handled in hook
    } finally {
      setIsSaving(false);
    }
  }, [draftMatrix, fetchMatrix, matrix.roles, message, updateRolePermission]);

  const columns = React.useMemo(() => {
    const roleColumns = (matrix.roles || []).map((role) => ({
      title: formatRoleLabel(role.name),
      key: role.id_role,
      align: 'center',
      render: (_value, record) => (
        <Checkbox
          checked={draftMatrix.get(role.id_role)?.has(record.id_permission) || false}
          onChange={(e) => handleToggle(role.id_role, record.id_permission, e.target.checked)}
        />
      ),
    }));

    return [
      {
        title: 'Resource - Action',
        dataIndex: 'label',
        key: 'label',
        fixed: 'left',
        width: 240,
      },
      ...roleColumns,
    ];
  }, [draftMatrix, handleToggle, matrix.roles]);

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
              Manajemen Permission Matrix
            </AppTypography>
            <AppButton
              type='primary'
              onClick={handleSave}
              loading={isSaving}
              disabled={isLoading || isSaving || rows.length === 0}
            >
              Simpan Perubahan
            </AppButton>
          </AppFlex>

          {isLoading && rows.length === 0 ? (
            <AppSkeleton active />
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
