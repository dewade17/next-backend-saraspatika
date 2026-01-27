'use client';

import React from 'react';
import { App as AntdApp, Form, Typography, Alert, Modal } from 'antd';
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

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function trimDeep(value, options) {
  const emptyToUndefined = options?.emptyToUndefined === true;

  if (typeof value === 'string') {
    const t = value.trim();
    return emptyToUndefined && t === '' ? undefined : t;
  }

  if (Array.isArray(value)) return value.map((v) => trimDeep(v, options));

  if (!value || typeof value !== 'object') return value;

  if (!isPlainObject(value)) return value;

  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = trimDeep(v, options);
  return out;
}

function pickByPaths(values, includePaths) {
  if (!Array.isArray(includePaths) || includePaths.length === 0) return values;

  const out = {};
  for (const p of includePaths) {
    const path = Array.isArray(p) ? p : String(p).split('.');
    let src = values;
    let dst = out;

    for (let i = 0; i < path.length; i += 1) {
      const key = path[i];
      if (src == null || typeof src !== 'object') break;

      if (i === path.length - 1) {
        dst[key] = src[key];
      } else {
        if (dst[key] == null || typeof dst[key] !== 'object') dst[key] = {};
        dst = dst[key];
        src = src[key];
      }
    }
  }

  return out;
}

function zodToAntdFieldErrors(schemaResult) {
  const issues = schemaResult?.error?.issues;
  if (!Array.isArray(issues) || issues.length === 0) return [];

  return issues.map((it) => ({
    name: Array.isArray(it.path) && it.path.length > 0 ? it.path : ['_form'],
    errors: [String(it.message ?? 'Invalid value')],
  }));
}

function normalizeDotPath(path) {
  if (Array.isArray(path)) return path;
  if (typeof path === 'string') return path.split('.').filter(Boolean);
  return null;
}

function normalizeAnyFieldErrors(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    const arr = input
      .map((it) => {
        if (!it) return null;
        if (Array.isArray(it.name) && Array.isArray(it.errors)) return { name: it.name, errors: it.errors.map(String) };
        if (typeof it.name === 'string' && Array.isArray(it.errors)) return { name: normalizeDotPath(it.name) ?? [it.name], errors: it.errors.map(String) };
        return null;
      })
      .filter(Boolean);
    return arr.length > 0 ? arr : [];
  }

  if (typeof input === 'object') {
    const entries = Object.entries(input);
    if (entries.length === 0) return [];
    return entries
      .map(([k, v]) => {
        const name = normalizeDotPath(k) ?? [k];
        if (v == null) return null;
        if (Array.isArray(v)) return { name, errors: v.map(String) };
        return { name, errors: [String(v)] };
      })
      .filter(Boolean);
  }

  return [];
}

function extractSubmitFieldErrors(err) {
  const direct = normalizeAnyFieldErrors(err?.fieldErrors);
  if (direct.length > 0) return direct;

  const nested = normalizeAnyFieldErrors(err?.response?.data?.fieldErrors);
  if (nested.length > 0) return nested;

  const alt = normalizeAnyFieldErrors(err?.response?.data?.errors);
  if (alt.length > 0) return alt;

  return [];
}

function safeJsonStringify(value) {
  const seen = new WeakSet();

  try {
    return JSON.stringify(value, (k, v) => {
      if (typeof v === 'bigint') return v.toString();
      if (typeof v === 'function' || typeof v === 'symbol') return undefined;
      if (v && typeof v === 'object') {
        if (typeof File !== 'undefined' && v instanceof File) return undefined;
        if (typeof Blob !== 'undefined' && v instanceof Blob) return undefined;
        if (v instanceof Date) return v.toISOString();
        if (seen.has(v)) return undefined;
        seen.add(v);
      }
      return v;
    });
  } catch {
    return null;
  }
}

