import React from 'react';
import { createHttpClient } from '@/lib/http_client.js';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { getClientAccessToken } from '@/lib/client_token_for_delete_face_only.js';

const FACE_API_BASE_URL = process.env.NEXT_PUBLIC_API_FACE_URL;

function normalizeBaseUrl(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  return s.replace(/\/+$/, '');
}

function pickUserId(idOrRecord) {
  if (idOrRecord == null) return null;
  if (typeof idOrRecord === 'string' || typeof idOrRecord === 'number') return idOrRecord;

  return idOrRecord?.id_user ?? idOrRecord?.user_id ?? idOrRecord?.id ?? idOrRecord?.user?.id_user ?? null;
}

export function useDeleteFace(onSuccess) {
  const message = useAppMessage();

  const baseUrl = React.useMemo(() => normalizeBaseUrl(FACE_API_BASE_URL), []);

  const client = React.useMemo(() => {
    return createHttpClient({
      ...(baseUrl ? { baseUrl } : {}),
      auth: {
        type: 'bearer',
        tokenProvider: () => getClientAccessToken(),
      },
    });
  }, [baseUrl]);

  const [deletingId, setDeletingId] = React.useState(null);

  const handleDeleteFace = React.useCallback(
    async (idOrRecord) => {
      const userId = pickUserId(idOrRecord);

      if (!userId) {
        message.error('ID tidak ditemukan');
        return;
      }

      if (!baseUrl) {
        message.error('FACE API base URL belum diset. Set NEXT_PUBLIC_FACE_API_BASE_URL (atau NEXT_PUBLIC_API_FACE_URL).');
        return;
      }

      const messageKey = `delete-face-${userId}`;
      setDeletingId(String(userId));
      message.loading('Menghapus data wajah...', { key: messageKey });

      try {
        // backend python: DELETE /api/face/:id
        await client.del(`/api/face/${encodeURIComponent(String(userId))}`);

        message.success('Data wajah berhasil dihapus', { key: messageKey });
        if (onSuccess) await onSuccess();
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal menghapus data wajah', key: messageKey });
      } finally {
        setDeletingId(null);
      }
    },
    [baseUrl, client, message, onSuccess],
  );

  return {
    deletingId,
    handleDeleteFace,
  };
}
