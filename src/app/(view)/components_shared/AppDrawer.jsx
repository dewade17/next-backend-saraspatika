'use client';

import React from 'react';
import { App as AntdApp, Drawer, Modal, Space, Typography, Grid } from 'antd';
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
    return JSON.stringify(err);
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

function resolveDimensionFromSize(size, isMobile, fullOnMobile) {
  if (size == null) return undefined;

  if (typeof size === 'number') return size;
  if (typeof size === 'string') {
    const s = size.trim().toLowerCase();

    // CSS value langsung
    if (s.endsWith('px') || s.endsWith('%') || s.endsWith('vw') || s.endsWith('vh') || s.endsWith('rem') || s.endsWith('em')) {
      return size;
    }

    // preset
    if (s === 'full') return '100%';
    if (fullOnMobile && isMobile) return '100%';

    const map = {
      xs: 360,
      sm: 420,
      md: 560,
      lg: 720,
      xl: 900,
    };

    if (map[s] != null) return map[s];
  }

  return undefined;
}

function normalizeConfirm(confirmOnClose) {
  if (!confirmOnClose) return null;

  // true => pakai default copy (akan dipakai saat dirty)
  if (confirmOnClose === true) {
    return {
      title: 'Tutup drawer?',
      content: 'Perubahan belum disimpan. Yakin ingin menutup?',
      okText: 'Tutup',
      cancelText: 'Batal',
      danger: true,
    };
  }

  // string / ReactNode
  if (typeof confirmOnClose === 'string' || React.isValidElement(confirmOnClose)) {
    return {
      title: 'Tutup drawer?',
      content: confirmOnClose,
      okText: 'Tutup',
      cancelText: 'Batal',
      danger: true,
    };
  }

  // object
  if (typeof confirmOnClose === 'object') {
    return {
      title: confirmOnClose.title ?? 'Tutup drawer?',
      content: confirmOnClose.content ?? confirmOnClose.description ?? 'Perubahan belum disimpan. Yakin ingin menutup?',
      okText: confirmOnClose.okText ?? 'Tutup',
      cancelText: confirmOnClose.cancelText ?? 'Batal',
      danger: confirmOnClose.danger ?? true,
      okType: confirmOnClose.okType,
      centered: confirmOnClose.centered,
      maskClosable: confirmOnClose.maskClosable,
      width: confirmOnClose.width,
      icon: confirmOnClose.icon,
      force: confirmOnClose.force, // confirm meskipun tidak dirty
    };
  }

  return null;
}

