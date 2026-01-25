'use client';

import React from 'react';
import { Input, Tooltip, Grid } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';
const BP_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
const BP_ORDER = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];

function isResponsiveMap(v) {
  if (!v || typeof v !== 'object') return false;
  if (Array.isArray(v)) return false;
  if (React.isValidElement(v)) return false;
  return Object.keys(v).some((k) => BP_KEYS.includes(k) || k === 'base');
}

function pickResponsive(v, screens) {
  if (!isResponsiveMap(v)) return v;

  for (const bp of BP_ORDER) {
    if (screens?.[bp] && v[bp] != null) return v[bp];
  }
  if (v.base != null) return v.base;
  if (v.xs != null) return v.xs;

  for (const k of BP_KEYS) {
    if (v[k] != null) return v[k];
  }
  return undefined;
}

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

function withTooltipWrapper(node, tooltipCfg) {
  if (!tooltipCfg?.title) return node;
  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: 'inline-block', width: '100%' }}>{node}</span>
    </Tooltip>
  );
}

function normalizeString(v) {
  if (v == null) return '';
  return String(v);
}

function applyTransforms(value, { trim, normalizeWhitespace, transform }) {
  let v = normalizeString(value);

  if (normalizeWhitespace) {
    v = v.replace(/\s+/g, ' ');
  }
  if (trim) {
    v = v.trim();
  }
  if (typeof transform === 'function') {
    const next = transform(v);
    if (next != null) v = String(next);
  }

  return v;
}

function applyPatternRules(nextValue, { allowPattern, blockPattern, prevValue }) {
  let v = normalizeString(nextValue);

  if (allowPattern instanceof RegExp) {
    const flags = allowPattern.flags?.includes('g') ? allowPattern.flags : `${allowPattern.flags}g`;
    const rgx = new RegExp(allowPattern.source, flags);
    const matches = v.match(rgx);
    v = matches ? matches.join('') : '';
  }

  if (blockPattern instanceof RegExp) {
    v = v.replace(blockPattern, '');
  }

  // Kalau filter bikin kosong padahal sebelumnya ada, tetap biarkan (lebih predictable)
  // tapi kamu bisa override via `transform` kalau mau.
  return v;
}

function FieldChrome({ label, required, extra, help, error, style, className, children }) {
  const hasHelp = help != null && help !== '';
  const hasError = error != null && error !== '';

  return (
    <div
      className={className}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...style,
      }}
    >
      {label != null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: '18px' }}>
            {label}
            {required ? <span style={{ marginInlineStart: 6, color: 'var(--ant-colorError, #ff4d4f)' }}>*</span> : null}
          </div>
          {extra != null ? <div style={{ opacity: 0.8 }}>{extra}</div> : null}
        </div>
      ) : null}

      {children}

      {hasError ? <div style={{ fontSize: 12, color: 'var(--ant-colorError, #ff4d4f)', lineHeight: '16px' }}>{error}</div> : hasHelp ? <div style={{ fontSize: 12, opacity: 0.75, lineHeight: '16px' }}>{help}</div> : null}
    </div>
  );
}

function useDebouncedCallback(cb, delay) {
  const cbRef = React.useRef(cb);
  React.useEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  const tRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, []);

  return React.useCallback(
    (...args) => {
      if (!delay || delay <= 0) {
        return cbRef.current?.(...args);
      }

      if (tRef.current) clearTimeout(tRef.current);
      tRef.current = setTimeout(() => cbRef.current?.(...args), delay);
      return undefined;
    },
    [delay],
  );
}

/**
 * AppInput (base)
 * - onValueChange: (value, meta) => void
 * - debounceMs: debounce onValueChange untuk typing
 * - trim/normalizeWhitespace/transform: sanitizing
 * - allowPattern/blockPattern: filter karakter
 */
