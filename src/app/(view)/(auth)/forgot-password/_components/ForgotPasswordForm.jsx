import React from 'react';
import { MailOutlined, SafetyCertificateOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

export default function ForgotPasswordForm({ form, step, isSubmitting, cooldown, onFinish, onResend, onBackToEmail }) {
  return (
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
          disabled={step === 2}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 18 }}>
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

      {step === 2 && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <a
            href='/login'
            style={{ fontSize: 12, textDecoration: 'none' }}
          >
            Sudah ingat password? Login
          </a>
        </div>
      )}
    </AppForm>
  );
}
