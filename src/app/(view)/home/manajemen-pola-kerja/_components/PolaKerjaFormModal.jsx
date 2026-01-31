import React from 'react';
import { Form } from 'antd';

import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppTimePicker from '@/app/(view)/components_shared/AppTimePicker.jsx';

export default function PolaKerjaFormModal({ open, onOpenChange, mode, initialValues, onSubmit, isSubmitting }) {
  const [form] = Form.useForm();
  const isCreate = mode === 'create';

  React.useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      nama_pola_kerja: initialValues?.nama_pola_kerja ?? '',
      jam_mulai_kerja: initialValues?.jam_mulai_kerja ?? '',
      jam_selesai_kerja: initialValues?.jam_selesai_kerja ?? '',
    });
  }, [open, form, initialValues]);

  return (
    <AppModal
      title={isCreate ? 'Tambah Pola Kerja' : 'Edit Pola Kerja'}
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
            label='Nama Pola Kerja'
            name='nama_pola_kerja'
            rules={[{ required: true, message: 'Nama pola kerja wajib diisi' }]}
          >
            <AppInput placeholder='Contoh: Shift Pagi' />
          </AppForm.Item>
          <AppForm.Item
            label='Jam Mulai'
            name='jam_mulai_kerja'
            rules={[{ required: true, message: 'Jam mulai wajib diisi' }]}
          >
            <AppTimePicker
              placeholder='Pilih jam mulai'
              valueType='string'
              valueFormat='HH:mm'
              inputFormat='HH:mm'
              allowClear={false}
            />
          </AppForm.Item>
          <AppForm.Item
            label='Jam Selesai'
            name='jam_selesai_kerja'
            rules={[{ required: true, message: 'Jam selesai wajib diisi' }]}
          >
            <AppTimePicker
              placeholder='Pilih jam selesai'
              valueType='string'
              valueFormat='HH:mm'
              inputFormat='HH:mm'
              allowClear={false}
            />
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
