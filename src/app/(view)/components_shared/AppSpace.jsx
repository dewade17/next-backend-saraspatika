'use client';

import React from 'react';
import { Space, Grid } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';
const BP_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
const BP_ORDER = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];

function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function isResponsiveMap(v) {
  if (!v || typeof v !== 'object') return false;
  if (Array.isArray(v)) return false;
  if (React.isValidElement(v)) return false;
  return Object.keys(v).some((k) => BP_KEYS.includes(k) || k === 'base');
}

function pickResponsive(v, screens) {
  if (!isResponsiveMap(v)) return v;

  for (const bp of BP_ORDER) {
    if (screens?.[bp] && v[bp] != null) return v[bp];
  }

  if (v.base != null) return v.base;
  if (v.xs != null) return v.xs;

  for (const k of BP_KEYS) {
    if (v[k] != null) return v[k];
  }

  return undefined;
}

function normalizeDirection(direction) {
  if (!direction) return undefined;
  const d = String(direction).toLowerCase();
  if (d === 'horizontal' || d === 'row') return 'horizontal';
  if (d === 'vertical' || d === 'column') return 'vertical';
  return undefined;
}

function resolveSizePreset(v) {
  if (v == null) return undefined;

  if (isNumber(v)) return v;

  if (typeof v === 'string') {
    const s = v.toLowerCase();

    if (s === 'small' || s === 'middle' || s === 'large') return v;

    switch (s) {
      case 'none':
        return 0;
      case 'xs':
        return 4;
      case 'sm':
        return 8;
      case 'md':
        return 12;
      case 'lg':
        return 16;
      case 'xl':
        return 24;
      case '2xl':
        return 32;
      default:
        return v;
    }
  }

  return v;
}

function resolveSpaceSize({ size, gap, gapX, gapY }) {
  if (gapX != null || gapY != null) {
    const sx = resolveSizePreset(gapX ?? gap ?? size);
    const sy = resolveSizePreset(gapY ?? gap ?? size);
    return [sx ?? 'small', sy ?? 'small'];
  }

  const base = resolveSizePreset(size ?? gap);
  return base;
}

function normalizeSplit(split, separator) {
  const sep = separator ?? split;
  if (!sep) return undefined;

  if (typeof sep === 'string' || isNumber(sep)) {
    return <span style={{ fontFamily: DEFAULT_FONT_FAMILY, opacity: 0.7 }}>{sep}</span>;
  }

  return sep;
}