async function runConfirm(confirm) {
  if (!confirm) return true;

  const cfg = typeof confirm === 'string' || React.isValidElement(confirm) ? { title: confirm } : typeof confirm === 'object' ? confirm : null;

  if (!cfg) return true;

  return new Promise((resolve) => {
    Modal.confirm({
      title: cfg.title ?? 'Yakin?',
      content: cfg.content ?? cfg.description,
      okText: cfg.okText ?? 'Ya',
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

function focusFirstError(form, errorInfo) {
  const fields = errorInfo?.errorFields;
  if (!Array.isArray(fields) || fields.length === 0) return;

  const first = fields[0]?.name;
  if (!first) return;

  try {
    form?.scrollToField?.(first, { block: 'center' });
  } catch {}

  try {
    const inst = form?.getFieldInstance?.(first);
    if (inst && typeof inst.focus === 'function') {
      inst.focus();
      return;
    }
  } catch {}

  try {
    const flat = Array.isArray(first) ? first.join('.') : String(first);
    const el = document.querySelector(`[name="${flat}"]`) || document.querySelector(`[id$="${flat}"]`) || document.querySelector('input,textarea,select');
    if (el && typeof el.focus === 'function') el.focus();
  } catch {}
}

function deepMerge(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) return override;

  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (isPlainObject(v) && isPlainObject(base[k])) out[k] = deepMerge(base[k], v);
    else out[k] = v;
  }
  return out;
}

function mergeInitialValues(initialValues, persisted) {
  if (!persisted || typeof persisted !== 'object') return initialValues ?? {};
  if (!initialValues || typeof initialValues !== 'object') return persisted;
  return deepMerge(initialValues, persisted);
}

export function useAppForm(formInstance) {
  const [form] = Form.useForm(formInstance);
  return form;
}

export function AppFormErrorSummary({ errors, title = 'Periksa kembali form kamu', style, className }) {
  const list = Array.isArray(errors) ? errors : [];
  if (list.length === 0) return null;

  const items = list
    .map((f) => {
      const name = f?.name;
      const msg = Array.isArray(f?.errors) ? f.errors[0] : null;
      const key = Array.isArray(name) ? name.join('.') : String(name ?? '');
      return msg ? { key, msg } : null;
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <Alert
      type='error'
      showIcon
      className={className}
      style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
      message={title}
      description={
        <ul style={{ margin: 0, paddingInlineStart: 18 }}>
          {items.map((it) => (
            <li
              key={it.key}
              style={{ marginBlock: 2 }}
            >
              {it.msg}
            </li>
          ))}
        </ul>
      }
    />
  );
}

export const AppForm = React.forwardRef(function AppForm(
  {
    form: formProp,
    name,

    layout = 'vertical',
    requiredMark = true,
    colon = false,

    initialValues,
    preserve,
    validateTrigger = 'onBlur',

    onSubmit,
    onFinish,
    onFinishFailed,
    onError,

    schema,
    autoTrim = true,
    trimOptions,
    transformValues,
    beforeSubmit,
    confirm,

    submitting,
    setSubmitting,

    feedback,
    feedbackKey,
    resetOnSuccess = false,

    persistKey,
    persistDebounceMs = 300,
    persistInclude,

    autoFocusError = true,
    scrollToFirstError = true,
    errorSummary = false,

    children,
    style,
    className,

    ...rest
  },
  ref,
) {
  const { message } = AntdApp.useApp();

  const [innerForm] = Form.useForm(formProp);
  const form = formProp ?? innerForm;

  const [innerSubmitting, setInnerSubmitting] = React.useState(false);
  const isSubmitting = submitting ?? innerSubmitting;

  const [lastErrorFields, setLastErrorFields] = React.useState([]);

  const persistTimerRef = React.useRef(null);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    if (!persistKey) return;
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(persistKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const merged = mergeInitialValues(initialValues, parsed);
      form.setFieldsValue(merged);
    } catch {}
  }, [form, initialValues, persistKey]);

  const handleValuesChange = (changed, all) => {
    if (!persistKey || typeof window === 'undefined') return;
    if (!mountedRef.current) return;

    try {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => {
        try {
          const picked = pickByPaths(all, persistInclude);
          const raw = safeJsonStringify(picked);
          if (raw != null) window.localStorage.setItem(persistKey, raw);
        } catch {}
      }, persistDebounceMs);
    } catch {}
  };

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  const setSubmittingSafe = (next) => {
    if (typeof setSubmitting === 'function') setSubmitting(next);
    else setInnerSubmitting(next);
  };

  const doSubmit = async (values) => {
    const fb = normalizeFeedback(feedback);
    const msgKey = feedbackKey ?? `appform_${Date.now()}`;

    const showLoading = fb?.loading;
    if (showLoading) {
      message.open({ type: 'loading', content: fb.loading, key: msgKey });
    }

    try {
      const handler = onSubmit ?? onFinish;
      const result = handler ? handler(values) : undefined;
      const resolved = isThenable(result) ? await result : result;

      if (showLoading) {
        if (fb?.success) message.open({ type: 'success', content: fb.success, key: msgKey });
        else message.destroy(msgKey);
      } else if (fb?.success) {
        message.success(fb.success);
      }

      if (resetOnSuccess) form.resetFields();

      if (persistKey && typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(persistKey);
        } catch {}
      }

      return resolved;
    } catch (err) {
      if (showLoading) message.destroy(msgKey);
      if (fb?.error) message.error(fb.error);
      throw err;
    }
  };

  const handleFinish = async (rawValues) => {
    const ok = await runConfirm(confirm);
    if (!ok) return;

    setSubmittingSafe(true);
    setLastErrorFields([]);

    try {
      let values = rawValues;

      if (autoTrim) values = trimDeep(values, trimOptions);
      if (typeof transformValues === 'function') values = transformValues(values);
      if (typeof beforeSubmit === 'function') {
        const res = beforeSubmit(values);
        values = isThenable(res) ? await res : res;
      }

      if (schema && typeof schema.safeParse === 'function') {
        const parsed = schema.safeParse(values);
        if (!parsed?.success) {
          const fieldErrors = zodToAntdFieldErrors(parsed);
          setLastErrorFields(fieldErrors);
          if (fieldErrors.length > 0) form.setFields(fieldErrors);

          if (scrollToFirstError) {
            try {
              form.scrollToField(fieldErrors[0].name, { block: 'center' });
            } catch {}
          }
          if (autoFocusError) focusFirstError(form, { errorFields: fieldErrors });
          return;
        }
        values = parsed.data;
      }

      await doSubmit(values);
    } catch (err) {
      const fieldErrors = extractSubmitFieldErrors(err);
      if (fieldErrors.length > 0) {
        setLastErrorFields(fieldErrors);
        try {
          form.setFields(fieldErrors);
        } catch {}

        if (scrollToFirstError) {
          try {
            form.scrollToField(fieldErrors[0].name, { block: 'center' });
          } catch {}
        }
        if (autoFocusError) focusFirstError(form, { errorFields: fieldErrors });
      }

      if (typeof onError === 'function') onError(err);
      else if (typeof rest?.onError === 'function') rest.onError(err);
      else {
        const fb = normalizeFeedback(feedback);
        if (!fb?.error) message.error(toErrorMessage(err));
      }
    } finally {
      setSubmittingSafe(false);
    }
  };

  const handleFinishFailed = (errorInfo) => {
    const errFields = errorInfo?.errorFields ?? [];
    setLastErrorFields(errFields);

    if (scrollToFirstError) {
      try {
        const first = errFields?.[0]?.name;
        if (first) form.scrollToField(first, { block: 'center' });
      } catch {}
    }
    if (autoFocusError) focusFirstError(form, errorInfo);

    if (typeof onFinishFailed === 'function') onFinishFailed(errorInfo);
  };

  const computedInitialValues = React.useMemo(() => {
    return initialValues;
  }, [initialValues]);

  return (
    <div style={{ width: '100%' }}>
      {errorSummary ? <AppFormErrorSummary errors={lastErrorFields} /> : null}

      <Form
        ref={ref}
        form={form}
        name={name}
        layout={layout}
        requiredMark={requiredMark}
        colon={colon}
        initialValues={computedInitialValues}
        preserve={preserve}
        validateTrigger={validateTrigger}
        onValuesChange={handleValuesChange}
        onFinish={handleFinish}
        onFinishFailed={handleFinishFailed}
        style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
        className={className}
        {...rest}
      >
        {typeof children === 'function' ? children({ form, submitting: isSubmitting }) : children}
      </Form>
    </div>
  );
});

