'use client';

import React from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';

export default function Providers({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: 'var(--font-poppins)',
          colorPrimary: '#0958d9',
          colorLink: '#0958d9',
          colorInfo: '#0958d9',
          colorSuccess: '#237804',
          colorWarning: '#874d00',
          colorError: '#cf1322',
          colorTextSecondary: '#595959',
          colorTextTertiary: '#595959',
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
