'use client';

import React from 'react';
import { PlusOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppEmpty from '@/app/(view)/components_shared/AppEmpty.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppFloatButton from '@/app/(view)/components_shared/AppFloatButton.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppGrid, { useAppBreakpoint } from '@/app/(view)/components_shared/AppGrid.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import AppSpace from '@/app/(view)/components_shared/AppSpace.jsx';
import AppTypography, { H2 } from '@/app/(view)/components_shared/AppTypography.jsx';

import { useProfileSekolah } from './_hooks/useProfileSekolah';
import ProfileCard from './_components/ProfileCard';

export default function ProfileSekolahPage() {
  const screens = useAppBreakpoint();
  const isMdUp = !!screens?.md;

  const { rows, loading, submitting, deletingId, modalOpen, mode, form, openCreate, openEdit, closeModal, handleSubmit, handleDelete } = useProfileSekolah();

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: isMdUp ? 16 : 12 }}>
      <AppSpace
        direction='vertical'
        size={16}
        style={{ width: '100%' }}
      >
        <AppCard
          bordered
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 16 } }}
        >
          <AppFlex
            align='center'
            justify='space-between'
            wrap
            gap={12}
          >
            <div>
              <H2 style={{ margin: 0 }}>Profile Sekolah</H2>
              <AppTypography
                as='text'
                tone='secondary'
                style={{ display: 'block', marginTop: 4 }}
              >
                Kelola data identitas sekolah.
              </AppTypography>
            </div>
          </AppFlex>
        </AppCard>

        {loading ? (
          <AppGrid
            columns={{ base: 1, md: 2 }}
            gap={16}
          >
            {Array.from({ length: 2 }).map((_, idx) => (
              <AppCard
                key={idx}
                bordered
                style={{ borderRadius: 12 }}
              >
                <AppSkeleton active />
              </AppCard>
            ))}
          </AppGrid>
        ) : rows.length === 0 ? (
          <AppCard
            bordered
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 24 } }}
          >
            <AppEmpty description='Belum ada profile sekolah.' />
          </AppCard>
        ) : (
          <AppGrid
            columns={{ base: 1, md: 2 }}
            gap={16}
          >
            {rows.map((item) => (
              <ProfileCard
                key={item.id_profile}
                item={item}
                onEdit={openEdit}
                onDelete={handleDelete}
                deleting={deletingId === item.id_profile}
              />
            ))}
          </AppGrid>
        )}
      </AppSpace>

      <AppFloatButton
        icon={<PlusOutlined />}
        tooltip='Tambah Profile'
        onClick={openCreate}
      />

      <AppModal
        open={modalOpen}
        onOpenChange={(val) => !val && closeModal()}
        title={mode === 'edit' ? 'Edit Profile Sekolah' : 'Tambah Profile Sekolah'}
        okText={mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'}
        cancelText='Batal'
        onOk={handleSubmit}
        okDisabled={submitting}
        centered
      >
        <AppForm
          form={form}
          layout='vertical'
          requiredMark={false}
          autoComplete='off'
        >
          <AppForm.Item
            label='Nama Sekolah'
            name='nama_sekolah'
            rules={[
              { required: true, message: 'Nama sekolah wajib diisi' },
              { max: 160, message: 'Maksimal 160 karakter' },
            ]}
          >
            <AppInput placeholder='Sekolah ...' />
          </AppForm.Item>

          <AppForm.Item
            label='Alamat Sekolah'
            name='alamat_sekolah'
            rules={[
              { required: true, message: 'Alamat sekolah wajib diisi' },
              { max: 2000, message: 'Maksimal 2000 karakter' },
            ]}
          >
            <AppInput.TextArea
              rows={4}
              placeholder='jalan ...'
            />
          </AppForm.Item>

          <AppForm.Item
            label='NPSN'
            name='npsn'
            rules={[
              { required: true, message: 'NPSN wajib diisi' },
              { pattern: /^\d{8}$/, message: 'NPSN harus 8 digit angka' },
            ]}
          >
            <AppInput
              placeholder='101xxx'
              maxLength={8}
            />
          </AppForm.Item>

          <AppForm.Item
            label='No Telepon'
            name='no_telepon'
            rules={[{ max: 40, message: 'Maksimal 40 karakter' }]}
          >
            <AppInput placeholder='0361xxx' />
          </AppForm.Item>
        </AppForm>
      </AppModal>
    </div>
  );
}
