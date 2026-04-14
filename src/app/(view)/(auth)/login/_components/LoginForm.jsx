import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Checkbox } from 'antd';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import { clearRememberedLoginEmail, loadRememberedLoginEmail, saveRememberedLoginEmail } from '@/lib/remember_login_email.js';

export default function LoginForm({ onFinish, loading }) {
  const form = AppForm.useForm();

  React.useEffect(() => {
    const rememberedEmail = loadRememberedLoginEmail();
    if (!rememberedEmail) return;

    form.setFieldsValue({
      email: rememberedEmail,
      rememberMe: true,
    });
  }, [form]);

  const handleFinish = React.useCallback(
    (values) => {
      if (values?.rememberMe) saveRememberedLoginEmail(values?.email);
      else clearRememberedLoginEmail();

      return onFinish?.(values);
    },
    [onFinish],
  );

  return (
    <AppForm
      form={form}
      layout='vertical'
      onFinish={handleFinish}
      requiredMark={false}
      initialValues={{ rememberMe: false }}
    >
      <AppForm.Item
        label='Email'
        name='email'
        rules={[{ required: true, message: 'Masukkan email Anda!' }]}
      >
        <AppInput
          prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
          placeholder='nama@email.com'
          size='large'
        />
      </AppForm.Item>

      <AppForm.Item
        label='Kata Sandi'
        name='password'
        rules={[{ required: true, message: 'Masukkan password Anda!' }]}
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
        <AppForm.Item
          name='rememberMe'
          valuePropName='checked'
          noStyle
        >
          <Checkbox>Ingatkan saya</Checkbox>
        </AppForm.Item>
        <a
          href='/forgot-password'
          style={{ fontSize: 12, textDecoration: 'none' }}
        >
          Lupa Password
        </a>
      </div>

      <AppButton
        type='primary'
        htmlType='submit'
        block
        size='large'
        loading={loading}
        style={{
          height: 44,
          fontWeight: 600,
          backgroundColor: '#86D7A0',
          borderColor: '#86D7A0',
        }}
      >
        Masuk
      </AppButton>
    </AppForm>
  );
}
