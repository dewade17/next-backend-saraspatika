'use client';

import React from 'react';
import { Avatar, Badge, Tooltip, theme } from 'antd';
import { UserOutlined } from '@ant-design/icons';

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
      <span style={{ display: 'inline-flex', width: 'fit-content' }}>{node}</span>
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

function hashToHue(str) {
  const s = String(str ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function pickInitials(name, max = 2) {
  const n = String(name ?? '').trim();
  if (!n) return '';
  const parts = n.split(/\s+/).filter(Boolean);

  const initials = [];
  for (const p of parts) {
    const ch = p[0];
    if (ch) initials.push(ch.toUpperCase());
    if (initials.length >= max) break;
  }

  if (initials.length === 0) return '';
  return initials.join('');
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function normalizeSize(size) {
  if (size == null) return undefined;
  if (size === 'small' || size === 'default' || size === 'large') return size;
  if (isNumber(size)) return size;

  const s = String(size).toLowerCase();
  switch (s) {
    case 'xs':
      return 24;
    case 'sm':
      return 28;
    case 'md':
      return 32;
    case 'lg':
      return 40;
    case 'xl':
      return 48;
    case '2xl':
      return 64;
    default:
      return size;
  }
}

function statusToBadge({ status, token, badgeColor }) {
  if (!status && !badgeColor) return null;

  const s = String(status ?? '').toLowerCase();

  const color =
    badgeColor ??
    (s === 'online' || s === 'success'
      ? token?.colorSuccess
      : s === 'away' || s === 'warning'
        ? token?.colorWarning
        : s === 'busy' || s === 'error' || s === 'danger'
          ? token?.colorError
          : s === 'processing' || s === 'loading'
            ? token?.colorInfo
            : token?.colorTextTertiary);

  return { dot: true, color };
}

export const AppAvatar = React.forwardRef(function AppAvatar(
  {
    src,
    fallbackSrc,

    name,
    initials,
    showInitials = true,
    maxInitials = 2,

    autoColor = true,
    colorSeed, // default: name || initials
    bgColor, // override
    textColor, // override
    gradient = false, // background gradient kalau autoColor

    icon,
    children,

    size = 'md',
    shape = 'circle', // circle|square
    alt,

    tooltip,
    disabledReason,

    status, // online|offline|busy|away|processing
    badge, // Badge props override
    badgeColor,
    badgeOffset, // [x,y]

    ring = false, // true => ring 2px
    ringWidth = 2,
    ringColor,

    clickable = false,
    onPress,
    onClick,

    href,
    target,

    disabled = false,
    className,
    style,

    ...rest
  },
  ref,
) {
  const { token } = theme.useToken();

  const computedSize = normalizeSize(size);

  const sources = React.useMemo(() => toSources(src, fallbackSrc), [src, fallbackSrc]);
  const sourcesKey = React.useMemo(() => JSON.stringify(sources), [sources]);

  const [srcIndex, setSrcIndex] = React.useState(0);
  const [exhausted, setExhausted] = React.useState(false);

  React.useEffect(() => {
    setSrcIndex(0);
    setExhausted(false);
  }, [sourcesKey]);

  const currentSrc = !exhausted && sources.length > 0 ? sources[clamp(srcIndex, 0, sources.length - 1)] : undefined;

  const handleImgError = () => {
    if (sources.length > 0 && srcIndex < sources.length - 1) {
      setSrcIndex((i) => i + 1);
      return;
    }
    setExhausted(true);
  };

  const computedInitials = initials ?? (showInitials ? pickInitials(name, maxInitials) : '');

  const seed = colorSeed ?? name ?? computedInitials ?? '';
  const hue = hashToHue(seed);
  const autoBg = autoColor ? (gradient ? `linear-gradient(135deg, hsl(${hue} 70% 46%), hsl(${(hue + 35) % 360} 70% 46%))` : `hsl(${hue} 65% 45%)`) : undefined;

  const finalBg = bgColor ?? autoBg;
  const finalText = textColor ?? token?.colorTextLightSolid;

  const shouldShowTextFallback = !currentSrc && (computedInitials || children);

  const content = (() => {
    if (children != null) return children;
    if (shouldShowTextFallback && computedInitials) return computedInitials;
    if (shouldShowTextFallback && !computedInitials) return <UserOutlined />;
    return null;
  })();

  const isDisabled = Boolean(disabled);
  const effectiveClickable = Boolean((clickable || onPress || onClick || href) && !isDisabled);

  const tooltipCfg = normalizeTooltip(tooltip, isDisabled, disabledReason, tooltip === undefined ? name : null);

  const ringClr = ringColor ?? token?.colorBgContainer ?? '#fff';
  const ringW = isNumber(ringWidth) ? ringWidth : 2;

  const baseStyle = {
    fontFamily: DEFAULT_FONT_FAMILY,
    ...(finalBg ? { background: finalBg } : null),
    ...(finalText ? { color: finalText } : null),
    ...(ring
      ? {
          boxShadow: `0 0 0 ${ringW}px ${ringClr}`,
        }
      : null),
    ...(effectiveClickable ? { cursor: 'pointer', userSelect: 'none' } : null),
    ...(isDisabled ? { opacity: 0.55, cursor: 'not-allowed' } : null),
    ...(style ?? null),
  };

  const avatarNode = (
    <Avatar
      ref={ref}
      src={currentSrc}
      alt={alt ?? name}
      size={computedSize}
      shape={shape}
      icon={icon ?? (!shouldShowTextFallback ? <UserOutlined /> : undefined)}
      className={className}
      style={baseStyle}
      onClick={
        effectiveClickable
          ? (e) => {
              if (typeof onClick === 'function') onClick(e);
              if (typeof onPress === 'function') onPress(e);
            }
          : undefined
      }
      onError={() => {
        handleImgError();
      }}
      {...rest}
    >
      {content}
    </Avatar>
  );

  const wrappedForA11y = (() => {
    if (!effectiveClickable) return avatarNode;

    const onKeyDown = (e) => {
      if (isDisabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (typeof onClick === 'function') onClick(e);
        if (typeof onPress === 'function') onPress(e);
      }
    };

    const inner = (
      <span
        role='button'
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ display: 'inline-flex', borderRadius: shape === 'square' ? 8 : 999 }}
      >
        {avatarNode}
      </span>
    );

    if (href) {
      return (
        <a
          href={href}
          target={target}
          rel={target === '_blank' ? 'noreferrer noopener' : undefined}
          style={{ display: 'inline-flex' }}
          aria-disabled={isDisabled}
          onClick={(e) => {
            if (isDisabled) {
              e.preventDefault();
              return;
            }
            if (typeof onClick === 'function') onClick(e);
            if (typeof onPress === 'function') onPress(e);
          }}
        >
          {inner}
        </a>
      );
    }

    return inner;
  })();

  const badgeAuto = statusToBadge({ status, token, badgeColor });
  const badgeProps = {
    ...(badgeAuto ?? null),
    ...(Array.isArray(badgeOffset) ? { offset: badgeOffset } : null),
    ...(badge ?? null),
  };

  const withBadge = badgeProps?.dot || badgeProps?.count != null || badgeProps?.status ? <Badge {...badgeProps}>{wrappedForA11y}</Badge> : wrappedForA11y;

  return withTooltipWrapper(withBadge, tooltipCfg);
});

export function AppAvatarGroup({
  users, // [{ key, src, name, ... }]
  maxCount,
  maxPopoverTrigger = 'hover',
  size = 'md',
  shape = 'circle',
  gap = 8,
  renderItem,
  className,
  style,
  ...rest
}) {
  const computedSize = normalizeSize(size);

  const content = Array.isArray(users)
    ? users.map((u, idx) => {
        const key = u?.key ?? u?.id ?? `${u?.name ?? 'user'}_${idx}`;
        if (typeof renderItem === 'function') return <React.Fragment key={String(key)}>{renderItem(u, idx)}</React.Fragment>;
        return (
          <AppAvatar
            key={String(key)}
            src={u?.src}
            fallbackSrc={u?.fallbackSrc}
            name={u?.name}
            initials={u?.initials}
            status={u?.status}
            tooltip={u?.tooltip}
            ring={u?.ring}
            shape={u?.shape ?? shape}
            size={u?.size ?? computedSize}
            {...(u?.props ?? null)}
          />
        );
      })
    : null;

  return (
    <Avatar.Group
      maxCount={maxCount}
      maxPopoverTrigger={maxPopoverTrigger}
      size={computedSize}
      shape={shape}
      className={className}
      style={{ display: 'inline-flex', gap, ...(style ?? null) }}
      {...rest}
    >
      {content}
    </Avatar.Group>
  );
}

export function AppUserAvatar(props) {
  return (
    <AppAvatar
      size='md'
      ring
      {...props}
    />
  );
}

AppAvatar.Group = AppAvatarGroup;
AppAvatar.User = AppUserAvatar;

export default AppAvatar;
