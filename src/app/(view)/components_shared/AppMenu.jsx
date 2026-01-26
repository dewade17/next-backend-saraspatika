'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Menu, Input, Divider, Empty } from 'antd';

/**
 * AppMenu (AntD Menu wrapper) — reusable + "canggih"
 *
 * Fitur:
 * - Searchable (filter items deep, termasuk submenu)
 * - Auto openKeys berdasarkan selectedKeys/path
 * - Controlled/uncontrolled openKeys & selectedKeys
 * - Item action hook: onAction(key, info)
 * - Normalize keys ke string (stabil)
 * - Helper util: buildKeyMap (untuk mapping path -> key)
 *
 * Props penting:
 * - items: AntD Menu items (tree)
 * - searchable: boolean
 * - filterFn: (item, query) => boolean  (custom match)
 * - autoOpenSelected: boolean (default true) buka parent submenu dari selectedKeys
 * - preserveOpenKeysOnSearch: boolean (default false) kalau true, openKeys tetap saat search
 * - onAction: async/sync handler untuk item click
 */
export default function AppMenu({
  items = [],
  mode = 'inline',
  theme,
  selectable = true,

  selectedKeys,
  defaultSelectedKeys,

  openKeys,
  defaultOpenKeys,
  onOpenChange,

  onClick,
  onAction,

  inlineCollapsed,
  inlineIndent,
  style,
  className,

  searchable = false,
  searchPlaceholder = 'Cari menu…',
  filterFn = defaultFilterFn,
  searchAutoFocus = false,
  emptyText = 'Tidak ada menu',
  showSearchDivider = true,

  autoOpenSelected = true,
  preserveOpenKeysOnSearch = false,

  expandIcon,
  subMenuOpenDelay,
  subMenuCloseDelay,
}) {
  const [query, setQuery] = useState('');
  const [internalOpenKeys, setInternalOpenKeys] = useState(Array.isArray(defaultOpenKeys) ? defaultOpenKeys.map(String) : []);
  const [internalSelectedKeys, setInternalSelectedKeys] = useState(Array.isArray(defaultSelectedKeys) ? defaultSelectedKeys.map(String) : []);

  const isOpenControlled = Array.isArray(openKeys);
  const isSelectedControlled = Array.isArray(selectedKeys);

  const mergedSelectedKeys = useMemo(() => {
    const raw = isSelectedControlled ? selectedKeys : internalSelectedKeys;
    return Array.isArray(raw) ? raw.map(String) : [];
  }, [internalSelectedKeys, isSelectedControlled, selectedKeys]);

  const baseItems = useMemo(() => normalizeKeysDeep(items), [items]);

  const keyParents = useMemo(() => buildParentsMap(baseItems), [baseItems]);

  const autoOpenForSelected = useMemo(() => {
    if (!autoOpenSelected || mergedSelectedKeys.length === 0) return [];
    const parents = new Set();
    mergedSelectedKeys.forEach((k) => {
      const chain = keyParents.get(String(k)) || [];
      chain.forEach((p) => parents.add(p));
    });
    return Array.from(parents);
  }, [autoOpenSelected, keyParents, mergedSelectedKeys]);

  const mergedOpenKeys = useMemo(() => {
    const raw = isOpenControlled ? openKeys : internalOpenKeys;
    const normalized = Array.isArray(raw) ? raw.map(String) : [];

    // Jika tidak searching, merge auto-open selected parents
    if (!searchable || !query.trim()) {
      const set = new Set([...normalized, ...autoOpenForSelected]);
      return Array.from(set);
    }

    // Searching:
    // - kalau preserveOpenKeysOnSearch: tetap
    // - kalau tidak: buka semua parent dari hasil filter supaya terlihat
    if (preserveOpenKeysOnSearch) return normalized;

    const visibleParents = new Set();
    const filtered = filterItemsDeep(baseItems, query, filterFn);
    buildParentsMap(filtered).forEach((parents) => parents.forEach((p) => visibleParents.add(p)));
    return Array.from(visibleParents);
  }, [autoOpenForSelected, baseItems, filterFn, internalOpenKeys, isOpenControlled, openKeys, preserveOpenKeysOnSearch, query, searchable]);

  const filteredItems = useMemo(() => {
    if (!searchable) return baseItems;
    const q = query.trim();
    if (!q) return baseItems;
    return filterItemsDeep(baseItems, q, filterFn);
  }, [baseItems, filterFn, query, searchable]);

  const inputRef = useRef(null);

  const setOpenKeysSafe = useCallback(
    (next) => {
      const keys = Array.isArray(next) ? next.map(String) : [];
      if (!isOpenControlled) setInternalOpenKeys(keys);
      onOpenChange?.(keys);
    },
    [isOpenControlled, onOpenChange],
  );

  const setSelectedKeysSafe = useCallback(
    (next) => {
      const keys = Array.isArray(next) ? next.map(String) : [];
      if (!isSelectedControlled) setInternalSelectedKeys(keys);
    },
    [isSelectedControlled],
  );

  const handleMenuClick = useCallback(
    async (info) => {
      const key = String(info?.key ?? '');

      // maintain selected keys (optional)
      if (selectable) setSelectedKeysSafe([key]);

      // user hooks
      const r1 = onClick?.(info);
      const r2 = onAction?.(key, info);

      if (isPromiseLike(r1)) await r1;
      if (isPromiseLike(r2)) await r2;
    },
    [onAction, onClick, selectable, setSelectedKeysSafe],
  );

  const handleSearchChange = useCallback(
    (e) => {
      setQuery(e.target.value);
    },
    [setQuery],
  );

  const handleSearchFocus = useCallback(() => {
    if (searchAutoFocus) {
      queueMicrotask(() => inputRef.current?.focus?.());
    }
  }, [searchAutoFocus]);

  const isEmpty = !filteredItems || filteredItems.length === 0;

  return (
    <div
      className={className}
      style={style}
    >
      {searchable && (
        <div style={{ padding: 12 }}>
          <Input
            ref={inputRef}
            value={query}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            placeholder={searchPlaceholder}
            allowClear
          />
          {showSearchDivider && <Divider style={{ margin: '12px 0 0 0' }} />}
        </div>
      )}

      {isEmpty ? (
        <div style={{ padding: 16 }}>
          <Empty description={emptyText} />
        </div>
      ) : (
        <Menu
          items={filteredItems}
          mode={mode}
          theme={theme}
          selectable={selectable}
          selectedKeys={mergedSelectedKeys}
          openKeys={mergedOpenKeys}
          onOpenChange={setOpenKeysSafe}
          onClick={handleMenuClick}
          inlineCollapsed={inlineCollapsed}
          inlineIndent={inlineIndent}
          expandIcon={expandIcon}
          subMenuOpenDelay={subMenuOpenDelay}
          subMenuCloseDelay={subMenuCloseDelay}
        />
      )}
    </div>
  );
}