function readPersistedOpen(key) {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(`appdrawer:${key}:open`);
    if (raw == null) return null;
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

function writePersistedOpen(key, value) {
  if (!key) return;
  try {
    window.localStorage.setItem(`appdrawer:${key}:open`, value ? '1' : '0');
  } catch {
    // ignore
  }
}

function defaultHeader(title, subtitle, description) {
  if (!title && !subtitle && !description) return null;

  return (
    <Space
      direction='vertical'
      size={2}
      style={{ lineHeight: 1.15 }}
    >
      {title ? (
        <Typography.Text
          strong
          style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 16 }}
        >
          {title}
        </Typography.Text>
      ) : null}

      {subtitle ? (
        <Typography.Text
          type='secondary'
          style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 12 }}
        >
          {subtitle}
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

export const AppDrawer = React.forwardRef(function AppDrawer(
  {
    // controlled/uncontrolled
    open,
    visible, // alias
    defaultOpen = false,
    onOpenChange,

    // persist open state (uncontrolled)
    persistKey,

    // header
    title,
    subtitle,
    description,
    header, // override title node
    extra, // antd Drawer extra
    headerActions, // alias extra (kalau extra tidak diisi)

    // drawer sizing
    placement = 'right',
    size = 'md', // xs|sm|md|lg|xl|full|number|css string
    width,
    height,
    responsive = true,
    fullOnMobile = true,

    // close behavior
    onClose,
    confirmOnClose, // true | string | ReactNode | object
    dirty = false, // boolean | () => boolean
    closeReason = 'close',
    closeOnOk = true,

    // focus
    autoFocus = true,
    autoFocusSelector, // mis: 'input,textarea,select,button'

    // footer / actions
    footer, // false|null => no footer, ReactNode/function => custom, undefined => auto
    showFooter, // force show footer
    okText = 'Simpan',
    cancelText = 'Batal',
    okButtonProps,
    cancelButtonProps,
    okTone, // success|warning|info|danger (untuk AppButton)
    okDanger,
    okDisabled,
    onOk,
    onOkSuccess,
    onOkError,
    feedback, // boolean | { loading, success, error }

    // antd drawer props passthrough
    closable = true,
    maskClosable = true,
    keyboard = true,
    destroyOnClose = false,
    forceRender = false,
    getContainer,
    zIndex,
    className,
    rootClassName,
    style,
    styles,
    classNames,

    children,
    ...rest
  },
  ref,
) {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();

  const isMobile = responsive ? !screens?.sm : false;

  const controlledOpen = open ?? visible;
  const isControlled = controlledOpen != null;

  const [innerOpen, setInnerOpen] = React.useState(() => {
    if (typeof window !== 'undefined' && !isControlled && persistKey) {
      const persisted = readPersistedOpen(persistKey);
      if (persisted != null) return persisted;
    }
    return Boolean(defaultOpen);
  });

  // sync uncontrolled persist on mount (in case localStorage becomes available after hydration)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isControlled) return;
    if (!persistKey) return;

    const persisted = readPersistedOpen(persistKey);
    if (persisted != null) setInnerOpen(persisted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mergedOpen = isControlled ? Boolean(controlledOpen) : innerOpen;

  const setOpen = React.useCallback(
    (next) => {
      const v = Boolean(next);

      if (!isControlled) {
        setInnerOpen(v);
        if (persistKey) writePersistedOpen(persistKey, v);
      }

      if (typeof onOpenChange === 'function') onOpenChange(v);
    },
    [isControlled, onOpenChange, persistKey],
  );

  const wrapId = React.useId();
  const wrapperRef = React.useRef(null);

  const [okLoading, setOkLoading] = React.useState(false);
  const [closeLoading, setCloseLoading] = React.useState(false);

  const isDirty = React.useMemo(() => {
    try {
      if (typeof dirty === 'function') return Boolean(dirty());
      return Boolean(dirty);
    } catch {
      return false;
    }
  }, [dirty, mergedOpen]); // recompute on open changes too

  const confirmCfg = React.useMemo(() => normalizeConfirm(confirmOnClose), [confirmOnClose]);

  const resolvedWidth = width != null ? width : placement === 'left' || placement === 'right' ? resolveDimensionFromSize(size, isMobile, fullOnMobile) : undefined;

  const resolvedHeight = height != null ? height : placement === 'top' || placement === 'bottom' ? resolveDimensionFromSize(size, isMobile, fullOnMobile) : undefined;

  const mergedTitle = header ?? defaultHeader(title, subtitle, description);
  const mergedExtra = extra ?? headerActions;

  const tryAutoFocus = React.useCallback(() => {
    if (!autoFocus) return;

    const root = wrapperRef.current;
    if (!root) return;

    const selector = autoFocusSelector || 'input:not([disabled]),textarea:not([disabled]),select:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])';

    const el = root.querySelector(selector);
    if (el && typeof el.focus === 'function') {
      try {
        el.focus();
      } catch {
        // ignore
      }
    }
  }, [autoFocus, autoFocusSelector]);

  const afterOpenChange = React.useCallback(
    (nextOpen) => {
      if (nextOpen) {
        // tunggu DOM ready
        setTimeout(() => tryAutoFocus(), 0);
      }
      if (typeof rest.afterOpenChange === 'function') rest.afterOpenChange(nextOpen);
    },
    [rest, tryAutoFocus],
  );

  async function confirmCloseIfNeeded(reason) {
    const cfg = confirmCfg;

    // tidak ada confirm
    if (!cfg) return true;

    // kalau cfg.force => confirm selalu
    const mustConfirm = Boolean(cfg.force) || isDirty;

    // default behavior: confirm hanya ketika dirty (kecuali force)
    if (!mustConfirm) return true;

    return new Promise((resolve) => {
      Modal.confirm({
        title: cfg.title ?? 'Tutup drawer?',
        content: cfg.content ?? 'Perubahan belum disimpan. Yakin ingin menutup?',
        okText: cfg.okText ?? 'Tutup',
        cancelText: cfg.cancelText ?? 'Batal',
        okType: cfg.okType ?? (cfg.danger ? 'danger' : 'primary'),
        centered: cfg.centered,
        maskClosable: cfg.maskClosable,
        width: cfg.width,
        icon: cfg.icon,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }

  const runClose = React.useCallback(
    async (reason, evt) => {
      if (closeLoading || okLoading) return;

      const ok = await confirmCloseIfNeeded(reason);
      if (!ok) return;

      try {
        setCloseLoading(true);

        if (typeof onClose === 'function') {
          const res = onClose({ reason: reason ?? closeReason, event: evt });
          if (isThenable(res)) await res;
        }

        setOpen(false);
      } catch (err) {
        message.error(toErrorMessage(err));
      } finally {
        setCloseLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [closeLoading, okLoading, onClose, closeReason, setOpen, message, isDirty, confirmCfg],
  );

  const runOk = React.useCallback(async () => {
    if (!onOk) return;

    if (okLoading || closeLoading) return;
    if (okDisabled) return;

    const fb = normalizeFeedback(feedback);
    const now = Date.now();
    const key = `appdrawer_ok_${now}`;

    try {
      setOkLoading(true);

      if (fb?.loading) {
        message.open({ type: 'loading', content: fb.loading, key });
      }

      const result = onOk();

      if (isThenable(result)) {
        const resolved = await result;

        if (fb?.loading) {
          if (fb?.success) message.open({ type: 'success', content: fb.success, key });
          else message.destroy(key);
        } else if (fb?.success) {
          message.success(fb.success);
        }

        if (typeof onOkSuccess === 'function') onOkSuccess(resolved);

        if (closeOnOk) {
          await runClose('ok');
        }

        return resolved;
      }

      if (fb?.success) message.success(fb.success);
      if (typeof onOkSuccess === 'function') onOkSuccess(result);

      if (closeOnOk) {
        await runClose('ok');
      }

      return result;
    } catch (err) {
      if (fb?.loading) {
        const msg = fb?.error ?? toErrorMessage(err);
        message.open({ type: 'error', content: msg, key });
      } else {
        const msg = fb?.error ?? toErrorMessage(err);
        message.error(msg);
      }

      if (typeof onOkError === 'function') onOkError(err);
      return undefined;
    } finally {
      setOkLoading(false);
    }
  }, [onOk, okLoading, closeLoading, okDisabled, feedback, message, onOkSuccess, onOkError, closeOnOk, runClose]);

  const shouldRenderFooter = footer === false || footer === null ? false : Boolean(showFooter) || Boolean(onOk) || typeof footer === 'function' || React.isValidElement(footer);

  const footerNode = React.useMemo(() => {
    if (!shouldRenderFooter) return null;

    if (typeof footer === 'function') {
      return footer({
        open: mergedOpen,
        close: () => runClose('cancel'),
        ok: () => runOk(),
        okLoading,
        closeLoading,
        dirty: isDirty,
      });
    }

    if (React.isValidElement(footer)) return footer;

    // default footer
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
        <AppButton
          onPress={() => runClose('cancel')}
          disabled={okLoading || closeLoading}
          {...cancelButtonProps}
        >
          {cancelText}
        </AppButton>

        <AppButton
          type='primary'
          tone={okTone}
          danger={okDanger || okTone === 'danger' || okTone === 'error'}
          onPress={() => runOk()}
          loading={okLoading}
          disabled={okDisabled || closeLoading}
          {...okButtonProps}
        >
          {okText}
        </AppButton>
      </div>
    );
  }, [shouldRenderFooter, footer, mergedOpen, runClose, runOk, okLoading, closeLoading, isDirty, cancelText, okText, okTone, okDanger, okDisabled, okButtonProps, cancelButtonProps]);

  const mergedStyles = {
    ...(styles ?? null),
    header: {
      fontFamily: DEFAULT_FONT_FAMILY,
      ...(styles?.header ?? null),
    },
    body: {
      fontFamily: DEFAULT_FONT_FAMILY,
      ...(styles?.body ?? null),
    },
    footer: {
      fontFamily: DEFAULT_FONT_FAMILY,
      ...(styles?.footer ?? null),
    },
  };

  return (
    <Drawer
      ref={ref}
      open={mergedOpen}
      placement={placement}
      width={resolvedWidth}
      height={resolvedHeight}
      title={mergedTitle}
      extra={mergedExtra}
      footer={footerNode}
      closable={closable}
      maskClosable={maskClosable}
      keyboard={keyboard}
      destroyOnClose={destroyOnClose}
      forceRender={forceRender}
      getContainer={getContainer}
      zIndex={zIndex}
      className={className}
      rootClassName={rootClassName}
      style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
      styles={mergedStyles}
      classNames={classNames}
      onClose={(evt) => runClose('close', evt)}
      afterOpenChange={afterOpenChange}
      drawerRender={(node) => (
        <div
          ref={wrapperRef}
          data-appdrawer-id={wrapId}
          style={{ fontFamily: DEFAULT_FONT_FAMILY, height: '100%' }}
        >
          {node}
        </div>
      )}
      {...rest}
    >
      {children}
    </Drawer>
  );
});

export default AppDrawer;
