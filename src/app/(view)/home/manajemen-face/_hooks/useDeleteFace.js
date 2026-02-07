import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useDeleteFace(onSuccess) {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);
  const [deletingId, setDeletingId] = React.useState(null);

  const faceurl = process.env.NEXT_PUBLIC_API_FACE_URL;

  const handleDeleteFace = React.useCallback(
    async (record) => {
      const userId = record?.id_user ?? record?.user_id ?? record?.id;
      if (!userId) {
        message.error('ID user tidak ditemukan');
        return;
      }

      const displayName = record?.name || record?.email || 'user';
      const messageKey = `delete-face-${userId}`;

      setDeletingId(userId);
      message.loading(`Menghapus data wajah ${displayName}...`, { key: messageKey });

      try {
        await client.del(`${faceurl}/api/face/${userId}`);
        message.success(`Data wajah ${displayName} berhasil dihapus`, { key: messageKey });
        if (onSuccess) await onSuccess();
      } catch (err) {
        message.errorFrom(err, { fallback: `Gagal menghapus data wajah ${displayName}`, key: messageKey });
      } finally {
        setDeletingId(null);
      }
    },
    [client, message, onSuccess, faceurl],
  );

  return { deletingId, handleDeleteFace };
}
