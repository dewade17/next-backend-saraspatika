'use client';

import React from 'react';
import { App as AntdApp, Alert, Button, Card, Dropdown, Space, Typography, theme } from 'antd';
import { DownOutlined, MoreOutlined, RightOutlined } from '@ant-design/icons';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function isThenable(value) {
  return value != null && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}

function resolvePaddingPx(padding) {
  if (padding == null) return undefined;
  if (isNumber(padding)) return padding;

  switch (String(padding).toLowerCase()) {
    case 'none':
      return 0;
    case 'xs':
      return 8;
    case 'sm':
      return 12;
    case 'md':
      return 16;
    case 'lg':
      return 24;
    case 'xl':
      return 32;
    default:
      return undefined;
  }
}

function pickToneColor(tone, token) {
  const t = String(tone ?? '').toLowerCase();
  if (!t) return null;

  if (t === 'success') return token?.colorSuccess;
  if (t === 'warning') return token?.colorWarning;
  if (t === 'info') return token?.colorInfo;
  if (t === 'danger' || t === 'error') return token?.colorError;
  if (t === 'muted') return token?.colorSplit;
  if (t === 'primary') return token?.colorPrimary;

  return null;
}

function normalizeConfirm(confirm) {
  if (!confirm) return null;

  if (typeof confirm === 'string' || React.isValidElement(confirm)) {
    return { title: confirm, okText: 'Ya', cancelText: 'Batal' };
  }

  if (typeof confirm === 'object') {
    return {
      title: confirm.title ?? 'Yakin?',
      content: confirm.content ?? confirm.description,
      okText: confirm.okText ?? 'Ya',
      cancelText: confirm.cancelText ?? 'Batal',
      okType: confirm.okType,
      danger: confirm.danger,
      centered: confirm.centered,
      maskClosable: confirm.maskClosable,
      width: confirm.width,
      icon: confirm.icon,
    };
  }

  return null;
}

