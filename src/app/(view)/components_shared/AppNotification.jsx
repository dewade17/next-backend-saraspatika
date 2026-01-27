'use client';

import React from 'react';
import { App as AntdApp, notification, Spin } from 'antd';

const DEFAULT_CONFIG = Object.freeze({
  placement: 'topRight',
  duration: 4,
  maxCount: 4,
});

let _configured = false;
let _config = { ...DEFAULT_CONFIG };

function safeConfig(next) {
  try {
    notification.config(next);
    _configured = true;
  } catch {
    // ignore
  }
}

function ensureConfigured() {
  if (_configured) return;
  safeConfig(_config);
}

function isThenable(v) {
  return v != null && (typeof v === 'object' || typeof v === 'function') && typeof v.then === 'function';
}

function isValidReactNode(v) {
  return v == null || typeof v === 'string' || typeof v === 'number' || React.isValidElement(v);
}

function pickFirstString(...candidates) {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
}

function extractMessageFromUnknown(err) {
  if (!err) return null;

  if (typeof err === 'string') return err;
  if (typeof err === 'number') return String(err);
  if (err instanceof Error) return err.message || null;

  const e = err;

  const direct =
    pickFirstString(
      e?.message,
      e?.error,
      e?.msg,
      e?.detail,
      e?.title,
      e?.reason,
      e?.cause?.message,
      e?.data?.message,
      e?.data?.error,
      e?.response?.data?.message,
      e?.response?.data?.error,
      e?.response?.data?.msg,
      e?.response?.data?.detail,
      e?.response?.data?.errors?.[0]?.message,
      e?.errors?.[0]?.message,
    ) || null;

  if (direct) return direct;

  const issues = e?.issues || e?.error?.issues;
  if (Array.isArray(issues) && issues.length) {
    const m = pickFirstString(issues[0]?.message);
    if (m) return m;
  }

  if (Array.isArray(e) && e.length) {
    const m = extractMessageFromUnknown(e[0]);
    if (m) return m;
  }

  try {
    const s = JSON.stringify(e);
    if (s && s !== '{}' && s !== '[]') return s;
  } catch {
    // ignore
  }

  return null;
}

function toDescription(input, fallback = 'Terjadi kesalahan.') {
  if (isValidReactNode(input)) {
    if (typeof input === 'string' && !input.trim()) return fallback;
    return input ?? fallback;
  }

  const extracted = extractMessageFromUnknown(input);
  return extracted ?? fallback;
}

function normalizeArgs(args) {
  if (args == null) return { message: 'Info', description: '' };

  // shorthand: ReactNode/string/number => jadi description
  if (isValidReactNode(args)) {
    return { message: 'Info', description: args };
  }

  // object config
  if (typeof args === 'object') {
    const {
      type,
      message: title,
      title: titleAlias,
      description,
      desc,
      key,
      duration,
      placement,
      icon,
      btn,
      actions, // alias btn
      onClose,
      onClick,
      closeIcon,
      style,
      className,
      role,
      ariaLabel,
      ...rest
    } = args;

    return {
      type,
      message: title ?? titleAlias ?? 'Info',
      description: description ?? desc ?? '',
      key,
      duration,
      placement,
      icon,
      btn: btn ?? actions,
      onClose,
      onClick,
      closeIcon,
      style,
      className,
      role,
      'aria-label': ariaLabel,
      ...rest,
    };
  }

  return { message: 'Info', description: String(args) };
}

function openNormalized(api, args) {
  ensureConfigured();

  const payload = normalizeArgs(args);

  try {
    const type = payload.type;
    if (type && typeof api[type] === 'function') {
      api[type](payload);
    } else {
      api.open(payload);
    }
  } catch {
    // ignore
  }

  return payload.key;
}

function closeByKey(api, key) {
  ensureConfigured();
  try {
    if (key) api.close(key);
  } catch {
    // ignore
  }
}

function destroyAll(api) {
  ensureConfigured();
  try {
    api.destroy();
  } catch {
    // ignore
  }
}