function mergeStyles(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

export const AppSpace = React.forwardRef(function AppSpace(
  {
    children,

    items, // optional: array render
    renderItem,
    keyExtractor,

    direction, // horizontal|vertical|row|column OR responsive map
    vertical, // boolean OR responsive map
    wrap, // boolean OR responsive map
    align, // start|end|center|baseline OR responsive map

    size, // preset/number or [x,y] OR responsive map
    gap, // alias size
    gapX, // preset/number OR responsive map
    gapY, // preset/number OR responsive map

    separator, // alias split
    split, // antd split
    separatorSpacing, // number|string (px), only when separator is string/number

    block = false, // true => width 100%
    fullWidth = false,
    fullHeight = false,
    minWidth0 = false,

    style,
    className,

    onClick,
    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();

  const pickedDirection = pickResponsive(direction, screens);
  const pickedVertical = pickResponsive(vertical, screens);
  const pickedWrap = pickResponsive(wrap, screens);
  const pickedAlign = pickResponsive(align, screens);

  const pickedSize = pickResponsive(size, screens);
  const pickedGap = pickResponsive(gap, screens);
  const pickedGapX = pickResponsive(gapX, screens);
  const pickedGapY = pickResponsive(gapY, screens);

  const dir = normalizeDirection(pickedDirection);
  const computedDirection = dir ?? (pickedVertical != null ? (pickedVertical ? 'vertical' : 'horizontal') : undefined);

  const computedSize = (() => {
    if (Array.isArray(pickedSize)) {
      const sx = resolveSizePreset(pickedSize[0]);
      const sy = resolveSizePreset(pickedSize[1]);
      return [sx ?? 'small', sy ?? 'small'];
    }
    return resolveSpaceSize({
      size: pickedSize,
      gap: pickedGap,
      gapX: pickedGapX,
      gapY: pickedGapY,
    });
  })();

  const computedSplit = (() => {
    const base = normalizeSplit(split, separator);
    if (!base) return undefined;

    if ((typeof separator === 'string' || isNumber(separator) || typeof split === 'string' || isNumber(split)) && separatorSpacing != null) {
      const sp = isNumber(separatorSpacing) ? `${separatorSpacing}px` : String(separatorSpacing);
      return <span style={{ marginInline: sp }}>{base}</span>;
    }

    return base;
  })();

  const computedStyle = mergeStyles({ fontFamily: DEFAULT_FONT_FAMILY }, block || fullWidth ? { width: '100%' } : null, fullHeight ? { height: '100%' } : null, minWidth0 ? { minWidth: 0 } : null, style);

  const content = (() => {
    if (Array.isArray(items)) {
      const render = typeof renderItem === 'function' ? renderItem : (it) => it;
      const getKey =
        typeof keyExtractor === 'function'
          ? keyExtractor
          : (it, idx) => {
              if (it && typeof it === 'object' && (it.key != null || it.id != null)) return String(it.key ?? it.id);
              return String(idx);
            };

      return items.map((it, idx) => <React.Fragment key={getKey(it, idx)}>{render(it, idx)}</React.Fragment>);
    }

    return children;
  })();

  return (
    <Space
      ref={ref}
      orientation={computedDirection}
      align={pickedAlign}
      wrap={pickedWrap}
      size={computedSize}
      separator={computedSplit}
      className={className}
      style={computedStyle}
      onClick={onClick}
      {...rest}
    >
      {content}
    </Space>
  );
});

export function HSpace(props) {
  return (
    <AppSpace
      direction='horizontal'
      {...props}
    />
  );
}

export function VSpace(props) {
  return (
    <AppSpace
      direction='vertical'
      {...props}
    />
  );
}

export function AppSpaceCompact({
  children,
  items,
  renderItem,
  keyExtractor,

  direction, // horizontal|vertical OR responsive map
  vertical, // boolean OR responsive map
  size, // preset/number OR responsive map
  block = false,
  fullWidth = false,

  style,
  className,
  ...rest
}) {
  const screens = Grid.useBreakpoint();

  const pickedDirection = pickResponsive(direction, screens);
  const pickedVertical = pickResponsive(vertical, screens);
  const pickedSize = pickResponsive(size, screens);

  const dir = normalizeDirection(pickedDirection);
  const computedDirection = dir ?? (pickedVertical != null ? (pickedVertical ? 'vertical' : 'horizontal') : undefined);

  const computedSize = resolveSizePreset(pickedSize);

  const computedStyle = mergeStyles({ fontFamily: DEFAULT_FONT_FAMILY }, block || fullWidth ? { width: '100%' } : null, style);

  const content = (() => {
    if (Array.isArray(items)) {
      const render = typeof renderItem === 'function' ? renderItem : (it) => it;
      const getKey =
        typeof keyExtractor === 'function'
          ? keyExtractor
          : (it, idx) => {
              if (it && typeof it === 'object' && (it.key != null || it.id != null)) return String(it.key ?? it.id);
              return String(idx);
            };

      return items.map((it, idx) => <React.Fragment key={getKey(it, idx)}>{render(it, idx)}</React.Fragment>);
    }

    return children;
  })();

  return (
    <Space.Compact
      orientation={computedDirection}
      size={computedSize}
      className={className}
      style={computedStyle}
      {...rest}
    >
      {content}
    </Space.Compact>
  );
}

AppSpace.H = HSpace;
AppSpace.V = VSpace;
AppSpace.Compact = AppSpaceCompact;

export default AppSpace;
