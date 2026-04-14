import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';
import { setClientAccessToken } from '@/lib/client_token_for_delete_face_only.js';

export function useLogin() {
  const router = useRouter();
  const message = useAppMessage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const client = React.useMemo(() => createHttpClient(), []);

  const handleLogin = async (values) => {
    setIsSubmitting(true);
    try {
      const res = await client.post('/api/auth/login', {
        json: {
          email: values.email,
          password: values.password,
        },
      });

      // simpan token untuk opsi B (call langsung ke backend Python)
      if (res?.token) setClientAccessToken(res.token);

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