export const AppInput = React.forwardRef(function AppInput(
  {
    value,
    defaultValue,

    onValueChange,
    onChange,
    onBlur,
    onPressEnter,
    onEnter,

    debounceMs = 0,
    emitOnChange = true,
    emitOnBlur = false,

    trim = false,
    normalizeWhitespace = false,
    transform, // (string) => string
    allowPattern, // RegExp: keep only matches
    blockPattern, // RegExp: remove matches

    tooltip,
    disabledReason,

    clearable = true,
    allowClear,

    block = true,
    size, // 'small'|'middle'|'large' OR responsive map

    status,
    error, // alias status='error'

    autoSelectOnFocus = false,

    style,
    className,

    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();

  const pickedSize = pickResponsive(size, screens);
  const computedStatus = status ?? (error ? 'error' : undefined);
  const finalAllowClear = allowClear ?? clearable;
  const disabled = Boolean(rest.disabled);

  const tooltipCfg = normalizeTooltip(tooltip, disabled, disabledReason);

  const debouncedEmit = useDebouncedCallback((next, meta) => {
    if (typeof onValueChange === 'function') onValueChange(next, meta);
  }, debounceMs);

  const handleChange = (e) => {
    if (typeof onChange === 'function') onChange(e);

    const raw = e?.target?.value ?? '';
    const filtered = applyPatternRules(raw, {
      allowPattern,
      blockPattern,
      prevValue: value ?? defaultValue,
    });

    if (filtered !== raw) {
      // Mutate value back for better UX (optional but useful)
      try {
        e.target.value = filtered;
      } catch {
        // ignore
      }
    }

    if (emitOnChange) {
      debouncedEmit(filtered, { event: e, source: 'change' });
    }
  };

  const handleBlur = async (e) => {
    if (typeof onBlur === 'function') onBlur(e);

    const raw = e?.target?.value ?? '';
    const filtered = applyPatternRules(raw, { allowPattern, blockPattern });

    const final = applyTransforms(filtered, { trim, normalizeWhitespace, transform });

    if (final !== raw) {
      try {
        e.target.value = final;
      } catch {
        // ignore
      }

      // Jika controlled, user biasanya update via onValueChange
      if (emitOnChange || emitOnBlur) {
        const res = debouncedEmit(final, { event: e, source: 'blur' });
        if (isThenable(res)) await res;
      }
    } else if (emitOnBlur) {
      debouncedEmit(final, { event: e, source: 'blur' });
    }
  };

  const handlePressEnter = (e) => {
    if (typeof onPressEnter === 'function') onPressEnter(e);
    if (typeof onEnter === 'function') onEnter(e);
  };

  const inputNode = (
    <Input
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      allowClear={finalAllowClear}
      size={pickedSize}
      status={computedStatus}
      className={className}
      style={{
        width: block ? '100%' : undefined,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      onPressEnter={handlePressEnter}
      onFocus={(e) => {
        if (autoSelectOnFocus) {
          try {
            e?.target?.select?.();
          } catch {
            // ignore
          }
        }
        if (typeof rest.onFocus === 'function') rest.onFocus(e);
      }}
      {...rest}
    />
  );

  return withTooltipWrapper(inputNode, tooltipCfg);
});

export const AppPassword = React.forwardRef(function AppPassword({ tooltip, disabledReason, clearable = true, allowClear, size, style, className, status, error, block = true, ...rest }, ref) {
  const screens = Grid.useBreakpoint();
  const pickedSize = pickResponsive(size, screens);
  const computedStatus = status ?? (error ? 'error' : undefined);
  const disabled = Boolean(rest.disabled);

  const tooltipCfg = normalizeTooltip(tooltip, disabled, disabledReason);
  const finalAllowClear = allowClear ?? clearable;

  const node = (
    <Input.Password
      ref={ref}
      allowClear={finalAllowClear}
      size={pickedSize}
      status={computedStatus}
      className={className}
      style={{
        width: block ? '100%' : undefined,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      {...rest}
    />
  );

  return withTooltipWrapper(node, tooltipCfg);
});

export const AppTextArea = React.forwardRef(function AppTextArea(
  {
    value,
    defaultValue,
    onValueChange,
    onChange,
    onBlur,

    debounceMs = 0,
    emitOnChange = true,
    emitOnBlur = false,

    trim = false,
    normalizeWhitespace = false,
    transform,
    allowPattern,
    blockPattern,

    tooltip,
    disabledReason,

    clearable = true,
    allowClear,

    autoSize = { minRows: 3, maxRows: 8 },

    size,
    status,
    error,

    block = true,
    style,
    className,

    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();
  const pickedSize = pickResponsive(size, screens);
  const computedStatus = status ?? (error ? 'error' : undefined);
  const disabled = Boolean(rest.disabled);

  const tooltipCfg = normalizeTooltip(tooltip, disabled, disabledReason);
  const finalAllowClear = allowClear ?? clearable;

  const debouncedEmit = useDebouncedCallback((next, meta) => {
    if (typeof onValueChange === 'function') onValueChange(next, meta);
  }, debounceMs);

  const handleChange = (e) => {
    if (typeof onChange === 'function') onChange(e);

    const raw = e?.target?.value ?? '';
    const filtered = applyPatternRules(raw, { allowPattern, blockPattern });

    if (filtered !== raw) {
      try {
        e.target.value = filtered;
      } catch {
        // ignore
      }
    }

    if (emitOnChange) debouncedEmit(filtered, { event: e, source: 'change' });
  };

  const handleBlur = (e) => {
    if (typeof onBlur === 'function') onBlur(e);

    const raw = e?.target?.value ?? '';
    const filtered = applyPatternRules(raw, { allowPattern, blockPattern });
    const final = applyTransforms(filtered, { trim, normalizeWhitespace, transform });

    if (final !== raw) {
      try {
        e.target.value = final;
      } catch {
        // ignore
      }
      if (emitOnChange || emitOnBlur) debouncedEmit(final, { event: e, source: 'blur' });
      return;
    }

    if (emitOnBlur) debouncedEmit(final, { event: e, source: 'blur' });
  };

  const node = (
    <Input.TextArea
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      allowClear={finalAllowClear}
      autoSize={autoSize}
      size={pickedSize}
      status={computedStatus}
      className={className}
      style={{
        width: block ? '100%' : undefined,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      {...rest}
    />
  );

  return withTooltipWrapper(node, tooltipCfg);
});

export const AppSearch = React.forwardRef(function AppSearch(
  {
    value,
    defaultValue,
    onValueChange,
    onSearch,
    onChange,

    debounceMs = 0,
    emitOnChange = false, // default: Search biasanya emit saat search
    trimOnSearch = true,

    tooltip,
    disabledReason,

    clearable = true,
    allowClear,

    size,
    status,
    error,

    block = true,
    style,
    className,

    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();
  const pickedSize = pickResponsive(size, screens);
  const computedStatus = status ?? (error ? 'error' : undefined);
  const disabled = Boolean(rest.disabled);

  const tooltipCfg = normalizeTooltip(tooltip, disabled, disabledReason);
  const finalAllowClear = allowClear ?? clearable;

  const debouncedEmit = useDebouncedCallback((next, meta) => {
    if (typeof onValueChange === 'function') onValueChange(next, meta);
  }, debounceMs);

  const handleChange = (e) => {
    if (typeof onChange === 'function') onChange(e);
    const raw = e?.target?.value ?? '';
    if (emitOnChange) debouncedEmit(raw, { event: e, source: 'change' });
  };

  const handleSearch = (val, e, info) => {
    const v = trimOnSearch ? normalizeString(val).trim() : normalizeString(val);
    if (typeof onSearch === 'function') onSearch(v, e, info);
    if (typeof onValueChange === 'function') onValueChange(v, { event: e, source: 'search' });
  };

  const node = (
    <Input.Search
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      allowClear={finalAllowClear}
      size={pickedSize}
      status={computedStatus}
      className={className}
      style={{
        width: block ? '100%' : undefined,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
      onChange={handleChange}
      onSearch={handleSearch}
      {...rest}
    />
  );

  return withTooltipWrapper(node, tooltipCfg);
});

export function AppInputField({ label, required, extra, help, error, tooltip, disabledReason, inputProps, ...props }) {
  return (
    <FieldChrome
      label={label}
      required={required}
      extra={extra}
      help={help}
      error={error}
    >
      <AppInput
        tooltip={tooltip}
        disabledReason={disabledReason}
        error={error}
        {...(inputProps ?? null)}
        {...props}
      />
    </FieldChrome>
  );
}

export function AppTextAreaField({ label, required, extra, help, error, tooltip, disabledReason, inputProps, ...props }) {
  return (
    <FieldChrome
      label={label}
      required={required}
      extra={extra}
      help={help}
      error={error}
    >
      <AppTextArea
        tooltip={tooltip}
        disabledReason={disabledReason}
        error={error}
        {...(inputProps ?? null)}
        {...props}
      />
    </FieldChrome>
  );
}

export function AppPasswordField({ label, required, extra, help, error, tooltip, disabledReason, inputProps, ...props }) {
  return (
    <FieldChrome
      label={label}
      required={required}
      extra={extra}
      help={help}
      error={error}
    >
      <AppPassword
        tooltip={tooltip}
        disabledReason={disabledReason}
        error={error}
        {...(inputProps ?? null)}
        {...props}
      />
    </FieldChrome>
  );
}

AppInput.Password = AppPassword;
AppInput.TextArea = AppTextArea;
AppInput.Search = AppSearch;
AppInput.Field = AppInputField;

export default AppInput;
