import React from 'react';
import { pickUploadFile } from '../_utils/userHelpers';

export function useSubmitUser({ client, message, onSuccess }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState('create'); // 'create' | 'edit'
  const [activeUser, setActiveUser] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const openCreate = () => {
    setMode('create');
    setActiveUser(null);
    setIsOpen(true);
  };

  const openEdit = (user) => {
    setMode('edit');
    setActiveUser(user);
    setIsOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const isEdit = mode === 'edit' && activeUser?.id_user;
      const file = pickUploadFile(values?.foto_profil_file);

      // Kondisional untuk URL dan Method
      const url = isEdit ? `/api/users/${activeUser.id_user}` : '/api/users';
      const method = isEdit ? 'patch' : 'post';

      const { foto_profil_file, ...rest } = values;
      const payload = {
        ...rest,
        foto_profil_url: isEdit && !file ? activeUser.foto_profil_url : undefined,
      };

      // Kondisional untuk Payload (FormData vs JSON)
      let requestOptions = {};
      if (file) {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => v != null && formData.append(k, String(v)));
        formData.append('foto_profil', file);
        requestOptions = { body: formData };
      } else {
        requestOptions = { json: payload };
      }

      await client[method](url, requestOptions);

      message.success(`Pengguna berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`);
      setIsOpen(false);
      if (onSuccess) await onSuccess();
    } catch (err) {
      message.errorFrom(err, { fallback: `Gagal ${mode === 'edit' ? 'memperbarui' : 'membuat'} pengguna` });
    } finally {
      setSubmitting(false);
    }
  };

  return { isOpen, setIsOpen, mode, activeUser, openCreate, openEdit, handleSubmit, submitting };
}
