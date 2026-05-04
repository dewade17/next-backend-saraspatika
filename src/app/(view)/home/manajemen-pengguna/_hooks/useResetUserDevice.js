import React from 'react';

export function useResetUserDevice({ client, message, onSuccess }) {
  const [resettingId, setResettingId] = React.useState(null);

  const handleResetDevice = React.useCallback(
    async (user) => {
      if (!user?.id_user) return;

      setResettingId(user.id_user);
      try {
        await client.patch(`/api/users/${user.id_user}/reset-device`);
        message.success('Perangkat pengguna berhasil direset');
        if (onSuccess) await onSuccess();
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal reset perangkat pengguna' });
      } finally {
        setResettingId(null);
      }
    },
    [client, message, onSuccess],
  );

  return { resettingId, handleResetDevice };
}
