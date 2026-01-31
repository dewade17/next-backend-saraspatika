'use client';

import React from 'react';
import { App as AntdApp, Grid } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppSpace from '@/app/(view)/components_shared/AppSpace.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';

export default function ManajemenPolaKerjaPage() {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    let alive = true;

    setLoading(true);
    const t = setTimeout(() => {
      if (!alive) return;

      setRows([
        {
          id_pola_kerja: 'b59d1a1e-5fd8-4d0a-9b91-0fb6b0d6e001',
          nama_pola_kerja: 'Pola Pagi',
          jam_mulai_kerja: '07:00',
          jam_selesai_kerja: '15:00',
        },
        {
          id_pola_kerja: 'b59d1a1e-5fd8-4d0a-9b91-0fb6b0d6e002',
          nama_pola_kerja: 'Pola Siang',
          jam_mulai_kerja: '12:00',
          jam_selesai_kerja: '20:00',
        },
        {
          id_pola_kerja: 'b59d1a1e-5fd8-4d0a-9b91-0fb6b0d6e003',
          nama_pola_kerja: 'Pola Malam',
          jam_mulai_kerja: '20:00',
          jam_selesai_kerja: '04:00',
        },
      ]);

      setLoading(false);
    }, 650);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  const handleCreate = React.useCallback(() => {
    message.info('Aksi: Tambah Pola Kerja (dummy).');
  }, [message]);

  const handleEdit = React.useCallback(
    (record) => {
      message.info(`Aksi: Edit "${record?.nama_pola_kerja}" (dummy).`);
    },
    [message],
  );

  const handleDelete = React.useCallback(
    (record) => {
      const id = record?.id_pola_kerja;
      if (!id) return;

      setRows((prev) => prev.filter((r) => r.id_pola_kerja !== id));
      message.success(`Terhapus: "${record?.nama_pola_kerja}"`);
    },
    [message],
  );

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
              onClick={() => handleEdit(record)}
            >
              Edit
            </AppButton>

            <AppButton
              type='text'
              danger
              icon={<DeleteOutlined />}
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
    [handleDelete, handleEdit],
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
              onClick={handleCreate}
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
    </div>
  );
}
