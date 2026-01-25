'use client';

import React from 'react';
import { App as AntdApp, Button, Popconfirm, Tooltip, theme } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isThenable(value) {
  return value != null && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}

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

  if (typeof tooltip === 'string') return { title: tooltip };
  if (typeof tooltip === 'object') {
    const { title, ...rest } = tooltip;
    return { title, ...rest };
  }

  return null;
}

function normalizeConfirm(confirm) {
  if (!confirm) return null;

  if (typeof confirm === 'string') {
    return {
      title: confirm,
      okText: 'Ya',
      cancelText: 'Batal',
    };
  }

  if (typeof confirm === 'object') {
    return {
      title: confirm.title ?? 'Yakin?',
      description: confirm.description,
      okText: confirm.okText ?? 'Ya',
      cancelText: confirm.cancelText ?? 'Batal',
      placement: confirm.placement,
      okButtonProps: confirm.okButtonProps,
      cancelButtonProps: confirm.cancelButtonProps,
    };
  }

  return null;
}

function buildToneStyle({ tone, antdType, danger, disabled, token }) {
  if (!tone || disabled) return null;

  const t = String(tone).toLowerCase();
  if (t === 'danger' || t === 'error' || danger) return null; // gunakan prop danger bawaan antd

  const isSolid = antdType === 'primary';
  const isDefault = antdType === 'default' || antdType == null;

  const palette = {
    success: {
      solidBg: token?.colorSuccess,
      solidBorder: token?.colorSuccess,
      solidText: token?.colorTextLightSolid,
      outlineBorder: token?.colorSuccess,
      outlineText: token?.colorSuccess,
    },
    warning: {
      solidBg: token?.colorWarning,
      solidBorder: token?.colorWarning,
      solidText: token?.colorTextLightSolid,
      outlineBorder: token?.colorWarning,
      outlineText: token?.colorWarning,
    },
    info: {
      solidBg: token?.colorInfo,
      solidBorder: token?.colorInfo,
      solidText: token?.colorTextLightSolid,
      outlineBorder: token?.colorInfo,
      outlineText: token?.colorInfo,
    },
  }[t];

  if (!palette) return null;

  if (isSolid) {
    return {
      backgroundColor: palette.solidBg,
      borderColor: palette.solidBorder,
      color: palette.solidText,
    };
  }

  if (isDefault) {
    return {
      borderColor: palette.outlineBorder,
      color: palette.outlineText,
    };
  }

  return null;
}

