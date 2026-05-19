import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useSetPassword({ token }) {
  const router = useRouter();
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      message.success('Password berhasil disimpan. Silakan login.');
      router.push('/login');
    } catch (error) {
      message.errorFrom(error, { fallback: 'Gagal menyimpan password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    onFinish,
  };
}
