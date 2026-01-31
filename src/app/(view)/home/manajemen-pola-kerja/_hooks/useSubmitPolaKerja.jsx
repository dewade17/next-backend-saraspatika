import React from 'react';

export function useSubmitPolaKerja({ client, message, onSuccess }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState('create');
  const [activePolaKerja, setActivePolaKerja] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const openCreate = () => {
    setMode('create');
    setActivePolaKerja(null);
    setIsOpen(true);
  };

  const openEdit = (record) => {
    setMode('edit');
    setActivePolaKerja(record);
    setIsOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const isEdit = mode === 'edit' && activePolaKerja?.id_pola_kerja;
      const url = isEdit ? `/api/pola-kerja/${activePolaKerja.id_pola_kerja}` : '/api/pola-kerja';
      const method = isEdit ? 'patch' : 'post';

      await client[method](url, { json: values });
      message.success(`Pola kerja berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`);
      setIsOpen(false);
      if (onSuccess) await onSuccess();
    } catch (err) {
      message.errorFrom(err, { fallback: `Gagal ${mode === 'edit' ? 'memperbarui' : 'membuat'} pola kerja` });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    mode,
    activePolaKerja,
    openCreate,
    openEdit,
    handleSubmit,
    submitting,
  };
}
