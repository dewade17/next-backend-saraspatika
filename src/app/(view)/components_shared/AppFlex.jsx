'use client';

import React from 'react';
import { Flex, Grid } from 'antd';

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
  const keys = Object.keys(v);
  return keys.some((k) => BP_KEYS.includes(k) || k === 'base');
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
  if (d === 'row' || d === 'horizontal') return 'horizontal';
  if (d === 'column' || d === 'vertical') return 'vertical';
  return undefined;
}

function resolveGapPreset(gap) {
  if (gap == null) return undefined;

  if (isNumber(gap)) return gap;
  if (typeof gap === 'string') {
    const g = gap.toLowerCase();

    if (g === 'small' || g === 'middle' || g === 'large') return gap;

    switch (g) {
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
        return gap;
    }
  }

  return gap;
}

function resolveGap({ gap, gapX, gapY }) {
  const gx = gapX != null ? resolveGapPreset(gapX) : undefined;
  const gy = gapY != null ? resolveGapPreset(gapY) : undefined;

  if (gx == null && gy == null) {
    return { gapProp: resolveGapPreset(gap), styleGap: null };
  }

  const col = gx;
  const row = gy;

  const styleGap = {
    ...(col != null ? { columnGap: isNumber(col) ? col : col } : null),
    ...(row != null ? { rowGap: isNumber(row) ? row : row } : null),
  };

  return { gapProp: undefined, styleGap };
}

function resolveWrap(wrap) {
  if (wrap == null) return undefined;
  if (wrap === true) return 'wrap';
  if (wrap === false) return 'nowrap';
  return wrap;
}

function mergeStyles(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

export const AppFlex = React.forwardRef(function AppFlex(
  {
    children,

    direction, // row|column|horizontal|vertical OR responsive map
    vertical, // boolean OR responsive map
    orientation, // 'horizontal'|'vertical' OR responsive map (pass-through)
    wrap, // boolean|'wrap'|'nowrap'|'wrap-reverse' OR responsive map

    justify, // OR responsive map
    align, // OR responsive map
    flex, // OR responsive map

    gap, // preset or number OR responsive map
    gapX, // preset or number OR responsive map
    gapY, // preset or number OR responsive map

    center = false,
    between = false,
    around = false,
    evenly = false,

    inline = false, // inline-flex
    fullWidth = false,
    fullHeight = false,
    minWidth0 = false,

    as, // alias untuk antd prop: component
    component,

    style,
    className,

    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();

  const pickedDirection = pickResponsive(direction, screens);
  const pickedVertical = pickResponsive(vertical, screens);
  const pickedOrientation = pickResponsive(orientation, screens);
  const pickedWrap = pickResponsive(wrap, screens);

  const pickedJustify = pickResponsive(justify, screens);
  const pickedAlign = pickResponsive(align, screens);
  const pickedFlex = pickResponsive(flex, screens);

  const pickedGap = pickResponsive(gap, screens);
  const pickedGapX = pickResponsive(gapX, screens);
  const pickedGapY = pickResponsive(gapY, screens);

  const dir = normalizeDirection(pickedDirection);
  const computedVertical = pickedVertical != null ? Boolean(pickedVertical) : dir === 'vertical';

  const computedJustify = (() => {
    if (center && !pickedJustify) return 'center';
    if (between && !pickedJustify) return 'space-between';
    if (around && !pickedJustify) return 'space-around';
    if (evenly && !pickedJustify) return 'space-evenly';
    return pickedJustify;
  })();

  const computedAlign = center && !pickedAlign ? 'center' : pickedAlign;

  const { gapProp, styleGap } = resolveGap({
    gap: pickedGap,
    gapX: pickedGapX,
    gapY: pickedGapY,
  });

  const computedStyle = mergeStyles(
    {
      fontFamily: DEFAULT_FONT_FAMILY,
      ...(inline ? { display: 'inline-flex' } : null),
      ...(fullWidth ? { width: '100%' } : null),
      ...(fullHeight ? { height: '100%' } : null),
      ...(minWidth0 ? { minWidth: 0 } : null),
    },
    styleGap,
    style,
  );

  const Component = as ?? component;

  return (
    <Flex
      ref={ref}
      vertical={computedVertical}
      orientation={pickedOrientation}
      wrap={resolveWrap(pickedWrap)}
      justify={computedJustify}
      align={computedAlign}
      flex={pickedFlex}
      gap={gapProp}
      component={Component}
      style={computedStyle}
      className={className}
      {...rest}
    >
      {children}
    </Flex>
  );
});

export function HStack(props) {
  return (
    <AppFlex
      direction='row'
      {...props}
    />
  );
}

export function VStack(props) {
  return (
    <AppFlex
      direction='column'
      {...props}
    />
  );
}

export function Center(props) {
  return (
    <AppFlex
      center
      {...props}
    />
  );
}

export function Spacer({ flex = 1, style, ...rest }) {
  return (
    <div
      style={{ flex, ...(style ?? null) }}
      {...rest}
    />
  );
}

export function AppFlexItem({ children, grow, shrink, basis, flex, alignSelf, order, style, className, ...rest }) {
  const computedFlex = flex != null ? flex : `${grow != null ? grow : 0} ${shrink != null ? shrink : 1} ${basis != null ? basis : 'auto'}`;

  return (
    <div
      style={{
        flex: computedFlex,
        ...(alignSelf != null ? { alignSelf } : null),
        ...(order != null ? { order } : null),
        ...(style ?? null),
      }}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
}

AppFlex.HStack = HStack;
AppFlex.VStack = VStack;
AppFlex.Center = Center;
AppFlex.Spacer = Spacer;
AppFlex.Item = AppFlexItem;

export default AppFlex;
