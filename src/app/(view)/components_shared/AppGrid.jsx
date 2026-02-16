'use client';

import React from 'react';
import { Col, Grid, Row } from 'antd';

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

function resolvePresetPx(v) {
  if (v == null) return undefined;
  if (isNumber(v)) return v;

  const s = String(v).toLowerCase();
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
    case '3xl':
      return 40;
    default:
      return v;
  }
}

function resolveGap({ gap, gapX, gapY }) {
  const gx = gapX != null ? resolvePresetPx(gapX) : undefined;
  const gy = gapY != null ? resolvePresetPx(gapY) : undefined;

  if (gx == null && gy == null) {
    const g = resolvePresetPx(gap);
    return { gridGap: g, styleGap: null };
  }

  const styleGap = {
    ...(gx != null ? { columnGap: gx } : null),
    ...(gy != null ? { rowGap: gy } : null),
  };

  return { gridGap: undefined, styleGap };
}

function normalizeAutoFlow(flow, dense) {
  if (!flow && !dense) return undefined;
  const f = String(flow ?? 'row').toLowerCase();
  const base = f === 'column' ? 'column' : 'row';
  return dense ? `${base} dense` : base;
}

function normalizeMinWidth(minItemWidth) {
  if (minItemWidth == null) return undefined;
  if (isNumber(minItemWidth)) return `${minItemWidth}px`;
  return String(minItemWidth);
}

function normalizeMaxWidth(maxItemWidth) {
  if (maxItemWidth == null) return '1fr';
  if (isNumber(maxItemWidth)) return `${maxItemWidth}px`;
  return String(maxItemWidth);
}

function resolveTemplateColumns({ templateColumns, columns, auto, minItemWidth, maxItemWidth }) {
  if (templateColumns) return templateColumns;

  const minW = normalizeMinWidth(minItemWidth) ?? '220px';
  const maxW = normalizeMaxWidth(maxItemWidth);

  const c = columns;

  const isAuto = auto === true || c === 'auto' || c === 'auto-fit' || c === 'auto-fill';

  if (isAuto) {
    const mode = c === 'auto-fill' ? 'auto-fill' : 'auto-fit';
    return `repeat(${mode}, minmax(${minW}, ${maxW}))`;
  }

  if (isNumber(c)) {
    return `repeat(${c}, minmax(0, 1fr))`;
  }

  if (typeof c === 'string' && c.trim().length > 0) {
    return c;
  }

  return undefined;
}

function resolveTemplateRows(templateRows, rows) {
  if (templateRows) return templateRows;

  if (isNumber(rows)) return `repeat(${rows}, minmax(0, 1fr))`;
  if (typeof rows === 'string' && rows.trim().length > 0) return rows;

  return undefined;
}

