'use client';

import React from 'react';
import { Divider, theme } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function resolveSpacingPx(spacing) {
  if (isNumber(spacing)) return spacing;

  switch (String(spacing ?? '').toLowerCase()) {
    case 'none':
      return 0;
    case 'xs':
      return 8;
    case 'sm':
      return 12;
    case 'md':
      return 16;
    case 'lg':
      return 24;
    case 'xl':
      return 32;
    default:
      return undefined;
  }
}

function resolveInset(inset) {
  if (inset == null) return null;

  if (isNumber(inset)) {
    return { insetInlineStart: inset, insetInlineEnd: inset };
  }

  if (typeof inset === 'object') {
    const start = isNumber(inset.start) ? inset.start : undefined;
    const end = isNumber(inset.end) ? inset.end : undefined;
    if (start == null && end == null) return null;
    return {
      ...(start != null ? { insetInlineStart: start } : null),
      ...(end != null ? { insetInlineEnd: end } : null),
    };
  }

  return null;
}

function pickTone(tone, token) {
  const t = String(tone ?? '').toLowerCase();

  switch (t) {
    case 'muted':
      return {
        line: token?.colorSplit,
        text: token?.colorTextSecondary,
      };
    case 'success':
      return {
        line: token?.colorSuccess,
        text: token?.colorSuccess,
      };
    case 'warning':
      return {
        line: token?.colorWarning,
        text: token?.colorWarning,
      };
    case 'info':
      return {
        line: token?.colorInfo,
        text: token?.colorInfo,
      };
    case 'danger':
    case 'error':
      return {
        line: token?.colorError,
        text: token?.colorError,
      };
    default:
      return null;
  }
}

function LabelContent({ label, description, icon, iconPosition = 'left', labelStyle, descriptionStyle, toneTextColor, size = 'md' }) {
  const s = String(size ?? 'md').toLowerCase();
  const labelFontSize = s === 'sm' ? 12 : s === 'lg' ? 14 : 13;
  const descFontSize = s === 'sm' ? 11 : s === 'lg' ? 12 : 11.5;

  const iconNode = icon ? <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}>{icon}</span> : null;

  const labelNode =
    label != null ? (
      <span
        style={{
          fontFamily: DEFAULT_FONT_FAMILY,
          fontSize: labelFontSize,
          fontWeight: 600,
          color: toneTextColor,
          ...labelStyle,
        }}
      >
        {label}
      </span>
    ) : null;

  const descNode =
    description != null ? (
      <span
        style={{
          fontFamily: DEFAULT_FONT_FAMILY,
          fontSize: descFontSize,
          opacity: 0.85,
          color: toneTextColor,
          ...descriptionStyle,
        }}
      >
        {description}
      </span>
    ) : null;

  const textStack =
    descNode != null ? (
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
        {labelNode}
        {descNode}
      </span>
    ) : (
      labelNode
    );

  if (!iconNode) return textStack;

  const pos = String(iconPosition).toLowerCase();
  if (pos === 'right') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {textStack}
        {iconNode}
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {iconNode}
      {textStack}
    </span>
  );
}

export function AppDivider({
  label,
  description,
  icon,
  iconPosition,

  tone, // success|warning|info|danger|muted
  soft = false,

  type = 'horizontal', // horizontal|vertical
  dashed,
  plain,
  orientation = 'center', // left|right|center
  orientationMargin,

  spacing = 'md', // none|xs|sm|md|lg|xl|number(px)
  inset, // number(px) | {start,end}

  size = 'md', // sm|md|lg (untuk text label)
  labelStyle,
  descriptionStyle,

  className,
  style,

  children,
  ...rest
}) {
  const { token } = theme.useToken();

  const spacingPx = resolveSpacingPx(spacing);
  const insetStyle = resolveInset(inset);
  const palette = pickTone(tone, token);

  const lineColor = palette?.line;
  const textColor = palette?.text ?? token?.colorTextSecondary;

  const mergedStyle = {
    fontFamily: DEFAULT_FONT_FAMILY,
    ...(spacingPx != null ? { marginBlock: spacingPx } : null),
    ...(insetStyle ?? null),
    ...(style ?? null),
  };

  const computedStyle = {
    ...mergedStyle,
    ...(soft ? { opacity: 0.8 } : null),
    ...(lineColor ? { borderColor: lineColor } : null),
  };

  const content =
    children ??
    (type !== 'vertical' && (label != null || description != null || icon != null) ? (
      <LabelContent
        label={label}
        description={description}
        icon={icon}
        iconPosition={iconPosition}
        labelStyle={labelStyle}
        descriptionStyle={descriptionStyle}
        toneTextColor={textColor}
        size={size}
      />
    ) : null);

  return (
    <Divider
      type={type}
      dashed={dashed}
      plain={plain}
      orientation={orientation}
      orientationMargin={orientationMargin}
      className={className}
      style={computedStyle}
      {...rest}
    >
      {content}
    </Divider>
  );
}

export function AppSectionDivider(props) {
  return (
    <AppDivider
      orientation='left'
      plain
      spacing='lg'
      size='lg'
      {...props}
    />
  );
}

export function AppMutedDivider(props) {
  return (
    <AppDivider
      tone='muted'
      soft
      {...props}
    />
  );
}

export default AppDivider;
