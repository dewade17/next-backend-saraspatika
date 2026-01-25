'use client';

import React from 'react';
import { App as AntdApp, DatePicker, Tooltip, Grid } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';
const BP_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
const BP_ORDER = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];

function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

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

function inferFormat({ picker, showTime, format }) {
  if (format) return format;

  const p = String(picker ?? 'date').toLowerCase();

  if (p === 'time') return 'HH:mm:ss';
  if (p === 'month') return 'YYYY-MM';
  if (p === 'quarter') return 'YYYY-[Q]Q';
  if (p === 'year') return 'YYYY';
  if (p === 'week') return 'GGGG-[W]WW';

  if (showTime) return 'YYYY-MM-DD HH:mm:ss';
  return 'YYYY-MM-DD';
}

function toDayjs(value, { inputFormat } = {}) {
  if (value == null || value === '') return null;

  if (dayjs.isDayjs(value)) return value;

  if (value instanceof Date) {
    const d = dayjs(value);
    return d.isValid() ? d : null;
  }

  if (isNumber(value)) {
    const d = dayjs(value);
    return d.isValid() ? d : null;
  }

  if (typeof value === 'string') {
    const d = inputFormat ? dayjs(value, inputFormat, true) : dayjs(value);
    return d.isValid() ? d : null;
  }

  return null;
}

function toDayjsRange(value, opts) {
  if (!Array.isArray(value)) return null;
  const a = toDayjs(value[0], opts);
  const b = toDayjs(value[1], opts);
  if (!a && !b) return null;
  return [a, b];
}

function convertOutput(d, { valueType, valueFormat }) {
  if (!d) return null;

  const t = String(valueType ?? 'dayjs').toLowerCase();
  if (t === 'dayjs') return d;
  if (t === 'date') return d.toDate();
  if (t === 'iso') return d.toISOString();
  if (t === 'string') return d.format(valueFormat);
  return d;
}

function convertRangeOutput(range, { valueType, valueFormat }) {
  if (!range) return null;
  const [a, b] = range;
  return [convertOutput(a, { valueType, valueFormat }), convertOutput(b, { valueType, valueFormat })];
}

function buildDisabledDate({ min, max, disablePast, disableFuture, inputFormat, userDisabledDate }) {
  const minD = toDayjs(min, { inputFormat });
  const maxD = toDayjs(max, { inputFormat });

  const hasRules = Boolean(minD || maxD || disablePast || disableFuture || userDisabledDate);

  if (!hasRules) return undefined;

  return (current) => {
    if (!current) return false;

    const c = dayjs.isDayjs(current) ? current : dayjs(current);

    if (minD && c.endOf('day').isBefore(minD.startOf('day'))) return true;
    if (maxD && c.startOf('day').isAfter(maxD.endOf('day'))) return true;

    if (disablePast && c.endOf('day').isBefore(dayjs().startOf('day'))) return true;
    if (disableFuture && c.startOf('day').isAfter(dayjs().endOf('day'))) return true;

    if (typeof userDisabledDate === 'function') return Boolean(userDisabledDate(current));
    return false;
  };
}

function defaultSinglePresets(picker) {
  const p = String(picker ?? 'date').toLowerCase();
  if (p !== 'date' && p !== 'month' && p !== 'year') return undefined;

  const now = dayjs();
  if (p === 'year') {
    return [
      { label: 'Tahun ini', value: now.startOf('year') },
      { label: 'Tahun lalu', value: now.subtract(1, 'year').startOf('year') },
    ];
  }

  if (p === 'month') {
    return [
      { label: 'Bulan ini', value: now.startOf('month') },
      { label: 'Bulan lalu', value: now.subtract(1, 'month').startOf('month') },
    ];
  }

  return [
    { label: 'Hari ini', value: now },
    { label: 'Kemarin', value: now.subtract(1, 'day') },
    { label: '7 hari lalu', value: now.subtract(7, 'day') },
    { label: 'Awal bulan', value: now.startOf('month') },
    { label: 'Akhir bulan', value: now.endOf('month') },
  ];
}

