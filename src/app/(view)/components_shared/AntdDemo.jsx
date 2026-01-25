'use client';

import React from 'react';
import { Alert, Button, Card, Input, Space } from 'antd';

export default function AntdDemo() {
  return (
    <Card
      title='Ant Design is ready'
      style={{ width: '100%' }}
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
        />
        <Space.Compact style={{ width: '100%' }}>
          <Input placeholder='Type something...' />
          <Button type='primary'>Submit</Button>
        </Space.Compact>
        <Button>Secondary Button</Button>
      </Space>
    </Card>
  );
}
