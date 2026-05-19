'use client';

import React from 'react';
import { Layout, Grid } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppForm from '@/app/(view)/components_shared/AppForm.jsx';
import AppImage from '@/app/(view)/components_shared/AppImage.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

import SetPasswordForm from './SetPasswordForm';
import { useSetPassword } from '../_hooks/useSetPassword';

const { Content } = Layout;

export default function SetPasswordPageClient({ token }) {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;
  const form = AppForm.useForm();

  const { isSubmitting, isSuccess, onFinish } = useSetPassword({ token });

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
          style={{ width: '100%', maxWidth: 1100, borderRadius: 0, boxShadow: 'none', backgroundColor: 'transparent' }}
          styles={{ body: { padding: isMdUp ? 48 : 24 } }}
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
                  alt='Set Password Illustration'
                  preview={false}
                  width={420}
                />
              </div>
            )}

            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: isSuccess ? 0 : 18 }}>
                <AppImage
                  src='/assets/images/logo_saraspatika.png'
                  alt='Logo'
                  preview={false}
                  width={44}
                  style={{ marginBottom: isSuccess ? 18 : 10 }}
                />

                {isSuccess ? (
                  <>
                    <CheckCircleFilled style={{ color: '#237804', fontSize: 54, marginBottom: 16 }} />

                    <AppTypography
                      as='title'
                      level={3}
                      align='center'
                      style={{ marginBottom: 8, fontWeight: 700 }}
                    >
                      Akun Anda sudah aktif
                    </AppTypography>

                    <AppTypography
                      as='paragraph'
                      tone='secondary'
                      align='center'
                      style={{ marginBottom: 0 }}
                    >
                      Silakan login ke sistem Saraspatika di handphone Anda.
                    </AppTypography>
                  </>
                ) : (
                  <>
                    <AppTypography
                      as='title'
                      level={3}
                      align='center'
                      style={{ marginBottom: 4, fontWeight: 700 }}
                    >
                      Atur Password
                    </AppTypography>

                    <AppTypography
                      as='text'
                      tone='secondary'
                      align='center'
                      style={{ display: 'block' }}
                    >
                      Masukkan password untuk mengaktifkan akun Anda.
                    </AppTypography>
                  </>
                )}
              </div>

              {!isSuccess && (
                <SetPasswordForm
                  form={form}
                  hasToken={!!token}
                  isSubmitting={isSubmitting}
                  onFinish={onFinish}
                />
              )}
            </div>
          </AppGrid>
        </AppCard>
      </Content>
    </Layout>
  );
}