export const AppButton = React.forwardRef(function AppButton(
  {
    children,
    onPress,
    onClick,

    variant, // alias untuk antd "type"
    type, // antd: 'primary' | 'default' | 'dashed' | 'link' | 'text'
    size, // 'xs|sm|md|lg|xl' atau 'small|middle|large'
    htmlType,

    tone, // 'success|warning|info|danger'
    danger,
    ghost,

    icon,
    iconRight,
    loading,
    loadingText,

    fullWidth,
    className,
    style,

    tooltip,
    disabledReason,
    confirm,

    throttleMs = 0,
    preventDefault = false,
    stopPropagation = false,

    autoLoading = true,
    feedback, // { loading?: string, success?: string, error?: string } atau boolean
    onSuccess,
    onError,

    ...rest
  },
  ref,
) {
  const { token } = theme.useToken();
  const { message } = AntdApp.useApp();

  const [innerLoading, setInnerLoading] = React.useState(false);
  const lastFireAtRef = React.useRef(0);

  const antdType = type ?? variant ?? 'default';
  const antdSize = resolveAntdSize(size);
  const isLoading = loading ?? innerLoading;

  const disabled = Boolean(rest.disabled);
  const tooltipCfg = normalizeTooltip(tooltip, disabled, disabledReason);
  const confirmCfg = normalizeConfirm(confirm);

  const toneStyle = buildToneStyle({
    tone,
    antdType,
    danger,
    disabled,
    token,
  });

  const finalStyle = {
    fontFamily: DEFAULT_FONT_FAMILY,
    ...(toneStyle ?? null),
    ...(style ?? null),
  };

  const renderContent = () => {
    if (isLoading && loadingText) return loadingText;

    // Jika ada iconRight, kita layout manual (tanpa merusak antd)
    if (iconRight) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{children}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconRight}</span>
        </span>
      );
    }

    return children;
  };

  const runAction = async (evt) => {
    if (disabled || isLoading) return;
    const now = Date.now();
    if (throttleMs > 0 && now - lastFireAtRef.current < throttleMs) return;
    lastFireAtRef.current = now;

    if (evt) {
      if (preventDefault && typeof evt.preventDefault === 'function') evt.preventDefault();
      if (stopPropagation && typeof evt.stopPropagation === 'function') evt.stopPropagation();
    }

    const handler = onPress ?? onClick;
    if (!handler) return;

    let result;
    try {
      result = handler(evt);

      if (autoLoading && isThenable(result)) {
        setInnerLoading(true);

        const cfg = feedback === true ? {} : feedback;
        const loadingMsg = typeof cfg === 'object' ? cfg.loading : undefined;

        let msgKey;
        if (loadingMsg) {
          msgKey = `appbtn_${now}`;
          message.open({ type: 'loading', content: loadingMsg, key: msgKey });
        }

        const resolved = await result;

        if (loadingMsg && msgKey) {
          const successMsg = typeof cfg === 'object' ? cfg.success : undefined;
          if (successMsg) {
            message.open({ type: 'success', content: successMsg, key: msgKey });
          } else {
            message.destroy(msgKey);
          }
        } else {
          const successMsg = typeof cfg === 'object' ? cfg.success : undefined;
          if (successMsg) message.success(successMsg);
        }

        if (typeof onSuccess === 'function') onSuccess(resolved);
        return resolved;
      }

      if (typeof onSuccess === 'function') onSuccess(result);
      return result;
    } catch (err) {
      const cfg = feedback === true ? {} : feedback;
      const errorMsg = typeof cfg === 'object' ? cfg.error : undefined;
      if (errorMsg) message.error(errorMsg);
      if (typeof onError === 'function') onError(err);
      return undefined;
    } finally {
      setInnerLoading(false);
    }
  };

  const buttonNode = (
    <Button
      ref={ref}
      type={antdType}
      size={antdSize}
      htmlType={htmlType}
      danger={danger || tone === 'danger' || tone === 'error'}
      ghost={ghost}
      block={fullWidth}
      icon={icon}
      loading={isLoading}
      className={className}
      style={finalStyle}
      onClick={confirmCfg ? undefined : runAction}
      aria-label={rest['aria-label']}
      {...rest}
    >
      {renderContent()}
    </Button>
  );

  // Popconfirm tidak bekerja “natural” pada disabled element; jadi skip saat disabled
  const withConfirm =
    confirmCfg && !disabled ? (
      <Popconfirm
        title={confirmCfg.title}
        description={confirmCfg.description}
        okText={confirmCfg.okText}
        cancelText={confirmCfg.cancelText}
        placement={confirmCfg.placement}
        okButtonProps={confirmCfg.okButtonProps}
        cancelButtonProps={confirmCfg.cancelButtonProps}
        onConfirm={() => runAction()}
      >
        <span style={{ display: 'inline-block' }}>{buttonNode}</span>
      </Popconfirm>
    ) : (
      buttonNode
    );

  if (!tooltipCfg?.title) return withConfirm;

  // Tooltip butuh wrapper span supaya tetap muncul saat disabled
  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: 'inline-block' }}>{withConfirm}</span>
    </Tooltip>
  );
});

export function PrimaryButton(props) {
  return (
    <AppButton
      type='primary'
      {...props}
    />
  );
}

export function DangerButton(props) {
  return (
    <AppButton
      danger
      type='primary'
      {...props}
    />
  );
}

export function TextButton(props) {
  return (
    <AppButton
      type='text'
      {...props}
    />
  );
}

export default AppButton;
