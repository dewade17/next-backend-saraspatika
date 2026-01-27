import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useLogin() {
  const router = useRouter();
  const message = useAppMessage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const client = React.useMemo(() => createHttpClient(), []);

  const handleLogin = async (values) => {
    setIsSubmitting(true);
    try {
      await client.post('/api/auth/login', {
        json: {
          email: values.email,
          password: values.password,
        },
      });
      message.success('Berhasil masuk');
      router.push('/home/dashboard');
    } catch (error) {
      message.errorFrom(error, { fallback: 'Gagal login' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleLogin,
    isSubmitting,
  };
}
