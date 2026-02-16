import React from 'react';
import { Form } from 'antd';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';
import { normalizeFormPayload } from '../_utils/profileHelpers';

export function useProfileSekolah() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);
  const [form] = Form.useForm();

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [mode, setMode] = React.useState('create');
  const [active, setActive] = React.useState(null);

  const fetchProfileSekolah = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/profile-sekolah', { cache: 'no-store' });
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat profile sekolah.' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchProfileSekolah();
  }, [fetchProfileSekolah]);

  const openCreate = React.useCallback(() => {
    setMode('create');
    setActive(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEdit = React.useCallback(
    (item) => {
      setMode('edit');
      setActive(item || null);
      form.setFieldsValue({
        nama_sekolah: item?.nama_sekolah ?? '',
        alamat_sekolah: item?.alamat_sekolah ?? '',
        npsn: item?.npsn ?? '',
        no_telepon: item?.no_telepon ?? '',
      });
      setModalOpen(true);
    },
    [form],
  );

  const closeModal = React.useCallback(() => {
    setModalOpen(false);
    setMode('create');
    setActive(null);
    form.resetFields();
  }, [form]);

  const handleSubmit = React.useCallback(async () => {
    try {
      const values = await form.validateFields();
      const payload = normalizeFormPayload(values);
      const isEdit = mode === 'edit' && active?.id_profile;
      const url = isEdit ? `/api/profile-sekolah/${active.id_profile}` : '/api/profile-sekolah';
      const method = isEdit ? 'patch' : 'post';

      setSubmitting(true);
      await client[method](url, { json: payload });
      message.success(`Profile sekolah berhasil ${isEdit ? 'diperbarui' : 'dibuat'}.`);
      closeModal();
      await fetchProfileSekolah();
    } catch (err) {
      if (err?.errorFields) return;
      message.errorFrom(err, { fallback: `Gagal ${mode === 'edit' ? 'memperbarui' : 'membuat'} profile sekolah.` });
    } finally {
      setSubmitting(false);
    }
  }, [active, client, closeModal, fetchProfileSekolah, form, message, mode]);

  const handleDelete = React.useCallback(
    async (item) => {
      const id = item?.id_profile;
      if (!id) return;

      setDeletingId(id);
      try {
        await client.del(`/api/profile-sekolah/${id}`);
        message.success('Profile sekolah berhasil dihapus.');
        await fetchProfileSekolah();
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal menghapus profile sekolah.' });
      } finally {
        setDeletingId(null);
      }
    },
    [client, fetchProfileSekolah, message],
  );

  return {
    rows,
    loading,
    submitting,
    deletingId,
    modalOpen,
    mode,
    form,
    setModalOpen,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleDelete,
  };
}
