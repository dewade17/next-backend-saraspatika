'use client';

import React from 'react';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppSpace from '@/app/(view)/components_shared/AppSpace.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import PolaKerjaFormModal from './_components/PolaKerjaFormModal';
import { useFetchPolaKerja } from './_hooks/useFetchPolaKerja';
import { useDeletePolaKerja } from './_hooks/useDeletePolaKerja';
import { useSubmitPolaKerja } from './_hooks/useSubmitPolaKerja';

export default function ManajemenPolaKerjaPage() {
  const screens = AppGrid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const { rows, loading, fetchPolaKerja, client, message } = useFetchPolaKerja();
  const { deletingId, handleDelete } = useDeletePolaKerja({
    client,
    message,
    onSuccess: fetchPolaKerja,
  });

  const { isOpen, setIsOpen, mode, activePolaKerja, openCreate, openEdit, handleSubmit, submitting } = useSubmitPolaKerja({
    client,
    message,
    onSuccess: fetchPolaKerja,
  });

  const columns = React.useMemo(
    () => [
      {
        title: 'Nama Pola Kerja',
        dataIndex: 'nama_pola_kerja',
        key: 'nama_pola_kerja',
        width: 280,
        render: (v) => (
          <AppTypography
            as='text'
            weight='semibold'
            style={{ display: 'block' }}
          >
            {v || '-'}
          </AppTypography>
        ),
      },
      {
        title: 'Jam Mulai',
        dataIndex: 'jam_mulai_kerja',
        key: 'jam_mulai_kerja',
        width: 160,
        render: (v) => (
          <AppTypography
            as='text'
            tone='secondary'
          >
            {v || '-'}
          </AppTypography>
        ),
      },
      {
        title: 'Jam Selesai',
        dataIndex: 'jam_selesai_kerja',
        key: 'jam_selesai_kerja',
        width: 160,
        render: (v) => (
          <AppTypography
            as='text'
            tone='secondary'
          >
            {v || '-'}
          </AppTypography>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 170,
        fixed: 'right',
        render: (_, record) => (
          <AppFlex
            gap={8}
            align='center'
            wrap
          >
            <AppButton
              type='link'
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            >
              Edit
            </AppButton>

            <AppButton
              type='text'
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === record?.id_pola_kerja}
              confirm={{
                title: 'Hapus pola kerja ini?',
                content: `Pola "${record?.nama_pola_kerja}" akan dihapus.`,
                okText: 'Hapus',
                cancelText: 'Batal',
                okType: 'danger',
                danger: true,
                centered: true,
              }}
              onClick={() => handleDelete(record)}
            >
              Delete
            </AppButton>
          </AppFlex>
        ),
      },
    ],
    [deletingId, handleDelete, openEdit],
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: isMdUp ? 16 : 12 }}>
        <AppSpace
          direction='vertical'
          size={16}
          style={{ width: '100%' }}
        >
          <AppFlex
            align='center'
            justify='space-between'
            wrap
            gap='sm'
          >
            <div style={{ minWidth: 0 }}>
              <AppTypography
                as='title'
                level={4}
                style={{ margin: 0, fontWeight: 800 }}
              >
                Manajemen Pola Kerja
              </AppTypography>
              <AppTypography
                as='text'
                tone='secondary'
                style={{ display: 'block', marginTop: 4 }}
              >
                Daftar Pola Jam Kerja
              </AppTypography>
            </div>

            <AppButton
              type='primary'
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              Tambah Pola Kerja
            </AppButton>
          </AppFlex>

          <AppCard
            bordered
            style={{ borderRadius: 10 }}
            styles={{ body: { padding: 12 } }}
          >
            <AppTable
              columns={columns}
              dataSource={rows}
              rowKey='id_pola_kerja'
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
              searchable
              refreshable={false}
              columnSettings={false}
              exportCsv={false}
            />
          </AppCard>
        </AppSpace>
      </div>
      <PolaKerjaFormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        mode={mode}
        initialValues={activePolaKerja}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
