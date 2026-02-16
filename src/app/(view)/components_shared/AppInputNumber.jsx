'use client';

import React from 'react';
import { Grid, InputNumber } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';
const BP_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
const BP_ORDER = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];

function isResponsiveMap(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (React.isValidElement(value)) return false;
  return Object.keys(value).some((k) => BP_KEYS.includes(k) || k === 'base');
}

function pickResponsive(value, screens) {
  if (!isResponsiveMap(value)) return value;

  for (const bp of BP_ORDER) {
    if (screens?.[bp] && value[bp] != null) return value[bp];
  }

  if (value.base != null) return value.base;
  if (value.xs != null) return value.xs;

  for (const bp of BP_KEYS) {
    if (value[bp] != null) return value[bp];
  }

  return undefined;
}

export default React.forwardRef(function AppInputNumber(
  {
    size,
    status,
    error,
    block = true,
    style,
    className,
    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();
  const pickedSize = pickResponsive(size, screens);
  const computedStatus = status ?? (error ? 'error' : undefined);

  return (
    <InputNumber
      ref={ref}
      size={pickedSize}
      status={computedStatus}
      className={className}
      style={{
        width: block ? '100%' : undefined,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      {...rest}
    />
  );
});