async function runConfirm(modal, confirmCfg) {
  if (!confirmCfg) return true;

  return new Promise((resolve) => {
    modal.confirm({
      title: confirmCfg.title,
      content: confirmCfg.content,
      okText: confirmCfg.okText,
      cancelText: confirmCfg.cancelText,
      okType: confirmCfg.okType ?? (confirmCfg.danger ? 'danger' : 'primary'),
      centered: confirmCfg.centered,
      maskClosable: confirmCfg.maskClosable,
      width: confirmCfg.width,
      icon: confirmCfg.icon,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

function mergeStyles(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

function mergeCardStyles(base, override) {
  const a = base ?? {};
  const b = override ?? {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = {};
  for (const k of keys) out[k] = mergeStyles(a[k], b[k]);
  return out;
}

function buildVariantStyle({ variant, token }) {
  const v = String(variant ?? 'default').toLowerCase();

  if (v === 'ghost') {
    return {
      style: { background: 'transparent', borderColor: 'transparent' },
      bordered: false,
      hoverable: false,
    };
  }

  if (v === 'soft') {
    return {
      style: { background: token?.colorFillAlter ?? token?.colorBgContainer },
      bordered: false,
      hoverable: false,
    };
  }

  if (v === 'outlined') {
    return {
      style: { background: token?.colorBgContainer },
      bordered: true,
      hoverable: false,
    };
  }

  if (v === 'elevated') {
    return {
      style: {
        background: token?.colorBgContainer,
        boxShadow: token?.boxShadowSecondary ?? token?.boxShadow,
        borderColor: token?.colorBorderSecondary ?? token?.colorBorder,
      },
      bordered: true,
      hoverable: false,
    };
  }

  return {
    style: { background: token?.colorBgContainer },
    bordered: undefined,
    hoverable: undefined,
  };
}

function buildAccentStyle({ toneColor, accent, accentWidth, token }) {
  const a = String(accent ?? 'left').toLowerCase();
  const w = isNumber(accentWidth) ? accentWidth : 4;
  if (!toneColor || a === 'none') return null;

  if (a === 'top') {
    return {
      borderTop: `${w}px solid ${toneColor}`,
      borderTopLeftRadius: token?.borderRadiusLG ?? 12,
      borderTopRightRadius: token?.borderRadiusLG ?? 12,
    };
  }

  if (a === 'bottom') {
    return {
      borderBottom: `${w}px solid ${toneColor}`,
    };
  }

  // default: left
  return {
    borderInlineStart: `${w}px solid ${toneColor}`,
  };
}

function HeaderTitle({ icon, title, subtitle, tag, toneColor, dense, titleProps, subtitleProps }) {
  const titleSize = dense ? 13 : 14;
  const subtitleSize = dense ? 11.5 : 12;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: subtitle ? 2 : 0, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {icon ? <span style={{ display: 'inline-flex', lineHeight: 0 }}>{icon}</span> : null}

        <Typography.Text
          strong
          {...(titleProps ?? null)}
          style={{
            fontFamily: DEFAULT_FONT_FAMILY,
            fontSize: titleSize,
            lineHeight: '18px',
            color: toneColor || undefined,
            minWidth: 0,
            ...(titleProps?.style ?? null),
          }}
          ellipsis
        >
          {title}
        </Typography.Text>

        {tag ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              paddingInline: 8,
              paddingBlock: 2,
              borderRadius: 999,
              fontSize: 11,
              fontFamily: DEFAULT_FONT_FAMILY,
              border: `1px solid ${toneColor ?? 'rgba(0,0,0,0.12)'}`,
              color: toneColor ?? undefined,
              opacity: 0.9,
              whiteSpace: 'nowrap',
            }}
          >
            {tag}
          </span>
        ) : null}
      </div>

      {subtitle ? (
        <Typography.Text
          {...(subtitleProps ?? null)}
          style={{
            fontFamily: DEFAULT_FONT_FAMILY,
            fontSize: subtitleSize,
            lineHeight: '16px',
            opacity: 0.8,
            ...(subtitleProps?.style ?? null),
          }}
          ellipsis
        >
          {subtitle}
        </Typography.Text>
      ) : null}
    </div>
  );
}

export const AppCard = React.forwardRef(function AppCard(
  {
    children,

    // header sugar
    icon,
    title,
    subtitle,
    tag,

    titleProps,
    subtitleProps,

    extra, // antd extra
    toolbar, // node displayed at right (beside extra)
    menu, // antd Dropdown menu config { items, onClick } or MenuProps
    menuTriggerIcon,
    menuButtonProps,

    // states
    loading,
    error, // string|node
    errorTitle = 'Terjadi kesalahan',

    // styles
    variant = 'default', // default|soft|outlined|elevated|ghost
    tone, // success|warning|info|danger|muted|primary
    accent = 'left', // left|top|bottom|none
    accentWidth = 4,

    padding = 'md', // body padding preset/number
    headerPadding, // optional override
    footerPadding, // optional override
    denseHeader = false,

    footer, // rendered inside body bottom (with divider)
    footerDivider = true,

    fullWidth = false,
    minHeight,
    bodyScroll, // { maxHeight } or number

    // collapsible
    collapsible = false,
    collapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    collapseIcon,
    collapseIconPosition = 'right', // left|right
    collapseTrigger = 'icon', // icon|header

    // clickable
    clickable = false,
    disabled = false,
    onPress,
    onClick,
    href,
    target,
    confirm,

    hoverable,
    bordered,

    style,
    className,
    styles: stylesProp,
    classNames,

    ...rest
  },
  ref,
) {
  const { token } = theme.useToken();
  const antdApp = AntdApp.useApp?.();
  const modal = antdApp?.modal ?? ModalFallback;

  const toneColor = pickToneColor(tone, token);
  const variantPack = buildVariantStyle({ variant, token });
  const accentStyle = buildAccentStyle({ toneColor, accent, accentWidth, token });

  const bodyPad = resolvePaddingPx(padding);
  const headerPad = resolvePaddingPx(headerPadding);
  const footerPad = resolvePaddingPx(footerPadding);

  const [innerCollapsed, setInnerCollapsed] = React.useState(Boolean(defaultCollapsed));
  const isCollapsed = collapsed ?? innerCollapsed;

  const setCollapsedSafe = (next) => {
    if (collapsed == null) setInnerCollapsed(next);
    if (typeof onCollapsedChange === 'function') onCollapsedChange(next);
  };

  const confirmCfg = normalizeConfirm(confirm);

  const isClickable = Boolean((clickable || onPress || onClick || href) && !disabled);
  const computedHoverable = hoverable ?? (isClickable ? true : variantPack.hoverable);
  const computedBordered = bordered ?? variantPack.bordered;

  const handleCardClick = async (e) => {
    if (!isClickable) return;

    if (collapsible && collapseTrigger === 'header') {
      // hanya toggle jika user klik area header (kasar), kita tetap biarkan user override via stopPropagation di child
      const targetEl = e?.target;
      const headerEl = targetEl?.closest?.('.ant-card-head');
      if (headerEl) {
        setCollapsedSafe(!isCollapsed);
        return;
      }
    }

    if (confirmCfg) {
      const ok = await runConfirm(modal, confirmCfg);
      if (!ok) return;
    }

    if (typeof onClick === 'function') onClick(e);
    if (typeof onPress === 'function') onPress(e);
  };

  const collapseNode = collapsible ? (
    <Button
      type='text'
      size='small'
      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCollapsedSafe(!isCollapsed);
      }}
      style={{ paddingInline: 6 }}
      icon={collapseIcon ?? (isCollapsed ? <RightOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />)}
    />
  ) : null;

  const menuNode = menu ? (
    <Dropdown menu={menu}>
      <Button
        type='text'
        size='small'
        icon={menuTriggerIcon ?? <MoreOutlined />}
        onClick={(e) => e.stopPropagation()}
        style={{ paddingInline: 6 }}
        {...(menuButtonProps ?? null)}
      />
    </Dropdown>
  ) : null;

  const headerTitleNode =
    title != null || subtitle != null || icon != null || tag != null ? (
      <HeaderTitle
        icon={icon}
        title={title}
        subtitle={subtitle}
        tag={tag}
        toneColor={toneColor}
        dense={denseHeader}
        titleProps={titleProps}
        subtitleProps={subtitleProps}
      />
    ) : null;

  const headerExtraNode =
    collapseNode || menuNode || toolbar || extra ? (
      <Space
        size={6}
        style={{ fontFamily: DEFAULT_FONT_FAMILY }}
        onClick={(e) => {
          // jangan trigger card click saat klik extra tools
          e.stopPropagation();
        }}
      >
        {collapseIconPosition === 'left' ? collapseNode : null}
        {menuNode}
        {toolbar}
        {extra}
        {collapseIconPosition === 'right' ? collapseNode : null}
      </Space>
    ) : null;

  const computedRootStyle = mergeStyles(
    {
      fontFamily: DEFAULT_FONT_FAMILY,
      ...(fullWidth ? { width: '100%' } : null),
      ...(minHeight != null ? { minHeight } : null),
      ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : null),
      ...(isClickable ? { cursor: 'pointer', userSelect: 'none' } : null),
      ...(variantPack.style ?? null),
      ...(accentStyle ?? null),
    },
    style,
  );

  const scrollStyle = (() => {
    if (!bodyScroll) return null;
    if (isNumber(bodyScroll)) return { maxHeight: bodyScroll, overflow: 'auto' };
    if (typeof bodyScroll === 'object') {
      const mh = bodyScroll.maxHeight;
      return mh != null ? { maxHeight: mh, overflow: 'auto' } : { overflow: 'auto' };
    }
    return null;
  })();

  const computedStyles = mergeCardStyles(
    {
      header: headerPad != null ? { padding: headerPad } : null,
      body: mergeStyles(bodyPad != null ? { padding: bodyPad } : null, scrollStyle),
    },
    stylesProp,
  );

  const bodyContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error ? (
        <Alert
          type='error'
          showIcon
          title={errorTitle}
          description={typeof error === 'string' ? error : undefined}
          style={{ fontFamily: DEFAULT_FONT_FAMILY }}
        />
      ) : null}

      {isCollapsed ? null : children}

      {footer && !isCollapsed ? (
        <div
          style={{
            marginTop: 4,
            paddingTop: footerDivider ? 12 : 0,
            ...(footerDivider ? { borderTop: `1px solid ${token?.colorSplit}` } : null),
            ...(footerPad != null ? { paddingBottom: footerPad } : null),
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );

  const cardNode = (
    <Card
      ref={ref}
      title={headerTitleNode}
      extra={headerExtraNode}
      loading={loading}
      bordered={computedBordered}
      hoverable={computedHoverable}
      className={className}
      classNames={classNames}
      styles={computedStyles}
      style={computedRootStyle}
      onClick={handleCardClick}
      {...rest}
    >
      {bodyContent}
    </Card>
  );

  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        target={target}
        rel={target === '_blank' ? 'noreferrer noopener' : undefined}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {cardNode}
      </a>
    );
  }

  return cardNode;
});

