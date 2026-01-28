import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

const EMPTY_MATRIX = { roles: [], resources: [] };

export function usePermissionMatrix() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [matrix, setMatrix] = React.useState(EMPTY_MATRIX);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchMatrix = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/api/permissions', { cache: 'no-store' });
      setMatrix(res?.data ?? EMPTY_MATRIX);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat permission matrix' });
      setMatrix(EMPTY_MATRIX);
    } finally {
      setIsLoading(false);
    }
  }, [client, message]);

  const updateRolePermission = React.useCallback(
    async (roleId, permissionIds) => {
      setIsLoading(true);
      try {
        const res = await client.put('/api/permissions', {
          json: { roleId, permissions: permissionIds },
        });
        return res?.data ?? null;
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memperbarui permission role' });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, message],
  );

  React.useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  return {
    matrix,
    isLoading,
    fetchMatrix,
    updateRolePermission,
  };
}
