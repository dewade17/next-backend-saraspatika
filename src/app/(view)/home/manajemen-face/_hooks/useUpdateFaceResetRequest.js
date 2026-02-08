import React from 'react';
import { createHttpClient } from '@/lib/http_client.js';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

export function useUpdateFaceResetRequest(onSuccess) {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);
  const [updatingId, setUpdatingId] = React.useState(null);

  const handleUpdateStatus = React.useCallback(
    async (id, status) => {
      if (!id) {
        message.error('ID request tidak ditemukan');
        return;
      }
      if (!status) {
        message.error('Status tidak valid');
        return;
      }

      const messageKey = `update-face-reset-${id}`;

      setUpdatingId(id);
      message.loading('Memperbarui status permintaan...', { key: messageKey });

      try {
        const normalizedStatus = String(status).toUpperCase();
        await client.patch(`/api/face-reset-request/${id}`, {
          json: { status: normalizedStatus },
        });
        message.success('Status permintaan berhasil diperbarui', { key: messageKey });
        if (onSuccess) await onSuccess();
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memperbarui status permintaan', key: messageKey });
      } finally {
        setUpdatingId(null);
      }
    },
    [client, message, onSuccess],
  );

  return {
    updatingId,
    handleUpdateStatus,
  };
}