// Fallback modal (kalau App provider belum ada)
const ModalFallback = {
  confirm: (cfg) => {
    // eslint-disable-next-line no-console
    console.warn('Antd App provider tidak ditemukan. Modal.confirm fallback tidak ditampilkan.', cfg);
  },
};

export function AppCardSection({ title, subtitle, right, children, style, className }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(style ?? null),
      }}
    >
      {title || subtitle || right ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {title ? (
              <Typography.Text
                strong
                style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 13 }}
                ellipsis
              >
                {title}
              </Typography.Text>
            ) : null}
            {subtitle ? (
              <div style={{ marginTop: 2 }}>
                <Typography.Text
                  type='secondary'
                  style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 12 }}
                  ellipsis
                >
                  {subtitle}
                </Typography.Text>
              </div>
            ) : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      ) : null}

      <div>{children}</div>
    </div>
  );
}

export const AppCardMeta = Card.Meta;

export function AppCardGrid({ clickable, disabled, onPress, onClick, style, className, children, ...rest }) {
  const isClickable = Boolean((clickable || onPress || onClick) && !disabled);

  return (
    <Card.Grid
      className={className}
      style={{
        fontFamily: DEFAULT_FONT_FAMILY,
        ...(isClickable ? { cursor: 'pointer', userSelect: 'none' } : null),
        ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : null),
        ...(style ?? null),
      }}
      onClick={(e) => {
        if (!isClickable) return;
        if (typeof onClick === 'function') onClick(e);
        if (typeof onPress === 'function') onPress(e);
      }}
      {...rest}
    >
      {children}
    </Card.Grid>
  );
}

AppCard.Meta = AppCardMeta;
AppCard.Grid = AppCardGrid;
AppCard.Section = AppCardSection;

export default AppCard;
