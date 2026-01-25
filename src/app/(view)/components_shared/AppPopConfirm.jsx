'use client';

import React from 'react';
import { App as AntdApp, Popconfirm, Space, Typography } from 'antd';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isThenable(value) {
  return value != null && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}

function toErrorMessage(err) {
  if (!err) return 'Terjadi kesalahan.';
  if (typeof err === 'string') return err;
  if (err?.message && typeof err.message === 'string') return err.message;
  try {
    const s = JSON.stringify(err);
    return s && s !== '{}' ? s : 'Terjadi kesalahan.';
  } catch {
    return 'Terjadi kesalahan.';
  }
}

function normalizeFeedback(feedback) {
  if (!feedback) return null;
  if (feedback === true) return {};
  if (typeof feedback === 'object') return feedback;
  return null;
}

function defaultTitleNode(title, description) {
  if (!title && !description) return null;

  return (
    <Space
      direction='vertical'
      size={2}
      style={{ lineHeight: 1.15, minWidth: 220 }}
    >
      {title ? (
        <Typography.Text
          strong
          style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 13 }}
        >
          {title}
        </Typography.Text>
      ) : null}

      {description ? (
        <Typography.Text
          type='secondary'
          style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 12 }}
        >
          {description}
        </Typography.Text>
      ) : null}
    </Space>
  );
}

/**
 * AppPopConfirm
 * - controlled/uncontrolled open
 * - async onConfirm with loading
 * - feedback loading/success/error via antd message (prefer <App/> context)
 * - closeOnConfirm / closeOnCancel
 * - supports antd v5 open/onOpenChange and legacy visible/onVisibleChange
 */
