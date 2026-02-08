'use client';

import React from 'react';
import { Grid, Tag, Statistic, Card, Row, Col } from 'antd';
import { DeleteOutlined, HistoryOutlined, UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppAvatar from '@/app/(view)/components_shared/AppAvatar.jsx';
import AppTypography, { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';
import { useFetchFaceResetRequests } from './_hooks/useFetchFaceResetRequest';
import { useFetchUsers } from './_hooks/useFetchUsers';
import { useDeleteFace } from './_hooks/useDeleteFace';
import { formatFaceRegistration } from '@/lib/date_helper.js';
import { useUpdateFaceResetRequest } from './_hooks/useUpdateFaceResetRequest';

export default function ManajemenFacePage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  // '1' untuk Data Terdaftar, '2' untuk Request Reset
  const [activeView, setActiveView] = React.useState('1');

  // Hook utama untuk mengambil data
  const { rows: userRows, loading: loadingUsers, refresh: refreshUsers } = useFetchUsers();
  const { rows: requestRows, loading: loadingRequests, refresh: refreshRequests } = useFetchFaceResetRequests();
  const { handleDeleteFace, deletingId } = useDeleteFace(refreshUsers);
  const { handleUpdateStatus, updatingId } = useUpdateFaceResetRequest(refreshRequests);
  // --- Logika Perhitungan Statistik ---
  const stats = React.useMemo(() => {
    return {
      totalActive: userRows.length,
      pendingCount: requestRows.filter((r) => r.status === 'MENUNGGU').length,
    };
  }, [requestRows, userRows]);

  // --- Definisi Kolom ---
  const columnsActive = React.useMemo(
    () => [
      {
        title: 'Nama Guru & Pegawai',
        key: 'nama',
        render: (_, record) => (
          <AppFlex
            align='center'
            gap={10}
          >
            <AppAvatar
              src={record?.foto_profil_url}
              size={28}
            />
            <AppTypography
              as='text'
              weight='semibold'
            >
              {record?.name || '-'}
            </AppTypography>
          </AppFlex>
        ),
      },
      {
        title: 'Tanggal Registrasi',
        key: 'tanggal',
        render: (_, record) => (
          <AppTypography
            as='text'
            tone='secondary'
          >
            {formatFaceRegistration(record?.face_registered_at || record?.created_at)}
          </AppTypography>
        ),
      },
      {
        title: 'Aksi',
        key: 'action',
        width: 120,
        render: (_, record) => (
          <AppButton
            danger
            icon={<DeleteOutlined />}
            confirm={{ title: 'Hapus data face?' }}
            loading={deletingId === record?.id_user}
            onClick={() => handleDeleteFace(record)}
          >
            Hapus
          </AppButton>
        ),
      },
    ],
    [deletingId, handleDeleteFace],
  );

  const columnsRequest = React.useMemo(
    () => [
      {
        title: 'Pemohon',
        key: 'user',
        render: (_, record) => (
          <AppFlex
            align='center'
            gap={10}
          >
            <AppAvatar
              src={record?.user?.foto_profil_url}
              size={28}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{record?.user?.name}</div>
              <div style={{ fontSize: '11px', color: 'gray' }}>{record?.user?.email}</div>
            </div>
          </AppFlex>
        ),
      },
      {
        title: 'Alasan Reset',
        key: 'alasan',
        render: (_, record) => <div style={{ maxWidth: 250 }}>{record.alasan}</div>,
      },
      {
        title: 'Status',
        key: 'status',
        render: (_, record) => {
          const colors = { MENUNGGU: 'orange', SETUJU: 'green', DISETUJUI: 'green', DITOLAK: 'red' };
          const labels = { SETUJU: 'DISETUJUI' };
          const statusLabel = labels[record.status] || record.status;
          return <Tag color={colors[record.status] || 'default'}>{statusLabel}</Tag>;
        },
      },
      {
        title: 'Aksi',
        key: 'action',
        width: 200,
        render: (_, record) =>
          record.status === 'MENUNGGU' ? (
            <AppFlex gap={4}>
              <AppButton
                size='small'
                type='primary'
                icon={<CheckOutlined />}
                loading={updatingId === record?.id_request}
                onClick={() => handleUpdateStatus(record?.id_request, 'SETUJU')}
              >
                Setujui
              </AppButton>
              <AppButton
                size='small'
                danger
                icon={<CloseOutlined />}
                loading={updatingId === record?.id_request}
                onClick={() => handleUpdateStatus(record?.id_request, 'DITOLAK')}
              >
                Tolak
              </AppButton>
            </AppFlex>
          ) : (
            <span style={{ color: '#bfbfbf', fontSize: '12px' }}>Sudah Diproses</span>
          ),
      },
    ],
    [handleUpdateStatus, updatingId],
  );

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: isMdUp ? 24 : 12 }}>
      {/* Header Halaman */}
      <AppFlex
        align='center'
        justify='space-between'
        style={{ marginBottom: 24 }}
      >
        <H2 style={{ margin: 0 }}>Manajemen Data Face</H2>
      </AppFlex>

      {/* Bagian Navigasi Statistik (Pengganti Tabs) */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        <Col
          xs={24}
          sm={12}
        >
          <Card
            hoverable
            onClick={() => setActiveView('1')}
            style={{
              transition: '0.3s',
              borderBottom: activeView === '1' ? '4px solid #1677ff' : '4px solid transparent',
              background: activeView === '1' ? '#f0f5ff' : '#fff',
            }}
          >
            <Statistic
              title='Total Data Terdaftar'
              value={stats.totalActive}
              prefix={<UserOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col
          xs={24}
          sm={12}
        >
          <Card
            hoverable
            onClick={() => setActiveView('2')}
            style={{
              transition: '0.3s',
              borderBottom: activeView === '2' ? '4px solid #ff4d4f' : '4px solid transparent',
              background: activeView === '2' ? '#fff1f0' : '#fff',
            }}
          >
            <Statistic
              title='Permintaan Reset (Pending)'
              value={stats.pendingCount}
              valueStyle={{ color: stats.pendingCount > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Kontainer Tabel */}
      <AppCard
        bordered
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '16px 16px 0 16px' }}>
          <AppTypography
            as='text'
            weight='bold'
            size={16}
          >
            {activeView === '1' ? 'Daftar Guru & Pegawai Terdaftar' : 'Daftar Antrian Request Reset'}
          </AppTypography>
        </div>

        <AppTable
          columns={activeView === '1' ? columnsActive : columnsRequest}
          dataSource={activeView === '1' ? userRows : requestRows}
          rowKey={activeView === '1' ? 'id_user' : 'id_request'}
          loading={activeView === '1' ? loadingUsers : loadingRequests}
          searchable
          showToolbar={false}
          refreshable={false}
          columnSettings={false}
          exportCsv={false}
          emptyText='Tidak ada data yang ditemukan'
        />
      </AppCard>
    </div>
  );
}
