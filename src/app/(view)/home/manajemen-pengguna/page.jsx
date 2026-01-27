'use client';

import React from 'react';
import { Grid, Form, Select } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined, KeyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppFloatButton from '@/app/(view)/components_shared/AppFloatButton.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import AppUpload from '@/app/(view)/components_shared/AppUpload.jsx';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

const ROLE_OPTIONS = ['GURU', 'PEGAWAI', 'ADMIN'];
const STATUS_OPTIONS = [
  { label: 'Aktif', value: 'aktif' },
  { label: 'Non-Aktif', value: 'non_aktif' },
];

function normalizeQuery(q) {
  return String(q || '')
    .trim()
    .toLowerCase();
}

function matchesQuery(user, q) {
  const s = normalizeQuery(q);
  if (!s) return true;

  const hay = [user?.name, user?.email, user?.nip, user?.nomor_handphone, user?.role, user?.status].map((x) => (x == null ? '' : String(x).toLowerCase())).join(' ');

  return hay.includes(s);
}

function normalizeStatus(value) {
  const s = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!s) return '';
  if (s === 'aktif') return 'aktif';
  if (s === 'non_aktif' || s === 'non-aktif' || s === 'non aktif') return 'non_aktif';
  return s;
}

function buildInitialFotoFileList(url) {
  if (!url) return [];
  return [
    {
      uid: 'foto-profil-initial',
      name: 'Foto Profil',
      status: 'done',
      url,
    },
  ];
}

function pickUploadFile(fileList) {
  if (!Array.isArray(fileList)) return null;
  const hit = fileList.find((f) => f?.originFileObj);
  return hit?.originFileObj ?? null;
}

function buildPayload(values) {
  return Object.fromEntries(Object.entries(values || {}).filter(([, v]) => v !== undefined && v !== null));
}

function safeText(value, fallback = '-') {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return String(value);
  } catch {
    return fallback;
  }
}

function UserCard({ user, onEdit, onDelete, isDeleting }) {
  return (
    <AppCard
      bordered
      style={{
        borderRadius: 10,
        overflow: 'hidden',
      }}
      styles={{
        body: {
          padding: 14,
        },
      }}
    >
      <div style={{ paddingBottom: 10 }}>
        <AppTypography
          as='text'
          style={{ display: 'block', marginBottom: 6 }}
        >
          <span style={{ fontWeight: 700 }}>Nama</span> : {safeText(user?.name)}
        </AppTypography>
        <AppTypography
          as='text'
          style={{ display: 'block', marginBottom: 6 }}
        >
          <span style={{ fontWeight: 700 }}>Email</span> : {safeText(user?.email)}
        </AppTypography>
        <AppTypography
          as='text'
          style={{ display: 'block', marginBottom: 6 }}
        >
          <span style={{ fontWeight: 700 }}>Nip</span> : {safeText(user?.nip)}
        </AppTypography>
        <AppTypography
          as='text'
          style={{ display: 'block' }}
        >
          <span style={{ fontWeight: 700 }}>No.HP</span> : {safeText(user?.nomor_handphone)}
        </AppTypography>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 0,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 8,
        }}
      >
        <AppButton
          type='primary'
          icon={<EditOutlined />}
          block
          style={{ borderRadius: 0, flex: 1 }}
          onClick={() => onEdit(user)}
        >
          Edit
        </AppButton>

        <AppButton
          type='primary'
          danger
          icon={<DeleteOutlined />}
          block
          loading={isDeleting}
          style={{ borderRadius: 0, flex: 1 }}
          confirm={{
            title: 'Hapus pengguna ini?',
            okText: 'Hapus',
            cancelText: 'Batal',
          }}
          onClick={() => onDelete(user)}
        >
          Delete
        </AppButton>
      </div>
    </AppCard>
  );
}

function UserFormModal({ open, onOpenChange, mode, initialValues, onSubmit, isSubmitting }) {
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
              feedbackError='Gagal upload file'
              feedbackSuccess='File siap diupload'
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

export default function ManajemenPenggunaPage() {
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const [q, setQ] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [activeUser, setActiveUser] = React.useState(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/users', { cache: 'no-store' });
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data pengguna' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = React.useMemo(() => users.filter((u) => matchesQuery(u, q)), [users, q]);

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      const file = pickUploadFile(values?.foto_profil_file);
      // Hapus field file agar tidak ikut masuk ke JSON/Body data teks
      const { foto_profil_file, ...payload } = values;

      if (file) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        formData.append('foto_profil', file);
        await client.post('/api/users', { body: formData });
      } else {
        await client.post('/api/users', { json: payload });
      }

      message.success('Pengguna berhasil dibuat');
      setCreateOpen(false);
      await fetchUsers();
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal membuat pengguna' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values) => {
    if (!activeUser?.id_user) return;

    setSubmitting(true);
    try {
      const file = pickUploadFile(values?.foto_profil_file);
      // Pastikan foto_profil_url yang lama tetap ikut dikirim jika tidak ada file baru
      const payload = {
        ...values,
        foto_profil_url: activeUser.foto_profil_url,
        foto_profil_file: undefined,
      };

      if (file) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        formData.append('foto_profil', file);
        await client.patch(`/api/users/${activeUser.id_user}`, { body: formData });
      } else {
        await client.patch(`/api/users/${activeUser.id_user}`, { json: payload });
      }

      message.success('Pengguna berhasil diperbarui');
      setEditOpen(false);
      setActiveUser(null);
      await fetchUsers();
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memperbarui pengguna' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!user?.id_user) return;

    setDeletingId(user.id_user);
    try {
      await client.del(`/api/users/${user.id_user}`);
      message.success('Pengguna berhasil dihapus');
      await fetchUsers();
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal menghapus pengguna' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: isMdUp ? 16 : 12 }}>
        <AppFlex
          justify='flex-end'
          align='center'
          gap={10}
        >
          <AppButton
            icon={<KeyOutlined />}
            onClick={() => router.push('/home/permission-page')}
          >
            Permission Page
          </AppButton>

          <div style={{ width: isMdUp ? 260 : 220 }}>
            <AppInput.Search
              placeholder='Search'
              value={q}
              onValueChange={setQ}
              emitOnChange
              debounceMs={200}
            />
          </div>
        </AppFlex>

        <div style={{ marginTop: 18 }}>
          {loading ? (
            <AppGrid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
              gap={16}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <AppCard
                  key={i}
                  bordered
                  style={{ borderRadius: 10 }}
                >
                  <AppSkeleton active />
                </AppCard>
              ))}
            </AppGrid>
          ) : (
            <AppGrid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
              gap={16}
            >
              {filtered.map((u) => (
                <UserCard
                  key={u.id_user}
                  user={u}
                  isDeleting={deletingId === u.id_user}
                  onEdit={(user) => {
                    setActiveUser(user);
                    setEditOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </AppGrid>
          )}
        </div>

        <AppFloatButton
          icon={<UserAddOutlined />}
          tooltip='Tambah Pengguna'
          onClick={() => setCreateOpen(true)}
        />

        <UserFormModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode='create'
          initialValues={{ role: 'GURU' }}
          onSubmit={handleCreate}
          isSubmitting={submitting}
        />

        <UserFormModal
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setActiveUser(null);
          }}
          mode='edit'
          initialValues={activeUser}
          onSubmit={handleUpdate}
          isSubmitting={submitting}
        />
      </div>
    </div>
  );
}