function createFacade(apiInstance) {
  const core = apiInstance ?? notification;

  const facade = {
    config(next = {}) {
      _config = { ..._config, ...(next || {}) };
      safeConfig(_config);
    },

    resetConfig() {
      _config = { ...DEFAULT_CONFIG };
      safeConfig(_config);
    },

    open(args) {
      return openNormalized(core, args);
    },

    info(titleOrDesc, maybeDescOrOpts, maybeOpts) {
      // signatures:
      // info("Title", "Desc", opts) OR info("Desc", opts) OR info({ ... })
      if (typeof titleOrDesc === 'object' && !React.isValidElement(titleOrDesc)) {
        return openNormalized(core, { type: 'info', ...titleOrDesc });
      }

      if (maybeOpts != null) {
        return openNormalized(core, { type: 'info', message: titleOrDesc ?? 'Info', description: maybeDescOrOpts ?? '', ...(maybeOpts || {}) });
      }

      if (maybeDescOrOpts != null && typeof maybeDescOrOpts === 'object' && !React.isValidElement(maybeDescOrOpts)) {
        return openNormalized(core, { type: 'info', message: 'Info', description: titleOrDesc, ...(maybeDescOrOpts || {}) });
      }

      return openNormalized(core, { type: 'info', message: 'Info', description: titleOrDesc });
    },

    success(titleOrDesc, maybeDescOrOpts, maybeOpts) {
      if (typeof titleOrDesc === 'object' && !React.isValidElement(titleOrDesc)) {
        return openNormalized(core, { type: 'success', ...titleOrDesc });
      }

      if (maybeOpts != null) {
        return openNormalized(core, { type: 'success', message: titleOrDesc ?? 'Berhasil', description: maybeDescOrOpts ?? '', ...(maybeOpts || {}) });
      }

      if (maybeDescOrOpts != null && typeof maybeDescOrOpts === 'object' && !React.isValidElement(maybeDescOrOpts)) {
        return openNormalized(core, { type: 'success', message: 'Berhasil', description: titleOrDesc, ...(maybeDescOrOpts || {}) });
      }

      return openNormalized(core, { type: 'success', message: 'Berhasil', description: titleOrDesc });
    },

    warning(titleOrDesc, maybeDescOrOpts, maybeOpts) {
      if (typeof titleOrDesc === 'object' && !React.isValidElement(titleOrDesc)) {
        return openNormalized(core, { type: 'warning', ...titleOrDesc });
      }

      if (maybeOpts != null) {
        return openNormalized(core, { type: 'warning', message: titleOrDesc ?? 'Peringatan', description: maybeDescOrOpts ?? '', ...(maybeOpts || {}) });
      }

      if (maybeDescOrOpts != null && typeof maybeDescOrOpts === 'object' && !React.isValidElement(maybeDescOrOpts)) {
        return openNormalized(core, { type: 'warning', message: 'Peringatan', description: titleOrDesc, ...(maybeDescOrOpts || {}) });
      }

      return openNormalized(core, { type: 'warning', message: 'Peringatan', description: titleOrDesc });
    },

    error(titleOrDesc, maybeDescOrOpts, maybeOpts) {
      if (typeof titleOrDesc === 'object' && !React.isValidElement(titleOrDesc)) {
        return openNormalized(core, { type: 'error', ...titleOrDesc });
      }

      if (maybeOpts != null) {
        return openNormalized(core, { type: 'error', message: titleOrDesc ?? 'Gagal', description: maybeDescOrOpts ?? '', ...(maybeOpts || {}) });
      }

      if (maybeDescOrOpts != null && typeof maybeDescOrOpts === 'object' && !React.isValidElement(maybeDescOrOpts)) {
        return openNormalized(core, { type: 'error', message: 'Gagal', description: titleOrDesc, ...(maybeDescOrOpts || {}) });
      }

      return openNormalized(core, { type: 'error', message: 'Gagal', description: titleOrDesc });
    },

    close(key) {
      closeByKey(core, key);
    },

    destroy() {
      destroyAll(core);
    },

    once(key, args) {
      if (!key) return openNormalized(core, args);
      const normalized = normalizeArgs(args);
      return openNormalized(core, { ...normalized, key });
    },

    fromError(err, fallback = 'Terjadi kesalahan.') {
      return toDescription(err, fallback);
    },

    errorFrom(err, opts = {}) {
      const { title = 'Gagal', fallback = 'Terjadi kesalahan.', key, duration, placement, prefix, ...rest } = opts || {};

      const desc = toDescription(err, fallback);
      const description = prefix && typeof desc === 'string' ? `${prefix}: ${desc}` : desc;

      return openNormalized(core, {
        type: 'error',
        message: title,
        description,
        key,
        duration,
        placement,
        ...rest,
      });
    },

    async promise(promiseOrFn, opts = {}) {
      const {
        key: providedKey,
        loadingTitle = 'Memproses...',
        loadingDescription = 'Mohon tunggu sebentar.',
        successTitle = 'Berhasil',
        successDescription = 'Selesai diproses.',
        errorTitle = 'Gagal',
        errorDescription = 'Terjadi kesalahan.',
        duration,
        placement,
        throwOnError = false,
        transformSuccess,
        transformError,
        showLoading = true,
      } = opts || {};

      const key = providedKey || `appnotif_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      if (showLoading) {
        openNormalized(core, {
          type: 'info',
          key,
          duration: 0,
          placement,
          message: loadingTitle,
          description: loadingDescription,
          icon: <Spin size='small' />,
        });
      }

      try {
        const p = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
        const result = isThenable(p) ? await p : p;

        const next =
          typeof transformSuccess === 'function'
            ? transformSuccess(result)
            : {
                message: successTitle,
                description: successDescription,
              };

        openNormalized(core, {
          type: 'success',
          key,
          duration,
          placement,
          message: next?.message ?? successTitle,
          description: next?.description ?? successDescription,
          ...(next && typeof next === 'object' ? next : null),
        });

        return result;
      } catch (err) {
        const errText = toDescription(err, typeof errorDescription === 'string' ? errorDescription : 'Terjadi kesalahan.');

        const next =
          typeof transformError === 'function'
            ? transformError(err, errText)
            : {
                message: errorTitle,
                description: typeof errorDescription === 'string' ? `${errorDescription}: ${errText}` : errText,
              };

        openNormalized(core, {
          type: 'error',
          key,
          duration,
          placement,
          message: next?.message ?? errorTitle,
          description: next?.description ?? errText,
          ...(next && typeof next === 'object' ? next : null),
        });

        if (throwOnError) throw err;
        return undefined;
      }
    },

    scope(scopeKey, scopeOpts = {}) {
      const prefix = scopeOpts.prefix;
      const keyPrefix = scopeOpts.keyPrefix ?? scopeKey;

      const withPrefixDesc = (desc) => {
        if (!prefix) return desc;
        if (typeof desc === 'string') return `${prefix}: ${desc}`;
        return desc;
      };

      const withPrefixTitle = (title) => {
        if (!prefix) return title;
        if (typeof title === 'string') return `${prefix}: ${title}`;
        return title;
      };

      const nsKey = (k) => (k ? `${keyPrefix}:${k}` : undefined);

      return {
        open: (args) => {
          const n = normalizeArgs(args);
          return openNormalized(core, {
            ...n,
            key: nsKey(n.key),
            message: withPrefixTitle(n.message),
            description: withPrefixDesc(n.description),
          });
        },
        info: (a, b, c) => facade.info(a, b, { ...(c || (b && typeof b === 'object' ? b : {})), key: nsKey((c || b || {})?.key), message: withPrefixTitle((c || b || {})?.message) }),
        success: (a, b, c) => facade.success(a, b, { ...(c || (b && typeof b === 'object' ? b : {})), key: nsKey((c || b || {})?.key), message: withPrefixTitle((c || b || {})?.message) }),
        warning: (a, b, c) => facade.warning(a, b, { ...(c || (b && typeof b === 'object' ? b : {})), key: nsKey((c || b || {})?.key), message: withPrefixTitle((c || b || {})?.message) }),
        error: (a, b, c) => facade.error(a, b, { ...(c || (b && typeof b === 'object' ? b : {})), key: nsKey((c || b || {})?.key), message: withPrefixTitle((c || b || {})?.message) }),
        close: (k) => closeByKey(core, nsKey(k)),
        destroy: () => destroyAll(core),
        once: (k, args) => facade.once(nsKey(k), args),
        fromError: (e, f) => toDescription(e, f),
        errorFrom: (e, o = {}) =>
          facade.errorFrom(e, {
            ...(o || {}),
            key: nsKey(o?.key),
            prefix: o?.prefix ?? prefix,
          }),
        promise: (p, o = {}) =>
          facade.promise(p, {
            ...(o || {}),
            key: nsKey(o?.key),
          }),
      };
    },
  };

  return facade;
}

const coreFacade = createFacade(notification);

export function useAppNotification() {
  let api = null;

  // Prefer AntD <App> context jika ada
  try {
    const ctx = AntdApp.useApp();
    api = ctx?.notification ?? null;
  } catch {
    api = null;
  }

  // Memoize supaya facade tidak dibuat ulang setiap render
  const facade = React.useMemo(() => {
    if (api) return createFacade(api);
    return coreFacade;
  }, [api]);

  return facade;
}

export function AppNotificationProvider({ children, config }) {
  React.useEffect(() => {
    if (config) coreFacade.config(config);
  }, [config]);

  return children;
}

export const AppNotification = coreFacade;
export default AppNotification;
