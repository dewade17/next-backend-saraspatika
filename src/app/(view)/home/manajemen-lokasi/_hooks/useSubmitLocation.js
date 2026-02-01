import React from 'react';
import { makeId, buildLocationPayload } from '../_utils/locationHelpers';

export function useSubmitLocation({ message, setLocations }) {
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

    setSubmitting(true);
    try {
      const isEdit = mode === 'edit' && activeLocation?.id;

      if (isEdit) {
        setLocations((prev) => prev.map((l) => (l.id === activeLocation.id ? { ...l, ...payload } : l)));
        message.success('Lokasi berhasil diupdate.');
      } else {
        setLocations((prev) => [{ id: makeId(), ...payload }, ...(Array.isArray(prev) ? prev : [])]);
        message.success('Lokasi berhasil ditambahkan.');
      }

      setIsOpen(false);
      setActiveLocation(null);
      setMode('create');
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
