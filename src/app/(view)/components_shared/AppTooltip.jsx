'use client';

import React from 'react';
import { Tooltip } from 'antd';

export default function AppTooltip({ children, ...rest }) {
  return <Tooltip {...rest}>{children}</Tooltip>;
}
