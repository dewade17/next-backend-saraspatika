import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useSetPassword({ token }) {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const onFinish = async (values) => {
    if (!token) {
      message.error('Link set password tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await client.post('/api/auth/set-password', {
        json: {
          token,
          newPassword: values.newPassword,
        },
      });
      message.success('Akun Anda sudah aktif.');
      setIsSuccess(true);
    } catch (error) {
      message.errorFrom(error, { fallback: 'Gagal menyimpan password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    isSuccess,
    onFinish,
  };
}
