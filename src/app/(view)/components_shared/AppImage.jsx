'use client';

import React from 'react';
import { Image, Tooltip, theme } from 'antd';
import { PictureOutlined } from '@ant-design/icons';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function normalizeTooltip(tooltip, disabled, disabledReason, autoTitle) {
  if (disabled && disabledReason) return { title: disabledReason };
  if (tooltip == null) {
    if (autoTitle) return { title: autoTitle };
    return null;
  }
  if (typeof tooltip === 'string' || React.isValidElement(tooltip)) return { title: tooltip };
  if (typeof tooltip === 'object') {
    const { title, ...rest } = tooltip;
    return { title, ...rest };
  }
  return null;
}

function withTooltipWrapper(node, tooltipCfg) {
  if (!tooltipCfg?.title) return node;
  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: 'inline-block', width: '100%' }}>{node}</span>
    </Tooltip>
  );
}

function toSources(src, fallbackSrc) {
  const list = [];
  const push = (v) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach(push);
    else list.push(String(v));
  };
  push(src);
  push(fallbackSrc);
  return list.filter(Boolean);
}

function parseRatio(ratio) {
  if (ratio == null) return null;
  if (isNumber(ratio) && ratio > 0) return ratio;

  const s = String(ratio).trim();
  // support: "16/9", "4:3", "1.777"
  if (s.includes('/')) {
    const [a, b] = s.split('/').map((x) => Number(String(x).trim()));
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) return a / b;
    return null;
  }
  if (s.includes(':')) {
    const [a, b] = s.split(':').map((x) => Number(String(x).trim()));
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) return a / b;
    return null;
  }

  const n = Number(s);
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}

function normalizeRadius(radius) {
  if (radius == null) return undefined;
  if (isNumber(radius)) return radius;
  const s = String(radius).toLowerCase();
  if (s === 'none') return 0;
  if (s === 'sm') return 8;
  if (s === 'md') return 12;
  if (s === 'lg') return 16;
  if (s === 'xl') return 20;
  if (s === 'full') return 999;
  return radius;
}

function normalizeFit(fit) {
  if (!fit) return undefined;
  const f = String(fit).toLowerCase();
  if (f === 'cover' || f === 'contain' || f === 'fill' || f === 'none' || f === 'scale-down') return f;
  return undefined;
}

function defaultPlaceholderNode({ token, radius, height }) {
  return (
    <div
      style={{
        width: '100%',
        height: height ?? '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius,
        background: token?.colorFillAlter ?? 'rgba(0,0,0,0.04)',
        color: token?.colorTextTertiary ?? 'rgba(0,0,0,0.35)',
        fontFamily: DEFAULT_FONT_FAMILY,
      }}
    >
      <PictureOutlined />
    </div>
  );
}

function normalizePreview(preview, { disabled, previewSrc, previewTitle, previewMask }) {
  if (disabled) return false;
  if (preview === false) return false;

  if (preview === true || preview == null) {
    if (previewSrc || previewTitle || previewMask) {
      return {
        src: previewSrc,
        ...(previewTitle != null ? { title: previewTitle } : null),
        ...(previewMask != null ? { mask: previewMask } : null),
      };
    }
    return true;
  }

  if (typeof preview === 'object') {
    return {
      ...(previewSrc ? { src: previewSrc } : null),
      ...(previewTitle != null ? { title: previewTitle } : null),
      ...(previewMask != null ? { mask: previewMask } : null),
      ...preview,
    };
  }

  return preview;
}

