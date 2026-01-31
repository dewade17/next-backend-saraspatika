'use client';

import React from 'react';
import { App as AntdApp, TimePicker, Tooltip, Grid } from 'antd';
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

function withTooltipWrapper(node, tooltipCfg, disabled) {
  if (!tooltipCfg?.title) return node;

  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: 'inline-block', width: '100%', cursor: disabled ? 'not-allowed' : 'inherit' }}>{node}</span>
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

function inferFormat({ format, showSecond, use12Hours }) {
  if (format) return format;

  const withSecond = Boolean(showSecond);
  if (use12Hours) return withSecond ? 'hh:mm:ss A' : 'hh:mm A';
  return withSecond ? 'HH:mm:ss' : 'HH:mm';
}

function toDayjsTime(value, { inputFormat, fallbackFormats } = {}) {
  if (value == null || value === '') return null;

  if (dayjs.isDayjs(value)) return value.isValid() ? value : null;

  if (value instanceof Date) {
    const d = dayjs(value);
    return d.isValid() ? d : null;
  }

  if (isNumber(value)) {
    const d = dayjs(value);
    return d.isValid() ? d : null;
  }

  if (typeof value === 'string') {
    const v = value.trim();
    if (!v) return null;

    if (inputFormat) {
      const d = dayjs(v, inputFormat, true);
      return d.isValid() ? d : null;
    }

    const fmts = Array.isArray(fallbackFormats) && fallbackFormats.length ? fallbackFormats : ['HH:mm', 'HH:mm:ss', 'hh:mm A', 'hh:mm:ss A'];

    for (const f of fmts) {
      const d = dayjs(v, f, true);
      if (d.isValid()) return d;
    }

    const loose = dayjs(v);
    return loose.isValid() ? loose : null;
  }

  return null;
}

