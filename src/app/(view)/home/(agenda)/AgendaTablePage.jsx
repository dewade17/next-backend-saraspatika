'use client';

import React from 'react';
import { FileImageOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTable from '@/app/(view)/components_shared/AppTable.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppSpace from '@/app/(view)/components_shared/AppSpace.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import AppAvatar from '@/app/(view)/components_shared/AppAvatar.jsx';
import { AppDatePickerField } from '@/app/(view)/components_shared/AppDatePicker.jsx';

import { useAuth } from '@/app/(view)/home/providerAuth.jsx';
import { useFetchAgenda } from './_hooks/useFetchAgenda.js';
import {
  formatUtcDateIdLongWithWeekday,
  formatUtcTimeDot,
  getTodayDateKey,
  pickAgendaAvatarUrl,
  pickAgendaDisplayName,
  toAgendaDateKey,
} from './_utils/agendaFormatters.js';

export default function AgendaTablePage({ pageTitle, pageSubtitle, kategoriFilter, nameColumnTitle = 'Nama' }) {
  const screens = AppGrid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const { user } = useAuth();
  const fallbackName = user?.nama_pengguna || user?.name || '-';

  const { rows, loading } = useFetchAgenda(kategoriFilter);
  const didPickDateRef = React.useRef(false);
  const [selectedDateKey, setSelectedDateKey] = React.useState(() => getTodayDateKey());

  const filteredRows = React.useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    if (!kategoriFilter) return list;
    return list.filter((r) => String(r?.kategori_agenda || '').toUpperCase() === String(kategoriFilter).toUpperCase());
  }, [rows, kategoriFilter]);

  const latestDateKey = React.useMemo(() => {
    for (const row of filteredRows) {
      const key = toAgendaDateKey(row?.tanggal || row?.jam_mulai || row?.jam_selesai);
      if (key) return key;
    }
    return null;
  }, [filteredRows]);

  React.useEffect(() => {
    if (didPickDateRef.current) return;
    if (!latestDateKey) return;
    if (filteredRows.some((row) => toAgendaDateKey(row?.tanggal || row?.jam_mulai || row?.jam_selesai) === selectedDateKey)) return;
    setSelectedDateKey(latestDateKey);
  }, [filteredRows, latestDateKey, selectedDateKey]);

  const rowsByDate = React.useMemo(() => {
    return filteredRows.filter((row) => toAgendaDateKey(row?.tanggal || row?.jam_mulai || row?.jam_selesai) === selectedDateKey);
  }, [filteredRows, selectedDateKey]);

  const selectedDateLabel = React.useMemo(() => {
    return formatUtcDateIdLongWithWeekday(selectedDateKey);
  }, [selectedDateKey]);

  const handleDateChange = React.useCallback((value) => {
    if (!value) return;
    didPickDateRef.current = true;
    setSelectedDateKey(String(value));
  }, []);

  const columns = React.useMemo(
    () => [
      {
        title: nameColumnTitle,
        key: 'nama',
        width: 320,
        render: (_, record) => {
          const displayName = record?.user?.name || pickAgendaDisplayName(record, fallbackName);
          const avatarUrl = pickAgendaAvatarUrl(record);

          return (
            <AppFlex
              align='center'
              gap='sm'
              style={{ minWidth: 0 }}
            >
              <AppAvatar
                size={30}
                src={avatarUrl}
                name={displayName}
              />
              <AppTypography
                as='text'
                weight='semibold'
                truncate
                tooltip
                style={{ minWidth: 0 }}
              >
                {displayName}
              </AppTypography>
            </AppFlex>
          );
        },
      },
      {
        title: 'Deskripsi',
        dataIndex: 'deskripsi',
        key: 'deskripsi',
        render: (v) => (
          <AppTypography
            as='text'
            tone='secondary'
            truncate
            tooltip
            style={{ display: 'block' }}
          >
            {v || '-'}
          </AppTypography>
        ),
      },
      {
        title: 'Bukti Foto',
        key: 'bukti_pendukung_url',
        dataIndex: 'bukti_pendukung_url',
        width: 120,
        align: 'center',
        render: (url) => (
          <AppButton
            type='text'
            icon={<FileImageOutlined />}
            disabled={!url}
            tooltip={url ? 'Buka bukti foto di halaman baru' : 'Tidak ada bukti foto'}
            onClick={() => {
              if (!url) return;
              window.open(String(url), '_blank', 'noopener,noreferrer');
            }}
          />
        ),
      },
      {
        title: 'Jam Mulai',
        dataIndex: 'jam_mulai',
        key: 'jam_mulai',
        width: 120,
        render: (v) => (
          <AppTypography
            as='text'
            tone='secondary'
            style={{ whiteSpace: 'nowrap' }}
          >
            {formatUtcTimeDot(v)}
          </AppTypography>
        ),
      },
      {
        title: 'Jam Selesai',
        dataIndex: 'jam_selesai',
        key: 'jam_selesai',
        width: 120,
        render: (v) => (
          <AppTypography
            as='text'
            tone='secondary'
            style={{ whiteSpace: 'nowrap' }}
          >
            {formatUtcTimeDot(v)}
          </AppTypography>
        ),
      },
    ],
    [fallbackName, nameColumnTitle],
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
                {pageTitle}
              </AppTypography>
              {pageSubtitle ? (
                <AppTypography
                  as='text'
                  tone='secondary'
                  style={{ display: 'block' }}
                >
                  {pageSubtitle}
                </AppTypography>
              ) : null}
            </div>
          </AppFlex>

          <AppCard>
            <AppSpace
              direction='vertical'
              size={16}
              style={{ width: '100%' }}
            >
              <AppFlex
                align={isMdUp ? 'center' : 'flex-start'}
                justify='space-between'
                wrap
                gap='sm'
                style={{ width: '100%' }}
              >
                <div style={{ minWidth: 0 }}>
                  <AppTypography
                    as='text'
                    weight='semibold'
                    style={{ display: 'block' }}
                  >
                    Agenda per Tanggal
                  </AppTypography>
                  <AppTypography
                    as='text'
                    tone='secondary'
                    style={{ display: 'block' }}
                  >
                    {selectedDateLabel}
                  </AppTypography>
                </div>

                <div style={{ width: isMdUp ? 220 : '100%' }}>
                  <AppDatePickerField
                    label={null}
                    value={selectedDateKey}
                    valueType='string'
                    valueFormat='YYYY-MM-DD'
                    onValueChange={handleDateChange}
                    placeholder='Pilih tanggal'
                    allowClear={false}
                    clearable={false}
                  />
                </div>
              </AppFlex>

              {rowsByDate.length === 0 && !loading ? (
                <AppTypography
                  as='text'
                  tone='secondary'
                >
                  {filteredRows.length === 0 ? 'Belum ada data agenda.' : 'Belum ada agenda pada tanggal yang dipilih.'}
                </AppTypography>
              ) : (
                <AppTable
                  showToolbar={false}
                  rowKey={(r) => r?.id_agenda || `${r?.tanggal || ''}-${r?.jam_mulai || ''}-${r?.jam_selesai || ''}`}
                  loading={loading}
                  columns={columns}
                  dataSource={rowsByDate}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                  }}
                />
              )}
            </AppSpace>
          </AppCard>
        </AppSpace>
      </div>
    </div>
  );
}
