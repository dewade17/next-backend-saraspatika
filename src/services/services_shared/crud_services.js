import { badRequest, notFound } from '@/lib/error.js';

/**
 * @typedef {{
 *  repo: any,
 *  createSchema?: any,
 *  updateSchema?: any,
 *  querySchema?: any,
 *  defaults?: {
 *    page?: number,
 *    pageSize?: number,
 *    maxPageSize?: number
 *  },
 *  hooks?: {
 *    buildWhere?: (q: any, ctx?: any)=>any,
 *    buildOrderBy?: (q: any, ctx?: any)=>any,
 *    beforeCreate?: (data: any, ctx?: any)=>Promise<any>|any,
 *    beforeUpdate?: (data: any, ctx?: any)=>Promise<any>|any,
 *    beforeRemove?: (ctx?: any)=>Promise<void>|void
 *  },
 *  include?: any,
 *  select?: any
 * }} CrudServiceConfig
 */

/**
 * CRUD Service factory (pagination, filtering hooks, meta).
 * Semua error dilempar sebagai AppError agar apiRoute() bisa standardize.
 * @param {CrudServiceConfig} cfg
 */
export function createCrudService(cfg) {
  const repo = cfg.repo;
  if (!repo) throw new Error('createCrudService: cfg.repo wajib diisi');

  const createSchema = cfg.createSchema ?? null;
  const updateSchema = cfg.updateSchema ?? null;
  const querySchema = cfg.querySchema ?? null;

  const defaults = {
    page: 1,
    pageSize: 20,
    maxPageSize: 100,
    ...(cfg.defaults ?? {}),
  };

  const hooks = {
    buildWhere: cfg.hooks?.buildWhere ?? (() => ({})),
    buildOrderBy: cfg.hooks?.buildOrderBy ?? (() => undefined),
    beforeCreate: cfg.hooks?.beforeCreate ?? (async (d) => d),
    beforeUpdate: cfg.hooks?.beforeUpdate ?? (async (d) => d),
    beforeRemove: cfg.hooks?.beforeRemove ?? (async () => {}),
  };

  const clampInt = (v, def) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return def;
    const i = Math.trunc(n);
    return i <= 0 ? def : i;
  };

  return {
    /**
     * Query standar:
     * { page, pageSize, q, filters, sort, order }
     */
    async list(rawQuery = {}, ctx = {}) {
      const q = querySchema ? await querySchema.parseAsync(rawQuery) : rawQuery;

      const page = clampInt(q.page, defaults.page);
      const pageSize = Math.min(clampInt(q.pageSize, defaults.pageSize), defaults.maxPageSize);
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const where = await hooks.buildWhere(q, ctx);
      const orderBy = await hooks.buildOrderBy(q, ctx);

      const [items, total] = await Promise.all([repo.list({ where, orderBy, skip, take, include: cfg.include, select: cfg.select }), repo.count(where)]);

      const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

      return {
        data: items,
        meta: { page, pageSize, total, totalPages },
      };
    },

    async get(id, ctx = {}) {
      if (id === undefined || id === null || id === '') throw badRequest('ID wajib diisi', { code: 'id_required' });
      const item = await repo.findById(id, { include: cfg.include, select: cfg.select });
      if (!item) throw notFound('Data tidak ditemukan', { code: 'record_not_found' });
      return item;
    },

    async create(input, ctx = {}) {
      const data0 = createSchema ? await createSchema.parseAsync(input) : input;
      const data = await hooks.beforeCreate(data0, ctx);
      return await repo.create(data, { include: cfg.include, select: cfg.select });
    },

    async update(id, input, ctx = {}) {
      if (id === undefined || id === null || id === '') throw badRequest('ID wajib diisi', { code: 'id_required' });

      const data0 = updateSchema ? await updateSchema.parseAsync(input) : input;
      const data = await hooks.beforeUpdate(data0, ctx);

      // repo.update akan melempar Prisma error P2025 -> otomatis jadi 404 via normalizeToAppError()
      return await repo.update(id, data, { include: cfg.include, select: cfg.select });
    },

    async remove(id, ctx = {}) {
      if (id === undefined || id === null || id === '') throw badRequest('ID wajib diisi', { code: 'id_required' });
      await hooks.beforeRemove(ctx);
      // Prisma P2025 -> 404 via error normalization
      return await repo.remove(id);
    },
  };
}
