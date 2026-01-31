// src/app/(view)/home/permission-page/_hooks/usePermissionEditor.js
import React from 'react';
import { Checkbox } from 'antd';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { titleize } from '../_utils/permissionHelpers';

export function usePermissionEditor({ matrix, isLoading, fetchMatrix, updateUserPermission, userId, router }) {
  const message = useAppMessage();
  const [isSaving, setIsSaving] = React.useState(false);
  const [draftMatrix, setDraftMatrix] = React.useState(new Map());
  const [baseMatrix, setBaseMatrix] = React.useState(new Map());
  const [selectedUserId, setSelectedUserId] = React.useState(null);

  React.useEffect(() => {
    const nextDraft = new Map();
    const nextBase = new Map();
    for (const resource of matrix.resources || []) {
      for (const action of resource.actions || []) {
        nextDraft.set(action.id_permission, Boolean(action.granted));
        nextBase.set(action.id_permission, Boolean(action.fromRole));
      }
    }
    setDraftMatrix(nextDraft);
    setBaseMatrix(nextBase);
  }, [matrix]);

  React.useEffect(() => {
    if (!userId) {
      message.warning('User tidak ditemukan. Mengarahkan ke manajemen pengguna.');
      router.replace('/home/manajemen-pengguna');
      setSelectedUserId(null);
      fetchMatrix(null);
      return;
    }
    setSelectedUserId(userId);
    fetchMatrix(userId);
  }, [fetchMatrix, message, router, userId]);

  const handleToggle = React.useCallback((permissionId, checked) => {
    setDraftMatrix((prev) => {
      const next = new Map(prev);
      next.set(permissionId, checked);
      return next;
    });
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!selectedUserId) {
      message.error('User wajib dipilih sebelum menyimpan');
      return;
    }
    setIsSaving(true);
    try {
      const overrides = [];
      for (const [id_permission, granted] of draftMatrix.entries()) {
        const baseGranted = baseMatrix.get(id_permission) || false;
        if (granted !== baseGranted) {
          overrides.push({ id_permission, grant: granted });
        }
      }
      await updateUserPermission(selectedUserId, overrides);
      message.success('Permission berhasil disimpan');
      await fetchMatrix(selectedUserId);
    } catch (err) {
    } finally {
      setIsSaving(false);
    }
  }, [baseMatrix, draftMatrix, fetchMatrix, message, selectedUserId, updateUserPermission]);

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
          granted: Boolean(action.granted),
          fromRole: Boolean(action.fromRole),
          override: action.override ?? null,
          label: `${resourceLabel} - ${titleize(action.action)}`,
        });
      }
    }
    return output;
  }, [matrix]);

  const columns = React.useMemo(() => {
    return [
      {
        title: 'Resource - Action',
        dataIndex: 'label',
        key: 'label',
        fixed: 'left',
        width: 240,
      },
      {
        title: 'Sumber',
        key: 'source',
        render: (_value, record) => {
          const override = record.override;
          if (override) {
            return (
              <AppTypography
                as='text'
                size='sm'
                tone={override.grant ? 'success' : 'danger'}
              >
                {override.grant ? 'Override (Grant)' : 'Override (Deny)'}
              </AppTypography>
            );
          }
          if (record.fromRole) {
            return (
              <AppTypography
                as='text'
                size='sm'
                tone='info'
              >
                Role
              </AppTypography>
            );
          }
          return (
            <AppTypography
              as='text'
              size='sm'
              tone='muted'
            >
              Tidak ada
            </AppTypography>
          );
        },
      },
      {
        title: 'Akses',
        key: 'access',
        align: 'center',
        render: (_value, record) => (
          <Checkbox
            checked={draftMatrix.get(record.id_permission) || false}
            onChange={(e) => handleToggle(record.id_permission, e.target.checked)}
          />
        ),
      },
    ];
  }, [draftMatrix, handleToggle]);

  const roleLabels = React.useMemo(() => matrix.roles || [], [matrix.roles]);

  return { rows, columns, isSaving, handleSave, selectedUserId, roleLabels };
}
