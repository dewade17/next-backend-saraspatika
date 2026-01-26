'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dropdown, Input, Divider, Modal, Spin } from 'antd';

function isPromiseLike(v) {
  return v && typeof v === 'object' && typeof v.then === 'function';
}

function ensureTriggerChild(children) {
  if (React.isValidElement(children)) return children;
  return <span>{children}</span>;
}

function getLabelText(label) {
  if (typeof label === 'string') return label;
  if (typeof label === 'number') return String(label);
  return '';
}

function flattenItems(items, out = []) {
  (items || []).forEach((it) => {
    if (!it) return;
    out.push(it);
    if (Array.isArray(it.children) && it.children.length) flattenItems(it.children, out);
  });
  return out;
}

function defaultFilterFn(item, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;

  const labelText = getLabelText(item?.label).toLowerCase();
  const keyText = typeof item?.key === 'string' ? item.key.toLowerCase() : '';
  return labelText.includes(q) || keyText.includes(q);
}

function filterItemsDeep(items, query, filterFn) {
  if (!Array.isArray(items)) return items;

  const filtered = [];
  for (const it of items) {
    if (!it) continue;

    const hasChildren = Array.isArray(it.children) && it.children.length > 0;
    if (hasChildren) {
      const nextChildren = filterItemsDeep(it.children, query, filterFn);
      if (nextChildren.length > 0 || filterFn(it, query)) {
        filtered.push({ ...it, children: nextChildren });
      }
      continue;
    }

    if (filterFn(it, query)) filtered.push(it);
  }
  return filtered;
}

/**
 * AppDropDown (AntD Dropdown wrapper)
 *
 * Props penting:
 * - items: array menu items (AntD Menu items)
 * - menu: props menu AntD (optional; kalau diberikan, override items)
 * - searchable: boolean (tampilkan search box & filter items)
 * - confirmByKey: object map key -> { title, content, okText, cancelText } / true
 * - closeOnItemClick: boolean (default true)
 * - header / footer: ReactNode atau function(ctx)
 * - onAction: (key, info) => void|Promise (dipanggil setelah item click)
 * - onItemClick: (info) => void|Promise (hook mentah dari antd menu click)
 */
