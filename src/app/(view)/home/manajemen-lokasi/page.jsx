'use client';

import React from 'react';
import { Empty, Grid } from 'antd';
import { EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppSpace from '@/app/(view)/components_shared/AppSpace.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppFloatButton from '@/app/(view)/components_shared/AppFloatButton.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import AppTypography, { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';

import LocationCard from './_components/LocationCard';
import LocationFormModal from './_components/LocationFormModal';

import { useFetchLocations } from './_hooks/useFetchLocations';
import { useSubmitLocation } from './_hooks/useSubmitLocation';
import { useDeleteLocation } from './_hooks/useDeleteLocation';
import { matchesQuery } from './_utils/locationHelpers';

export default function ManajemenLokasiPage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const { locations, loading, q, setQ, message, fetchLocations, client } = useFetchLocations();

  const { deletingId, handleDelete } = useDeleteLocation({
    client,
    message,
    onSuccess: fetchLocations,
  });

  const { isOpen, setIsOpen, mode, activeLocation, openCreate, openEdit, handleSubmit, submitting } = useSubmitLocation({
    client,
    message,
    onSuccess: fetchLocations,
  });

  const filtered = React.useMemo(() => locations.filter((l) => matchesQuery(l, q)), [locations, q]);

  const statsText = React.useMemo(() => {
    const total = locations.length;
    const shown = filtered.length;
    if (total === 0) return '0 lokasi';
    if (shown === total) return `${total} lokasi`;
    return `${shown} dari ${total} lokasi`;
  }, [locations.length, filtered.length]);

  return (
    <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto', padding: isMdUp ? 16 : 12 }}>
      <AppSpace
        direction='vertical'
        size={16}
        style={{ width: '100%' }}
      >
        <AppCard
          bordered
          style={{ borderRadius: 14 }}
          styles={{ body: { padding: 16 } }}
        >
          <AppFlex
            align='center'
            justify='space-between'
            wrap
            gap={12}
            style={{ width: '100%' }}
          >
            <div style={{ minWidth: 0 }}>
              <AppFlex
                align='center'
                gap={8}
                style={{ marginBottom: 4 }}
              >
                <EnvironmentOutlined />
                <H2 style={{ margin: 0 }}>Manajemen Lokasi</H2>
              </AppFlex>

              <AppTypography
                as='text'
                tone='secondary'
                style={{ display: 'block' }}
              >
                Kelola daftar lokasi beserta koordinat dan radius.
              </AppTypography>

              <AppTypography
                as='text'
                tone='secondary'
                style={{ display: 'block', marginTop: 4, fontSize: 12 }}
              >
                {statsText}
              </AppTypography>
            </div>

            <AppFlex
              align='center'
              gap={10}
              wrap
              style={{ width: isMdUp ? 'auto' : '100%' }}
            >
              <div style={{ width: isMdUp ? 320 : '100%', minWidth: 220 }}>
                <AppInput.Search
                  placeholder='Cari nama lokasi...'
                  value={q}
                  onValueChange={setQ}
                  emitOnChange
                  debounceMs={200}
                  allowClear
                />
              </div>
            </AppFlex>
          </AppFlex>
        </AppCard>

        {loading ? (
          <AppGrid
            columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
            gap={16}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <AppCard
                key={i}
                bordered
                style={{ borderRadius: 10 }}
              >
                <AppSkeleton active />
              </AppCard>
            ))}
          </AppGrid>
        ) : filtered.length === 0 ? (
          <AppCard
            bordered
            style={{ borderRadius: 10 }}
            styles={{ body: { padding: 24 } }}
          >
            <Empty description={locations.length === 0 ? 'Belum ada lokasi.' : 'Tidak ada hasil pencarian.'} />
          </AppCard>
        ) : (
          <AppGrid
            columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
            gap={16}
          >
            {filtered.map((loc) => (
              <LocationCard
                key={loc.id}
                loc={loc}
                onEdit={openEdit}
                onDelete={handleDelete}
                isDeleting={deletingId === loc.id}
              />
            ))}
          </AppGrid>
        )}

        <AppFloatButton
          icon={<PlusOutlined />}
          tooltip='Tambah lokasi'
          onClick={openCreate}
        />

        <LocationFormModal
          open={isOpen}
          onOpenChange={setIsOpen}
          mode={mode}
          initialValues={activeLocation}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
        />
      </AppSpace>
    </div>
  );
}
