'use client';

import React from 'react';
import { Select } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

export const AppSelect = React.forwardRef(function AppSelect({ style, onValueChange, onChange, ...rest }, ref) {
  return (
    <Select
      ref={ref}
      style={{
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      onChange={(value, option) => {
        if (typeof onValueChange === 'function') onValueChange(value, option);
        if (typeof onChange === 'function') onChange(value, option);
      }}
      {...rest}
    />
  );
});

export default AppSelect;
