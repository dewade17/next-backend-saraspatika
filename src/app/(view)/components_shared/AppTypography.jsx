'use client';

import React from 'react';
import { Typography, theme } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function resolveWeight(weight) {
  if (typeof weight === 'number') return weight;
  switch (weight) {
    case 'thin':
      return 300;
    case 'regular':
      return 400;
    case 'medium':
      return 500;
    case 'semibold':
      return 600;
    case 'bold':
      return 700;
    default:
      return undefined;
  }
}

function resolveToneColor(tone, token) {
  switch (tone) {
    case 'secondary':
    case 'muted':
      return token?.colorTextSecondary;
    case 'success':
      return token?.colorSuccess;
    case 'warning':
      return token?.colorWarning;
    case 'danger':
    case 'error':
      return token?.colorError;
    case 'info':
      return token?.colorInfo;
    default:
      return undefined;
  }
}

function resolveTextSize(size, token) {
  if (size == null) return undefined;
  if (typeof size === 'number') return size;
  if (typeof size === 'string' && /px|rem|em|%|vh|vw$/.test(size)) return size;

  const base = token?.fontSize ?? 14;
  const sm = token?.fontSizeSM ?? Math.max(12, base - 2);
  const lg = token?.fontSizeLG ?? base + 2;

  switch (size) {
    case 'xs':
      return Math.max(11, sm - 1);
    case 'sm':
      return sm;
    case 'md':
      return base;
    case 'lg':
      return lg;
    case 'xl':
      return lg + 4;
    case '2xl':
      return lg + 8;
    default:
      return undefined;
  }
}

function buildEllipsis({ truncate, lines, tooltip }) {
  if (!truncate && !lines) return undefined;

  const rows = typeof lines === 'number' && lines > 0 ? lines : undefined;

  if (rows) {
    return {
      rows,
      tooltip: tooltip === true ? undefined : tooltip,
    };
  }

  return tooltip ? { tooltip: tooltip === true ? undefined : tooltip } : true;
}

function buildGradientStyle(gradient) {
  if (!gradient) return null;

  if (typeof gradient === 'string') {
    return {
      backgroundImage: gradient,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
    };
  }

  const from = gradient.from ?? '#1677ff';
  const to = gradient.to ?? '#13c2c2';
  const deg = gradient.deg ?? 90;

  return {
    backgroundImage: `linear-gradient(${deg}deg, ${from}, ${to})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
}

function normalizeAs(as) {
  if (!as) return 'text';
  const v = String(as).toLowerCase();
  if (v === 'p') return 'paragraph';
  return v;
}

function resolveTitleLevel(as, level) {
  if (typeof level === 'number') return Math.min(5, Math.max(1, level));
  switch (as) {
    case 'h1':
      return 1;
    case 'h2':
      return 2;
    case 'h3':
      return 3;
    case 'h4':
      return 4;
    case 'h5':
      return 5;
    case 'h6':
      return 5;
    default:
      return undefined;
  }
}

export const T = React.forwardRef(function T(
  { as = 'text', level, tone, weight, size, lines, truncate, tooltip, gradient, fontFamily, align, transform, tracking, leading, italic, underline, strong, mark, disabled, code, copyable, editable, className, style, children, ...rest },
  ref,
) {
  const { token } = theme.useToken();

  const normalizedAs = normalizeAs(as);
  const titleLevel = resolveTitleLevel(normalizedAs, level);

  const toneColor = resolveToneColor(tone, token);
  const fontSize = resolveTextSize(size, token);
  const fontWeight = resolveWeight(weight);
  const ellipsis = buildEllipsis({ truncate, lines, tooltip });
  const gradientStyle = buildGradientStyle(gradient);

  const finalStyle = {
    fontFamily: fontFamily ?? DEFAULT_FONT_FAMILY,
    ...(toneColor ? { color: toneColor } : null),
    ...(fontSize ? { fontSize } : null),
    ...(fontWeight ? { fontWeight } : null),
    ...(align ? { textAlign: align } : null),
    ...(transform ? { textTransform: transform } : null),
    ...(tracking != null ? { letterSpacing: tracking } : null),
    ...(leading != null ? { lineHeight: leading } : null),
    ...(gradientStyle ?? null),
    ...(style ?? null),
  };

  if (normalizedAs === 'title' || normalizedAs.startsWith('h')) {
    const h6Tweak =
      normalizedAs === 'h6'
        ? {
            fontSize: fontSize ?? token?.fontSize ?? 14,
            fontWeight: fontWeight ?? 600,
            marginTop: 0,
          }
        : null;

    return (
      <Typography.Title
        ref={ref}
        level={titleLevel ?? 3}
        italic={italic}
        underline={underline}
        disabled={disabled}
        className={className}
        style={{ ...finalStyle, ...(h6Tweak ?? null) }}
        {...rest}
      >
        {children}
      </Typography.Title>
    );
  }

  if (normalizedAs === 'paragraph') {
    return (
      <Typography.Paragraph
        ref={ref}
        italic={italic}
        underline={underline}
        strong={strong}
        mark={mark}
        disabled={disabled}
        ellipsis={ellipsis}
        editable={editable}
        copyable={copyable}
        className={className}
        style={finalStyle}
        {...rest}
      >
        {children}
      </Typography.Paragraph>
    );
  }

  if (normalizedAs === 'link') {
    return (
      <Typography.Link
        ref={ref}
        italic={italic}
        underline={underline}
        strong={strong}
        disabled={disabled}
        ellipsis={ellipsis}
        className={className}
        style={finalStyle}
        {...rest}
      >
        {children}
      </Typography.Link>
    );
  }

  return (
    <Typography.Text
      ref={ref}
      italic={italic}
      underline={underline}
      strong={strong}
      mark={mark}
      disabled={disabled}
      code={code || normalizedAs === 'code'}
      ellipsis={ellipsis}
      editable={editable}
      copyable={copyable}
      className={className}
      style={finalStyle}
      {...rest}
    >
      {children}
    </Typography.Text>
  );
});

export function H1(props) {
  return (
    <T
      as='h1'
      {...props}
    />
  );
}
export function H2(props) {
  return (
    <T
      as='h2'
      {...props}
    />
  );
}
export function H3(props) {
  return (
    <T
      as='h3'
      {...props}
    />
  );
}
export function H4(props) {
  return (
    <T
      as='h4'
      {...props}
    />
  );
}
export function H5(props) {
  return (
    <T
      as='h5'
      {...props}
    />
  );
}
export function H6(props) {
  return (
    <T
      as='h6'
      {...props}
    />
  );
}

export function P(props) {
  return (
    <T
      as='paragraph'
      {...props}
    />
  );
}

export function Text(props) {
  return (
    <T
      as='text'
      {...props}
    />
  );
}

export function Link(props) {
  return (
    <T
      as='link'
      {...props}
    />
  );
}

export function Code(props) {
  return (
    <T
      as='text'
      code
      {...props}
    />
  );
}

export default T;
