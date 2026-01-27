'use client';

import React from 'react';
import { MailOutlined, SafetyCertificateOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Layout, Grid } from 'antd';
import { useRouter } from 'next/navigation';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppImage from '@/app/(view)/components_shared/AppImage.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

const { Content } = Layout;

export default function ForgotPasswordPage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;
  const router = useRouter();
  const message = useAppMessage();

  const form = AppForm.useForm();
  const client = React.useMemo(() => createHttpClient(), []);

  const [step, setStep] = React.useState(1); // 1=request token, 2=reset
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
    } catch {
      // validation error: ignore
    }
  };

  const onBackToEmail = () => {
    setStep(1);
    form.setFieldsValue({ code: undefined, newPassword: undefined, confirmPassword: undefined });
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMdUp ? '40px 24px' : '24px 16px',
        }}
      >
        <AppCard
          bordered={false}
          style={{
            width: '100%',
            maxWidth: 1100,
            borderRadius: 0,
            boxShadow: 'none',
            backgroundColor: 'transparent',
          }}
          styles={{
            body: {
              padding: isMdUp ? 48 : 24,
            },
          }}
        >
          <AppGrid
            templateColumns={isMdUp ? '1fr 420px' : '1fr'}
            gap={isMdUp ? 48 : 24}
            alignItems='center'
          >
            {isMdUp ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <AppImage
                  src='/assets/images/Karakter_login.png'
                  alt='Forgot Password Illustration'
                  preview={false}
                  width={420}
                />
              </div>
            ) : null}

            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <AppImage
                  src='/assets/images/logo_saraspatika.png'
                  alt='Logo'
                  preview={false}
                  width={44}
                  style={{ marginBottom: 10 }}
                />

                <AppTypography
                  as='title'
                  level={3}
                  align='center'
                  style={{ marginBottom: 4, fontWeight: 700 }}
                >
                  Lupa Password
                </AppTypography>

                <AppTypography
                  as='text'
                  tone='secondary'
                  align='center'
                  style={{ display: 'block' }}
                >
                  {step === 1 ? 'Masukkan email untuk menerima kode reset (6 digit).' : 'Masukkan kode (6 digit) dan password baru.'}
                </AppTypography>
              </div>

              <AppForm
                form={form}
                layout='vertical'
                onFinish={onFinish}
                requiredMark={false}
              >
                <AppForm.Item
                  label='Email'
                  name='email'
                  rules={[{ required: true, message: 'Masukkan email Anda!' }]}
                >
                  <AppInput
                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder='nama@email.com'
                    size='large'
                    trim
                    disabled={step === 2} // lock email saat step 2 biar tidak mismatch
                  />
                </AppForm.Item>

                {step === 2 ? (
                  <>
                    <AppForm.Item
                      label='Kode (6 digit)'
                      name='code'
                      rules={[
                        { required: true, message: 'Masukkan kode 6 digit!' },
                        { pattern: /^\d{6}$/, message: 'Kode harus 6 digit' },
                      ]}
                    >
                      <AppInput
                        prefix={<SafetyCertificateOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder='123456'
                        size='large'
                        inputMode='numeric'
                        maxLength={6}
                        allowPattern={/\d/g}
                      />
                    </AppForm.Item>

                    <AppForm.Item
                      label='Password Baru'
                      name='newPassword'
                      rules={[
                        { required: true, message: 'Masukkan password baru!' },
                        { min: 8, message: 'Minimal 8 karakter' },
                      ]}
                    >
                      <AppInput.Password
                        prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder='********'
                        size='large'
                      />
                    </AppForm.Item>

                    <AppForm.Item
                      label='Konfirmasi Password'
                      name='confirmPassword'
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Konfirmasi password baru!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const p = getFieldValue('newPassword');
                            if (!value || value === p) return Promise.resolve();
                            return Promise.reject(new Error('Konfirmasi tidak sama dengan password baru'));
                          },
                        }),
                      ]}
                    >
                      <AppInput.Password
                        prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder='********'
                        size='large'
                      />
                    </AppForm.Item>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 6,
                        marginBottom: 18,
                      }}
                    >
                      <AppButton
                        type='link'
                        onClick={onBackToEmail}
                        icon={<ArrowLeftOutlined />}
                      >
                        Ganti email
                      </AppButton>

                      <AppButton
                        type='link'
                        onClick={onResend}
                        disabled={cooldown > 0}
                      >
                        {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode'}
                      </AppButton>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, marginBottom: 18 }}>
                    <a
                      href='/login'
                      style={{ fontSize: 12, textDecoration: 'none' }}
                    >
                      Kembali ke login
                    </a>
                  </div>
                )}

                <AppButton
                  type='primary'
                  htmlType='submit'
                  block
                  size='large'
                  loading={isSubmitting}
                  style={{
                    height: 44,
                    fontWeight: 600,
                    backgroundColor: '#86D7A0',
                    borderColor: '#86D7A0',
                  }}
                >
                  {step === 1 ? 'Kirim Kode' : 'Reset Password'}
                </AppButton>

                {step === 2 ? (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <a
                      href='/login'
                      style={{ fontSize: 12, textDecoration: 'none' }}
                    >
                      Sudah ingat password? Login
                    </a>
                  </div>
                ) : null}
              </AppForm>
            </div>
          </AppGrid>
        </AppCard>
      </Content>
    </Layout>
  );
}
