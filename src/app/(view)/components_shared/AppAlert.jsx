'use client';

import React from 'react';
import { Alert, App as AntdApp, Space, Tooltip, Typography, theme } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isThenable(v) {
  return v != null && (typeof v === 'object' || typeof v === 'function') && typeof v.then === 'function';
}

function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
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
      <span style={{ display: 'block' }}>{node}</span>
    </Tooltip>
  );
}

function safeStringify(v) {
  try {
    if (typeof v === 'string') return v;
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function toErrorMessage(err) {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (err?.message && typeof err.message === 'string') return err.message;

  // fetch-like
  if (err?.error && typeof err.error === 'string') return err.error;

  // zod-ish
  if (err?.issues && Array.isArray(err.issues)) {
    const first = err.issues[0];
    if (first?.message) return String(first.message);
  }

  return safeStringify(err);
}

function toErrorDetails(err) {
  if (!err) return null;

  // known fields
  const stack = err?.stack;
  if (stack && typeof stack === 'string') return stack;

  // response-ish
  const data = err?.data ?? err?.response ?? err?.cause;
  if (data) return data;

  // zod issues
  if (err?.issues && Array.isArray(err.issues)) {
    return err.issues.map((it) => ({
      path: Array.isArray(it?.path) ? it.path.join('.') : it?.path,
      message: it?.message,
    }));
  }

  return err;
}

function normalizeType({ type, tone }) {
  const t = String(tone ?? type ?? 'info').toLowerCase();
  if (t === 'success') return 'success';
  if (t === 'warning') return 'warning';
  if (t === 'error' || t === 'danger') return 'error';
  return 'info';
}

function pickToneColor(tone, token) {
  const t = String(tone ?? '').toLowerCase();
  if (t === 'success') return token?.colorSuccess;
  if (t === 'warning') return token?.colorWarning;
  if (t === 'error' || t === 'danger') return token?.colorError;
  if (t === 'info') return token?.colorInfo;
  if (t === 'muted') return token?.colorSplit;
  if (t === 'primary') return token?.colorPrimary;
  return null;
}

function buildVariantStyle({ variant, toneColor, token }) {
  const v = String(variant ?? 'default').toLowerCase();

  if (v === 'soft') {
    return {
      background: token?.colorFillAlter ?? token?.colorBgLayout,
      borderColor: token?.colorBorderSecondary ?? token?.colorBorder,
      ...(toneColor ? { borderInlineStart: `4px solid ${toneColor}` } : null),
    };
  }

  if (v === 'outlined') {
    return {
      background: token?.colorBgContainer,
      borderColor: toneColor ?? token?.colorBorder,
      ...(toneColor ? { borderInlineStart: `4px solid ${toneColor}` } : null),
    };
  }

  if (v === 'ghost') {
    return {
      background: 'transparent',
      borderColor: 'transparent',
      ...(toneColor ? { borderInlineStart: `4px solid ${toneColor}` } : null),
    };
  }

  // default
  return {
    background: token?.colorBgContainer,
  };
}

function normalizeErrors(errors) {
  if (!errors) return [];
  if (Array.isArray(errors)) {
    return errors
      .map((e) => {
        if (!e) return null;
        if (typeof e === 'string') return e;
        if (typeof e?.message === 'string') return e.message;
        return safeStringify(e);
      })
      .filter(Boolean);
  }
  if (typeof errors === 'string') return [errors];
  return [safeStringify(errors)];
}

async function copyToClipboard(text) {
  if (typeof window === 'undefined') return false;
  const t = String(text ?? '');
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * AppAlert
 * - error object friendly: kasih `error={err}` → auto isi message/description/details
 * - details collapsible + copy button
 * - actions: array config → render AppButton (support confirm/feedback dari AppButton)
 * - variant: default|soft|outlined|ghost
 * - autoCloseMs: auto dismiss (tetap respect onClose)
 */
export const AppAlert = React.forwardRef(function AppAlert(
  {
    // base
    type,
    tone, // alias type + also for color accent
    variant = 'default',

    message,
    title, // alias message
    description,

    error,
    errors, // list of strings
    details, // string|node|object, shown in expandable area

    showIcon = true,
    banner,
    closable,
    closeText,
    onClose,

    // details UI
    showDetails = true,
    defaultDetailsOpen = false,
    detailsLabel = 'Detail',
    hideDetailsLabel = 'Sembunyikan',
    detailsMaxHeight = 220,

    // copy
    copyable = false,
    copyLabel = 'Copy',
    copySuccess = 'Tersalin',
    copyError = 'Gagal copy',
    copyValue, // override: string|object

    // retry shortcut
    retryable = false,
    onRetry,
    retryText = 'Coba lagi',
    retryConfirm,
    retryFeedback,
    retryProps,

    // actions
    actions, // [{ key, label, onPress, type, tone, confirm, feedback, icon, ...AppButtonProps }]
    action, // pass-through antd action node (will be appended after actions)

    // tooltip/disabled
    tooltip,
    disabledReason,
    disabled = false,

    // auto close
    autoCloseMs,

    // styling
    className,
    style,

    ...rest
  },
  ref,
) {
  const { token } = theme.useToken();
  const { message: toast } = AntdApp.useApp();

  const resolvedType = normalizeType({ type, tone });
  const toneColor = pickToneColor(tone ?? resolvedType, token);

  const [openDetails, setOpenDetails] = React.useState(Boolean(defaultDetailsOpen));
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (!isNumber(autoCloseMs) || autoCloseMs <= 0) return;
    if (!visible) return;
    const t = setTimeout(() => {
      setVisible(false);
      if (typeof onClose === 'function') onClose();
    }, autoCloseMs);
    return () => clearTimeout(t);
  }, [autoCloseMs, visible, onClose]);

  const resolvedMessage = message ?? title ?? toErrorMessage(error) ?? undefined;
  const resolvedDescription = description ?? (error ? null : null);
  const resolvedErrors = normalizeErrors(errors);
  const resolvedDetails = details ?? toErrorDetails(error);

  const tooltipCfg = normalizeTooltip(tooltip, disabled, disabledReason);

  const hasDetails = showDetails && (resolvedDetails != null || (typeof resolvedDescription === 'string' && resolvedDescription.trim() !== '') || resolvedErrors.length > 0);

  const variantStyle = buildVariantStyle({ variant, toneColor, token });

  const detailsNode = (() => {
    if (!hasDetails) return null;
    if (!openDetails) return null;

    const content = (() => {
      const pieces = [];

      if (resolvedDescription) {
        pieces.push(
          <div
            key='desc'
            style={{ marginBottom: 8 }}
          >
            {resolvedDescription}
          </div>,
        );
      }

      if (resolvedErrors.length > 0) {
        pieces.push(
          <ul
            key='errs'
            style={{ margin: 0, paddingInlineStart: 18 }}
          >
            {resolvedErrors.map((e, idx) => (
              <li
                key={`${idx}_${String(e).slice(0, 12)}`}
                style={{ marginBlock: 2 }}
              >
                {e}
              </li>
            ))}
          </ul>,
        );
      }

      if (resolvedDetails != null) {
        pieces.push(
          <pre
            key='details'
            style={{
              marginTop: resolvedErrors.length > 0 || resolvedDescription ? 10 : 0,
              marginBottom: 0,
              padding: 10,
              borderRadius: 10,
              background: token?.colorFillAlter ?? 'rgba(0,0,0,0.04)',
              overflow: 'auto',
              maxHeight: detailsMaxHeight,
              fontSize: 12,
              lineHeight: '16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {typeof resolvedDetails === 'string' ? resolvedDetails : safeStringify(resolvedDetails)}
          </pre>,
        );
      }

      return pieces.length > 0 ? pieces : null;
    })();

    return <div style={{ marginTop: 10, fontFamily: DEFAULT_FONT_FAMILY }}>{content}</div>;
  })();

  const handleCopy = async () => {
    const val = copyValue ?? resolvedDetails ?? resolvedDescription ?? resolvedErrors.join('\n') ?? resolvedMessage;
    const ok = await copyToClipboard(typeof val === 'string' ? val : safeStringify(val));
    if (ok) toast.success(copySuccess);
    else toast.error(copyError);
  };

  const renderActions = () => {
    const list = Array.isArray(actions) ? actions.filter(Boolean) : [];

    const actionNodes = list.map((a, idx) => (
      <AppButton
        key={String(a.key ?? a.label ?? idx)}
        size='small'
        type={a.type ?? 'default'}
        tone={a.tone}
        danger={a.danger}
        icon={a.icon}
        confirm={a.confirm}
        feedback={a.feedback}
        onPress={a.onPress}
        disabled={a.disabled}
        {...(a.props ?? null)}
      >
        {a.label}
      </AppButton>
    ));

    const retryNode =
      retryable || typeof onRetry === 'function' ? (
        <AppButton
          size='small'
          type='default'
          icon={<ReloadOutlined />}
          confirm={retryConfirm}
          feedback={retryFeedback}
          onPress={onRetry}
          {...(retryProps ?? null)}
        >
          {retryText}
        </AppButton>
      ) : null;

    const detailsToggle = hasDetails ? (
      <AppButton
        size='small'
        type='link'
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenDetails((v) => !v);
        }}
        style={{ paddingInline: 0 }}
      >
        {openDetails ? hideDetailsLabel : detailsLabel}
      </AppButton>
    ) : null;

    const copyNode = copyable ? (
      <AppButton
        size='small'
        icon={<CopyOutlined />}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleCopy();
        }}
      >
        {copyLabel}
      </AppButton>
    ) : null;

    const rightAction = action ?? null;

    const nodes = [retryNode, ...actionNodes, detailsToggle, copyNode, rightAction].filter(Boolean);
    if (nodes.length === 0) return undefined;

    return (
      <Space
        size={8}
        wrap
        style={{ fontFamily: DEFAULT_FONT_FAMILY }}
      >
        {nodes}
      </Space>
    );
  };

  if (!visible) return null;

  const alertNode = (
    <Alert
      ref={ref}
      type={resolvedType}
      showIcon={showIcon}
      banner={banner}
      closable={closable}
      closeText={closeText}
      onClose={() => {
        setVisible(false);
        if (typeof onClose === 'function') onClose();
      }}
      message={
        resolvedMessage != null ? (
          <Typography.Text
            strong
            style={{ fontFamily: DEFAULT_FONT_FAMILY }}
          >
            {resolvedMessage}
          </Typography.Text>
        ) : undefined
      }
      description={
        // description utama sengaja kita taruh di detail area supaya ringkas;
        // tapi kalau user isi `description` node, kita tetap tampilkan di sini (kecuali mereka pakai details)
        resolvedDescription && !hasDetails ? <div style={{ fontFamily: DEFAULT_FONT_FAMILY }}>{resolvedDescription}</div> : undefined
      }
      action={renderActions()}
      className={className}
      style={{
        fontFamily: DEFAULT_FONT_FAMILY,
        borderRadius: 14,
        border: '1px solid',
        borderColor: token?.colorBorderSecondary ?? token?.colorBorder,
        ...variantStyle,
        ...(style ?? null),
        ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : null),
      }}
      {...rest}
    />
  );

  return withTooltipWrapper(
    <div style={{ fontFamily: DEFAULT_FONT_FAMILY }}>
      {alertNode}
      {detailsNode}
    </div>,
    tooltipCfg,
  );
});

