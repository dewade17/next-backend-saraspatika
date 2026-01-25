'use client';

import React from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';

export default function Providers({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: 'var(--font-poppins)',
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