function mergeStyles(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

export const AppGrid = React.forwardRef(function AppGrid(
  {
    children,
    items, // optional array render
    renderItem,
    keyExtractor,

    as,
    component,

    columns, // number | css string | 'auto-fit'|'auto-fill'|'auto'
    rows, // number | css string
    auto = false, // true => repeat(auto-fit,...)
    minItemWidth = 220,
    maxItemWidth = '1fr',

    templateColumns,
    templateRows,
    templateAreas, // string (CSS grid-template-areas)
    area, // set gridArea for wrapper (rare)

    gap = 'md',
    gapX,
    gapY,

    flow = 'row', // row|column
    dense = false,

    alignItems,
    justifyItems,
    alignContent,
    justifyContent,

    center = false, // place-items: center
    fullWidth = false,
    fullHeight = false,
    minWidth0 = false,

    inset, // number | { start, end } for padding-inline
    padding, // preset/number for padding all

    style,
    className,

    onClick,
    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();

  const pickedColumns = pickResponsive(columns, screens);
  const pickedRows = pickResponsive(rows, screens);
  const pickedAuto = pickResponsive(auto, screens);
  const pickedMinItemWidth = pickResponsive(minItemWidth, screens);
  const pickedMaxItemWidth = pickResponsive(maxItemWidth, screens);

  const pickedGap = pickResponsive(gap, screens);
  const pickedGapX = pickResponsive(gapX, screens);
  const pickedGapY = pickResponsive(gapY, screens);

  const pickedAlignItems = pickResponsive(alignItems, screens);
  const pickedJustifyItems = pickResponsive(justifyItems, screens);
  const pickedAlignContent = pickResponsive(alignContent, screens);
  const pickedJustifyContent = pickResponsive(justifyContent, screens);

  const { gridGap, styleGap } = resolveGap({
    gap: pickedGap,
    gapX: pickedGapX,
    gapY: pickedGapY,
  });

  const tc = resolveTemplateColumns({
    templateColumns,
    columns: pickedColumns,
    auto: pickedAuto,
    minItemWidth: pickedMinItemWidth,
    maxItemWidth: pickedMaxItemWidth,
  });

  const tr = resolveTemplateRows(templateRows, pickedRows);

  const pad = resolvePresetPx(padding);
  const insetStyle = (() => {
    if (inset == null) return null;
    if (isNumber(inset)) return { paddingInline: inset };
    if (typeof inset === 'object') {
      const start = isNumber(inset.start) ? inset.start : undefined;
      const end = isNumber(inset.end) ? inset.end : undefined;
      return {
        ...(start != null ? { paddingInlineStart: start } : null),
        ...(end != null ? { paddingInlineEnd: end } : null),
      };
    }
    return null;
  })();

  const computedStyle = mergeStyles(
    {
      fontFamily: DEFAULT_FONT_FAMILY,
      display: 'grid',
      ...(tc ? { gridTemplateColumns: tc } : null),
      ...(tr ? { gridTemplateRows: tr } : null),
      ...(templateAreas ? { gridTemplateAreas: templateAreas } : null),
      ...(area ? { gridArea: area } : null),
      ...(gridGap != null ? { gap: gridGap } : null),
      ...(normalizeAutoFlow(flow, dense) ? { gridAutoFlow: normalizeAutoFlow(flow, dense) } : null),

      ...(center ? { placeItems: 'center' } : null),
      ...(pickedAlignItems ? { alignItems: pickedAlignItems } : null),
      ...(pickedJustifyItems ? { justifyItems: pickedJustifyItems } : null),
      ...(pickedAlignContent ? { alignContent: pickedAlignContent } : null),
      ...(pickedJustifyContent ? { justifyContent: pickedJustifyContent } : null),

      ...(fullWidth ? { width: '100%' } : null),
      ...(fullHeight ? { height: '100%' } : null),
      ...(minWidth0 ? { minWidth: 0 } : null),
      ...(pad != null ? { padding: pad } : null),
    },
    insetStyle,
    styleGap,
    style,
  );

  const Component = as ?? component ?? 'div';

  const content = (() => {
    if (Array.isArray(items)) {
      const render = typeof renderItem === 'function' ? renderItem : (it) => it;
      const getKey =
        typeof keyExtractor === 'function'
          ? keyExtractor
          : (_it, idx) => {
              if (_it && typeof _it === 'object' && (_it.key != null || _it.id != null)) return String(_it.key ?? _it.id);
              return String(idx);
            };

      return items.map((it, idx) => <React.Fragment key={getKey(it, idx)}>{render(it, idx)}</React.Fragment>);
    }

    return children;
  })();

  return (
    <Component
      ref={ref}
      className={className}
      style={computedStyle}
      onClick={onClick}
      {...rest}
    >
      {content}
    </Component>
  );
});

export function useAppBreakpoint() {
  return Grid.useBreakpoint();
}

export const AppRow = React.forwardRef(function AppRow({ style, ...rest }, ref) {
  return (
    <Row
      ref={ref}
      style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
      {...rest}
    />
  );
});

export const AppCol = React.forwardRef(function AppCol({ style, ...rest }, ref) {
  return (
    <Col
      ref={ref}
      style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
      {...rest}
    />
  );
});

export function AppGridItem({
  children,
  col, // number | "span 2" | "1 / span 3" | "1 / 4"
  row, // number | "span 2" | "1 / span 3" | "1 / 4"
  area, // string (area name)
  alignSelf,
  justifySelf,
  placeSelf,
  style,
  className,
  as,
  ...rest
}) {
  const Component = as ?? 'div';

  const gridColumn = (() => {
    if (col == null) return undefined;
    if (isNumber(col)) return `span ${col}`;
    return String(col);
  })();

  const gridRow = (() => {
    if (row == null) return undefined;
    if (isNumber(row)) return `span ${row}`;
    return String(row);
  })();

  const computedStyle = {
    ...(gridColumn ? { gridColumn } : null),
    ...(gridRow ? { gridRow } : null),
    ...(area ? { gridArea: area } : null),
    ...(placeSelf ? { placeSelf } : null),
    ...(alignSelf ? { alignSelf } : null),
    ...(justifySelf ? { justifySelf } : null),
    ...(style ?? null),
  };

  return (
    <Component
      className={className}
      style={computedStyle}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function SimpleGrid(props) {
  const { cols = 3, spacing = 'md', minChildWidth, ...rest } = props ?? {};
  const auto = minChildWidth != null;
  return (
    <AppGrid
      columns={auto ? 'auto-fit' : cols}
      auto={auto}
      minItemWidth={minChildWidth ?? 220}
      gap={spacing}
      {...rest}
    />
  );
}

export function AutoGrid(props) {
  const { minItemWidth = 220, ...rest } = props ?? {};
  return (
    <AppGrid
      columns='auto-fit'
      auto
      minItemWidth={minItemWidth}
      {...rest}
    />
  );
}

AppGrid.Item = AppGridItem;
AppGrid.Simple = SimpleGrid;
AppGrid.Auto = AutoGrid;
AppGrid.useBreakpoint = useAppBreakpoint;
AppGrid.Row = AppRow;
AppGrid.Col = AppCol;

export default AppGrid;
