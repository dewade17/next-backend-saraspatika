'use client';

import React from 'react';
import { Layout, Grid } from 'antd';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppImage from '@/app/(view)/components_shared/AppImage.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';

import LoginForm from './_components/LoginForm';
import LoginHeader from './_components/LoginHeader';
import { useLogin } from './_hooks/useLogin';

const { Content } = Layout;

export default function LoginPage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;
  const { handleLogin, isSubmitting } = useLogin();

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
            {isMdUp && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <AppImage
                  src='/assets/images/Karakter_login.png'
                  alt='Login Illustration'
                  preview={false}
                  width={420}
                />
              </div>
            )}

            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
              <LoginHeader />
              <LoginForm
                onFinish={handleLogin}
                loading={isSubmitting}
              />
            </div>
          </AppGrid>
        </AppCard>
      </Content>
    </Layout>
  );
}