function defaultRangePresets(picker) {
  const p = String(picker ?? 'date').toLowerCase();
  if (p !== 'date') return undefined;

  const now = dayjs();
  const todayStart = now.startOf('day');
  const todayEnd = now.endOf('day');

  return [
    { label: 'Hari ini', value: [todayStart, todayEnd] },
    { label: 'Kemarin', value: [todayStart.subtract(1, 'day'), todayEnd.subtract(1, 'day')] },
    { label: '7 hari terakhir', value: [todayStart.subtract(6, 'day'), todayEnd] },
    { label: '30 hari terakhir', value: [todayStart.subtract(29, 'day'), todayEnd] },
    { label: 'Bulan ini', value: [now.startOf('month'), now.endOf('month')] },
    { label: 'Bulan lalu', value: [now.subtract(1, 'month').startOf('month'), now.subtract(1, 'month').endOf('month')] },
  ];
}

function withTooltipWrapper(node, tooltipCfg, disabled) {
  if (!tooltipCfg?.title) return node;

  // Tooltip butuh wrapper supaya tetap muncul saat disabled
  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: 'inline-block', width: '100%' }}>{node}</span>
    </Tooltip>
  );
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

export const AppDatePicker = React.forwardRef(function AppDatePicker(
  {
    value,
    defaultValue,
    inputFormat,

    valueType = 'dayjs', // dayjs | date | string | iso
    valueFormat, // default auto (berdasarkan picker/showTime)
    onValueChange, // (val, meta) => void

    tooltip,
    disabledReason,

    min,
    max,
    disablePast = false,
    disableFuture = false,
    disabledDate,

    presets, // true | 'default' | array
    feedback, // boolean | { loading, success, error }
    autoFeedback = false,

    clearable = true,
    allowClear,

    status, // antd: 'error'|'warning'
    error, // alias status=error + text (kalau dipakai Field)
    size,
    style,
    className,

    picker = 'date',
    showTime,

    name, // optional hidden input for html form
    hiddenInput = false,

    onChange,
    onOpenChange,
    onCalendarChange,
    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();
  const { message } = AntdApp.useApp();

  const pickedSize = pickResponsive(size, screens);

  const fmt = inferFormat({ picker, showTime, format: valueFormat });

  const djValue = toDayjs(value, { inputFormat });
  const djDefault = toDayjs(defaultValue, { inputFormat });

  const computedDisabledDate = buildDisabledDate({
    min,
    max,
    disablePast,
    disableFuture,
    inputFormat,
    userDisabledDate: disabledDate,
  });

  const tooltipCfg = normalizeTooltip(tooltip, Boolean(rest.disabled), disabledReason);

  const computedPresets = (() => {
    if (!presets) return undefined;
    if (presets === true || presets === 'default') return defaultSinglePresets(picker);
    if (Array.isArray(presets)) return presets;
    return undefined;
  })();

  const finalAllowClear = allowClear ?? clearable;

  const computedStatus = (() => {
    if (status) return status;
    if (error) return 'error';
    return undefined;
  })();

  const handleChange = (next, dateString) => {
    if (typeof onChange === 'function') onChange(next, dateString);

    if (typeof onValueChange === 'function') {
      const out = convertOutput(next, { valueType, valueFormat: fmt });
      onValueChange(out, {
        dayjsValue: next,
        dateString,
        valueType,
        valueFormat: fmt,
      });
    }

    if (autoFeedback && feedback) {
      const cfg = feedback === true ? {} : feedback;
      const successMsg = typeof cfg === 'object' ? cfg.success : undefined;
      if (successMsg) message.success(successMsg);
    }
  };

  const node = (
    <div style={{ width: '100%' }}>
      <DatePicker
        ref={ref}
        value={djValue}
        defaultValue={djDefault}
        picker={picker}
        showTime={showTime}
        format={fmt}
        presets={computedPresets}
        allowClear={finalAllowClear}
        disabledDate={computedDisabledDate}
        status={computedStatus}
        size={pickedSize}
        className={className}
        style={{ width: '100%', fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
        onChange={handleChange}
        onOpenChange={onOpenChange}
        onCalendarChange={onCalendarChange}
        inputReadOnly={rest.inputReadOnly ?? true}
        {...rest}
      />

      {hiddenInput && name ? (
        <input
          type='hidden'
          name={name}
          value={djValue ? (String(valueType).toLowerCase() === 'iso' ? djValue.toISOString() : djValue.format(fmt)) : ''}
          readOnly
        />
      ) : null}
    </div>
  );

  return withTooltipWrapper(node, tooltipCfg, Boolean(rest.disabled));
});

export const AppRangePicker = React.forwardRef(function AppRangePicker(
  {
    value,
    defaultValue,
    inputFormat,

    valueType = 'dayjs', // dayjs | date | string | iso
    valueFormat,
    onValueChange,

    tooltip,
    disabledReason,

    min,
    max,
    disablePast = false,
    disableFuture = false,
    disabledDate,

    presets,
    feedback,
    autoFeedback = false,

    clearable = true,
    allowClear,

    status,
    error,

    size,
    style,
    className,

    picker = 'date',
    showTime,

    name, // optional hidden input for html form
    hiddenInput = false,
    hiddenJoin = '|',

    onChange,
    onOpenChange,
    onCalendarChange,
    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();
  const { message } = AntdApp.useApp();

  const pickedSize = pickResponsive(size, screens);

  const fmt = inferFormat({ picker, showTime, format: valueFormat });

  const djValue = toDayjsRange(value, { inputFormat });
  const djDefault = toDayjsRange(defaultValue, { inputFormat });

  const computedDisabledDate = buildDisabledDate({
    min,
    max,
    disablePast,
    disableFuture,
    inputFormat,
    userDisabledDate: disabledDate,
  });

  const tooltipCfg = normalizeTooltip(tooltip, Boolean(rest.disabled), disabledReason);

  const computedPresets = (() => {
    if (!presets) return undefined;
    if (presets === true || presets === 'default') return defaultRangePresets(picker);
    if (Array.isArray(presets)) return presets;
    return undefined;
  })();

  const finalAllowClear = allowClear ?? clearable;

  const computedStatus = (() => {
    if (status) return status;
    if (error) return 'error';
    return undefined;
  })();

  const handleChange = (next, dateStrings) => {
    if (typeof onChange === 'function') onChange(next, dateStrings);

    if (typeof onValueChange === 'function') {
      const out = convertRangeOutput(next, { valueType, valueFormat: fmt });
      onValueChange(out, {
        dayjsValue: next,
        dateStrings,
        valueType,
        valueFormat: fmt,
      });
    }

    if (autoFeedback && feedback) {
      const cfg = feedback === true ? {} : feedback;
      const successMsg = typeof cfg === 'object' ? cfg.success : undefined;
      if (successMsg) message.success(successMsg);
    }
  };

  const node = (
    <div style={{ width: '100%' }}>
      <DatePicker.RangePicker
        ref={ref}
        value={djValue ?? undefined}
        defaultValue={djDefault ?? undefined}
        picker={picker}
        showTime={showTime}
        format={fmt}
        presets={computedPresets}
        allowClear={finalAllowClear}
        disabledDate={computedDisabledDate}
        status={computedStatus}
        size={pickedSize}
        className={className}
        style={{ width: '100%', fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
        onChange={handleChange}
        onOpenChange={onOpenChange}
        onCalendarChange={onCalendarChange}
        inputReadOnly={rest.inputReadOnly ?? true}
        {...rest}
      />

      {hiddenInput && name ? (
        <input
          type='hidden'
          name={name}
          value={
            djValue && Array.isArray(djValue)
              ? [
                  djValue[0] ? (String(valueType).toLowerCase() === 'iso' ? djValue[0].toISOString() : djValue[0].format(fmt)) : '',
                  djValue[1] ? (String(valueType).toLowerCase() === 'iso' ? djValue[1].toISOString() : djValue[1].format(fmt)) : '',
                ].join(hiddenJoin)
              : ''
          }
          readOnly
        />
      ) : null}
    </div>
  );

  return withTooltipWrapper(node, tooltipCfg, Boolean(rest.disabled));
});

export function AppDatePickerField({ label, required, extra, help, error, tooltip, disabledReason, ...props }) {
  return (
    <FieldChrome
      label={label}
      required={required}
      extra={extra}
      help={help}
      error={error}
    >
      <AppDatePicker
        tooltip={tooltip}
        disabledReason={disabledReason}
        error={error}
        {...props}
      />
    </FieldChrome>
  );
}

export function AppRangePickerField({ label, required, extra, help, error, tooltip, disabledReason, ...props }) {
  return (
    <FieldChrome
      label={label}
      required={required}
      extra={extra}
      help={help}
      error={error}
    >
      <AppRangePicker
        tooltip={tooltip}
        disabledReason={disabledReason}
        error={error}
        {...props}
      />
    </FieldChrome>
  );
}

export default AppDatePicker;
