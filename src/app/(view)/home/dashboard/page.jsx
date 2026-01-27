'use client';

import React from 'react';
import { Grid } from 'antd';
import { UserOutlined, CheckCircleOutlined, ProfileOutlined, CalendarOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppGrid from '@/app/(view)/components_shared/AppGrid.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppImage from '@/app/(view)/components_shared/AppImage.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';

function StatCard({ value, label, icon }) {
  return (
    <AppCard
      bordered={false}
      style={{
        borderRadius: 0,
        backgroundColor: '#3B8CFF',
        minHeight: 140,
        overflow: 'hidden',
      }}
      styles={{
        body: {
          padding: 20,
          height: '100%',
        },
      }}
    >
      <AppFlex
        justify='space-between'
        align='center'
        fullWidth
        minWidth0
        style={{ height: '100%' }}
      >
        <div style={{ minWidth: 0 }}>
          <AppTypography
            as='title'
            level={2}
            style={{
              margin: 0,
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {value}
          </AppTypography>

          <AppTypography
            as='text'
            style={{
              display: 'block',
              marginTop: 10,
              color: '#ffffff',
              fontWeight: 700,
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}
          >
            {label}
          </AppTypography>
        </div>

        <div
          style={{
            width: 86,
            height: 86,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.9,
          }}
        >
          {icon}
        </div>
      </AppFlex>
    </AppCard>
  );
}

export default function DashboardPage() {
  const screens = Grid.useBreakpoint();
  const isMdUp = !!screens?.md;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
        <AppCard
          bordered
          style={{ borderRadius: 0, marginBottom: 16 }}
          styles={{ body: { padding: isMdUp ? 24 : 16 } }}
        >
          <AppTypography
            as='title'
            level={4}
            style={{ marginTop: 0, marginBottom: 16, fontWeight: 700 }}
          >
            Profile Sekolah
          </AppTypography>

          {/* Pakai grid supaya layout stabil dan tidak shrink jadi 1 karakter */}
          <AppGrid
            templateColumns={isMdUp ? '88px 1fr' : '72px 1fr'}
            gap={16}
            alignItems='start'
            fullWidth
            minWidth0
          >
            <AppImage
              src='/assets/images/logo_saraspatika.png'
              alt='Logo Sekolah'
              preview={false}
              width={isMdUp ? 72 : 56}
            />

            <div style={{ minWidth: 0 }}>
              <AppTypography
                as='text'
                style={{
                  display: 'block',
                  fontWeight: 700,
                  marginBottom: 6,
                  wordBreak: 'break-word',
                }}
              >
                SD Saraswati 4 Denpasar
              </AppTypography>

              <AppTypography
                as='text'
                tone='secondary'
                style={{
                  display: 'block',
                  marginBottom: 4,
                  wordBreak: 'break-word',
                }}
              >
                No. Telephone: <span style={{ fontWeight: 600 }}>(0361) 4747701</span>
              </AppTypography>

              <AppTypography
                as='text'
                tone='secondary'
                style={{
                  display: 'block',
                  marginBottom: 4,
                  wordBreak: 'break-word',
                }}
              >
                Alamat: Jl. Tukad Barito V No.16, Renon, Denpasar Selatan
              </AppTypography>

              <AppTypography
                as='text'
                tone='secondary'
                style={{ display: 'block', wordBreak: 'break-word' }}
              >
                NPSN: 50103258
              </AppTypography>
            </div>
          </AppGrid>
        </AppCard>

        <AppGrid
          templateColumns={isMdUp ? '1fr 1fr' : '1fr'}
          gap={16}
        >
          <StatCard
            value='36'
            label={'Guru &\nPegawai'}
            icon={<UserOutlined style={{ fontSize: 64, color: 'rgba(0,0,0,0.65)' }} />}
          />
          <StatCard
            value='5'
            label={'Verifikasi\nIzin/Sakit/Cuti'}
            icon={<CheckCircleOutlined style={{ fontSize: 64, color: 'rgba(0,0,0,0.65)' }} />}
          />
          <StatCard
            value='15'
            label={'Agenda\nMengajar'}
            icon={<ProfileOutlined style={{ fontSize: 64, color: 'rgba(0,0,0,0.65)' }} />}
          />
          <StatCard
            value='10'
            label={'Agenda Kerja'}
            icon={<CalendarOutlined style={{ fontSize: 64, color: 'rgba(0,0,0,0.65)' }} />}
          />
        </AppGrid>
      </div>
    </div>
  );
}