export const AppImage = React.forwardRef(function AppImage(
  {
    src,
    fallbackSrc,

    alt,
    title, // optional tooltip title / preview title override
    tooltip,
    disabledReason,

    width,
    height,
    block = true, // width:100%
    responsive = true, // height auto (kalau tidak pakai ratio)
    ratio, // "16/9" | 1.777
    fit = 'cover', // object-fit
    radius = 'md',
    bordered = false,
    borderColor,
    ring = false,
    ringWidth = 2,
    ringColor,

    placeholder, // true|node
    loading = 'lazy',

    preview = true,
    previewSrc,
    previewTitle,
    previewMask,

    clickable = false,
    onPress,
    onClick,
    href,
    target,

    disabled = false,

    wrapperClassName,
    wrapperStyle,
    className,
    style,
    imgstyle,

    onLoad,
    onError,

    ...rest
  },
  ref,
) {
  const { token } = theme.useToken();

  const sources = React.useMemo(() => toSources(src, fallbackSrc), [src, fallbackSrc]);
  const sourcesKey = React.useMemo(() => JSON.stringify(sources), [sources]);

  const [srcIndex, setSrcIndex] = React.useState(0);
  const [exhausted, setExhausted] = React.useState(false);

  React.useEffect(() => {
    setSrcIndex(0);
    setExhausted(false);
  }, [sourcesKey]);

  const currentSrc = !exhausted && sources.length > 0 ? sources[Math.max(0, Math.min(srcIndex, sources.length - 1))] : undefined;

  const computedRadius = normalizeRadius(radius);
  const computedFit = normalizeFit(fit);
  const computedRatio = parseRatio(ratio);

  const isDisabled = Boolean(disabled);
  const isClickable = Boolean((clickable || onPress || onClick || href) && !isDisabled);

  const tooltipCfg = normalizeTooltip(tooltip, isDisabled, disabledReason, tooltip === undefined ? (title ?? alt) : null);

  const finalPreview = normalizePreview(preview, {
    disabled: isDisabled,
    previewSrc,
    previewTitle: previewTitle ?? title,
    previewMask,
  });

  const ringClr = ringColor ?? token?.colorBgContainer ?? '#fff';
  const ringW = isNumber(ringWidth) ? ringWidth : 2;

  const finalBorderColor = borderColor ?? token?.colorSplit;

  const containerStyle = {
    fontFamily: DEFAULT_FONT_FAMILY,
    width: block ? '100%' : undefined,
    ...(width != null ? { width } : null),
    ...(height != null ? { height } : null),
    ...(computedRatio ? { aspectRatio: String(computedRatio) } : null),
    ...(computedRadius != null ? { borderRadius: computedRadius, overflow: 'hidden' } : null),
    ...(bordered ? { border: `1px solid ${finalBorderColor}` } : null),
    ...(ring ? { boxShadow: `0 0 0 ${ringW}px ${ringClr}` } : null),
    ...(isClickable ? { cursor: 'pointer', userSelect: 'none' } : null),
    ...(isDisabled ? { opacity: 0.55, cursor: 'not-allowed' } : null),
    ...(wrapperStyle ?? null),
  };

  const effectivePlaceholder = placeholder === true ? defaultPlaceholderNode({ token, radius: computedRadius, height: computedRatio ? '100%' : height }) : (placeholder ?? undefined);

  const finalimgstyle = {
    ...(computedFit ? { objectFit: computedFit } : null),
    ...(computedRadius != null ? { borderRadius: computedRadius } : null),
    ...(responsive && !computedRatio && height == null ? { height: 'auto' } : null),
    ...(imgstyle ?? null),
  };

  const advanceSrc = () => {
    if (sources.length > 0 && srcIndex < sources.length - 1) {
      setSrcIndex((i) => i + 1);
      return;
    }
    setExhausted(true);
  };

  const imageNode = currentSrc ? (
    <Image
      ref={ref}
      src={currentSrc}
      alt={alt}
      width={computedRatio ? '100%' : width}
      height={computedRatio ? '100%' : height}
      placeholder={effectivePlaceholder}
      preview={finalPreview}
      loading={loading}
      className={className}
      style={{
        width: computedRatio ? '100%' : block ? '100%' : undefined,
        ...(style ?? null),
      }}
      imgstyle={finalimgstyle}
      onClick={(e) => {
        if (!isClickable) return;
        if (typeof onClick === 'function') onClick(e);
        if (typeof onPress === 'function') onPress(e);
      }}
      onLoad={onLoad}
      onError={(e) => {
        if (typeof onError === 'function') onError(e);
        advanceSrc();
      }}
      {...rest}
    />
  ) : (
    // no src left => fallback visual
    defaultPlaceholderNode({ token, radius: computedRadius, height: computedRatio ? '100%' : height })
  );

  const wrapped = (
    <span
      className={wrapperClassName}
      style={containerStyle}
    >
      {imageNode}
    </span>
  );

  if (href) {
    return withTooltipWrapper(
      <a
        href={isDisabled ? undefined : href}
        target={target}
        rel={target === '_blank' ? 'noreferrer noopener' : undefined}
        style={{ display: block ? 'block' : 'inline-block', textDecoration: 'none', color: 'inherit' }}
        aria-disabled={isDisabled}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (typeof onClick === 'function') onClick(e);
          if (typeof onPress === 'function') onPress(e);
        }}
      >
        {wrapped}
      </a>,
      tooltipCfg,
    );
  }

  return withTooltipWrapper(wrapped, tooltipCfg);
});

export function AppImageGroup({
  children,
  items, // optional: [{ src, alt, ...props }]
  renderItem,
  preview = true,
  ...rest
}) {
  const content = (() => {
    if (Array.isArray(items)) {
      const render = typeof renderItem === 'function' ? renderItem : (it) => <AppImage {...it} />;
      return items.map((it, idx) => <React.Fragment key={String(it?.key ?? it?.id ?? it?.src ?? idx)}>{render(it, idx)}</React.Fragment>);
    }
    return children;
  })();

  return (
    <Image.PreviewGroup
      preview={preview}
      {...rest}
    >
      {content}
    </Image.PreviewGroup>
  );
}

export function AppImageThumb(props) {
  return (
    <AppImage
      ratio='1/1'
      fit='cover'
      radius='md'
      bordered
      {...props}
    />
  );
}

AppImage.Group = AppImageGroup;
AppImage.Thumb = AppImageThumb;

export default AppImage;
