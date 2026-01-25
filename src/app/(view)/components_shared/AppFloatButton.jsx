'use client';

import React from 'react';
import { App as AntdApp, FloatButton, theme } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isThenable(value) {
  return value != null && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
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

function normalizeConfirm(confirm) {
  if (!confirm) return null;

  if (typeof confirm === 'string' || React.isValidElement(confirm)) {
    return {
      title: confirm,
      content: undefined,
      okText: 'Ya',
      cancelText: 'Batal',
    };
  }

  if (typeof confirm === 'object') {
    return {
      title: confirm.title ?? 'Yakin?',
      content: confirm.content ?? confirm.description,
      okText: confirm.okText ?? 'Ya',
      cancelText: confirm.cancelText ?? 'Batal',
      okType: confirm.okType,
      centered: confirm.centered,
      maskClosable: confirm.maskClosable,
      width: confirm.width,
      icon: confirm.icon,
      danger: confirm.danger,
    };
  }

  return null;
}

function resolvePositionStyle(position, offset) {
  if (!position) return null;

  const pos = String(position).toLowerCase();

  const off = (() => {
    if (typeof offset === 'number') return { x: offset, y: offset };
    if (offset && typeof offset === 'object') return { x: offset.x ?? 24, y: offset.y ?? 24 };
    return { x: 24, y: 24 };
  })();

  const x = off.x;
  const y = off.y;

  switch (pos) {
    case 'br':
    case 'bottomright':
    case 'bottom-right':
      return { insetInlineEnd: x, insetBlockEnd: y };
    case 'bl':
    case 'bottomleft':
    case 'bottom-left':
      return { insetInlineStart: x, insetBlockEnd: y };
    case 'tr':
    case 'topright':
    case 'top-right':
      return { insetInlineEnd: x, insetBlockStart: y };
    case 'tl':
    case 'topleft':
    case 'top-left':
      return { insetInlineStart: x, insetBlockStart: y };
    default:
      return null;
  }
}

function pickTonePalette(tone, token) {
  const t = String(tone ?? '').toLowerCase();

  const map = {
    success: { solid: token?.colorSuccess, outline: token?.colorSuccess },
    warning: { solid: token?.colorWarning, outline: token?.colorWarning },
    info: { solid: token?.colorInfo, outline: token?.colorInfo },
    danger: { solid: token?.colorError, outline: token?.colorError },
    error: { solid: token?.colorError, outline: token?.colorError },
  };

  return map[t] ?? null;
}

function buildToneSemanticStyles({ tone, type, disabled, token }) {
  if (!tone || disabled) return null;

  const pal = pickTonePalette(tone, token);
  if (!pal) return null;

  const isPrimary = (type ?? 'default') === 'primary';
  const root = {};
  const icon = {};
  const content = {};

  if (isPrimary) {
    root.backgroundColor = pal.solid;
    root.borderColor = pal.solid;
    icon.color = token?.colorTextLightSolid;
    content.color = token?.colorTextLightSolid;
  } else {
    root.borderColor = pal.outline;
    icon.color = pal.outline;
    content.color = pal.outline;
  }

  return { root, icon, content };
}

function mergeSemanticStyles(base, override) {
  const a = base ?? {};
  const b = override ?? {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = {};
  for (const k of keys) {
    const va = a[k] ?? {};
    const vb = b[k] ?? {};
    out[k] = { ...va, ...vb };
  }
  return out;
}

function buildStylesProp(computed, userStyles) {
  if (typeof userStyles === 'function') {
    return (info) => mergeSemanticStyles(computed, userStyles(info));
  }
  return mergeSemanticStyles(computed, userStyles);
}

function buildClassNamesProp(userClassNames) {
  if (typeof userClassNames === 'function') return userClassNames;
  return userClassNames;
}

async function runWithFeedback({ message, promise, feedback, key }) {
  const cfg = feedback === true ? {} : feedback;
  const loadingMsg = typeof cfg === 'object' ? cfg.loading : undefined;
  const successMsg = typeof cfg === 'object' ? cfg.success : undefined;
  const errorMsg = typeof cfg === 'object' ? cfg.error : undefined;

  let msgKey = key;
  if (loadingMsg) {
    msgKey = msgKey ?? `appfb_${Date.now()}`;
    message.open({ type: 'loading', content: loadingMsg, key: msgKey });
  }

  try {
    const res = await promise;
    if (loadingMsg && msgKey) {
      if (successMsg) message.open({ type: 'success', content: successMsg, key: msgKey });
      else message.destroy(msgKey);
    } else if (successMsg) {
      message.success(successMsg);
    }
    return res;
  } catch (err) {
    if (loadingMsg && msgKey) message.destroy(msgKey);
    if (errorMsg) message.error(errorMsg);
    throw err;
  }
}

export function AppFloatButton({
  onPress,
  onClick,

  tooltip,
  disabledReason,

  confirm, // string | { title, description/content, okText, cancelText, danger, ... }
  confirmTitle,

  feedback, // boolean | { loading, success, error }
  autoLoading = true,
  throttleMs = 0,

  loading,
  loadingIcon,
  icon,

  disabled,
  tone, // success|warning|info|danger
  type = 'default', // default|primary

  position, // br|bl|tr|tl|bottomRight|...
  offset = 24,

  content,
  children,

  style,
  styles,
  classNames,

  onSuccess,
  onError,

  href,
  target,

  ...rest
}) {
  const { token } = theme.useToken();
  const { message, modal } = AntdApp.useApp();

  const [innerLoading, setInnerLoading] = React.useState(false);
  const lastFireAtRef = React.useRef(0);

  const isLoading = Boolean(loading ?? innerLoading);
  const isDisabled = Boolean(disabled);

  const tooltipCfg = normalizeTooltip(tooltip, isDisabled, disabledReason);
  const confirmCfg = normalizeConfirm(confirm ?? confirmTitle);

  const finalIcon = isLoading ? (loadingIcon ?? <LoadingOutlined />) : icon;
  const finalContent = content ?? (children != null ? children : undefined);

  const posStyle = resolvePositionStyle(position, offset);
  const mergedStyle = {
    ...(posStyle ?? null),
    ...(style ?? null),
  };

  const toneStyles = buildToneSemanticStyles({ tone, type, disabled: isDisabled, token });

  const computedSemanticStyles = {
    root: {
      ...(isDisabled ? { opacity: 0.55, cursor: 'not-allowed' } : null),
      ...(isLoading ? { cursor: 'progress' } : null),
    },
    icon: {},
    content: { fontFamily: DEFAULT_FONT_FAMILY },
  };

  const mergedSemanticStyles = mergeSemanticStyles(computedSemanticStyles, toneStyles);
  const finalStyles = buildStylesProp(mergedSemanticStyles, styles);

  const finalHref = isDisabled || isLoading ? undefined : href;

  const execute = React.useCallback(
    async (evt) => {
      if (isDisabled || isLoading) return undefined;

      const now = Date.now();
      if (throttleMs > 0 && now - lastFireAtRef.current < throttleMs) return undefined;
      lastFireAtRef.current = now;

      const handler = onPress ?? onClick;
      if (!handler) return undefined;

      try {
        const result = handler(evt);

        if (autoLoading && isThenable(result)) {
          setInnerLoading(true);
          const resolved = await runWithFeedback({
            message,
            promise: result,
            feedback,
            key: `appfb_${now}`,
          });
          if (typeof onSuccess === 'function') onSuccess(resolved);
          return resolved;
        }

        if (typeof onSuccess === 'function') onSuccess(result);
        return result;
      } catch (err) {
        if (typeof onError === 'function') onError(err);
        const cfg = feedback === true ? {} : feedback;
        const errorMsg = typeof cfg === 'object' ? cfg.error : undefined;
        if (errorMsg) message.error(errorMsg);
        return undefined;
      } finally {
        setInnerLoading(false);
      }
    },
    [isDisabled, isLoading, throttleMs, onPress, onClick, autoLoading, message, feedback, onSuccess, onError],
  );

  const handleClick = (evt) => {
    if (isDisabled || isLoading) return;

    if (confirmCfg) {
      modal.confirm({
        title: confirmCfg.title,
        content: confirmCfg.content,
        okText: confirmCfg.okText,
        cancelText: confirmCfg.cancelText,
        okType: confirmCfg.okType ?? (confirmCfg.danger || tone === 'danger' || tone === 'error' ? 'danger' : 'primary'),
        centered: confirmCfg.centered,
        maskClosable: confirmCfg.maskClosable,
        width: confirmCfg.width,
        icon: confirmCfg.icon,
        onOk: () => {
          const p = execute(evt);
          return isThenable(p) ? p : undefined;
        },
      });
      return;
    }

    const res = execute(evt);
    return res;
  };

  return (
    <FloatButton
      type={type}
      icon={finalIcon}
      content={finalContent}
      tooltip={tooltipCfg?.title ? tooltipCfg : undefined}
      style={mergedStyle}
      styles={finalStyles}
      classNames={buildClassNamesProp(classNames)}
      onClick={handleClick}
      href={finalHref}
      target={target}
      aria-disabled={isDisabled}
      {...rest}
    />
  );
}

function FloatGroupItem({ item }) {
  const { key: itemKey, tooltip, disabledReason, confirm, feedback, throttleMs, autoLoading, onPress, onClick, onSuccess, onError, tone, type, ...rest } = item ?? {};

  return (
    <AppFloatButton
      key={itemKey}
      tooltip={tooltip}
      disabledReason={disabledReason}
      confirm={confirm}
      feedback={feedback}
      throttleMs={throttleMs}
      autoLoading={autoLoading}
      onPress={onPress}
      onClick={onClick}
      onSuccess={onSuccess}
      onError={onError}
      tone={tone}
      type={type}
      {...rest}
    />
  );
}

export function AppFloatButtonGroup({
  items, // [{ key, icon, tooltip, onPress, confirm, ... }]
  rememberOpenKey,

  open,
  defaultOpen,
  onOpenChange,
  trigger = 'click',

  style,
  ...rest
}) {
  const [innerOpen, setInnerOpen] = React.useState(Boolean(defaultOpen));

  React.useEffect(() => {
    if (!rememberOpenKey) return;

    try {
      const stored = window.localStorage.getItem(rememberOpenKey);
      if (stored === '1') setInnerOpen(true);
      if (stored === '0') setInnerOpen(false);
    } catch {
      // ignore
    }
  }, [rememberOpenKey]);

  const mergedOpen = open ?? innerOpen;

  const handleOpenChange = (next) => {
    if (open == null) setInnerOpen(next);
    if (typeof onOpenChange === 'function') onOpenChange(next);

    if (rememberOpenKey) {
      try {
        window.localStorage.setItem(rememberOpenKey, next ? '1' : '0');
      } catch {
        // ignore
      }
    }
  };

  return (
    <FloatButton.Group
      open={mergedOpen}
      trigger={trigger}
      onOpenChange={handleOpenChange}
      style={style}
      {...rest}
    >
      {Array.isArray(items)
        ? items.map((it, index) => (
            <FloatGroupItem
              key={it?.key ?? it?.tooltip ?? index}
              item={it}
            />
          ))
        : null}
    </FloatButton.Group>
  );
}

export function AppFloatBackTop(props) {
  return <FloatButton.BackTop {...props} />;
}

export default AppFloatButton;
