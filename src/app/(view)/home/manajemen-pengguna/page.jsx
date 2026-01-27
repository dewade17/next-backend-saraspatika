'use client';

import React from 'react';
import { Grid } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import UserCard from './_components/UserCard';
import UserFormModal from './_components/UserFormModal';
import { useFetchUsers } from './_hooks/useFetchUsers';
import { useSubmitUser } from './_hooks/useSubmitUser';
import { useDeleteUser } from './_hooks/useDeleteUser';
import { matchesQuery } from './_utils/userHelpers';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppFloatButton from '@/app/(view)/components_shared/AppFloatButton.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';

export default function ManajemenPenggunaPage() {
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const { users, loading, q, setQ, fetchUsers, client, message } = useFetchUsers();

  const { isOpen, setIsOpen, mode, activeUser, openCreate, openEdit, handleSubmit, submitting } = useSubmitUser({
    client,
    message,
    onSuccess: fetchUsers,
  });

  const { deletingId, handleDelete } = useDeleteUser({
    client,
    message,
    onSuccess: fetchUsers,
  });

  const filtered = React.useMemo(() => users.filter((u) => matchesQuery(u, q)), [users, q]);

  const openPermission = React.useCallback(
    (user) => {
      const id = user?.id_user;
      if (!id) return;
      router.push(`/home/permission-page?userId=${encodeURIComponent(String(id))}`);
    },
    [router],
  );

  return (
    <div style={{ width: '100%', padding: isMdUp ? 16 : 12 }}>
      <AppFlex
        justify='flex-end'
        align='center'
        gap={10}
      >
        <div style={{ width: isMdUp ? 260 : 220 }}>
          <AppInput.Search
            placeholder='Search'
            value={q}
            onValueChange={setQ}
            emitOnChange
            debounceMs={200}
          />
        </div>
      </AppFlex>

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <AppGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            gap={16}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <AppCard
                key={i}
                bordered
              >
                <AppSkeleton active />
              </AppCard>
            ))}
          </AppGrid>
        ) : (
          <AppGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            gap={16}
          >
            {filtered.map((u) => (
              <UserCard
                key={u.id_user}
                user={u}
                isDeleting={deletingId === u.id_user}
                onEdit={openEdit}
                onDelete={handleDelete}
                onPermission={openPermission}
              />
            ))}
          </AppGrid>
        )}
      </div>

      <AppFloatButton
        icon={<UserAddOutlined />}
        tooltip='Tambah Pengguna'
        onClick={openCreate}
      />

      <UserFormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        mode={mode}
        initialValues={activeUser}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
