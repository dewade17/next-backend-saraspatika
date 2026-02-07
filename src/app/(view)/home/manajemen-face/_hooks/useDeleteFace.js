import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

export function useDeleteFace(onSuccess) {
  const message = useAppMessage();

  const handleDeleteFace = React.useCallback(
    async (record) => {
      // Menjaga pesan info yang sama dengan kode asli
      message.info(`Aksi delete face untuk "${record?.name || record?.email || 'user'}" belum dihubungkan ke API.`);

      // Jika nanti API sudah ada, panggil onSuccess() setelah await delete berhasil
      // if (onSuccess) onSuccess();
    },
    [message],
  );

  return { handleDeleteFace };
}
