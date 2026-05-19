export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 24;
export const MAX_LIMIT = 100;

export function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function parsePaginationParams(searchParams, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const wantsPagination = searchParams.has('page') || searchParams.has('limit') || searchParams.has('pageSize');
  if (!wantsPagination) {
    return { wantsPagination: false, page: undefined, limit: undefined };
  }

  const page = parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE);
  const limit = clamp(parsePositiveInt(searchParams.get('limit') ?? searchParams.get('pageSize'), defaultLimit), 1, maxLimit);

  return { wantsPagination: true, page, limit };
}

export function buildPaginationMeta({ page, limit, total, ...rest }) {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 0;
  const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0;

  return {
    page,
    limit,
    total: safeTotal,
    totalPages: safeLimit > 0 ? Math.ceil(safeTotal / safeLimit) : 0,
    ...rest,
  };
}
