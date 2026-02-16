'use client';

import React from 'react';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppTag from '@/app/(view)/components_shared/AppTag.jsx';
import AppTypography, { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';
import { AppDatePickerField } from '@/app/(view)/components_shared/AppDatePicker.jsx';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { AppModalStatic } from '@/app/(view)/components_shared/AppModal.jsx';

import { useManajemenVerifikasi } from './_hooks/useManajemenVerifikasi.js';
import { matchQuery, matchMonth, toIdDate } from './_utils/helper.js';
import { JENIS_LABEL, STATUS_LABEL, STATUS_TAG_COLOR } from './_utils/constants.js';
import SummaryCard from './_components/SummaryCard.jsx';

export default function ManajemenVerifikasiCutiPage() {
  const screens = AppGrid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const message = useAppMessage();
  const { rows, loading, busyId, updateStatus } = useManajemenVerifikasi();

  const [q, setQ] = React.useState('');
  const [month, setMonth] = React.useState(null);

  const filteredRows = React.useMemo(() => {
    return rows.filter((r) => matchQuery(r, q) && matchMonth(r, month));
  }, [rows, q, month]);

  const summaryItems = React.useMemo(() => rows.filter((r) => String(r?.status).toUpperCase() === 'MENUNGGU').slice(0, 3), [rows]);

  const handleReject = React.useCallback(
    (item) => {
      let note = '';

      AppModalStatic.confirm({
        title: 'Tolak pengajuan?',
        okText: 'Tolak',
        cancelText: 'Batal',
        okButtonProps: { danger: true },
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AppTypography
              as='text'
              tone='secondary'
            >
              Masukkan catatan untuk penolakan.
            </AppTypography>
            <AppInput.TextArea
              placeholder='catatan...'
              autoSize={{ minRows: 3, maxRows: 6 }}
              onChange={(e) => {
                note = e.target.value;
              }}
            />
          </div>
        ),
        onOk: async () => {
          const trimmed = String(note ?? '').trim();
          if (!trimmed) {
            message.error('note_admin wajib diisi');
            return Promise.reject(new Error('note_admin wajib diisi'));
          }
          await updateStatus(item, 'DITOLAK', trimmed);
        },
      });
    },
    [message, updateStatus],
  );

  const columns = [
    { title: 'Nama', key: 'name', render: (_, row) => row?.user?.name || '-' },
    {
      title: 'Konfirmasi',
      key: 'jenis',
      render: (_, row) => JENIS_LABEL[String(row?.jenis_pengajuan).toUpperCase()] || row?.jenis_pengajuan || '-',
    },
    { title: 'Mulai', key: 'tgl_mulai', render: (_, row) => toIdDate(row?.tanggal_mulai) },
    { title: 'Selesai', key: 'tgl_selesai', render: (_, row) => toIdDate(row?.tanggal_selesai) },
    {
      title: 'Status',
      key: 'status',
      render: (_, row) => {
        const s = String(row?.status ?? '').toUpperCase();
        return <AppTag color={STATUS_TAG_COLOR[s]}>{STATUS_LABEL[s] || s}</AppTag>;
      },
    },
    {
      title: 'note_admin',
      key: 'note_admin',
      render: (_, row) => row?.admin_note || '-',
    },
  ];

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
                onApprove={(i) => updateStatus(i, 'SETUJU')}
                onReject={handleReject}
                busy={busyId}
              />
            ))
          ) : (
            <AppCard
              bordered
              style={{ borderRadius: 10, gridColumn: '1 / -1' }}
              styles={{
                body: {
                  padding: isMdUp ? 18 : 14,
                  minHeight: isMdUp ? 110 : 90,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              }}
            >
              <AppTypography tone='secondary'>Tidak ada pengajuan menunggu.</AppTypography>
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
            wrap
            gap={12}
            fullWidth
            style={{ marginBottom: 12 }}
          >
            <div style={{ width: isMdUp ? 220 : '100%' }}>
              <AppDatePickerField
                picker='month'
                value={month}
                onValueChange={setMonth}
                placeholder='Pilih bulan'
                allowClear
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ width: isMdUp ? 260 : '100%', marginLeft: isMdUp ? 'auto' : 0 }}>
              <AppInput.Search
                placeholder='Cari...'
                value={q}
                onValueChange={setQ}
                debounceMs={200}
                style={{ width: '100%' }}
              />
            </div>
          </AppFlex>

          <AppTable
            showToolbar={false}
            searchable={false}
            refreshable={false}
            columnSettings={false}
            rowKey='id_pengajuan'
            columns={columns}
            dataSource={filteredRows}
            loading={loading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 800 }}
          />
        </AppCard>
      </div>
    </div>
  );
}
