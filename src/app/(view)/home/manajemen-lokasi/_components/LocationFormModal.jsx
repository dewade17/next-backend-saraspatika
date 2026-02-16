import React from 'react';
import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppInputNumber from '@/app/(view)/components_shared/AppInputNumber.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import { toNumber, buildLocationPayload } from '../_utils/locationHelpers';

export default function LocationFormModal({ open, onOpenChange, mode, initialValues, onSubmit, isSubmitting }) {
  const form = AppForm.useForm();
  const isCreate = mode === 'create';

  React.useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: initialValues?.name ?? '',
      latitude: initialValues?.latitude ?? null,
      longitude: initialValues?.longitude ?? null,
      radius: initialValues?.radius ?? 0.1,
    });
  }, [open, form, initialValues]);

  return (
    <AppModal
      title={isCreate ? 'Tambah Lokasi' : 'Edit Lokasi'}
      open={open}
      onOpenChange={onOpenChange}
      footer={false}
      centered
      destroyOnClose
    >
      <AppForm
        form={form}
        layout='vertical'
        onFinish={async (values) => {
          const payload = buildLocationPayload(values);
          await onSubmit(payload);
          form.resetFields();
        }}
      >
        <AppForm.Item
          label='Nama Lokasi'
          name='name'
          rules={[
            { required: true, message: 'Nama lokasi wajib diisi.' },
            { min: 3, message: 'Minimal 3 karakter.' },
            { max: 80, message: 'Maksimal 80 karakter.' },
          ]}
        >
          <AppInput
            placeholder='Contoh: SD Saraswati 4 Denpasar'
            allowClear
          />
        </AppForm.Item>

        <AppGrid
          templateColumns={{ base: '1fr', md: '1fr 1fr' }}
          gap={12}
        >
          <AppForm.Item
            label='Latitude'
            name='latitude'
            rules={[
              { required: true, message: 'Latitude wajib diisi.' },
              {
                validator: (_, v) => {
                  const n = toNumber(v);
                  if (n === null) return Promise.reject(new Error('Latitude harus berupa angka.'));
                  if (n < -90 || n > 90) return Promise.reject(new Error('Latitude harus di antara -90 sampai 90.'));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <AppInputNumber
              style={{ width: '100%' }}
              step={0.000001}
              placeholder='-6.193125'
            />
          </AppForm.Item>

          <AppForm.Item
            label='Longitude'
            name='longitude'
            rules={[
              { required: true, message: 'Longitude wajib diisi.' },
              {
                validator: (_, v) => {
                  const n = toNumber(v);
                  if (n === null) return Promise.reject(new Error('Longitude harus berupa angka.'));
                  if (n < -180 || n > 180) return Promise.reject(new Error('Longitude harus di antara -180 sampai 180.'));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <AppInputNumber
              style={{ width: '100%' }}
              step={0.000001}
              placeholder='106.821810'
            />
          </AppForm.Item>
        </AppGrid>

        <AppForm.Item
          label='Radius'
          name='radius'
          rules={[
            { required: true, message: 'Radius wajib diisi.' },
            {
              validator: (_, v) => {
                const n = toNumber(v);
                if (n === null) return Promise.reject(new Error('Radius harus berupa angka.'));
                if (n < 0.01) return Promise.reject(new Error('Radius minimal 0.01.'));
                return Promise.resolve();
              },
            },
          ]}
          extra='Sesuaikan satuan radius sesuai kebutuhan'
        >
          <AppInputNumber
            style={{ width: '100%' }}
            step={0.01}
            min={0.01}
          />
        </AppForm.Item>

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
