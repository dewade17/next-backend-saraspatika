'use client';

import React from 'react';
import { Grid, Tag } from 'antd';
import { ScheduleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppTypography, { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';
import { AppDatePickerField } from '@/app/(view)/components_shared/AppDatePicker.jsx';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

const STATUS_LABEL = Object.freeze({
  MENUNGGU: 'Menunggu',
  SETUJU: 'Disetujui',
  DITOLAK: 'Ditolak',
});

const STATUS_TAG_COLOR = Object.freeze({
  MENUNGGU: 'gold',
  SETUJU: 'green',
  DITOLAK: 'red',
});

const JENIS_LABEL = Object.freeze({
  IZIN: 'Izin',
  SAKIT: 'Sakit',
  CUTI: 'Cuti',
});

function toIdDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

function toLower(v) {
  return String(v ?? '').toLowerCase();
}

function matchQuery(row, q) {
  const query = String(q ?? '')
    .trim()
    .toLowerCase();
  if (!query) return true;

  const name = toLower(row?.user?.name);
  const nip = toLower(row?.user?.nip);
  const jenis = toLower(row?.jenis_pengajuan);
  const alasan = toLower(row?.alasan);
  const status = toLower(row?.status);

  return [name, nip, jenis, alasan, status].some((s) => s.includes(query));
}

function matchMonth(row, monthValue) {
  if (!monthValue) return true;

  const raw = row?.tanggal_mulai || row?.tanggal_selesai;
  if (!raw) return true;

  const d = dayjs(raw);
  if (!d.isValid()) return true;

  return d.year() === monthValue.year() && d.month() === monthValue.month();
}

function SummaryCard({ item, onApprove, onReject, busy }) {
  const status = String(item?.status ?? 'MENUNGGU').toUpperCase();
  const jenis = String(item?.jenis_pengajuan ?? '').toUpperCase();

  return (
    <AppCard
      bordered
      style={{
        borderRadius: 10,
        height: '100%',
      }}
      styles={{
        body: { padding: 14 },
      }}
    >
      <AppFlex
        direction='column'
        gap={8}
        style={{ width: '100%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <AppTypography
            as='text'
            weight='semibold'
            style={{ display: 'block', minWidth: 0 }}
            truncate
          >
            {item?.user?.name || '-'}
          </AppTypography>

          <Tag
            color={STATUS_TAG_COLOR[status] || 'default'}
            style={{ marginInlineEnd: 0 }}
          >
            {STATUS_LABEL[status] || status}
          </Tag>
        </div>

        <AppTypography as='text'>
          <b>Nama</b>: {item?.user?.name || '-'}
        </AppTypography>
        <AppTypography as='text'>
          <b>NIP</b>: {item?.user?.nip || '-'}
        </AppTypography>
        <AppTypography as='text'>
          <b>Konfirmasi</b>: {JENIS_LABEL[jenis] || item?.jenis_pengajuan || '-'}
        </AppTypography>
        <AppTypography as='text'>
          <b>Deskripsi</b>: {item?.alasan || '-'}
        </AppTypography>
        <AppTypography as='text'>
          <b>Tanggal Mulai</b>: {toIdDate(item?.tanggal_mulai)}
        </AppTypography>
        <AppTypography as='text'>
          <b>Tanggal Selesai</b>: {toIdDate(item?.tanggal_selesai)}
        </AppTypography>

        <AppFlex
          gap={10}
          justify='space-between'
          style={{ marginTop: 10 }}
        >
          <AppButton
            type='primary'
            block
            onClick={() => onApprove(item)}
            loading={busy === item?.id_pengajuan}
            disabled={status !== 'MENUNGGU'}
          >
            Setuju
          </AppButton>

          <AppButton
            danger
            block
            onClick={() => onReject(item)}
            loading={busy === item?.id_pengajuan}
            disabled={status !== 'MENUNGGU'}
          >
            Tolak
          </AppButton>
        </AppFlex>
      </AppFlex>
    </AppCard>
  );
}

export default function ManajemenVerifikasiCutiPage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState(null);

  const [q, setQ] = React.useState('');
  const [month, setMonth] = React.useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState([]);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/pengajuan-absensi', { cache: 'no-store' });
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat daftar pengajuan' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const pending = React.useMemo(() => rows.filter((r) => String(r?.status).toUpperCase() === 'MENUNGGU'), [rows]);
  const summaryItems = React.useMemo(() => pending.slice(0, 3), [pending]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((r) => matchQuery(r, q)).filter((r) => matchMonth(r, month));
  }, [rows, q, month]);

  const updateStatus = React.useCallback(
    async (item, nextStatus) => {
      const id = item?.id_pengajuan;
      if (!id) return;

      setBusyId(id);
      try {
        await client.patch(`/api/pengajuan-absensi/${encodeURIComponent(String(id))}`, {
          json: { status: nextStatus },
        });

        message.success(`Pengajuan berhasil ${nextStatus === 'SETUJU' ? 'disetujui' : 'ditolak'}`);
        await fetchRows();
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memproses pengajuan' });
      } finally {
        setBusyId(null);
      }
    },
    [client, fetchRows, message],
  );

  const onApprove = React.useCallback((item) => updateStatus(item, 'SETUJU'), [updateStatus]);
  const onReject = React.useCallback((item) => updateStatus(item, 'DITOLAK'), [updateStatus]);

  const columns = React.useMemo(
    () => [
      {
        title: 'Nama',
        key: 'name',
        render: (_, row) => row?.user?.name || '-',
      },
      {
        title: 'Konfirmasi',
        key: 'jenis',
        render: (_, row) => {
          const jenis = String(row?.jenis_pengajuan ?? '').toUpperCase();
          return JENIS_LABEL[jenis] || row?.jenis_pengajuan || '-';
        },
      },
      {
        title: 'Tanggal Mulai',
        key: 'tgl_mulai',
        render: (_, row) => toIdDate(row?.tanggal_mulai),
      },
      {
        title: 'Tanggal Selesai',
        key: 'tgl_selesai',
        render: (_, row) => toIdDate(row?.tanggal_selesai),
      },
      {
        title: 'Status',
        key: 'status',
        render: (_, row) => {
          const status = String(row?.status ?? '').toUpperCase();
          return <Tag color={STATUS_TAG_COLOR[status] || 'default'}>{STATUS_LABEL[status] || status || '-'}</Tag>;
        },
      },
      {
        title: 'Aksi',
        key: 'aksi',
        render: (_, row) => {
          const status = String(row?.status ?? '').toUpperCase();
          if (status !== 'MENUNGGU') return '-';

          return (
            <AppFlex
              gap={8}
              wrap
            >
              <AppButton
                type='primary'
                size='small'
                onClick={() => onApprove(row)}
                loading={busyId === row?.id_pengajuan}
              >
                Setuju
              </AppButton>
              <AppButton
                danger
                size='small'
                onClick={() => onReject(row)}
                loading={busyId === row?.id_pengajuan}
              >
                Tolak
              </AppButton>
            </AppFlex>
          );
        },
      },
    ],
    [busyId, onApprove, onReject],
  );

  return (
    <div style={{ width: '100%', padding: isMdUp ? 16 : 12 }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        <AppFlex
          align='center'
          justify='space-between'
          wrap
          gap={12}
          style={{ width: '100%', marginBottom: 16 }}
        >
          <div style={{ minWidth: 0 }}>
            <AppFlex
              align='center'
              gap={8}
              style={{ marginBottom: 4 }}
            >
              <ScheduleOutlined />
              <H2 style={{ margin: 0 }}>Manajemen Verifikasi Pengajuan</H2>
            </AppFlex>

            <AppTypography
              as='text'
              tone='secondary'
              style={{ display: 'block' }}
            >
              Verifikasi pengajuan cuti, izin, dan sakit pegawai & guru-guru.
            </AppTypography>
          </div>
        </AppFlex>

        <AppGrid
          columns={{ base: 1, md: 3 }}
          gap={12}
          style={{ marginBottom: 14 }}
        >
          {summaryItems.length ? (
            summaryItems.map((item) => (
              <SummaryCard
                key={item.id_pengajuan}
                item={item}
                onApprove={onApprove}
                onReject={onReject}
                busy={busyId}
              />
            ))
          ) : (
            <AppCard
              bordered
              style={{ borderRadius: 10 }}
              styles={{ body: { padding: 14 } }}
            >
              <AppTypography
                as='text'
                tone='secondary'
              >
                Tidak ada pengajuan yang menunggu verifikasi.
              </AppTypography>
            </AppCard>
          )}
        </AppGrid>

        <AppCard
          bordered
          style={{ borderRadius: 10 }}
          styles={{ body: { padding: isMdUp ? 16 : 12 } }}
        >
          <AppFlex
            align='center'
            justify='space-between'
            wrap
            gap={12}
            style={{ marginBottom: 12 }}
          >
            <div style={{ width: isMdUp ? 220 : '100%' }}>
              <AppDatePickerField
                label={null}
                picker='month'
                value={month}
                onValueChange={setMonth}
                placeholder='Pilih bulan'
                allowClear
                clearable
              />
            </div>

            <div style={{ width: isMdUp ? 260 : '100%' }}>
              <AppInput.Search
                placeholder='Search'
                value={q}
                onValueChange={setQ}
                emitOnChange
                debounceMs={200}
              />
            </div>
          </AppFlex>

          <AppTable
            rowKey='id_pengajuan'
            columns={columns}
            dataSource={filteredRows}
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            size='middle'
            bordered
            showToolbar={false}
            searchable={false}
            refreshable={false}
            exportCsv={false}
            columnSettings={false}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            scroll={{ x: 920 }}
          />
        </AppCard>
      </div>
    </div>
  );
}
