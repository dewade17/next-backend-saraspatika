import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export function useForgotPassword(form) {
  const router = useRouter();
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const requestToken = async (email, { keepStep = false } = {}) => {
    setIsSubmitting(true);
    try {
      await client.post('/api/auth/request-token', { json: { email } });
      message.success('Jika email terdaftar, kode telah dikirim.');
      setCooldown(60);
      if (!keepStep) setStep(2);
    } catch (error) {
      message.errorFrom(error, { fallback: 'Gagal mengirim kode' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const doResetPassword = async ({ email, code, newPassword }) => {
    setIsSubmitting(true);
    try {
      await client.post('/api/auth/reset-password', {
        json: { email, code, newPassword },
      });
      message.success('Password berhasil direset. Silakan login.');
      router.push('/login');
    } catch (error) {
      message.errorFrom(error, { fallback: 'Gagal reset password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinish = async (values) => {
    if (step === 1) {
      await requestToken(values.email);
      return;
    }
    await doResetPassword(values);
  };

  const onResend = async () => {
    try {
      const email = form.getFieldValue('email');
      await form.validateFields(['email']);
      if (cooldown > 0) return;
      await requestToken(email, { keepStep: true });
    } catch {}
  };

  const onBackToEmail = () => {
    setStep(1);
    form.setFieldsValue({ code: undefined, newPassword: undefined, confirmPassword: undefined });
  };

  return {
    step,
    isSubmitting,
    cooldown,
    onFinish,
    onResend,
    onBackToEmail,
  };
}
