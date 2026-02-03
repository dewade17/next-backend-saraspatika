import React from 'react';

export function useDeleteLocation({ client, message, onSuccess }) {
  const [deletingId, setDeletingId] = React.useState(null);

  const handleDelete = async (loc) => {
    const id = loc?.id;
    if (!id) return;

    setDeletingId(id);
    try {
      await client.del(`/api/lokasi/${id}`);
      message.success('Lokasi berhasil dihapus.');
      if (onSuccess) await onSuccess(loc);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal menghapus lokasi.' });
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, handleDelete };
}
