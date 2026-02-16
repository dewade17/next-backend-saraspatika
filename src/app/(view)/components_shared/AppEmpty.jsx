'use client';

import React from 'react';
import { Empty } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

export default function AppEmpty({ style, ...rest }) {
  return (
    <Empty
      style={{
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      {...rest}
    />
  );
}