function toDayjsTimeRange(value, opts) {
  if (!Array.isArray(value)) return null;
  const a = toDayjsTime(value[0], opts);
  const b = toDayjsTime(value[1], opts);
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

function timeToSeconds(d) {
  if (!d) return null;
  const dj = dayjs.isDayjs(d) ? d : dayjs(d);
  if (!dj.isValid()) return null;
  return dj.hour() * 3600 + dj.minute() * 60 + dj.second();
}

function buildDisabledTime({ min, max, disablePast, disableFuture, inputFormat, fallbackFormats, userDisabledTime }) {
  const minD = toDayjsTime(min, { inputFormat, fallbackFormats });
  const maxD = toDayjsTime(max, { inputFormat, fallbackFormats });

  const minSec = timeToSeconds(minD);
  const maxSec = timeToSeconds(maxD);

  const hasRules = Boolean(minSec != null || maxSec != null || disablePast || disableFuture || userDisabledTime);
  if (!hasRules) return undefined;

  return (current) => {
    if (typeof userDisabledTime === 'function') {
      const res = userDisabledTime(current);
      if (res) return res;
    }

    const now = dayjs();
    const cur = current && dayjs.isDayjs(current) ? current : dayjs(current);

    const curSec = cur && cur.isValid() ? timeToSeconds(cur) : null;
    const nowSec = timeToSeconds(now);

    const lower = minSec != null ? minSec : null;
    const upper = maxSec != null ? maxSec : null;

    const blockLower = disablePast && nowSec != null ? nowSec : lower;
    const blockUpper = disableFuture && nowSec != null ? nowSec : upper;

    const disabledHours = () => {
      const hours = [];
      for (let h = 0; h <= 23; h += 1) {
        const hStart = h * 3600;
        const hEnd = h * 3600 + 3599;

        if (blockLower != null && hEnd < blockLower) hours.push(h);
        else if (blockUpper != null && hStart > blockUpper) hours.push(h);
      }
      return hours;
    };

    const disabledMinutes = (selectedHour) => {
      if (selectedHour == null) return [];
      const mins = [];
      for (let m = 0; m <= 59; m += 1) {
        const mStart = selectedHour * 3600 + m * 60;
        const mEnd = mStart + 59;

        if (blockLower != null && mEnd < blockLower) mins.push(m);
        else if (blockUpper != null && mStart > blockUpper) mins.push(m);
      }
      return mins;
    };

    const disabledSeconds = (selectedHour, selectedMinute) => {
      if (selectedHour == null || selectedMinute == null) return [];
      const secs = [];
      for (let s = 0; s <= 59; s += 1) {
        const sec = selectedHour * 3600 + selectedMinute * 60 + s;
        if (blockLower != null && sec < blockLower) secs.push(s);
        else if (blockUpper != null && sec > blockUpper) secs.push(s);
      }
      return secs;
    };

    if (curSec == null) {
      return { disabledHours, disabledMinutes, disabledSeconds };
    }

    return { disabledHours, disabledMinutes, disabledSeconds };
  };
}

const AppTimePicker = React.forwardRef(function AppTimePicker(
  {
    value,
    defaultValue,
    onChange,
    onValueChange,

    valueType = 'dayjs',
    valueFormat,
    inputFormat,
    fallbackFormats,

    tooltip,
    disabledReason,
    error,

    size,
    width,
    fullWidth = true,

    format,
    showSecond,
    use12Hours,

    min,
    max,
    disablePast,
    disableFuture,
    disabledTime: userDisabledTime,

    autoFeedback,
    feedback,

    hiddenInputName,
    hiddenJoin = ' - ',

    ...rest
  },
  ref,
) {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();

  const finalSize = pickResponsive(size, screens);
  const finalWidth = pickResponsive(width, screens);

  const fmt = inferFormat({ format, showSecond, use12Hours });
  const outFmt = valueFormat || fmt;

  const djValue = React.useMemo(() => toDayjsTime(value, { inputFormat, fallbackFormats }), [value, inputFormat, fallbackFormats]);

  const djDefault = React.useMemo(() => toDayjsTime(defaultValue, { inputFormat, fallbackFormats }), [defaultValue, inputFormat, fallbackFormats]);

  const tooltipCfg = normalizeTooltip(tooltip, Boolean(rest.disabled), disabledReason);

  const disabledTime = React.useMemo(
    () =>
      buildDisabledTime({
        min,
        max,
        disablePast,
        disableFuture,
        inputFormat,
        fallbackFormats,
        userDisabledTime,
      }),
    [min, max, disablePast, disableFuture, inputFormat, fallbackFormats, userDisabledTime],
  );

  const finalAllowClear = rest.allowClear !== false;

  const handleChange = (next, timeString) => {
    if (typeof onChange === 'function') onChange(next, timeString);

    if (typeof onValueChange === 'function') {
      const out = convertOutput(next, { valueType, valueFormat: outFmt });
      onValueChange(out, {
        dayjsValue: next,
        timeString,
        valueType,
        valueFormat: outFmt,
      });
    }

    if (autoFeedback && feedback) {
      const cfg = feedback === true ? {} : feedback;
      const successMsg = typeof cfg === 'object' ? cfg.success : undefined;
      if (successMsg) message.success(successMsg);
    }
  };

  const node = (
    <div style={{ width: fullWidth ? '100%' : undefined }}>
      <TimePicker
        ref={ref}
        value={djValue}
        defaultValue={djDefault}
        format={fmt}
        use12Hours={use12Hours}
        size={finalSize}
        allowClear={finalAllowClear}
        disabledTime={disabledTime}
        status={error ? 'error' : rest.status}
        style={{
          width: fullWidth ? '100%' : finalWidth,
          fontFamily: DEFAULT_FONT_FAMILY,
          ...(rest.style || null),
        }}
        onChange={handleChange}
        {...rest}
      />

      {hiddenInputName ? (
        <input
          type='hidden'
          name={hiddenInputName}
          value={djValue ? (String(valueType).toLowerCase() === 'iso' ? djValue.toISOString() : djValue.format(outFmt)) : ''}
          readOnly
        />
      ) : null}
    </div>
  );

  return withTooltipWrapper(node, tooltipCfg, Boolean(rest.disabled));
});

export const AppTimeRangePicker = React.forwardRef(function AppTimeRangePicker(
  {
    value,
    defaultValue,
    onChange,
    onValueChange,

    valueType = 'dayjs',
    valueFormat,
    inputFormat,
    fallbackFormats,

    tooltip,
    disabledReason,
    error,

    size,
    width,
    fullWidth = true,

    format,
    showSecond,
    use12Hours,

    min,
    max,
    disablePast,
    disableFuture,
    disabledTime: userDisabledTime,

    hiddenInputName,
    hiddenJoin = ' - ',

    ...rest
  },
  ref,
) {
  const screens = Grid.useBreakpoint();

  const finalSize = pickResponsive(size, screens);
  const finalWidth = pickResponsive(width, screens);

  const fmt = inferFormat({ format, showSecond, use12Hours });
  const outFmt = valueFormat || fmt;

  const djValue = React.useMemo(() => toDayjsTimeRange(value, { inputFormat, fallbackFormats }), [value, inputFormat, fallbackFormats]);

  const djDefault = React.useMemo(() => toDayjsTimeRange(defaultValue, { inputFormat, fallbackFormats }), [defaultValue, inputFormat, fallbackFormats]);

  const tooltipCfg = normalizeTooltip(tooltip, Boolean(rest.disabled), disabledReason);

  const disabledTime = React.useMemo(
    () =>
      buildDisabledTime({
        min,
        max,
        disablePast,
        disableFuture,
        inputFormat,
        fallbackFormats,
        userDisabledTime,
      }),
    [min, max, disablePast, disableFuture, inputFormat, fallbackFormats, userDisabledTime],
  );

  const finalAllowClear = rest.allowClear !== false;

  const handleChange = (nextRange, timeStrings) => {
    if (typeof onChange === 'function') onChange(nextRange, timeStrings);

    if (typeof onValueChange === 'function') {
      const out = convertRangeOutput(nextRange, { valueType, valueFormat: outFmt });
      onValueChange(out, {
        dayjsValue: nextRange,
        timeStrings,
        valueType,
        valueFormat: outFmt,
      });
    }
  };

  const node = (
    <div style={{ width: fullWidth ? '100%' : undefined }}>
      <TimePicker.RangePicker
        ref={ref}
        value={djValue}
        defaultValue={djDefault}
        format={fmt}
        use12Hours={use12Hours}
        size={finalSize}
        allowClear={finalAllowClear}
        disabledTime={disabledTime}
        status={error ? 'error' : rest.status}
        style={{
          width: fullWidth ? '100%' : finalWidth,
          fontFamily: DEFAULT_FONT_FAMILY,
          ...(rest.style || null),
        }}
        onChange={handleChange}
        {...rest}
      />

      {hiddenInputName ? (
        <input
          type='hidden'
          name={hiddenInputName}
          value={
            djValue
              ? [
                  djValue[0] ? (String(valueType).toLowerCase() === 'iso' ? djValue[0].toISOString() : djValue[0].format(outFmt)) : '',
                  djValue[1] ? (String(valueType).toLowerCase() === 'iso' ? djValue[1].toISOString() : djValue[1].format(outFmt)) : '',
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

export function AppTimePickerField({ label, required, extra, help, error, tooltip, disabledReason, ...props }) {
  return (
    <FieldChrome
      label={label}
      required={required}
      extra={extra}
      help={help}
      error={error}
    >
      <AppTimePicker
        tooltip={tooltip}
        disabledReason={disabledReason}
        error={error}
        {...props}
      />
    </FieldChrome>
  );
}

export function AppTimeRangePickerField({ label, required, extra, help, error, tooltip, disabledReason, ...props }) {
  return (
    <FieldChrome
      label={label}
      required={required}
      extra={extra}
      help={help}
      error={error}
    >
      <AppTimeRangePicker
        tooltip={tooltip}
        disabledReason={disabledReason}
        error={error}
        {...props}
      />
    </FieldChrome>
  );
}

AppTimePicker.RangePicker = AppTimeRangePicker;
AppTimePicker.Field = AppTimePickerField;

export default AppTimePicker;
