'use client';

import React from 'react';
import { Alert, Button, Card, Input, Space, Typography } from 'antd';

export default function AntdDemo() {
  return (
    <Card
      title={<span style={{ fontFamily: 'var(--font-poppins)' }}>Ant Design is ready</span>}
      style={{ width: '100%', fontFamily: 'var(--font-poppins)' }}
    >
      <Space
        orientation='vertical'
        size='middle'
        style={{ width: '100%' }}
      >
        <Alert
          showIcon
          type='success'
          title='SSR style is handled by @ant-design/nextjs-registry'
          style={{ fontFamily: 'var(--font-poppins)' }}
        />

        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder='Type something...'
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
          <Button
            type='primary'
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Submit
          </Button>
        </Space.Compact>

        <Button style={{ fontFamily: 'var(--font-poppins)' }}>Secondary Button</Button>

        <Typography.Text style={{ fontFamily: 'var(--font-poppins)' }}>
          Font: Poppins (via CSS variable <code>--font-poppins</code>)
        </Typography.Text>
      </Space>
    </Card>
  );
}
