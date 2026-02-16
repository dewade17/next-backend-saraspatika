'use client';

import React from 'react';
import { Tag, Tooltip } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

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

function resolveTagColor(tone, color) {
  if (color) return color;
  const t = String(tone ?? '').toLowerCase();
  if (t === 'success') return 'green';
  if (t === 'warning') return 'orange';
  if (t === 'danger' || t === 'error') return 'red';
  if (t === 'info') return 'blue';
  if (t === 'processing') return 'processing';
  return undefined;
}

export const AppTag = React.forwardRef(function AppTag(
  {
    children,
    tone,
    color,
    rounded = false,
    onPress,
    onClick,
    tooltip,
    disabledReason,
    disabled = false,
    style,
    className,
    ...rest
  },
  ref,
) {
  const tooltipCfg = normalizeTooltip(tooltip, disabled, disabledReason);
  const finalColor = resolveTagColor(tone, color);

  const node = (
    <Tag
      ref={ref}
      color={finalColor}
      className={className}
      style={{
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(rounded ? { borderRadius: 999 } : null),
        ...(disabled ? { opacity: 0.55, cursor: 'not-allowed' } : null),
        ...(style ?? null),
      }}
      onClick={
        disabled
          ? undefined
          : (e) => {
              if (typeof onClick === 'function') onClick(e);
              if (typeof onPress === 'function') onPress(e);
            }
      }
      {...rest}
    >
      {children}
    </Tag>
  );

  if (!tooltipCfg?.title) return node;

  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: 'inline-block' }}>{node}</span>
    </Tooltip>
  );
});

export default AppTag;