/* ------------------ Helpers ------------------ */

function isPromiseLike(v) {
  return v && typeof v === 'object' && typeof v.then === 'function';
}

function getLabelText(label) {
  if (typeof label === 'string') return label;
  if (typeof label === 'number') return String(label);
  return '';
}

/**
 * Default filter: match query ke label (string/number) atau key.
 * Untuk label ReactNode kompleks, sebaiknya pakai filterFn custom,
 * atau tambahkan field `searchText` pada item (lihat defaultFilterFn).
 */
function defaultFilterFn(item, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;

  const labelText = getLabelText(item?.label).toLowerCase();
  const keyText = typeof item?.key === 'string' || typeof item?.key === 'number' ? String(item.key).toLowerCase() : '';
  const searchText = typeof item?.searchText === 'string' ? item.searchText.toLowerCase() : '';

  return labelText.includes(q) || keyText.includes(q) || searchText.includes(q);
}

/**
 * Pastikan semua key jadi string (biar stabil).
 */
function normalizeKeysDeep(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(Boolean).map((it) => {
    const next = { ...it };
    if (typeof next.key === 'number') next.key = String(next.key);
    if (next.key == null && typeof next.label === 'string') next.key = next.label; // fallback
    if (Array.isArray(next.children)) next.children = normalizeKeysDeep(next.children);
    return next;
  });
}

/**
 * Filter items deep: parent ikut kebawa kalau ada child match.
 */
function filterItemsDeep(items, query, filterFn) {
  if (!Array.isArray(items)) return [];

  const out = [];
  for (const it of items) {
    if (!it) continue;

    const hasChildren = Array.isArray(it.children) && it.children.length > 0;
    if (hasChildren) {
      const filteredChildren = filterItemsDeep(it.children, query, filterFn);
      if (filteredChildren.length > 0 || filterFn(it, query)) {
        out.push({ ...it, children: filteredChildren });
      }
      continue;
    }

    if (filterFn(it, query)) out.push(it);
  }
  return out;
}

/**
 * Map: childKey -> [parentKey1, parentKey2, ...] (chain)
 */
function buildParentsMap(items) {
  const map = new Map();

  const walk = (nodes, parents) => {
    (nodes || []).forEach((n) => {
      if (!n) return;
      const key = n.key != null ? String(n.key) : '';
      if (!key) return;

      map.set(key, parents);

      if (Array.isArray(n.children) && n.children.length) {
        walk(n.children, [...parents, key]);
      }
    });
  };

  walk(items, []);
  return map;
}

/**
 * Helper opsional untuk mapping path -> key (kalau kamu punya href di item)
 * Contoh: const map = buildKeyMap(menuConfig); lalu selectedKey dari pathname.
 */
export function buildKeyMap(items, hrefField = 'href') {
  const out = {};
  const walk = (nodes) => {
    (nodes || []).forEach((n) => {
      if (!n) return;
      const key = n.key != null ? String(n.key) : '';
      const href = n[hrefField];
      if (href && key) out[href] = key;
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    });
  };
  walk(items);
  return out;
}
