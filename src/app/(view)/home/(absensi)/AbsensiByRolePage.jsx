'use client';

import React from 'react';
import dayjs from 'dayjs';
import { Grid, Segmented, Tag, Typography } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, EnvironmentOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';

import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppAvatar from '@/app/(view)/components_shared/AppAvatar.jsx';
import { AppFloatButtonGroup } from '@/app/(view)/components_shared/AppFloatButton.jsx';
import AppTypography, { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';
import { AppDatePickerField } from '@/app/(view)/components_shared/AppDatePicker.jsx';

import { useFetchAbsensi } from './_hooks/useFetchAbsensi.js';
import LocationMapModal from './_components/LocationMapModal.jsx';
import { formatHeaderID, formatTimeDot, pickCoords, toDateKey } from './_utils/absensiHelpers.js';

const { Text } = Typography;

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
  // 1. Definisikan header tanpa kolom koordinat
  const headers = ['Tanggal', 'Nama', 'NIP/NIK', 'Jam Kedatangan', 'Status Kedatangan', 'Lokasi Kedatangan', 'Jam Kepulangan', 'Status Kepulangan', 'Lokasi Kepulangan'];

  const lines = (Array.isArray(rows) ? rows : []).map((r) => {
    const inLocName = r?.in?.lokasi?.nama_lokasi ?? null;
    const outLocName = r?.out?.lokasi?.nama_lokasi ?? null;

    // 2. Susun data sesuai urutan header yang baru (koordinat dihapus)
    return [r?.tanggal ?? null, r?.user?.name ?? null, r?.user?.nip ?? null, formatTimeDot(r?.waktu_masuk), r?.status_masuk ?? null, inLocName, formatTimeDot(r?.waktu_pulang), r?.status_pulang ?? null, outLocName].map(toCsvCell).join(',');
  });

  // 3. Tetap gunakan 'sep=,' agar Excel otomatis membagi kolom dengan rapi
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
    <Tag
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
    </Tag>
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
          <Text type='secondary'>{label}</Text>
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
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const { rows, loading, range, setRange, message, client } = useFetchAbsensi({ role });

  const [viewMode, setViewMode] = React.useState('HARIAN'); // HARIAN | BULANAN
  const [selectedRowKeys, setSelectedRowKeys] = React.useState([]);

  React.useEffect(() => {
    setSelectedRowKeys([]);
  }, [role, rows?.length, viewMode]);

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

  const totalPresensi = React.useMemo(() => {
    const set = new Set();
    for (const r of Array.isArray(rows) ? rows : []) {
      if (r?.id_user) set.add(String(r.id_user));
    }
    return set.size;
  }, [rows]);

  const tepatWaktu = React.useMemo(() => {
    let n = 0;
    for (const r of Array.isArray(rows) ? rows : []) if (r?.status_masuk === 'TEPAT') n += 1;
    return n;
  }, [rows]);

  const terlambat = React.useMemo(() => {
    let n = 0;
    for (const r of Array.isArray(rows) ? rows : []) if (r?.status_masuk === 'TERLAMBAT') n += 1;
    return n;
  }, [rows]);

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

  const resolveExportTarget = React.useCallback(
    (sourceRows) => {
      const allRows = Array.isArray(sourceRows) ? sourceRows : [];
      if (!Array.isArray(selectedRowKeys) || selectedRowKeys.length === 0) return allRows;
      return allRows.filter((r) => selectedRowKeys.includes(r?.id_absensi));
    },
    [selectedRowKeys],
  );

  const handleExportHarian = React.useCallback(() => {
    const target = resolveExportTarget(rows);

    if (!target || target.length === 0) {
      message.info('Tidak ada data untuk diexport.');
      return;
    }

    const fileName = `absensi-${String(roleLabel).toLowerCase()}-${selectedDayKey}.csv`;
    buildAbsensiCsv({ rows: target, fileName });
    message.success('Export harian berhasil.');
  }, [message, roleLabel, rows, selectedDayKey, resolveExportTarget]);

  const handleExportBulanan = React.useCallback(async () => {
    const base = anchorDate?.isValid?.() ? anchorDate : dayjs();
    const monthKey = base.format('YYYY-MM');
    const start_date = base.startOf('month').format('YYYY-MM-DD');
    const end_date = base.endOf('month').format('YYYY-MM-DD');

    const msgKey = `export-bulanan-${monthKey}-${String(roleLabel).toLowerCase()}`;
    message.loading('Menyiapkan export bulanan...', { key: msgKey, duration: 0 });

    try {
      const params = new URLSearchParams();
      if (role) params.set('role', String(role));
      params.set('start_date', start_date);
      params.set('end_date', end_date);
      params.set('limit', '3000');

      const res = await client.get(`/api/absensi?${params.toString()}`, { cache: 'no-store' });
      const data = Array.isArray(res?.data) ? res.data : [];

      const target = isMonthly ? resolveExportTarget(data) : data;

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
  }, [anchorDate, client, isMonthly, message, role, roleLabel, resolveExportTarget]);

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
          <Text
            type='secondary'
            style={{ whiteSpace: 'nowrap' }}
          >
            {v || '-'}
          </Text>
        ),
      },
    ];

    if (isMonthly) {
      cols.push({
        title: 'Tanggal',
        key: 'tanggal',
        dataIndex: 'tanggal',
        width: 130,
        render: (v) => (
          <Text
            type='secondary'
            style={{ whiteSpace: 'nowrap' }}
          >
            {v || '-'}
          </Text>
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
                <Text>{t}</Text>
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
                <Text>{t}</Text>
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
          <Text type='secondary'>Pantau kehadiran dan kepulangan {roleLabel.toLowerCase()} secara real-time</Text>
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
              <Segmented
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
              <Text type='secondary'>Belum ada data absensi.</Text>
            ) : (
              <AppTable
                rowKey='id_absensi'
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
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                }}
                scroll={{ x: isMonthly ? 1120 : 940 }}
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
