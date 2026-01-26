'use client';

import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Checkbox, Layout, Grid } from 'antd';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppInput from '@/app/(view)/components_shared/AppInput.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppImage from '@/app/(view)/components_shared/AppImage.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

const { Content } = Layout;

export default function LoginPage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  const onFinish = (values) => {
    console.log('Success:', values);
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
                  alt='Login Illustration'
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
                  Si Hadir Saraswati 4 Denpasar
                </AppTypography>

                <AppTypography
                  as='text'
                  tone='secondary'
                  align='center'
                  style={{ display: 'block' }}
                >
                  Selamat datang, mohon masukkan data Anda!
                </AppTypography>
              </div>

              <AppForm
                layout='vertical'
                onFinish={onFinish}
                requiredMark={false}
              >
                <AppForm.Item
                  label='Username'
                  name='username'
                  rules={[{ required: true, message: 'Masukkan username Anda!' }]}
                >
                  <AppInput
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder='Kepala Sekolah'
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
                  <Checkbox>Ingatkan saya</Checkbox>

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
            </div>
          </AppGrid>
        </AppCard>
      </Content>
    </Layout>
  );
}
