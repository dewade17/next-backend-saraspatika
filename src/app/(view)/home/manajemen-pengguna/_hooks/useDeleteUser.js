import React from 'react';

export function useDeleteUser({ client, message, onSuccess }) {
  const [deletingId, setDeletingId] = React.useState(null);

  const handleDelete = async (user) => {
    if (!user?.id_user) return;

    setDeletingId(user.id_user);
    try {
      await client.del(`/api/users/${user.id_user}`);
      message.success('Pengguna berhasil dihapus');
      if (onSuccess) await onSuccess();
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal menghapus pengguna' });
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, handleDelete };
}
