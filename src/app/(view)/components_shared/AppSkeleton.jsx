'use client';

import React from 'react';
import { Skeleton } from 'antd';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isFn(v) {
  return typeof v === 'function';
}

function nowMs() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

/**
 * Delay + minimum visible duration to avoid skeleton flash.
 */
function useSmartLoading(loading, { delayMs = 120, minShowMs = 240 } = {}) {
  const [show, setShow] = React.useState(false);
  const shownAtRef = React.useRef(0);
  const tRef = React.useRef({ delay: null, hide: null });

  const clearTimers = React.useCallback(() => {
    if (tRef.current.delay) clearTimeout(tRef.current.delay);
    if (tRef.current.hide) clearTimeout(tRef.current.hide);
    tRef.current.delay = null;
    tRef.current.hide = null;
  }, []);

  React.useEffect(() => {
    const isLoading = isFn(loading) ? Boolean(loading()) : Boolean(loading);

    clearTimers();

    if (isLoading) {
      if (!show) {
        tRef.current.delay = setTimeout(
          () => {
            shownAtRef.current = nowMs();
            setShow(true);
          },
          Math.max(0, delayMs),
        );
      }
      return () => clearTimers();
    }

    // not loading
    if (!show) return () => clearTimers();

    const elapsed = nowMs() - (shownAtRef.current || 0);
    const remain = Math.max(0, (minShowMs || 0) - elapsed);

    if (remain <= 0) {
      setShow(false);
      shownAtRef.current = 0;
    } else {
      tRef.current.hide = setTimeout(() => {
        setShow(false);
        shownAtRef.current = 0;
      }, remain);
    }

    return () => clearTimers();
  }, [loading, delayMs, minShowMs, show, clearTimers]);

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  return show;
}

function px(v) {
  if (v == null) return undefined;
  if (typeof v === 'number') return `${v}px`;
  return v;
}

function repeat(n) {
  const count = Math.max(1, Number(n || 1));
  return Array.from({ length: count }, (_, i) => i);
}

function mergeStyle(a, b) {
  return { ...(a || null), ...(b || null) };
}

function SkeletonLine({ width = '100%', height = 14, active = true, style }) {
  return (
    <Skeleton.Input
      active={active}
      size='default'
      style={mergeStyle(
        {
          width: px(width),
          height: px(height),
          display: 'block',
        },
        style,
      )}
    />
  );
}

function SkeletonBlock({ width = '100%', height = 120, active = true, radius = 12, style }) {
  return (
    <Skeleton.Input
      active={active}
      size='default'
      style={mergeStyle(
        {
          width: px(width),
          height: px(height),
          borderRadius: px(radius),
          display: 'block',
        },
        style,
      )}
    />
  );
}

function TableSkeleton({ rows = 6, cols = 5, active = true, header = true, rowHeight = 14, gap = 10, style }) {
  const colTemplate = `repeat(${Math.max(1, cols)}, minmax(0, 1fr))`;

  return (
    <div
      style={mergeStyle(
        {
          display: 'grid',
          gridTemplateColumns: colTemplate,
          gap,
          width: '100%',
        },
        style,
      )}
    >
      {header
        ? repeat(cols).map((i) => (
            <SkeletonLine
              key={`h-${i}`}
              width='100%'
              height={rowHeight + 2}
              active={active}
            />
          ))
        : null}

      {repeat(rows).flatMap((r) =>
        repeat(cols).map((c) => (
          <SkeletonLine
            key={`r-${r}-c-${c}`}
            width='100%'
            height={rowHeight}
            active={active}
            style={{ opacity: 0.95 }}
          />
        )),
      )}
    </div>
  );
}

