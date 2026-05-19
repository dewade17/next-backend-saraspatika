import React from 'react';
import { LockOutlined } from '@ant-design/icons';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';

export default function SetPasswordForm({ form, hasToken, isSubmitting, onFinish }) {
  return (
    <AppForm
      form={form}
      layout='vertical'
      onFinish={onFinish}
      requiredMark={false}
    >
      <AppForm.Item
        label='Password'
        name='newPassword'
        rules={[
          { required: true, message: 'Masukkan password baru!' },
          { min: 8, message: 'Minimal 8 karakter' },
        ]}
      >
        <AppInput.Password
          prefix={<LockOutlined style={{ color: '#595959' }} />}
          placeholder='********'
          size='large'
          disabled={!hasToken}
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
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Konfirmasi password tidak sama'));
            },
          }),
        ]}
      >
        <AppInput.Password
          prefix={<LockOutlined style={{ color: '#595959' }} />}
          placeholder='********'
          size='large'
          disabled={!hasToken}
        />
      </AppForm.Item>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, marginBottom: 18 }}>
        <a
          href='/login'
          style={{ fontSize: 12, textDecoration: 'none' }}
        >
          Kembali ke login
        </a>
      </div>

      <AppButton
        type='primary'
        htmlType='submit'
        block
        size='large'
        loading={isSubmitting}
        disabled={!hasToken}
        style={{
          height: 44,
          fontWeight: 600,
          ...(hasToken
            ? {
                backgroundColor: '#237804',
                borderColor: '#237804',
                color: '#ffffff',
              }
            : null),
        }}
      >
        Simpan Password
      </AppButton>
    </AppForm>
  );
}
