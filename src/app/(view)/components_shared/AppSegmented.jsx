'use client';

import React from 'react';
import { Segmented, Tooltip } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function resolveAntdSize(size) {
  if (!size) return undefined;
  if (size === 'small' || size === 'middle' || size === 'large') return size;

  switch (String(size).toLowerCase()) {
    case 'xs':
    case 'sm':
      return 'small';
    case 'md':
      return 'middle';
    case 'lg':
    case 'xl':
      return 'large';
    default:
      return undefined;
  }
}

function normalizeTooltip(tooltip, disabled, disabledReason) {
  if (disabled && disabledReason) return { title: disabledReason };
  if (!tooltip) return null;

  if (typeof tooltip === 'string' || React.isValidElement(tooltip)) return { title: tooltip };
  if (typeof tooltip === 'object') {
    const { title, ...rest } = tooltip;
    return { title, ...rest };
  }
  return null;
}

export const AppSegmented = React.forwardRef(function AppSegmented(
  {
    value,
    defaultValue,
    options,
    onValueChange,
    onChange,
    size = 'middle',
    fullWidth = false,
    block,
    tooltip,
    disabledReason,
    style,
    className,
    disabled,
    ...rest
  },
  ref,
) {
  const tooltipCfg = normalizeTooltip(tooltip, disabled, disabledReason);
  const antdSize = resolveAntdSize(size);
  const isBlock = Boolean(block || fullWidth);

  const node = (
    <Segmented
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      options={options}
      disabled={disabled}
      size={antdSize}
      block={isBlock}
      className={className}
      style={{
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(isBlock ? { width: '100%' } : null),
        ...(style ?? null),
      }}
      onChange={(next) => {
        if (typeof onValueChange === 'function') onValueChange(next);
        if (typeof onChange === 'function') onChange(next);
      }}
      {...rest}
    />
  );

  if (!tooltipCfg?.title) return node;

  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: isBlock ? 'block' : 'inline-block', width: isBlock ? '100%' : 'auto' }}>{node}</span>
    </Tooltip>
  );
});

export default AppSegmented;
