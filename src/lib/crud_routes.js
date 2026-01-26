import { NextResponse } from 'next/server';
import { apiRoute, parseBody } from '@/lib/api.js';
import { requireToken, requirePermission, optionalToken } from '@/lib/authz.js';

/**
 * Parse query string -> object standar untuk service.list()
 */
function parseListQuery(req) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const q = sp.get('q') ?? undefined;
  const page = sp.get('page') ?? undefined;
  const pageSize = sp.get('pageSize') ?? undefined;

  // sort can be "name" or "-name"
  const sortRaw = sp.get('sort') ?? undefined;
  const orderRaw = sp.get('order') ?? undefined;

  let sort = sortRaw;
  let order = orderRaw;

  if (sortRaw && sortRaw.startsWith('-')) {
    sort = sortRaw.slice(1);
    order = order ?? 'desc';
  }

  // filters: f_status=ACTIVE & f_role=GURU
  const filters = {};
  for (const [k, v] of sp.entries()) {
    if (k.startsWith('f_')) filters[k.slice(2)] = v;
  }

  // optional: filter={"status":"ACTIVE"}
  const filterJson = sp.get('filter');
  if (filterJson) {
    try {
      const parsed = JSON.parse(filterJson);
      if (parsed && typeof parsed === 'object') Object.assign(filters, parsed);
    } catch {
      // ignore; validasi bisa dilakukan di querySchema kalau mau strict
    }
  }

  return { q, page, pageSize, sort, order, filters };
}

/**
 * Auth modes:
 * - { mode: 'public' }
 * - { mode: 'token' }
 * - { mode: 'permission', resource: 'users', action: 'read' } (per-method bisa beda)
 */
function wrapAuth(auth, handler) {
  const mode = auth?.mode ?? 'public';

  if (mode === 'token') return requireToken(handler);
  if (mode === 'permission') return requirePermission(auth.resource, auth.action, handler);
  if (mode === 'optional') return optionalToken(handler);

  return handler; // public
}

/**
 * CRUD untuk collection endpoint: /api/x
 * - GET: list
 * - POST: create
 */
export function crudCollectionRoutes(cfg) {
  const service = cfg.service;

  const GET = apiRoute(
    wrapAuth(cfg.auth?.GET, async (req, ctx) => {
      const query = parseListQuery(req);
      const result = await service.list(query, ctx);
      return NextResponse.json(result);
    }),
  );

  const POST = apiRoute(
    wrapAuth(cfg.auth?.POST, async (req, ctx) => {
      const input = cfg.schemas?.create ? await parseBody(req, cfg.schemas.create) : await req.json();
      const created = await service.create(input, ctx);
      return NextResponse.json({ ok: true, data: created }, { status: 201 });
    }),
  );

  return { GET, POST };
}

/**
 * CRUD untuk item endpoint: /api/x/[id]
 * - GET: get
 * - PATCH: update
 * - DELETE: remove
 */
export function crudItemRoutes(cfg) {
  const service = cfg.service;
  const idParam = cfg.idParam ?? 'id';

  const GET = apiRoute(
    wrapAuth(cfg.auth?.GET, async (req, ctx) => {
      const { [idParam]: id } = ctx.params ?? {};
      const data = await service.get(id, ctx);
      return NextResponse.json({ data });
    }),
  );

  const PATCH = apiRoute(
    wrapAuth(cfg.auth?.PATCH, async (req, ctx) => {
      const { [idParam]: id } = ctx.params ?? {};
      const input = cfg.schemas?.update ? await parseBody(req, cfg.schemas.update) : await req.json();
      const updated = await service.update(id, input, ctx);
      return NextResponse.json({ ok: true, data: updated });
    }),
  );

  const DELETE = apiRoute(
    wrapAuth(cfg.auth?.DELETE, async (req, ctx) => {
      const { [idParam]: id } = ctx.params ?? {};
      await service.remove(id, ctx);
      return NextResponse.json({ ok: true });
    }),
  );

  return { GET, PATCH, DELETE };
}
