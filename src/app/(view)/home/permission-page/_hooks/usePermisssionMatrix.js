import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

const EMPTY_MATRIX = { user: null, roles: [], resources: [] };

export function usePermissionMatrix() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [matrix, setMatrix] = React.useState(EMPTY_MATRIX);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchMatrix = React.useCallback(
    async (userId) => {
      const id_user = String(userId || '').trim();
      if (!id_user) {
        setMatrix(EMPTY_MATRIX);
        return;
      }
      setIsLoading(true);
      try {
        const res = await client.get(`/api/permissions?userId=${encodeURIComponent(id_user)}`, { cache: 'no-store' });
        setMatrix(res?.data ?? EMPTY_MATRIX);
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memuat permission matrix' });
        setMatrix(EMPTY_MATRIX);
      } finally {
        setIsLoading(false);
      }
    },
    [client, message],
  );

  const updateUserPermission = React.useCallback(
    async (userId, permissions) => {
      const id_user = String(userId || '').trim();
      if (!id_user) throw new Error('User wajib dipilih');
      setIsLoading(true);
      try {
        const res = await client.put('/api/permissions', {
          json: { userId: id_user, permissions },
        });
        return res?.data ?? null;
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memperbarui permission user' });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, message],
  );

  return {
    matrix,
    isLoading,
    fetchMatrix,
    updateUserPermission,
  };
}
