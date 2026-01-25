'use client';

import React from 'react';
import { App as AntdApp, Alert, Button, Checkbox, Drawer, Dropdown, Input, Space, Table, Tooltip, Typography } from 'antd';
import { DownOutlined, MoreOutlined, ReloadOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isThenable(v) {
  return v != null && (typeof v === 'object' || typeof v === 'function') && typeof v.then === 'function';
}

function safeJsonParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function toArray(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
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

function withTooltip(node, tooltipCfg) {
  if (!tooltipCfg?.title) return node;
  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: 'inline-flex', width: 'fit-content' }}>{node}</span>
    </Tooltip>
  );
}

function sorterToQuery(sorter) {
  const s = Array.isArray(sorter) ? sorter[0] : sorter;
  const field = s?.field ?? s?.columnKey;
  const order = s?.order;
  if (!field || !order) return { sortField: null, sortOrder: null };
  return {
    sortField: field,
    sortOrder: order === 'ascend' ? 'asc' : order === 'descend' ? 'desc' : null,
  };
}

function queryToSorter(sortField, sortOrder) {
  if (!sortField || !sortOrder) return null;
  return {
    field: sortField,
    order: sortOrder === 'asc' ? 'ascend' : sortOrder === 'desc' ? 'descend' : null,
  };
}

function getColumnId(col) {
  if (!col) return null;
  if (col.key != null) return String(col.key);
  const di = col.dataIndex;
  if (typeof di === 'string' || typeof di === 'number') return String(di);
  if (Array.isArray(di) && di.length > 0) return di.map(String).join('.');
  return null;
}

function getColumnLabel(col) {
  const t = col?.title;
  if (typeof t === 'string') return t;
  if (typeof t === 'number') return String(t);
  return getColumnId(col) ?? 'Column';
}

function deepClone(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return safeJsonParse(JSON.stringify(obj)) ?? obj;
}

