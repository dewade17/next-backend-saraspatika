'use client';

import React from 'react';
import { Checkbox, Select } from 'antd';

import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import { AppFlex } from '@/app/(view)/components_shared/AppFlex.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { usePermissionMatrix } from './_hooks/usePermisssionMatrix.js';
import { createHttpClient } from '@/lib/http_client.js';

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

function formatUserLabel(user) {
  if (!user) return '';
  const name = user.name ? titleize(user.name) : '';
  const email = user.email ? String(user.email).trim() : '';
  if (name && email) return `${name} (${email})`;
  return name || email || 'User';
}

export default function PermissionPage() {
  const message = useAppMessage();
  const { matrix, isLoading, fetchMatrix, updateUserPermission } = usePermissionMatrix();
  const client = React.useMemo(() => createHttpClient(), []);

  const [isSaving, setIsSaving] = React.useState(false);
  const [draftMatrix, setDraftMatrix] = React.useState(new Map());
  const [baseMatrix, setBaseMatrix] = React.useState(new Map());
  const [selectedUserId, setSelectedUserId] = React.useState(null);
  const [userOptions, setUserOptions] = React.useState([]);
  const [isUserLoading, setIsUserLoading] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

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

  const handleToggle = React.useCallback((permissionId, checked) => {
    setDraftMatrix((prev) => {
      const next = new Map(prev);
      next.set(permissionId, checked);
      return next;
    });
  }, []);

  const fetchUsers = React.useCallback(
    async (query) => {
      const q = String(query || '').trim();
      if (!q) {
        setUserOptions([]);
        return;
      }
      setIsUserLoading(true);
      try {
        const res = await client.get(`/api/users?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
        const users = Array.isArray(res?.data) ? res.data : [];
        setUserOptions(
          users.map((user) => ({
            value: user.id_user,
            label: formatUserLabel(user),
            user,
          })),
        );
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal mencari user' });
      } finally {
        setIsUserLoading(false);
      }
    },
    [client, message],
  );

  React.useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(searchValue);
    }, 300);
    return () => clearTimeout(t);
  }, [fetchUsers, searchValue]);

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
      // error handled in hook
    } finally {
      setIsSaving(false);
    }
  }, [baseMatrix, draftMatrix, fetchMatrix, message, selectedUserId, updateUserPermission]);

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
            const label = override.grant ? 'Override (Grant)' : 'Override (Deny)';
            return (
              <AppTypography
                as='text'
                size='sm'
                tone={override.grant ? 'success' : 'danger'}
              >
                {label}
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

  const roleLabels = React.useMemo(() => (matrix.roles || []).map((role) => formatRoleLabel(role.name)).filter(Boolean), [matrix.roles]);

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
              Pilih User
            </AppTypography>
            <Select
              showSearch
              allowClear
              placeholder='Cari nama atau email'
              style={{ minWidth: 280, flex: 1 }}
              value={selectedUserId}
              options={userOptions}
              filterOption={false}
              onSearch={setSearchValue}
              onChange={(value) => {
                setSelectedUserId(value || null);
                if (value) {
                  fetchMatrix(value);
                } else {
                  fetchMatrix(null);
                }
              }}
              notFoundContent={isUserLoading ? 'Memuat...' : 'User tidak ditemukan'}
              loading={isUserLoading}
            />
            {matrix.user ? (
              <AppTypography
                as='text'
                size='sm'
                tone='secondary'
              >
                {formatUserLabel(matrix.user)}
              </AppTypography>
            ) : null}
            {roleLabels.length > 0 ? (
              <AppTypography
                as='text'
                size='sm'
                tone='secondary'
              >
                Role: {roleLabels.join(', ')}
              </AppTypography>
            ) : null}
          </AppFlex>

          {isLoading && rows.length === 0 ? (
            <AppSkeleton active />
          ) : !selectedUserId ? (
            <AppTypography
              as='text'
              tone='secondary'
            >
              Pilih user untuk melihat dan mengatur permission.
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