export function AppErrorAlert(props) {
  return (
    <AppAlert
      tone='error'
      variant='soft'
      {...props}
    />
  );
}

export function AppSuccessAlert(props) {
  return (
    <AppAlert
      tone='success'
      variant='soft'
      {...props}
    />
  );
}

export function AppWarningAlert(props) {
  return (
    <AppAlert
      tone='warning'
      variant='soft'
      {...props}
    />
  );
}

export function AppInfoAlert(props) {
  return (
    <AppAlert
      tone='info'
      variant='soft'
      {...props}
    />
  );
}

/**
 * Helper: convert error → props yang enak dipakai
 * const p = toAppAlertProps(err, { title:'Gagal' })
 */
export function toAppAlertProps(err, opts = {}) {
  const title = opts.title ?? 'Terjadi kesalahan';
  const msg = opts.message ?? toErrorMessage(err) ?? title;
  const det = opts.details ?? toErrorDetails(err);

  return {
    tone: 'error',
    variant: 'soft',
    message: msg,
    details: det,
    copyable: true,
    showDetails: true,
    defaultDetailsOpen: Boolean(opts.defaultDetailsOpen),
  };
}

AppAlert.Error = AppErrorAlert;
AppAlert.Success = AppSuccessAlert;
AppAlert.Warning = AppWarningAlert;
AppAlert.Info = AppInfoAlert;
AppAlert.toProps = toAppAlertProps;

export default AppAlert;