function ListSkeleton({ items = 5, active = true, avatar = true, title = true, lines = 2, gap = 14, style }) {
  return (
    <div style={mergeStyle({ display: 'flex', flexDirection: 'column', gap }, style)}>
      {repeat(items).map((i) => (
        <div
          key={i}
          style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
        >
          {avatar ? (
            <Skeleton.Avatar
              active={active}
              size='default'
              shape='circle'
            />
          ) : null}

          <div style={{ flex: 1, minWidth: 0 }}>
            {title ? (
              <SkeletonLine
                active={active}
                width='44%'
                height={14}
                style={{ marginBottom: 10 }}
              />
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {repeat(lines).map((j) => (
                <SkeletonLine
                  key={j}
                  active={active}
                  width={j === lines - 1 ? '72%' : '100%'}
                  height={12}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ active = true, header = true, avatar = true, lines = 3, coverHeight = 140, radius = 14, style }) {
  return (
    <div
      style={mergeStyle(
        {
          width: '100%',
          borderRadius: px(radius),
          border: '1px solid rgba(0,0,0,0.06)',
          padding: 16,
        },
        style,
      )}
    >
      {coverHeight ? (
        <SkeletonBlock
          active={active}
          height={coverHeight}
          radius={radius}
          style={{ marginBottom: 14 }}
        />
      ) : null}

      {header ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {avatar ? (
            <Skeleton.Avatar
              active={active}
              size='default'
              shape='circle'
            />
          ) : null}
          <div style={{ flex: 1 }}>
            <SkeletonLine
              active={active}
              width='50%'
              height={14}
              style={{ marginBottom: 8 }}
            />
            <SkeletonLine
              active={active}
              width='30%'
              height={12}
            />
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {repeat(lines).map((i) => (
          <SkeletonLine
            key={i}
            active={active}
            width={i === lines - 1 ? '78%' : '100%'}
            height={12}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
        <Skeleton.Button
          active={active}
          size='default'
          style={{ width: 90 }}
        />
        <Skeleton.Button
          active={active}
          size='default'
          style={{ width: 110 }}
        />
      </div>
    </div>
  );
}

function PageSkeleton({ active = true, withHeader = true, withToolbar = true, withSidebar = false, sidebarWidth = 260, blocks = 3, style }) {
  return (
    <div style={mergeStyle({ width: '100%', display: 'flex', gap: 16 }, style)}>
      {withSidebar ? (
        <div style={{ width: px(sidebarWidth), flex: 'none' }}>
          <SkeletonLine
            active={active}
            width='66%'
            height={14}
            style={{ marginBottom: 12 }}
          />
          <ListSkeleton
            active={active}
            items={8}
            avatar={false}
            title={false}
            lines={1}
            gap={10}
          />
        </div>
      ) : null}

      <div style={{ flex: 1, minWidth: 0 }}>
        {withHeader ? (
          <div style={{ marginBottom: 14 }}>
            <SkeletonLine
              active={active}
              width='38%'
              height={18}
              style={{ marginBottom: 10 }}
            />
            <SkeletonLine
              active={active}
              width='58%'
              height={12}
            />
          </div>
        ) : null}

        {withToolbar ? (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <Skeleton.Button
              active={active}
              size='default'
              style={{ width: 120 }}
            />
            <Skeleton.Button
              active={active}
              size='default'
              style={{ width: 90 }}
            />
            <Skeleton.Button
              active={active}
              size='default'
              style={{ width: 140 }}
            />
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {repeat(blocks).map((i) => (
            <CardSkeleton
              key={i}
              active={active}
              coverHeight={i === 0 ? 160 : 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * AppSkeleton
 * - delay + min duration anti-flash
 * - variants: auto | text | block | card | list | table | page
 * - bisa wrap children (render children saat tidak loading)
 */
export function AppSkeleton({
  loading = true,
  delayMs = 120,
  minShowMs = 240,

  variant = 'auto',

  active = true,
  round = false,

  // auto/text variant props (antd Skeleton)
  avatar,
  title,
  paragraph,

  // common layout
  gap = 12,
  count = 1,

  // block variant
  blockWidth = '100%',
  blockHeight = 120,
  radius = 12,

  // list variant
  items = 6,
  lines = 2,
  listAvatar = true,
  listTitle = true,

  // table variant
  rows = 6,
  cols = 5,
  header = true,
  rowHeight = 14,

  // page variant
  withHeader = true,
  withToolbar = true,
  withSidebar = false,
  sidebarWidth = 260,
  blocks = 3,

  // custom skeleton node
  skeleton,

  // render
  children,

  style,
  className,
  ...rest
}) {
  const showLoading = useSmartLoading(loading, { delayMs, minShowMs });

  const fontStyle = { fontFamily: DEFAULT_FONT_FAMILY };

  if (!showLoading) {
    return <>{children}</>;
  }

  if (isFn(skeleton)) {
    return (
      <div
        className={className}
        style={mergeStyle(fontStyle, style)}
      >
        {skeleton({ loading: true })}
      </div>
    );
  }

  if (React.isValidElement(skeleton)) {
    return (
      <div
        className={className}
        style={mergeStyle(fontStyle, style)}
      >
        {skeleton}
      </div>
    );
  }

  const v = String(variant || 'auto').toLowerCase();

  if (v === 'auto' || v === 'text') {
    const mergedParagraph = paragraph === false ? false : paragraph === true || paragraph == null ? { rows: 3 } : paragraph;

    const mergedTitle = title === false ? false : title === true || title == null ? true : title;

    const mergedAvatar = avatar ?? false;

    return (
      <div
        className={className}
        style={mergeStyle(fontStyle, style)}
      >
        <Skeleton
          active={active}
          round={round}
          avatar={mergedAvatar}
          title={mergedTitle}
          paragraph={mergedParagraph}
          {...rest}
        >
          {children}
        </Skeleton>
      </div>
    );
  }

  if (v === 'block') {
    return (
      <div
        className={className}
        style={mergeStyle({ ...fontStyle, display: 'flex', flexDirection: 'column', gap }, style)}
      >
        {repeat(count).map((i) => (
          <SkeletonBlock
            key={i}
            active={active}
            width={blockWidth}
            height={blockHeight}
            radius={radius}
          />
        ))}
      </div>
    );
  }

  if (v === 'card') {
    return (
      <div
        className={className}
        style={mergeStyle({ ...fontStyle, display: 'flex', flexDirection: 'column', gap }, style)}
      >
        {repeat(count).map((i) => (
          <CardSkeleton
            key={i}
            active={active}
            radius={radius}
          />
        ))}
      </div>
    );
  }

  if (v === 'list') {
    return (
      <div
        className={className}
        style={mergeStyle(fontStyle, style)}
      >
        <ListSkeleton
          active={active}
          items={items}
          avatar={listAvatar}
          title={listTitle}
          lines={lines}
          gap={gap}
        />
      </div>
    );
  }

  if (v === 'table') {
    return (
      <div
        className={className}
        style={mergeStyle(fontStyle, style)}
      >
        <TableSkeleton
          active={active}
          rows={rows}
          cols={cols}
          header={header}
          rowHeight={rowHeight}
          gap={gap}
        />
      </div>
    );
  }

  if (v === 'page') {
    return (
      <div
        className={className}
        style={mergeStyle(fontStyle, style)}
      >
        <PageSkeleton
          active={active}
          withHeader={withHeader}
          withToolbar={withToolbar}
          withSidebar={withSidebar}
          sidebarWidth={sidebarWidth}
          blocks={blocks}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={mergeStyle(fontStyle, style)}
    >
      <Skeleton
        active={active}
        round={round}
        {...rest}
      />
    </div>
  );
}

export function AppSkeletonBlock(props) {
  return (
    <AppSkeleton
      variant='block'
      {...props}
    />
  );
}

export function AppSkeletonCard(props) {
  return (
    <AppSkeleton
      variant='card'
      {...props}
    />
  );
}

export function AppSkeletonList(props) {
  return (
    <AppSkeleton
      variant='list'
      {...props}
    />
  );
}

export function AppSkeletonTable(props) {
  return (
    <AppSkeleton
      variant='table'
      {...props}
    />
  );
}

export function AppSkeletonPage(props) {
  return (
    <AppSkeleton
      variant='page'
      {...props}
    />
  );
}

export function AppSkeletonSuspense({ fallbackProps, children }) {
  return (
    <React.Suspense
      fallback={
        <AppSkeleton
          loading
          variant='page'
          {...(fallbackProps || {})}
        />
      }
    >
      {children}
    </React.Suspense>
  );
}

export default AppSkeleton;