export function AppFormItem({ label, tooltip, required, help, extra, style, labelStyle, children, ...rest }) {
  return (
    <Form.Item
      label={label != null ? <span style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(labelStyle ?? null) }}>{label}</span> : null}
      tooltip={tooltip}
      required={required}
      help={help}
      extra={extra}
      style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
      {...rest}
    >
      {children}
    </Form.Item>
  );
}

export function AppFormSection({ title, description, extra, children, style, className }) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBlock: 12,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
    >
      {title || description || extra ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {title ? (
              <Typography.Title
                level={5}
                style={{ margin: 0, fontFamily: DEFAULT_FONT_FAMILY }}
              >
                {title}
              </Typography.Title>
            ) : null}
            {description ? (
              <Typography.Text
                type='secondary'
                style={{ fontFamily: DEFAULT_FONT_FAMILY }}
              >
                {description}
              </Typography.Text>
            ) : null}
          </div>
          {extra ? <div>{extra}</div> : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

export function AppFormActions({ children, align = 'right', gap = 10, style, className }) {
  const justifyContent = align === 'left' ? 'flex-start' : align === 'center' ? 'center' : align === 'between' ? 'space-between' : 'flex-end';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap,
        justifyContent,
        alignItems: 'center',
        marginTop: 12,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
    >
      {children}
    </div>
  );
}

export function AppFormSubmitButton({ form, children = 'Simpan', onPress, htmlType = 'submit', loading, disabled, ...props }) {
  const handlePress = async () => {
    if (!form) return onPress?.();
    await form.validateFields();
    return onPress?.();
  };

  return (
    <AppButton
      type='primary'
      htmlType={htmlType}
      loading={loading}
      disabled={disabled}
      onPress={onPress ? handlePress : undefined}
      {...props}
    >
      {children}
    </AppButton>
  );
}

AppForm.Item = AppFormItem;
AppForm.List = Form.List;
AppForm.Provider = Form.Provider;
AppForm.useForm = useAppForm;
AppForm.useWatch = Form.useWatch;
AppForm.ErrorSummary = AppFormErrorSummary;
AppForm.Section = AppFormSection;
AppForm.Actions = AppFormActions;
AppForm.SubmitButton = AppFormSubmitButton;

export default AppForm;
