'use client';

import React from 'react';
import { App as AntdApp, Grid, Modal, Space, Typography, message as antdMessage } from 'antd';
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

function resolveDimensionFromSize(size, isMobile, fullOnMobile) {
  if (size == null) return undefined;

  if (typeof size === 'number') return size;

  if (typeof size === 'string') {
    const s = size.trim().toLowerCase();

    if (s.endsWith('px') || s.endsWith('%') || s.endsWith('vw') || s.endsWith('vh') || s.endsWith('rem') || s.endsWith('em')) {
      return size;
    }

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

  if (confirmOnClose === true) {
    return {
      title: 'Tutup modal?',
      content: 'Perubahan belum disimpan. Yakin ingin menutup?',
      okText: 'Tutup',
      cancelText: 'Batal',
      danger: true,
    };
  }

  if (typeof confirmOnClose === 'string' || React.isValidElement(confirmOnClose)) {
    return {
      title: 'Tutup modal?',
      content: confirmOnClose,
      okText: 'Tutup',
      cancelText: 'Batal',
      danger: true,
    };
  }

  if (typeof confirmOnClose === 'object') {
    return {
      title: confirmOnClose.title ?? 'Tutup modal?',
      content: confirmOnClose.content ?? confirmOnClose.description ?? 'Perubahan belum disimpan. Yakin ingin menutup?',
      okText: confirmOnClose.okText ?? 'Tutup',
      cancelText: confirmOnClose.cancelText ?? 'Batal',
      danger: confirmOnClose.danger ?? true,
      okType: confirmOnClose.okType,
      centered: confirmOnClose.centered,
      maskClosable: confirmOnClose.maskClosable,
      width: confirmOnClose.width,
      icon: confirmOnClose.icon,
      force: confirmOnClose.force, // confirm walau tidak dirty
    };
  }

  return null;
}

function readPersistedOpen(key) {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(`appmodal:${key}:open`);
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
    window.localStorage.setItem(`appmodal:${key}:open`, value ? '1' : '0');
  } catch {
    // ignore
  }
}

function defaultHeader(title, subtitle, description) {
  if (!title && !subtitle && !description) return null;

  return (
    <Space
      orientation='vertical'
      size={2}
      style={{ lineHeight: 1.15, minWidth: 0 }}
    >
      {title ? (
        <Typography.Text
          strong
          style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 16 }}
          ellipsis
        >
          {title}
        </Typography.Text>
      ) : null}

      {subtitle ? (
        <Typography.Text
          type='secondary'
          style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 12 }}
          ellipsis
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