function mergeStyles(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function toCsvCell(v) {
  if (v == null) return '';
  const s = typeof v === 'string' ? v : typeof v === 'number' ? String(v) : JSON.stringify(v);
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadText(filename, content, mime = 'text/csv;charset=utf-8') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildCsv({ columns, rows, fileName = 'export.csv', mapper }) {
  const visibleCols = (columns ?? []).filter((c) => !c?.hidden && !c?.__internalHidden);
  const headers = visibleCols.map((c) => toCsvCell(getColumnLabel(c))).join(',');

  const lines = (rows ?? []).map((row, idx) => {
    if (typeof mapper === 'function') {
      const mapped = mapper(row, idx);
      if (Array.isArray(mapped)) return mapped.map(toCsvCell).join(',');
    }

    return visibleCols
      .map((c) => {
        const id = getColumnId(c);
        const di = c?.dataIndex;

        if (typeof c?.csvValue === 'function') return toCsvCell(c.csvValue(row, idx));

        if (Array.isArray(di)) {
          let cur = row;
          for (const k of di) cur = cur?.[k];
          return toCsvCell(cur);
        }

        if (id && row && typeof row === 'object') return toCsvCell(row[id]);
        return toCsvCell('');
      })
      .join(',');
  });

  const content = [headers, ...lines].join('\n');
  downloadText(fileName, content);
}

function defaultRowKey(record) {
  if (!record || typeof record !== 'object') return String(record);
  if (record.id != null) return String(record.id);
  if (record.key != null) return String(record.key);
  return String(record._id ?? Math.random());
}

function applyColumnVisibility(columns, hiddenSet) {
  const cols = (columns ?? []).map((c) => ({ ...c }));
  for (const c of cols) {
    const id = getColumnId(c);
    c.__internalHidden = id ? hiddenSet.has(id) : false;
  }
  return cols;
}

function filterVisibleColumns(cols) {
  return (cols ?? []).filter((c) => !c?.__internalHidden);
}

/**
 * Helper: buat kolom action dropdown cepat.
 *
 * makeActionsColumn({
 *   title: 'Aksi',
 *   width: 72,
 *   actions: (record) => [
 *     { key:'edit', label:'Edit', onPress:() => ..., disabledReason:'...' },
 *     { key:'delete', label:'Hapus', danger:true, confirm:'Yakin hapus?', onPress: async () => ... }
 *   ]
 * })
 */
export function makeActionsColumn({ title = '', width = 72, fixed, align = 'right', actions, icon = <MoreOutlined />, trigger = ['click'], disabled } = {}) {
  return {
    title,
    key: '__actions__',
    dataIndex: '__actions__',
    width,
    fixed,
    align,
    render: (_v, record, index) => {
      const itemsRaw = typeof actions === 'function' ? actions(record, index) : actions;
      const list = toArray(itemsRaw).filter(Boolean);

      const menuItems = list.map((a) => ({
        key: String(a.key ?? a.label ?? index),
        label: a.label,
        danger: Boolean(a.danger),
        disabled: Boolean(a.disabled),
      }));

      const disabledReason = list.find((a) => a.disabled && a.disabledReason)?.disabledReason;
      const tooltipCfg = normalizeTooltip(undefined, Boolean(disabled || menuItems.length === 0), disabledReason);

      return withTooltip(
        <Dropdown
          trigger={trigger}
          menu={{
            items: menuItems,
            onClick: async ({ key }) => {
              const act = list.find((x) => String(x.key ?? x.label) === String(key));
              if (!act || act.disabled) return;

              if (act.confirm) {
                // confirm handled by AppButton pattern? Keep lightweight: use window confirm fallback
                const ok = window.confirm(typeof act.confirm === 'string' ? act.confirm : 'Yakin?');
                if (!ok) return;
              }

              const res = act.onPress?.(record, index);
              if (isThenable(res)) await res;
            },
          }}
        >
          <Button
            type='text'
            size='small'
            icon={icon}
            onClick={(e) => e.stopPropagation()}
            disabled={Boolean(disabled || menuItems.length === 0)}
          />
        </Dropdown>,
        tooltipCfg,
      );
    },
  };
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    if (!delayMs || delayMs <= 0) {
      setDebounced(value);
      return;
    }
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export function useAppTable(initial = {}) {
  const [query, setQuery] = React.useState(() => ({
    page: 1,
    pageSize: 10,
    search: '',
    sortField: null,
    sortOrder: null, // 'asc'|'desc'
    filters: {},
    ...initial,
  }));

  return {
    query,
    setQuery,
    patchQuery: (patch) => setQuery((q) => ({ ...q, ...(typeof patch === 'function' ? patch(q) : patch) })),
    resetQuery: () =>
      setQuery({
        page: 1,
        pageSize: 10,
        search: '',
        sortField: null,
        sortOrder: null,
        filters: {},
        ...initial,
      }),
  };
}

function ColumnSettingsDrawer({ open, onClose, columns, hiddenSet, setHiddenSet, persistKey, title = 'Kolom' }) {
  const selectableCols = (columns ?? []).map((c) => ({ col: c, id: getColumnId(c) })).filter((x) => x.id && x.id !== '__actions__');

  const allIds = selectableCols.map((x) => x.id);
  const visibleCount = allIds.filter((id) => !hiddenSet.has(id)).length;

  const onToggle = (id, checked) => {
    setHiddenSet((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = () => {
    if (!persistKey || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(persistKey);
      const base = (raw && safeJsonParse(raw)) || {};
      window.localStorage.setItem(
        persistKey,
        JSON.stringify({
          ...base,
          hiddenColumns: Array.from(hiddenSet),
        }),
      );
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    if (!open) return;
    // save on close? keep explicit save on any change (cheap)
    save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hiddenSet]);

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width={360}
      styles={{ body: { fontFamily: DEFAULT_FONT_FAMILY } }}
    >
      <Space
        direction='vertical'
        size={12}
        style={{ width: '100%' }}
      >
        <Space>
          <Button
            onClick={() => setHiddenSet(new Set())}
            disabled={visibleCount === allIds.length}
          >
            Tampilkan semua
          </Button>
          <Button
            onClick={() => setHiddenSet(new Set(allIds))}
            disabled={visibleCount === 0}
          >
            Sembunyikan semua
          </Button>
          <Button
            type='link'
            onClick={() => setHiddenSet(new Set())}
            style={{ paddingInline: 0 }}
          >
            Reset
          </Button>
        </Space>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selectableCols.map(({ col, id }) => (
            <Checkbox
              key={id}
              checked={!hiddenSet.has(id)}
              onChange={(e) => onToggle(id, e.target.checked)}
            >
              <span style={{ fontFamily: DEFAULT_FONT_FAMILY }}>{getColumnLabel(col)}</span>
            </Checkbox>
          ))}
        </div>

        <Typography.Text
          type='secondary'
          style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 12 }}
        >
          Tip: kolom disimpan per <code>persistKey</code>.
        </Typography.Text>
      </Space>
    </Drawer>
  );
}

export const AppTable = React.forwardRef(function AppTable(
  {
    // data mode
    dataSource,
    total: totalProp,

    // request mode
    request, // async (params, ctx) => { data, total } or { dataSource, total }
    requestKey, // optional: force refetch when this changes

    // columns
    columns,
    rowKey = defaultRowKey,

    // query
    query,
    defaultQuery,
    onQueryChange,
    persistKey,

    // toolbar
    title,
    subtitle,
    toolbarLeft,
    toolbarRight,
    showToolbar = true,

    searchable = true,
    searchPlaceholder = 'Cari...',
    searchDebounceMs = 350,

    refreshable = true,
    onRefresh,

    exportCsv, // false | true | { fileName, mapper, columns }
    exportLabel = 'Export CSV',

    columnSettings = true,
    columnSettingsTitle = 'Kolom',

    // states
    loading: loadingProp,
    error,
    errorTitle = 'Terjadi kesalahan',
    emptyText = 'Tidak ada data',

    // table props
    size = 'middle',
    bordered = false,
    sticky = false,
    scroll,
    pagination: paginationProp,
    tableLayout,
    rowSelection,
    expandable,

    // behaviors
    autoFetch = true,
    keepPageOnSearch = false,
    throttleMs = 0,

    // styles
    className,
    style,
    ...rest
  },
  ref,
) {
  const { message } = AntdApp.useApp();

  const isControlledQuery = query != null;
  const [innerQuery, setInnerQuery] = React.useState(() => ({
    page: 1,
    pageSize: 10,
    search: '',
    sortField: null,
    sortOrder: null, // 'asc'|'desc'
    filters: {},
    ...(defaultQuery ?? null),
  }));

  const mergedQuery = isControlledQuery ? query : innerQuery;

  const patchQuery = React.useCallback(
    (patch) => {
      const next = typeof patch === 'function' ? patch(mergedQuery) : { ...mergedQuery, ...patch };
      if (!isControlledQuery) setInnerQuery(next);
      if (typeof onQueryChange === 'function') onQueryChange(next);
    },
    [isControlledQuery, mergedQuery, onQueryChange],
  );

  // load persisted settings
  const [hiddenSet, setHiddenSet] = React.useState(() => new Set());
  React.useEffect(() => {
    if (!persistKey || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(persistKey);
      const parsed = raw ? safeJsonParse(raw) : null;
      if (parsed?.hiddenColumns && Array.isArray(parsed.hiddenColumns)) {
        setHiddenSet(new Set(parsed.hiddenColumns.map(String)));
      }
      if (!isControlledQuery && parsed?.query && typeof parsed.query === 'object') {
        setInnerQuery((q) => ({ ...q, ...parsed.query }));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  // persist query changes
  React.useEffect(() => {
    if (!persistKey || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(persistKey);
      const base = (raw && safeJsonParse(raw)) || {};
      window.localStorage.setItem(
        persistKey,
        JSON.stringify({
          ...base,
          query: mergedQuery,
          hiddenColumns: Array.from(hiddenSet),
        }),
      );
    } catch {
      // ignore
    }
  }, [persistKey, mergedQuery, hiddenSet]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const computedColumns = React.useMemo(() => {
    const cols = applyColumnVisibility(columns ?? [], hiddenSet);
    return cols;
  }, [columns, hiddenSet]);

  const visibleColumns = React.useMemo(() => filterVisibleColumns(computedColumns), [computedColumns]);

  const [innerLoading, setInnerLoading] = React.useState(false);
  const [innerData, setInnerData] = React.useState([]);
  const [innerTotal, setInnerTotal] = React.useState(0);

  const debouncedSearch = useDebouncedValue(mergedQuery.search ?? '', searchDebounceMs);

  const lastFireAtRef = React.useRef(0);
  const requestSeqRef = React.useRef(0);

  const hasRequest = typeof request === 'function';
  const effectiveLoading = Boolean(loadingProp ?? innerLoading);

  const effectiveData = hasRequest ? innerData : (dataSource ?? []);
  const effectiveTotal = hasRequest ? innerTotal : typeof totalProp === 'number' ? totalProp : (dataSource?.length ?? 0);

  const effectiveScroll = scroll ?? { x: 'max-content' };
  const effectiveTableLayout = tableLayout ?? 'auto';

  const persistSearchQuery = mergedQuery.search ?? '';
  const effectiveSearchValue = searchable ? persistSearchQuery : '';

  const fetchData = React.useCallback(
    async (reason) => {
      if (!hasRequest) return;

      const now = Date.now();
      if (throttleMs > 0 && now - lastFireAtRef.current < throttleMs) return;
      lastFireAtRef.current = now;

      const seq = (requestSeqRef.current += 1);
      setInnerLoading(true);

      const params = {
        page: mergedQuery.page,
        pageSize: mergedQuery.pageSize,
        search: debouncedSearch,
        sortField: mergedQuery.sortField,
        sortOrder: mergedQuery.sortOrder,
        filters: mergedQuery.filters ?? {},
        reason,
      };

      try {
        const res = request(params, { message });
        const out = isThenable(res) ? await res : res;

        // ignore stale
        if (seq !== requestSeqRef.current) return;

        const data = out?.data ?? out?.dataSource ?? out?.items ?? [];
        const total = out?.total ?? out?.count ?? (Array.isArray(data) ? data.length : 0);

        setInnerData(Array.isArray(data) ? data : []);
        setInnerTotal(typeof total === 'number' ? total : 0);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        setInnerData([]);
        setInnerTotal(0);

        if (!error) {
          message.error('Gagal memuat data.');
        }
      } finally {
        if (seq === requestSeqRef.current) setInnerLoading(false);
      }
    },
    [hasRequest, mergedQuery.page, mergedQuery.pageSize, mergedQuery.sortField, mergedQuery.sortOrder, mergedQuery.filters, debouncedSearch, throttleMs, request, message, error],
  );

  // auto fetch
  React.useEffect(() => {
    if (!hasRequest) return;
    if (!autoFetch) return;
    fetchData('auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRequest, autoFetch, mergedQuery.page, mergedQuery.pageSize, mergedQuery.sortField, mergedQuery.sortOrder, debouncedSearch, JSON.stringify(mergedQuery.filters ?? {}), requestKey]);

  const onTableChange = (pagination, filters, sorter) => {
    const nextPage = pagination?.current ?? 1;
    const nextPageSize = pagination?.pageSize ?? mergedQuery.pageSize;

    const nextFilters = filters ?? {};
    const sortQ = sorterToQuery(sorter);

    patchQuery((q) => ({
      ...q,
      page: nextPage,
      pageSize: nextPageSize,
      filters: nextFilters,
      sortField: sortQ.sortField,
      sortOrder: sortQ.sortOrder,
    }));
  };

  const handleSearchChange = (e) => {
    const next = e?.target?.value ?? '';
    patchQuery((q) => ({
      ...q,
      search: next,
      page: keepPageOnSearch ? q.page : 1,
    }));
  };

  const handleRefresh = async () => {
    if (typeof onRefresh === 'function') {
      const res = onRefresh();
      if (isThenable(res)) await res;
    }
    await fetchData('refresh');
  };

  const toolbarNode =
    showToolbar && (title || subtitle || searchable || refreshable || exportCsv || columnSettings || toolbarLeft || toolbarRight) ? (
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          fontFamily: DEFAULT_FONT_FAMILY,
        }}
      >
        <div style={{ minWidth: 220, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {title ? (
            <Typography.Text
              strong
              style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 14 }}
            >
              {title}
            </Typography.Text>
          ) : null}
          {subtitle ? (
            <Typography.Text
              type='secondary'
              style={{ fontFamily: DEFAULT_FONT_FAMILY, fontSize: 12 }}
            >
              {subtitle}
            </Typography.Text>
          ) : null}
          {toolbarLeft ? <div style={{ marginTop: 6 }}>{toolbarLeft}</div> : null}
        </div>

        <Space
          wrap
          size={8}
          style={{ fontFamily: DEFAULT_FONT_FAMILY }}
        >
          {searchable ? (
            <Input
              value={effectiveSearchValue}
              onChange={handleSearchChange}
              allowClear
              prefix={<SearchOutlined />}
              placeholder={searchPlaceholder}
              style={{ width: 260, fontFamily: DEFAULT_FONT_FAMILY }}
            />
          ) : null}

          {exportCsv ? (
            <Button
              onClick={() => {
                const cfg = exportCsv === true ? {} : exportCsv;
                const fileName = cfg?.fileName ?? 'export.csv';
                const mapper = cfg?.mapper;
                const cols = cfg?.columns ?? visibleColumns;
                buildCsv({ columns: cols, rows: effectiveData, fileName, mapper });
              }}
            >
              {exportLabel}
            </Button>
          ) : null}

          {refreshable ? (
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={effectiveLoading}
            >
              Refresh
            </Button>
          ) : null}

          {columnSettings ? (
            <Button
              icon={<SettingOutlined />}
              onClick={() => setDrawerOpen(true)}
            >
              Kolom
            </Button>
          ) : null}

          {toolbarRight ? toolbarRight : null}
        </Space>
      </div>
    ) : null;

  const computedPagination = (() => {
    if (paginationProp === false) return false;

    const base = typeof paginationProp === 'object' ? paginationProp : {};
    const current = mergedQuery.page ?? 1;
    const pageSize = mergedQuery.pageSize ?? 10;

    return {
      current,
      pageSize,
      total: effectiveTotal,
      showSizeChanger: true,
      showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t}`,
      ...base,
    };
  })();

  const sorter = queryToSorter(mergedQuery.sortField, mergedQuery.sortOrder);

  const errorNode = error ? (
    <Alert
      type='error'
      showIcon
      message={errorTitle}
      description={typeof error === 'string' ? error : undefined}
      style={{ marginBottom: 12, fontFamily: DEFAULT_FONT_FAMILY }}
    />
  ) : null;

  const emptyNode = <div style={{ padding: 18, opacity: 0.75, fontFamily: DEFAULT_FONT_FAMILY }}>{emptyText}</div>;

  // Optional: quick actions dropdown (useful when toolbarRight is crowded)
  const quickActions = (() => {
    const items = [];
    if (refreshable) items.push({ key: 'refresh', label: 'Refresh' });
    if (columnSettings) items.push({ key: 'columns', label: 'Atur kolom' });
    if (exportCsv) items.push({ key: 'export', label: exportLabel });

    if (items.length === 0) return null;

    return (
      <Dropdown
        menu={{
          items,
          onClick: async ({ key }) => {
            if (key === 'refresh') return handleRefresh();
            if (key === 'columns') return setDrawerOpen(true);
            if (key === 'export') {
              const cfg = exportCsv === true ? {} : exportCsv;
              buildCsv({
                columns: cfg?.columns ?? visibleColumns,
                rows: effectiveData,
                fileName: cfg?.fileName ?? 'export.csv',
                mapper: cfg?.mapper,
              });
            }
          },
        }}
      >
        <Button icon={<MoreOutlined />}>
          Aksi <DownOutlined />
        </Button>
      </Dropdown>
    );
  })();

  const finalToolbar = toolbarNode ? (
    <div>
      {toolbarNode}
      {/* Quick actions fallback (optional) */}
      {!toolbarRight && (refreshable || columnSettings || exportCsv) ? <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>{quickActions}</div> : null}
    </div>
  ) : null;

  return (
    <div
      className={className}
      style={mergeStyles({ width: '100%', fontFamily: DEFAULT_FONT_FAMILY }, style)}
    >
      {finalToolbar}
      {errorNode}

      <Table
        ref={ref}
        columns={visibleColumns}
        dataSource={effectiveData}
        rowKey={rowKey}
        loading={effectiveLoading}
        size={size}
        bordered={bordered}
        sticky={sticky}
        scroll={effectiveScroll}
        tableLayout={effectiveTableLayout}
        pagination={computedPagination}
        rowSelection={rowSelection}
        expandable={expandable}
        locale={{ emptyText: emptyNode }}
        onChange={onTableChange}
        sortDirections={['ascend', 'descend']}
        sortOrder={sorter?.order ?? null}
        {...rest}
      />

      {columnSettings ? (
        <ColumnSettingsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          columns={columns ?? []}
          hiddenSet={hiddenSet}
          setHiddenSet={setHiddenSet}
          persistKey={persistKey}
          title={columnSettingsTitle}
        />
      ) : null}
    </div>
  );
});

AppTable.ActionsColumn = makeActionsColumn;
AppTable.useTable = useAppTable;

export default AppTable;
