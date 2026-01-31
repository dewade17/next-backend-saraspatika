import React from 'react';

export function useDeletePolaKerja({ client, message, onSuccess }) {
  const [deletingId, setDeletingId] = React.useState(null);

  const handleDelete = async (record) => {
    if (!record?.id_pola_kerja) return;

    setDeletingId(record.id_pola_kerja);
    try {
      await client.del(`/api/pola-kerja/${record.id_pola_kerja}`);
      message.success('Pola kerja berhasil dihapus');
      if (onSuccess) await onSuccess();
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal menghapus pola kerja' });
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, handleDelete };
}