export const AppModal = React.forwardRef(function AppModal(
  {
    // controlled / uncontrolled
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
    header, // override node
    headerActions, // node di kanan title (mis: tombol kecil)

    // sizing
    width,
    size = 'md', // xs|sm|md|lg|xl|full|number|css string
    responsive = true,
    fullOnMobile = true,

    // behavior
    centered = true,
    maskClosable = true,
    keyboard = true,
    destroyOnHidden,
    destroyOnClose = false,
    forceRender = false,
    closable = true,

    // close behavior
    onClose, // ({reason, event}) => void|Promise|false
    onCancel, // antd signature (event) optional
    confirmOnClose, // true|string|ReactNode|object
    dirty = false, // boolean | () => boolean
    closeReason = 'cancel',

    // focus
    autoFocus = true,
    autoFocusSelector,

    // footer/actions
    footer, // false|null => no footer, ReactNode/function => custom, undefined => auto
    showFooter,
    okText = 'Simpan',
    cancelText = 'Batal',
    okButtonProps,
    cancelButtonProps,
    okTone, // success|warning|info|danger
    okDanger,
    okDisabled,
    closeOnOk = true,
    onOk, // () => void|false|Promise<void|false>
    onOkSuccess,
    onOkError,
    feedback, // boolean | { loading, success, error }

    // styling / passthrough
    className,
    rootClassName,
    style,
    styles,
    classNames,
    zIndex,
    getContainer,
    closeIcon,
    modalRender,
    afterClose,
    afterOpenChange,

    children,
    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();

  const ctx = AntdApp.useApp();

  const apiMessage = ctx?.message ?? antdMessage;
  const apiModal = ctx?.modal ?? Modal;

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

  const [okLoading, setOkLoading] = React.useState(false);
  const [closeLoading, setCloseLoading] = React.useState(false);

  const wrapperRef = React.useRef(null);
  const lastActiveElRef = React.useRef(null);

  const isDirty = React.useMemo(() => {
    try {
      if (typeof dirty === 'function') return Boolean(dirty());
      return Boolean(dirty);
    } catch {
      return false;
    }
  }, [dirty, mergedOpen]);

  const confirmCfg = React.useMemo(() => normalizeConfirm(confirmOnClose), [confirmOnClose]);

  const resolvedWidth = width != null ? width : resolveDimensionFromSize(size, isMobile, fullOnMobile);

  const mergedHeader = header ?? defaultHeader(title, subtitle, description);

  const titleNode =
    mergedHeader || headerActions ? (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>{mergedHeader}</div>
        {headerActions ? <div style={{ flex: 'none' }}>{headerActions}</div> : null}
      </div>
    ) : null;

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

  React.useEffect(() => {
    if (!mergedOpen) return;

    if (typeof document !== 'undefined') {
      lastActiveElRef.current = document.activeElement;
    }

    setTimeout(() => tryAutoFocus(), 0);
  }, [mergedOpen, tryAutoFocus]);

  const runAfterClose = React.useCallback(() => {
    try {
      if (typeof afterClose === 'function') afterClose();
    } finally {
      const el = lastActiveElRef.current;
      if (el && typeof el.focus === 'function') {
        try {
          el.focus();
        } catch {
          // ignore
        }
      }
      lastActiveElRef.current = null;
    }
  }, [afterClose]);

  async function confirmCloseIfNeeded(reason) {
    const cfg = confirmCfg;
    if (!cfg) return true;

    const mustConfirm = Boolean(cfg.force) || isDirty;
    if (!mustConfirm) return true;

    return new Promise((resolve) => {
      const instance = typeof apiModal?.confirm === 'function' ? apiModal : Modal;

      instance.confirm({
        title: cfg.title ?? 'Tutup modal?',
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
          const out = isThenable(res) ? await res : res;
          if (out === false) return;
        }

        if (typeof onCancel === 'function') {
          const res = onCancel(evt);
          const out = isThenable(res) ? await res : res;
          if (out === false) return;
        }

        setOpen(false);
      } catch (err) {
        apiMessage.error(toErrorMessage(err));
      } finally {
        setCloseLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [closeLoading, okLoading, onClose, onCancel, closeReason, setOpen, apiMessage, isDirty, confirmCfg],
  );

  const runOk = React.useCallback(async () => {
    if (!onOk) return;
    if (okLoading || closeLoading) return;
    if (okDisabled) return;

    const fb = normalizeFeedback(feedback);
    const now = Date.now();
    const key = `appmodal_ok_${now}`;

    try {
      setOkLoading(true);

      if (fb?.loading) {
        apiMessage.open({ type: 'loading', content: fb.loading, key });
      }

      const res = onOk();
      const out = isThenable(res) ? await res : res;

      if (out === false) {
        if (fb?.loading) apiMessage.destroy(key);
        return;
      }

      if (fb?.loading) {
        if (fb?.success) apiMessage.open({ type: 'success', content: fb.success, key });
        else apiMessage.destroy(key);
      } else if (fb?.success) {
        apiMessage.success(fb.success);
      }

      if (typeof onOkSuccess === 'function') onOkSuccess(out);

      if (closeOnOk) {
        await runClose('ok');
      }

      return out;
    } catch (err) {
      const msg = fb?.error ?? toErrorMessage(err);
      if (fb?.loading) apiMessage.open({ type: 'error', content: msg, key });
      else apiMessage.error(msg);

      if (typeof onOkError === 'function') onOkError(err);
      return undefined;
    } finally {
      setOkLoading(false);
    }
  }, [onOk, okLoading, closeLoading, okDisabled, feedback, apiMessage, onOkSuccess, onOkError, closeOnOk, runClose]);

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

  const mergedDestroyOnHidden = typeof destroyOnHidden === 'boolean' ? destroyOnHidden : destroyOnClose;

  const defaultModalRender = (node) => (
    <div
      ref={wrapperRef}
      style={{ fontFamily: DEFAULT_FONT_FAMILY }}
    >
      {node}
    </div>
  );

  return (
    <Modal
      ref={ref}
      open={mergedOpen}
      title={titleNode}
      width={resolvedWidth}
      centered={centered}
      closable={closable}
      maskClosable={maskClosable}
      keyboard={keyboard}
      destroyOnHidden={mergedDestroyOnHidden}
      forceRender={forceRender}
      getContainer={getContainer}
      zIndex={zIndex}
      className={className}
      rootClassName={rootClassName}
      style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
      styles={mergedStyles}
      classNames={classNames}
      closeIcon={closeIcon}
      footer={footerNode}
      onCancel={(evt) => runClose('cancel', evt)}
      afterClose={runAfterClose}
      afterOpenChange={afterOpenChange}
      modalRender={modalRender ?? defaultModalRender}
      {...rest}
    >
      {children}
    </Modal>
  );
});

export function useAppModalStatic() {
  // helper untuk akses modal/message dari context Antd <App>
  const ctx = AntdApp.useApp();
  const modalApi = ctx?.modal ?? Modal;
  const messageApi = ctx?.message ?? antdMessage;

  return {
    modal: modalApi,
    message: messageApi,
    confirmAsync: (options) =>
      new Promise((resolve) => {
        modalApi.confirm({
          ...options,
          onOk: async () => {
            try {
              const r = options?.onOk?.();
              if (isThenable(r)) await r;
              resolve(true);
            } catch {
              resolve(false);
            }
          },
          onCancel: async () => {
            try {
              const r = options?.onCancel?.();
              if (isThenable(r)) await r;
            } finally {
              resolve(false);
            }
          },
        });
      }),
  };
}

export const AppModalStatic = {
  confirm: (opts) => Modal.confirm(opts),
  info: (opts) => Modal.info(opts),
  success: (opts) => Modal.success(opts),
  warning: (opts) => Modal.warning(opts),
  error: (opts) => Modal.error(opts),
  destroyAll: () => Modal.destroyAll(),
};

export default AppModal;
