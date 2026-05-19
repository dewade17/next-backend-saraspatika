'use client';

import React from 'react';
import { EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import { Pagination } from 'antd';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppSpace from '@/app/(view)/components_shared/AppSpace.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppEmpty from '@/app/(view)/components_shared/AppEmpty.jsx';
import AppFloatButton from '@/app/(view)/components_shared/AppFloatButton.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import AppTypography, { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';

import LocationCard from './_components/LocationCard';
import LocationFormModal from './_components/LocationFormModal';

import { useFetchLocations } from './_hooks/useFetchLocations';
import { useSubmitLocation } from './_hooks/useSubmitLocation';
import { useDeleteLocation } from './_hooks/useDeleteLocation';

export default function ManajemenLokasiPage() {
  const screens = AppGrid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const { locations, loading, q, setQ, page, pageSize, total, handlePageChange, message, fetchLocations, client } = useFetchLocations();

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

  const statsText = React.useMemo(() => {
    if (total === 0) return '0 lokasi';
    if (locations.length === total) return `${total} lokasi`;
    return `${locations.length} dari ${total} lokasi`;
  }, [locations.length, total]);

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
                  debounceMs={0}
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
        ) : locations.length === 0 ? (
          <AppCard
            bordered
            style={{ borderRadius: 10 }}
            styles={{ body: { padding: 24 } }}
          >
            <AppEmpty description={q ? 'Tidak ada hasil pencarian.' : 'Belum ada lokasi.'} />
          </AppCard>
        ) : (
          <AppGrid
            columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
            gap={16}
          >
            {locations.map((loc) => (
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

        {!loading && total > pageSize ? (
          <AppFlex
            justify='flex-end'
            style={{ width: '100%' }}
          >
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={['12', '24', '48', '96']}
              showTotal={(count, range) => `${range[0]}-${range[1]} dari ${count} lokasi`}
              onChange={handlePageChange}
            />
          </AppFlex>
        ) : null}

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
