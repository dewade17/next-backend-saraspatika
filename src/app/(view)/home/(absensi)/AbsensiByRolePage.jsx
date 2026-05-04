'use client';

import React from 'react';
import dayjs from 'dayjs';
import { CheckCircleOutlined, DownloadOutlined, EnvironmentOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';

import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppAvatar from '@/app/(view)/components_shared/AppAvatar.jsx';
import AppSegmented from '@/app/(view)/components_shared/AppSegmented.jsx';
import AppTag from '@/app/(view)/components_shared/AppTag.jsx';
import { AppFloatButtonGroup } from '@/app/(view)/components_shared/AppFloatButton.jsx';
import AppTypography, { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';
import { AppDatePickerField } from '@/app/(view)/components_shared/AppDatePicker.jsx';

import { useFetchAbsensi } from './_hooks/useFetchAbsensi.js';
import LocationMapModal from './_components/LocationMapModal.jsx';
import { formatHeaderID, formatTimeDot, pickCoords, summarizeAbsensi, toDateKey } from './_utils/absensiHelpers.js';

const ID_MONTH = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function toCsvCell(v) {
  if (v == null) return '';
  const s = typeof v === 'string' ? v : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? 'true' : 'false') : JSON.stringify(v);
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadText(filename, content, mime = 'text/csv;charset=utf-8') {
  if (typeof window === 'undefined') return;

  // Menambahkan \uFEFF (BOM) di awal konten agar Excel mengenali UTF-8
  const blob = new Blob(['\uFEFF', content], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function buildAbsensiCsv({ rows, fileName }) {
  const headers = ['Tanggal', 'Nama', 'NIP/NIK', 'Model Absensi', 'Jam Kedatangan', 'Status Kedatangan', 'Lokasi Kedatangan', 'Jam Kepulangan', 'Status Kepulangan', 'Lokasi Kepulangan'];

  const lines = (Array.isArray(rows) ? rows : []).map((r) => {
    const inLocName = r?.in?.lokasi?.nama_lokasi ?? null;
    const outLocName = r?.out?.lokasi?.nama_lokasi ?? null;

    return [
      r?.tanggal ?? null,
      r?.user?.name ?? null,
      r?.user?.nip ?? null,
      r?.model_absensi ?? 'Sekolah',
      formatTimeDot(r?.waktu_masuk),
      r?.status_masuk ?? null,
      inLocName,
      formatTimeDot(r?.waktu_pulang),
      r?.status_pulang ?? null,
      outLocName,
    ]
      .map(toCsvCell)
      .join(',');
  });

  const content = ['sep=,', headers.map(toCsvCell).join(','), ...lines].join('\n');

  downloadText(fileName || 'absensi.csv', content);
}

function normalizeStatusLabel(status) {
  const s = String(status ?? '')
    .trim()
    .toUpperCase();
  if (!s) return null;
  if (s === 'TEPAT') return 'Tepat Waktu';
  if (s === 'TERLAMBAT') return 'Terlambat';
  return s;
}

function StatusTag({ status }) {
  const label = normalizeStatusLabel(status);
  if (!label) return null;

  const s = String(status ?? '')
    .trim()
    .toUpperCase();
  const isLate = s === 'TERLAMBAT';

  return (
    <AppTag
      color={isLate ? 'orange' : 'green'}
      style={{
        margin: 0,
        borderRadius: 999,
        paddingInline: 10,
        paddingBlock: 2,
        fontWeight: 600,
        fontFamily: 'var(--font-poppins)',
        width: 'fit-content',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {isLate ? <WarningOutlined /> : <CheckCircleOutlined />}
        {label}
      </span>
    </AppTag>
  );
}

function ModelAbsensiTag({ value }) {
  const label = value || 'Sekolah';
  const isWfh = String(label).trim().toUpperCase() === 'WFH';

  return (
    <AppTag
      color={isWfh ? 'blue' : 'green'}
      style={{
        margin: 0,
        borderRadius: 999,
        paddingInline: 10,
        paddingBlock: 2,
        fontWeight: 600,
        fontFamily: 'var(--font-poppins)',
        width: 'fit-content',
      }}
    >
      {isWfh ? 'WFH' : 'Sekolah'}
    </AppTag>
  );
}

function StatCard({ label, value, icon, tone }) {
  return (
    <AppCard
      bordered
      variant='default'
      tone={tone}
      accent='none'
      padding='md'
      style={{ height: '100%' }}
    >
      <AppFlex
        align='center'
        justify='space-between'
        gap={12}
        style={{ width: '100%' }}
      >
        <div>
          <AppTypography
            as='text'
            tone='secondary'
          >
            {label}
          </AppTypography>
          <div style={{ marginTop: 2 }}>
            <AppTypography
              as='text'
              weight='semibold'
              style={{ fontSize: 28, lineHeight: 1.1 }}
            >
              {value}
            </AppTypography>
          </div>
        </div>
        <div style={{ fontSize: 26 }}>{icon}</div>
      </AppFlex>
    </AppCard>
  );
}

export default function AbsensiByRolePage({ title, role }) {
  const screens = AppGrid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const { rows, loading, range, setRange, message, fetchAbsensiRows } = useFetchAbsensi({ role });

  const [viewMode, setViewMode] = React.useState('HARIAN'); // HARIAN | BULANAN

  const [locOpen, setLocOpen] = React.useState(false);
  const [locState, setLocState] = React.useState({
    title: 'Lokasi Absensi',
    lokasiName: null,
    latitude: null,
    longitude: null,
  });

  const openLoc = React.useCallback((payload) => {
    setLocState(payload);
    setLocOpen(true);
  }, []);

  const roleLabel = React.useMemo(() => {
    const r = String(role || '').toUpperCase();
    if (r === 'GURU') return 'Guru';
    if (r === 'PEGAWAI') return 'Pegawai';
    return 'Karyawan';
  }, [role]);

  const anchorDate = React.useMemo(() => {
    const d = range?.[0];
    const x = d ? dayjs(d) : dayjs();
    return x.isValid() ? x : dayjs();
  }, [range]);

  const isMonthly = viewMode === 'BULANAN';

  const selectedDayKey = React.useMemo(() => toDateKey(anchorDate) ?? dayjs().format('YYYY-MM-DD'), [anchorDate]);
  const headerSubtitle = React.useMemo(() => {
    if (isMonthly) {
      const monthName = ID_MONTH[anchorDate.month()] ?? anchorDate.format('MM');
      return `${monthName} ${anchorDate.year()}`;
    }
    return selectedDayKey ? formatHeaderID(selectedDayKey) : '';
  }, [anchorDate, isMonthly, selectedDayKey]);

  const { totalPresensi, tepatWaktu, terlambat } = React.useMemo(() => summarizeAbsensi(rows), [rows]);

  const handleModeChange = React.useCallback(
    (val) => {
      const next = String(val ?? '').toUpperCase() === 'BULANAN' ? 'BULANAN' : 'HARIAN';
      if (next === viewMode) return;

      setViewMode(next);

      const base = anchorDate?.isValid?.() ? anchorDate : dayjs();
      if (next === 'BULANAN') {
        setRange([base.startOf('month'), base.endOf('month')]);
      } else {
        setRange([base.startOf('day'), base.endOf('day')]);
      }
    },
    [anchorDate, setRange, viewMode],
  );

  const handlePeriodChange = React.useCallback(
    (val) => {
      if (!val) return;
      const d = dayjs(val);
      if (!d.isValid()) return;

      if (isMonthly) {
        setRange([d.startOf('month'), d.endOf('month')]);
        return;
      }

      setRange([d.startOf('day'), d.endOf('day')]);
    },
    [isMonthly, setRange],
  );

  const handleExportHarian = React.useCallback(() => {
    const target = Array.isArray(rows) ? rows : [];

    if (!target || target.length === 0) {
      message.info('Tidak ada data untuk diexport.');
      return;
    }

    const fileName = `absensi-${String(roleLabel).toLowerCase()}-${selectedDayKey}.csv`;
    buildAbsensiCsv({ rows: target, fileName });
    message.success('Export harian berhasil.');
  }, [message, roleLabel, rows, selectedDayKey]);

  const handleExportBulanan = React.useCallback(async () => {
    const base = anchorDate?.isValid?.() ? anchorDate : dayjs();
    const monthKey = base.format('YYYY-MM');
    const start_date = base.startOf('month').format('YYYY-MM-DD');
    const end_date = base.endOf('month').format('YYYY-MM-DD');

    const msgKey = `export-bulanan-${monthKey}-${String(roleLabel).toLowerCase()}`;
    message.loading('Menyiapkan export bulanan...', { key: msgKey, duration: 0 });

    try {
      const target = await fetchAbsensiRows({ start_date, end_date, limit: 3000 });

      if (!target || target.length === 0) {
        message.info('Tidak ada data untuk diexport.', { key: msgKey });
        return;
      }

      const fileName = `absensi-${String(roleLabel).toLowerCase()}-${monthKey}.csv`;
      buildAbsensiCsv({ rows: target, fileName });
      message.success('Export bulanan berhasil.', { key: msgKey });
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal export bulanan.', key: msgKey });
    }
  }, [anchorDate, fetchAbsensiRows, message, roleLabel]);

  const nameColTitle = roleLabel === 'Guru' ? 'Nama Guru' : roleLabel === 'Pegawai' ? 'Nama Pegawai' : 'Nama';

  const columns = React.useMemo(() => {
    const cols = [
      {
        title: nameColTitle,
        key: 'nama',
        width: 340,
        render: (_, record) => {
          const user = record?.user;
          const name = user?.name || '-';
          return (
            <AppFlex
              align='center'
              gap={10}
            >
              <AppAvatar
                size={30}
                src={user?.foto_profil_url || null}
              />
              <AppTypography
                as='text'
                weight='semibold'
              >
                {name}
              </AppTypography>
            </AppFlex>
          );
        },
      },
      {
        title: 'NIP/NIK',
        key: 'nip',
        dataIndex: ['user', 'nip'],
        width: 160,
        render: (v) => (
          <AppTypography
            as='text'
            tone='secondary'
            style={{ whiteSpace: 'nowrap' }}
          >
            {v || '-'}
          </AppTypography>
        ),
      },
      {
        title: 'Keterangan',
        key: 'model_absensi',
        dataIndex: 'model_absensi',
        width: 130,
        render: (v) => <ModelAbsensiTag value={v} />,
      },
    ];

    if (isMonthly) {
      cols.push({
        title: 'Tanggal',
        key: 'tanggal',
        dataIndex: 'tanggal',
        width: 130,
        render: (v) => (
          <AppTypography
            as='text'
            tone='secondary'
            style={{ whiteSpace: 'nowrap' }}
          >
            {v || '-'}
          </AppTypography>
        ),
      });
    }

    cols.push(
      {
        title: 'Jam Kedatangan',
        key: 'jam_datang',
        width: 220,
        render: (_, record) => {
          const t = formatTimeDot(record?.waktu_masuk);
          const status = record?.status_masuk ?? null;
          const { latitude, longitude, name } = pickCoords(record?.in);
          const has = latitude != null && longitude != null;

          return (
            <AppFlex
              direction='column'
              gap={4}
              style={{ width: '100%' }}
            >
              <AppFlex
                align='center'
                gap={8}
              >
                <AppTypography as='text'>{t}</AppTypography>
                {has ? (
                  <AppButton
                    type='text'
                    size='small'
                    icon={<EnvironmentOutlined />}
                    tooltip='Lihat lokasi kedatangan'
                    onClick={() =>
                      openLoc({
                        title: 'Lokasi Kedatangan',
                        lokasiName: name,
                        latitude,
                        longitude,
                      })
                    }
                  />
                ) : null}
              </AppFlex>

              <StatusTag status={status} />
            </AppFlex>
          );
        },
      },
      {
        title: 'Jam Kepulangan',
        key: 'jam_pulang',
        width: 220,
        render: (_, record) => {
          const t = formatTimeDot(record?.waktu_pulang);
          const status = record?.status_pulang ?? null;
          const { latitude, longitude, name } = pickCoords(record?.out);
          const has = latitude != null && longitude != null;

          return (
            <AppFlex
              direction='column'
              gap={4}
              style={{ width: '100%' }}
            >
              <AppFlex
                align='center'
                gap={8}
              >
                <AppTypography as='text'>{t}</AppTypography>
                {has ? (
                  <AppButton
                    type='text'
                    size='small'
                    icon={<EnvironmentOutlined />}
                    tooltip='Lihat lokasi kepulangan'
                    onClick={() =>
                      openLoc({
                        title: 'Lokasi Kepulangan',
                        lokasiName: name,
                        latitude,
                        longitude,
                      })
                    }
                  />
                ) : null}
              </AppFlex>

              <StatusTag status={status} />
            </AppFlex>
          );
        },
      },
    );

    return cols;
  }, [isMonthly, nameColTitle, openLoc]);

  const exportFabItems = React.useMemo(
    () => [
      {
        key: 'export-harian',
        icon: <DownloadOutlined />,
        tooltip: 'Export Harian (CSV)',
        disabled: !rows || rows.length === 0,
        disabledReason: 'Tidak ada data untuk diexport.',
        onClick: handleExportHarian,
      },
      {
        key: 'export-bulanan',
        icon: <DownloadOutlined />,
        tooltip: 'Export Bulanan (CSV)',
        onClick: handleExportBulanan,
      },
    ],
    [handleExportBulanan, handleExportHarian, rows],
  );

  return (
    <div style={{ width: '100%', padding: isMdUp ? 16 : 12 }}>
      <div style={{ width: '100%' }}>
        <H2 style={{ margin: 0 }}>Absensi</H2>
        <div style={{ marginTop: 2 }}>
          <AppTypography
            as='text'
            tone='secondary'
          >
            Pantau kehadiran dan kepulangan {roleLabel.toLowerCase()} secara real-time
          </AppTypography>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <AppCard
          bordered
          variant='soft'
          tone='info'
          title={title || `Absensi ${roleLabel}`}
          subtitle={headerSubtitle}
          toolbar={
            <AppFlex
              direction={isMdUp ? 'row' : 'column'}
              gap={10}
              style={{ width: isMdUp ? 'auto' : '100%' }}
            >
              <AppSegmented
                size='middle'
                value={viewMode}
                onChange={handleModeChange}
                options={[
                  { label: 'Per Hari', value: 'HARIAN' },
                  { label: 'Per Bulan', value: 'BULANAN' },
                ]}
              />
              <div style={{ width: isMdUp ? 220 : '100%' }}>
                <AppDatePickerField
                  label={null}
                  picker={isMonthly ? 'month' : 'date'}
                  value={anchorDate}
                  onValueChange={handlePeriodChange}
                  placeholder={isMonthly ? 'Pilih bulan' : 'Pilih tanggal'}
                  allowClear={false}
                  clearable={false}
                />
              </div>
            </AppFlex>
          }
        >
          <AppFlex
            direction='column'
            gap={14}
            style={{ width: '100%' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMdUp ? 'repeat(3, minmax(0, 1fr))' : '1fr',
                gap: 12,
                width: '100%',
              }}
            >
              <StatCard
                label={`${roleLabel} Presensi`}
                value={totalPresensi}
                icon={<TeamOutlined />}
                tone='primary'
              />
              <StatCard
                label='Tepat Waktu'
                value={tepatWaktu}
                icon={<CheckCircleOutlined />}
                tone='success'
              />
              <StatCard
                label='Terlambat'
                value={terlambat}
                icon={<WarningOutlined />}
                tone='warning'
              />
            </div>

            {rows.length === 0 && !loading ? (
              <AppTypography
                as='text'
                tone='secondary'
              >
                Belum ada data absensi.
              </AppTypography>
            ) : (
              <AppTable
                rowKey='row_key'
                columns={columns}
                dataSource={rows}
                loading={loading}
                pagination={false}
                size='middle'
                bordered
                showToolbar={false}
                searchable={false}
                refreshable={false}
                exportCsv={false}
                columnSettings={false}
                scroll={{ x: isMonthly ? 1250 : 1070 }}
              />
            )}
          </AppFlex>
        </AppCard>
      </div>

      <AppFloatButtonGroup
        type='primary'
        icon={<DownloadOutlined />}
        items={exportFabItems}
        rememberOpenKey={`absensi-export-fab-${String(roleLabel).toLowerCase()}`}
      />

      <LocationMapModal
        open={locOpen}
        onOpenChange={setLocOpen}
        title={locState.title}
        lokasiName={locState.lokasiName}
        latitude={locState.latitude}
        longitude={locState.longitude}
      />
    </div>
  );
}