export default function AppDropDown({
  children,
  items,
  menu,
  open,
  defaultOpen,
  onOpenChange,
  trigger = ['click'],
  placement,
  arrow,
  disabled,

  searchable = false,
  searchPlaceholder = 'Cari…',
  filterFn = defaultFilterFn,
  searchAutoFocus = true,

  closeOnItemClick = true,
  confirmByKey,
  onAction,
  onItemClick,

  header,
  footer,
  width,
  overlayStyle,
  overlayClassName,
  className,

  dropdownRender,
  getPopupContainer,
}) {
  const [internalOpen, setInternalOpen] = useState(!!defaultOpen);
  const [query, setQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const searchInputRef = useRef(null);

  const isControlled = typeof open === 'boolean';
  const mergedOpen = isControlled ? open : internalOpen;

  const baseItems = useMemo(() => {
    if (menu?.items) return menu.items;
    return items || [];
  }, [items, menu]);

  const itemByKey = useMemo(() => {
    const map = new Map();
    flattenItems(baseItems).forEach((it) => {
      if (it && (typeof it.key === 'string' || typeof it.key === 'number')) {
        map.set(String(it.key), it);
      }
    });
    return map;
  }, [baseItems]);

  const computedItems = useMemo(() => {
    if (!searchable) return baseItems;
    return filterItemsDeep(baseItems, query, filterFn);
  }, [baseItems, filterFn, query, searchable]);

  const setOpenSafe = useCallback(
    (next) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
      if (next && searchable && searchAutoFocus) {
        queueMicrotask(() => {
          searchInputRef.current?.focus?.();
        });
      }
      if (!next) setQuery('');
    },
    [isControlled, onOpenChange, searchable, searchAutoFocus],
  );

  const resolveConfirmConfig = useCallback(
    (keyStr) => {
      const cfg = confirmByKey?.[keyStr];
      if (!cfg) return null;
      if (cfg === true) {
        return {
          title: 'Konfirmasi',
          content: 'Apakah Anda yakin?',
          okText: 'Ya',
          cancelText: 'Batal',
        };
      }
      return {
        title: cfg.title ?? 'Konfirmasi',
        content: cfg.content ?? 'Apakah Anda yakin?',
        okText: cfg.okText ?? 'Ya',
        cancelText: cfg.cancelText ?? 'Batal',
      };
    },
    [confirmByKey],
  );

  const runAction = useCallback(
    async (info) => {
      const keyStr = String(info?.key ?? '');
      const originalItem = itemByKey.get(keyStr);
      const confirmCfg = resolveConfirmConfig(keyStr);

      const exec = async () => {
        const maybe1 = originalItem?.onClick?.(info);
        const maybe2 = onItemClick?.(info);
        const maybe3 = onAction?.(keyStr, info);

        const maybePromises = [maybe1, maybe2, maybe3].filter(isPromiseLike);
        if (maybePromises.length) {
          setActionLoading(true);
          try {
            await Promise.allSettled(maybePromises);
          } finally {
            setActionLoading(false);
          }
        }

        if (closeOnItemClick) setOpenSafe(false);
      };

      if (confirmCfg) {
        Modal.confirm({
          title: confirmCfg.title,
          content: confirmCfg.content,
          okText: confirmCfg.okText,
          cancelText: confirmCfg.cancelText,
          centered: true,
          onOk: exec,
        });
        return;
      }

      await exec();
    },
    [closeOnItemClick, itemByKey, onAction, onItemClick, resolveConfirmConfig, setOpenSafe],
  );

  const mergedMenu = useMemo(() => {
    const base = menu || {};
    return {
      ...base,
      items: computedItems,
      onClick: async (info) => {
        // kalau user supply menu.onClick, tetap dipanggil via onItemClick hook
        await runAction(info);
        if (typeof base.onClick === 'function') {
          const r = base.onClick(info);
          if (isPromiseLike(r)) await r;
        }
      },
    };
  }, [computedItems, menu, runAction]);

  const composedDropdownRender = useCallback(
    (originNode) => {
      const ctx = {
        open: mergedOpen,
        setOpen: setOpenSafe,
        query,
        setQuery,
        loading: actionLoading,
      };

      const headerNode = typeof header === 'function' ? header(ctx) : header;
      const footerNode = typeof footer === 'function' ? footer(ctx) : footer;

      const built = (
        <div style={{ width: width ?? undefined }}>
          {(headerNode || searchable) && (
            <>
              {headerNode}
              {searchable && (
                <div style={{ padding: 12 }}>
                  <Input
                    ref={searchInputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    allowClear
                  />
                </div>
              )}
              <Divider style={{ margin: 0 }} />
            </>
          )}

          <div style={{ position: 'relative' }}>
            {originNode}
            {actionLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.6)',
                }}
              >
                <Spin />
              </div>
            )}
          </div>

          {footerNode && (
            <>
              <Divider style={{ margin: 0 }} />
              <div style={{ padding: 12 }}>{footerNode}</div>
            </>
          )}
        </div>
      );

      const withUser = typeof dropdownRender === 'function' ? dropdownRender(built) : built;
      return withUser;
    },
    [actionLoading, dropdownRender, footer, header, mergedOpen, query, searchable, searchPlaceholder, setOpenSafe, width],
  );

  return (
    <Dropdown
      className={className}
      disabled={disabled}
      open={mergedOpen}
      onOpenChange={setOpenSafe}
      trigger={trigger}
      placement={placement}
      arrow={arrow}
      menu={mergedMenu}
      overlayClassName={overlayClassName}
      overlayStyle={overlayStyle}
      dropdownRender={composedDropdownRender}
      getPopupContainer={getPopupContainer}
    >
      {ensureTriggerChild(children)}
    </Dropdown>
  );
}
