'use client';

import React from 'react';
import { Statistic } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

export const AppStatistic = React.forwardRef(function AppStatistic({ style, ...rest }, ref) {
  return (
    <Statistic
      ref={ref}
      style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
      {...rest}
    />
  );
});

export default AppStatistic;