export function AppPopConfirm({
  // controlled/uncontrolled
  open,
  visible, // alias legacy
  defaultOpen = false,
  onOpenChange,
  onVisibleChange, // legacy alias

  // content
  title = 'Yakin?',
  description,
  content, // alias for description (lebih natural)
  renderTitle, // (ctx) => ReactNode, override total
  icon,

  // behavior
  trigger = 'click',
  placement = 'top',
  disabled = false,
  closeOnConfirm = true,
  closeOnCancel = true,

  // buttons
  okText = 'Ya',
  cancelText = 'Batal',
  okType = 'primary',
  okDanger,
  okTone, // 'danger'|'error' -> danger
  okButtonProps,
  cancelButtonProps,

  // actions
  onConfirm, // (event) => void|false|Promise<void|false>
  onCancel, // (event) => void|false|Promise<void|false>
  feedback, // boolean | { loading, success, error }
  confirmDisabled = false,

  // passthrough styling
  overlayClassName,
  overlayStyle,
  zIndex,
  mouseEnterDelay,
  mouseLeaveDelay,
  arrow,
  destroyTooltipOnHide,

  children,
  ...rest
}) {
  const ctx = AntdApp.useApp();
  const apiMessage = ctx?.message;

  const controlledOpen = open ?? visible;
  const isControlled = controlledOpen != null;

  const [innerOpen, setInnerOpen] = React.useState(Boolean(defaultOpen));
  const mergedOpen = isControlled ? Boolean(controlledOpen) : innerOpen;

  const setOpen = React.useCallback(
    (next) => {
      const v = Boolean(next);

      if (!isControlled) setInnerOpen(v);

      if (typeof onOpenChange === 'function') onOpenChange(v);
      if (typeof onVisibleChange === 'function') onVisibleChange(v);
    },
    [isControlled, onOpenChange, onVisibleChange],
  );

  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const fb = React.useMemo(() => normalizeFeedback(feedback), [feedback]);

  const mergedDescription = description ?? content;

  const titleNode = React.useMemo(() => {
    if (typeof renderTitle === 'function') {
      return renderTitle({
        title,
        description: mergedDescription,
        open: mergedOpen,
        loading: confirmLoading,
      });
    }
    return defaultTitleNode(title, mergedDescription);
  }, [renderTitle, title, mergedDescription, mergedOpen, confirmLoading]);

  const mergedDanger = Boolean(okDanger || okTone === 'danger' || okTone === 'error');

  const messageApi = apiMessage ?? {
    open: () => {},
    destroy: () => {},
    success: () => {},
    error: () => {},
  };

  const runConfirm = React.useCallback(
    async (evt) => {
      if (disabled || confirmDisabled) return;
      if (confirmLoading || cancelLoading) return;

      const now = Date.now();
      const key = `apppopconfirm_ok_${now}`;

      try {
        setConfirmLoading(true);

        if (fb?.loading) {
          messageApi.open({ type: 'loading', content: fb.loading, key });
        }

        if (typeof onConfirm === 'function') {
          const res = onConfirm(evt);
          const out = isThenable(res) ? await res : res;

          if (out === false) {
            if (fb?.loading) messageApi.destroy(key);
            return;
          }
        }

        if (fb?.loading) {
          if (fb?.success) messageApi.open({ type: 'success', content: fb.success, key });
          else messageApi.destroy(key);
        } else if (fb?.success) {
          messageApi.success(fb.success);
        }

        if (closeOnConfirm) setOpen(false);
      } catch (err) {
        const msg = fb?.error ?? toErrorMessage(err);
        if (fb?.loading) messageApi.open({ type: 'error', content: msg, key });
        else messageApi.error(msg);
      } finally {
        setConfirmLoading(false);
      }
    },
    [disabled, confirmDisabled, confirmLoading, cancelLoading, fb, messageApi, onConfirm, closeOnConfirm, setOpen],
  );

  const runCancel = React.useCallback(
    async (evt) => {
      if (disabled) return;
      if (confirmLoading || cancelLoading) return;

      try {
        setCancelLoading(true);

        if (typeof onCancel === 'function') {
          const res = onCancel(evt);
          const out = isThenable(res) ? await res : res;
          if (out === false) return;
        }

        if (closeOnCancel) setOpen(false);
      } finally {
        setCancelLoading(false);
      }
    },
    [disabled, confirmLoading, cancelLoading, onCancel, closeOnCancel, setOpen],
  );

  const mergedOkButtonProps = {
    ...(okButtonProps || {}),
    loading: okButtonProps?.loading ?? confirmLoading,
    disabled: (okButtonProps?.disabled ?? disabled) || confirmDisabled || cancelLoading,
    danger: okButtonProps?.danger ?? mergedDanger,
  };

  const mergedCancelButtonProps = {
    ...(cancelButtonProps || {}),
    disabled: (cancelButtonProps?.disabled ?? disabled) || confirmLoading || cancelLoading,
  };

  return (
    <Popconfirm
      open={mergedOpen}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
      }}
      title={titleNode}
      icon={icon}
      trigger={trigger}
      placement={placement}
      okText={okText}
      cancelText={cancelText}
      okType={okType}
      okButtonProps={mergedOkButtonProps}
      cancelButtonProps={mergedCancelButtonProps}
      overlayClassName={overlayClassName}
      overlayStyle={{ fontFamily: DEFAULT_FONT_FAMILY, ...(overlayStyle || null) }}
      zIndex={zIndex}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      arrow={arrow}
      destroyTooltipOnHide={destroyTooltipOnHide}
      onConfirm={runConfirm}
      onCancel={runCancel}
      {...rest}
    >
      {children}
    </Popconfirm>
  );
}

/**
 * Convenience: trigger button bawaan (AppButton) + Popconfirm.
 */
export function AppPopConfirmButton({ buttonText = 'Hapus', buttonProps, children, ...popProps }) {
  const triggerNode = children ?? (
    <AppButton
      type='primary'
      danger
      {...buttonProps}
    >
      {buttonText}
    </AppButton>
  );

  return <AppPopConfirm {...popProps}>{triggerNode}</AppPopConfirm>;
}

export default AppPopConfirm;
