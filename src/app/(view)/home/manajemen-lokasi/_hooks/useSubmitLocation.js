import React from 'react';
import { buildLocationApiPayload, buildLocationPayload, mapLocationFromApi } from '../_utils/locationHelpers';

export function useSubmitLocation({ client, message, onSuccess }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState('create'); // 'create' | 'edit'
  const [activeLocation, setActiveLocation] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const openCreate = () => {
    setMode('create');
    setActiveLocation(null);
    setIsOpen(true);
  };

  const openEdit = (loc) => {
    setMode('edit');
    setActiveLocation(loc || null);
    setIsOpen(true);
  };

  const handleSubmit = async (rawValues) => {
    const payload = buildLocationPayload(rawValues);
    const apiPayload = buildLocationApiPayload(payload);

    setSubmitting(true);
    try {
      const isEdit = mode === 'edit' && activeLocation?.id;
      const url = isEdit ? `/api/lokasi/${activeLocation.id}` : '/api/lokasi';
      const method = isEdit ? 'patch' : 'post';

      const res = await client[method](url, { json: apiPayload });
      const saved = mapLocationFromApi(res?.data);
      message.success(`Lokasi berhasil ${isEdit ? 'diupdate' : 'ditambahkan'}.`);

      setIsOpen(false);
      setActiveLocation(null);
      setMode('create');
      if (onSuccess) await onSuccess(saved);
    } catch (err) {
      message.errorFrom(err, { fallback: `Gagal ${mode === 'edit' ? 'mengupdate' : 'menambahkan'} lokasi.` });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    mode,
    activeLocation,
    openCreate,
    openEdit,
    handleSubmit,
    submitting,
  };
}
