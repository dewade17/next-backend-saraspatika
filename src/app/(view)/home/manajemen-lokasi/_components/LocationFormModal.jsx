import React from 'react';
import dynamic from 'next/dynamic';
import { AimOutlined } from '@ant-design/icons';
import { App as AntdApp } from 'antd';
import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppInputNumber from '@/app/(view)/components_shared/AppInputNumber.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import { toNumber, buildLocationPayload } from '../_utils/locationHelpers';

function LocationPickerMapLoading() {
  return (
    <div style={{ width: '100%', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
      <AppSkeleton
        loading
        variant='block'
        delayMs={0}
        minShowMs={0}
        blockHeight={320}
        radius={0}
      />
    </div>
  );
}

const LocationPickerMap = dynamic(() => import('./LocationPickerMapClient.jsx'), {
  ssr: false,
  loading: () => <LocationPickerMapLoading />,
});

export default function LocationFormModal({ open, onOpenChange, mode, initialValues, onSubmit, isSubmitting }) {
  const { message } = AntdApp.useApp();
  const form = AppForm.useForm();
  const [isPickingCurrentLocation, setIsPickingCurrentLocation] = React.useState(false);
  const isMountedRef = React.useRef(false);
  const isOpenRef = React.useRef(Boolean(open));
  const isCreate = mode === 'create';
  const latitude = toNumber(AppForm.useWatch('latitude', form));
  const longitude = toNumber(AppForm.useWatch('longitude', form));

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    import('./LocationPickerMapClient.jsx').catch(() => {});
  }, [open]);

  React.useEffect(() => {
    isOpenRef.current = Boolean(open);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const parsedRadius = toNumber(initialValues?.radius);
    form.setFieldsValue({
      name: initialValues?.name ?? '',
      latitude: initialValues?.latitude ?? null,
      longitude: initialValues?.longitude ?? null,
      radius: parsedRadius === null ? 1 : Math.max(1, Math.trunc(parsedRadius)),
    });
  }, [open, form, initialValues]);

  React.useEffect(() => {
    if (open) return;
    setIsPickingCurrentLocation(false);
  }, [open]);

  const handleMapPick = React.useCallback(
    (nextLat, nextLng) => {
      const latitudeValue = Number(nextLat.toFixed(6));
      const longitudeValue = Number(nextLng.toFixed(6));

      form.setFieldsValue({
        latitude: latitudeValue,
        longitude: longitudeValue,
      });

      form.validateFields(['latitude', 'longitude']).catch(() => {});
    },
    [form],
  );

  const handlePickCurrentLocation = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.navigator?.geolocation) {
      message.error('Browser tidak mendukung fitur lokasi perangkat.');
      return;
    }

    setIsPickingCurrentLocation(true);

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current || !isOpenRef.current) return;
        const latitudeValue = Number(position.coords.latitude.toFixed(6));
        const longitudeValue = Number(position.coords.longitude.toFixed(6));

        form.setFieldsValue({
          latitude: latitudeValue,
          longitude: longitudeValue,
        });

        form.validateFields(['latitude', 'longitude']).catch(() => {});
        message.success('Lokasi saat ini berhasil digunakan.');
        setIsPickingCurrentLocation(false);
      },
      (error) => {
        if (!isMountedRef.current || !isOpenRef.current) return;

        const errorMessage =
          error?.code === 1
            ? 'Izin lokasi ditolak. Izinkan akses lokasi lalu coba lagi.'
            : error?.code === 2
              ? 'Lokasi perangkat tidak tersedia.'
              : error?.code === 3
                ? 'Pengambilan lokasi timeout. Coba lagi.'
                : 'Gagal mengambil lokasi perangkat.';

        message.error(errorMessage);
        setIsPickingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  }, [form, message]);

  return (
    <AppModal
      title={isCreate ? 'Tambah Lokasi' : 'Edit Lokasi'}
      open={open}
      onOpenChange={onOpenChange}
      footer={false}
      centered
      destroyOnClose={false}
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
                if (!Number.isInteger(n)) return Promise.reject(new Error('Radius harus bilangan bulat.'));
                if (n < 1) return Promise.reject(new Error('Radius minimal 1.'));
                return Promise.resolve();
              },
            },
          ]}
          extra='Sesuaikan satuan radius sesuai kebutuhan'
        >
          <AppInputNumber
            style={{ width: '100%' }}
            step={1}
            precision={0}
            min={1}
          />
        </AppForm.Item>

        <AppForm.Item
          label='Pilih Lokasi di Peta'
          extra={
            <AppFlex
              align='center'
              justify='space-between'
              wrap
              gap={8}
              style={{ marginTop: 6 }}
            >
              <span>Klik area peta untuk mengisi latitude dan longitude otomatis.</span>
              <AppButton
                icon={<AimOutlined />}
                loading={isPickingCurrentLocation}
                onPress={handlePickCurrentLocation}
              >
                Gunakan Lokasi Saya
              </AppButton>
            </AppFlex>
          }
        >
          {open ? (
            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              onPick={handleMapPick}
            />
          ) : null}
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
