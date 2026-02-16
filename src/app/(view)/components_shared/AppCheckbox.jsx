'use client';

import React from 'react';
import { Checkbox } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

export const AppCheckbox = React.forwardRef(function AppCheckbox({ style, children, ...rest }, ref) {
  return (
    <Checkbox
      ref={ref}
      style={{
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      {...rest}
    >
      {children}
    </Checkbox>
  );
});

export const AppCheckboxGroup = React.forwardRef(function AppCheckboxGroup({ style, ...rest }, ref) {
  return (
    <Checkbox.Group
      ref={ref}
      style={{
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      {...rest}
    />
  );
});

AppCheckbox.Group = AppCheckboxGroup;

export default AppCheckbox;
