import React from 'react';
import { Form, Select } from 'antd';
import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppUpload from '@/app/(view)/components_shared/AppUpload.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import { ROLE_OPTIONS, STATUS_OPTIONS, normalizeStatus, buildInitialFotoFileList } from '../_utils/userHelpers';

export default function UserFormModal({ open, onOpenChange, mode, initialValues, onSubmit, isSubmitting }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: initialValues?.name ?? '',
      email: initialValues?.email ?? '',
      nip: initialValues?.nip ?? '',
      nomor_handphone: initialValues?.nomor_handphone ?? '',
      status: normalizeStatus(initialValues?.status),
      foto_profil_file: buildInitialFotoFileList(initialValues?.foto_profil_url),
      role: initialValues?.role ?? 'GURU',
      password: '',
    });
  }, [open, form, initialValues]);

  const isCreate = mode === 'create';

  return (
    <AppModal
      title={isCreate ? 'Tambah Pengguna' : 'Edit Pengguna'}
      open={open}
      onOpenChange={onOpenChange}
      footer={false}
      centered
    >
      <AppForm
        form={form}
        layout='vertical'
        onFinish={async (values) => {
          const cleaned = Object.fromEntries(
            Object.entries(values || {}).map(([k, v]) => {
              if (typeof v === 'string') {
                const t = v.trim();
                return [k, t ? t : undefined];
              }
              return [k, v];
            }),
          );
          await onSubmit(cleaned);
        }}
      >
        <AppGrid
          templateColumns={{ base: '1fr', md: '1fr 1fr' }}
          gap={12}
        >
          <AppForm.Item
            label='Nama'
            name='name'
          >
            <AppInput placeholder='Nama' />
          </AppForm.Item>
          <AppForm.Item
            label='Email'
            name='email'
            rules={[
              { required: true, message: 'Email wajib diisi' },
              { type: 'email', message: 'Format email tidak valid' },
            ]}
          >
            <AppInput placeholder='Email' />
          </AppForm.Item>
          <AppForm.Item
            label='NIP'
            name='nip'
          >
            <AppInput placeholder='NIP' />
          </AppForm.Item>
          <AppForm.Item
            label='No. HP'
            name='nomor_handphone'
          >
            <AppInput placeholder='No. HP' />
          </AppForm.Item>
          <AppForm.Item
            label='Status'
            name='status'
          >
            <Select
              options={STATUS_OPTIONS}
              placeholder='Pilih status'
            />
          </AppForm.Item>
          <AppForm.Item
            label='Role'
            name='role'
            rules={[{ required: true, message: 'Role wajib dipilih' }]}
          >
            <Select
              options={ROLE_OPTIONS.map((r) => ({ label: r, value: r }))}
              placeholder='Pilih role'
            />
          </AppForm.Item>
          <AppForm.Item
            label='Foto Profil'
            name='foto_profil_file'
            valuePropName='value'
            trigger='onValueChange'
          >
            <AppUpload.Image
              maxCount={1}
              autoUpload={false}
              feedback
            />
          </AppForm.Item>
          <AppForm.Item
            label={isCreate ? 'Password' : 'Password (opsional)'}
            name='password'
            rules={
              isCreate
                ? [
                    { required: true, message: 'Password wajib diisi' },
                    { min: 8, message: 'Minimal 8 karakter' },
                  ]
                : [{ min: 8, message: 'Minimal 8 karakter' }]
            }
          >
            <AppInput.Password placeholder='Password' />
          </AppForm.Item>
        </AppGrid>

        <AppFlex
          justify='flex-end'
          gap={10}
          style={{ marginTop: 12 }}
        >
          <AppButton onClick={() => onOpenChange(false)}>Batal</AppButton>
          <AppButton
            type='primary'
            htmlType='submit'
            loading={isSubmitting}
          >
            Simpan
          </AppButton>
        </AppFlex>
      </AppForm>
    </AppModal>
  );
}
