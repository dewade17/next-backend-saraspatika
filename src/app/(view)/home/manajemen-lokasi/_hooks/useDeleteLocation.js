import React from 'react';

export function useDeleteLocation({ message, setLocations }) {
  const [deletingId, setDeletingId] = React.useState(null);

  const handleDelete = async (loc) => {
    const id = loc?.id;
    if (!id) return;

    setDeletingId(id);
    try {
      // placeholder (tanpa API): langsung hapus dari state
      setLocations((prev) => (Array.isArray(prev) ? prev.filter((l) => l.id !== id) : []));
      message.success('Lokasi berhasil dihapus.');
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal menghapus lokasi.' });
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, handleDelete };
}
