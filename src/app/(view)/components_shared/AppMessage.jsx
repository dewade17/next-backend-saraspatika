'use client';

import React from 'react';
import { App as AntdApp, message } from 'antd';

const DEFAULT_CONFIG = Object.freeze({
  duration: 2.5,
  maxCount: 3,
  top: 24,
});

let _configured = false;
let _config = { ...DEFAULT_CONFIG };

function safeMessageConfig(next) {
  try {
    message.config(next);
    _configured = true;
  } catch {
    // ignore
  }
}

function ensureConfigured() {
  if (_configured) return;
  safeMessageConfig(_config);
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

  // common shapes (axios/fetch/custom)
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

  // zod issues
  const issues = e?.issues || e?.error?.issues;
  if (Array.isArray(issues) && issues.length) {
    const first = issues[0];
    const m = pickFirstString(first?.message);
    if (m) return m;
  }

  // array of errors/messages
  if (Array.isArray(e) && e.length) {
    const first = e[0];
    const m = extractMessageFromUnknown(first);
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

function toDisplayContent(input, fallback = 'Terjadi kesalahan.') {
  if (isValidReactNode(input)) {
    if (typeof input === 'string' && !input.trim()) return fallback;
    return input ?? fallback;
  }

  const extracted = extractMessageFromUnknown(input);
  return extracted ?? fallback;
}

function normalizeOpenArgs(args) {
  if (args == null) return { content: '...' };

  if (isValidReactNode(args)) {
    return { content: args };
  }

  if (typeof args === 'object') {
    const { type, content, duration, key, icon, style, className, onClick, onClose } = args;

    return {
      type,
      content,
      duration,
      key,
      icon,
      style,
      className,
      onClick,
      onClose,
    };
  }

  return { content: String(args) };
}

function openNormalized(api, args) {
  ensureConfigured();
  const payload = normalizeOpenArgs(args);
  try {
    api.open(payload);
  } catch {
    // ignore
  }
  return payload?.key;
}

function destroyByKey(api, key) {
  ensureConfigured();
  try {
    if (key) api.destroy(key);
    else api.destroy();
  } catch {
    // ignore
  }
}

function createFacade(api) {
  const core = api ?? message;

  return {
    config(next = {}) {
      _config = { ..._config, ...(next || {}) };
      safeMessageConfig(_config);
    },

    resetConfig() {
      _config = { ...DEFAULT_CONFIG };
      safeMessageConfig(_config);
    },

    open(args) {
      return openNormalized(core, args);
    },

    success(content, opts = {}) {
      return openNormalized(core, { type: 'success', content, ...opts });
    },

    info(content, opts = {}) {
      return openNormalized(core, { type: 'info', content, ...opts });
    },

    warning(content, opts = {}) {
      return openNormalized(core, { type: 'warning', content, ...opts });
    },

    error(content, opts = {}) {
      return openNormalized(core, { type: 'error', content, ...opts });
    },

    loading(content, opts = {}) {
      return openNormalized(core, { type: 'loading', content, ...opts });
    },

    destroy(key) {
      destroyByKey(core, key);
    },

    fromError(err, fallback = 'Terjadi kesalahan.') {
      return toDisplayContent(err, fallback);
    },

    errorFrom(err, opts = {}) {
      const { fallback = 'Terjadi kesalahan.', duration, key, prefix } = opts;

      const msg = toDisplayContent(err, fallback);
      const content = prefix && typeof msg === 'string' ? `${prefix}: ${msg}` : msg;

      return openNormalized(core, { type: 'error', content, duration, key });
    },

    once(key, args) {
      if (!key) return openNormalized(core, args);
      return openNormalized(core, { ...(typeof args === 'object' ? args : { content: args }), key });
    },

    async promise(promiseOrFn, opts = {}) {
      const { key: providedKey, loading = 'Memproses...', success = 'Berhasil', error = 'Gagal', duration, throwOnError = false, transformSuccess, transformError } = opts;

      const key = providedKey || `appmsg_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      openNormalized(core, { type: 'loading', content: loading, key, duration: duration ?? 0 });

      try {
        const p = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
        const result = isThenable(p) ? await p : p;

        const successContent = typeof transformSuccess === 'function' ? transformSuccess(result) : success;

        openNormalized(core, { type: 'success', content: successContent, key, duration });

        return result;
      } catch (err) {
        const errText = toDisplayContent(err, typeof error === 'string' ? error : 'Gagal');

        const errorContent = typeof transformError === 'function' ? transformError(err, errText) : typeof error === 'string' ? `${error}: ${errText}` : errText;

        openNormalized(core, { type: 'error', content: errorContent, key, duration });

        if (throwOnError) throw err;
        return undefined;
      }
    },

    scope(scopeKey, scopeOpts = {}) {
      const prefix = scopeOpts.prefix;
      const keyPrefix = scopeOpts.keyPrefix ?? scopeKey;

      return {
        open: (args) => {
          const k = typeof args === 'object' ? args?.key : null;
          const nextKey = k ? `${keyPrefix}:${k}` : undefined;

          const content = prefix && typeof (args?.content ?? args) === 'string' ? `${prefix}: ${args?.content ?? args}` : (args?.content ?? args);

          return openNormalized(core, {
            ...(typeof args === 'object' ? args : { content }),
            key: nextKey,
            content,
          });
        },
        success: (c, o = {}) => openNormalized(core, { type: 'success', content: prefix ? `${prefix}: ${c}` : c, key: o?.key ? `${keyPrefix}:${o.key}` : undefined, ...o }),
        info: (c, o = {}) => openNormalized(core, { type: 'info', content: prefix ? `${prefix}: ${c}` : c, key: o?.key ? `${keyPrefix}:${o.key}` : undefined, ...o }),
        warning: (c, o = {}) => openNormalized(core, { type: 'warning', content: prefix ? `${prefix}: ${c}` : c, key: o?.key ? `${keyPrefix}:${o.key}` : undefined, ...o }),
        error: (c, o = {}) => openNormalized(core, { type: 'error', content: prefix ? `${prefix}: ${c}` : c, key: o?.key ? `${keyPrefix}:${o.key}` : undefined, ...o }),
        loading: (c, o = {}) => openNormalized(core, { type: 'loading', content: prefix ? `${prefix}: ${c}` : c, key: o?.key ? `${keyPrefix}:${o.key}` : undefined, ...o }),
        destroy: (k) => destroyByKey(core, k ? `${keyPrefix}:${k}` : undefined),
        promise: (p, o = {}) => coreFacade.promise(p, { ...o, key: o?.key ? `${keyPrefix}:${o.key}` : undefined }),
        fromError: (e, f) => toDisplayContent(e, f),
        errorFrom: (e, o = {}) => coreFacade.errorFrom(e, { ...o, key: o?.key ? `${keyPrefix}:${o.key}` : undefined, prefix: prefix ?? o?.prefix }),
      };
    },
  };
}

const coreFacade = createFacade(message);

export function useAppMessage() {
  let api = null;

  // Prefer Antd <App> context jika tersedia
  try {
    const ctx = AntdApp.useApp();
    api = ctx?.message ?? null;
  } catch {
    api = null;
  }

  const facade = React.useMemo(() => {
    if (api) return createFacade(api);
    return coreFacade;
  }, [api]);

  return facade;
}

export function AppMessageProvider({ children, config }) {
  React.useEffect(() => {
    if (config) coreFacade.config(config);
  }, [config]);

  return children;
}

export const AppMessage = coreFacade;
export default AppMessage;
