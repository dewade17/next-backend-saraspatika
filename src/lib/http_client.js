/**
 * Reusable HTTP + CRUD client (fetch wrapper) for Next.js (works in browser & server).
 *
 * Features:
 * - Token optional: none / bearer / cookie
 * - Query builder
 * - JSON/FormData support
 * - Timeout + retry with exponential backoff
 * - Standardized HttpError that understands your API problem-details format
 *
 * Notes:
 * - In the browser, same-origin cookies are sent automatically by fetch.
 * - On the server (Node), you MUST use an absolute URL (provide baseUrl),
 *   and if you need cookie auth, pass `cookie` header manually from the request context.
 */

/**
 * @typedef {'none'|'bearer'|'cookie'} AuthType
 *
 * @typedef {{
 *  type?: AuthType,
 *  token?: string | null,
 *  tokenProvider?: (() => (string | null | Promise<string | null>)) | null,
 *  cookie?: string | null, // server-side: "access_token=...; other=..."
 * }} AuthOptions
 *
 * @typedef {{
 *  baseUrl?: string | null,
 *  headers?: Record<string, string>,
 *  auth?: AuthOptions,
 *  credentials?: RequestCredentials,
 *  timeoutMs?: number,
 *  retry?: number,
 *  retryDelayMs?: number,
 *  retryOn?: number[],
 *  onRequest?: ((ctx: { url: string, init: RequestInit }) => void | Promise<void>) | null,
 *  onResponse?: ((ctx: { url: string, init: RequestInit, res: Response }) => void | Promise<void>) | null,
 *  fetchImpl?: typeof fetch,
 * }} HttpClientOptions
 *
 * @typedef {{
 *  method?: string,
 *  headers?: Record<string, string>,
 *  query?: Record<string, any> | URLSearchParams | null,
 *  json?: any,
 *  body?: BodyInit | null,
 *  auth?: AuthOptions,
 *  timeoutMs?: number,
 *  retry?: number,
 *  retryDelayMs?: number,
 *  retryOn?: number[],
 *  signal?: AbortSignal | null,
 *  next?: any, // Next.js fetch options passthrough (revalidate/tags)
 *  cache?: RequestCache,
 *  credentials?: RequestCredentials,
 *  redirect?: RequestRedirect,
 *  referrerPolicy?: ReferrerPolicy,
 *  integrity?: string,
 *  keepalive?: boolean,
 *  mode?: RequestMode,
 * }} RequestOptions
 *
 * @typedef {{
 *  type?: string,
 *  title?: string,
 *  status?: number,
 *  code?: string,
 *  detail?: string,
 *  errors?: any,
 *  stack?: any,
 * }} ProblemDetails
 */

function isAbsoluteUrl(u) {
  return /^https?:\/\//i.test(String(u || ''));
}

function stripTrailingSlash(s) {
  return String(s || '').replace(/\/+$/g, '');
}

function stripLeadingSlash(s) {
  return String(s || '').replace(/^\/+/g, '');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeHeaders(a, b) {
  const out = {};
  for (const [k, v] of Object.entries(a || {})) out[k.toLowerCase()] = String(v);
  for (const [k, v] of Object.entries(b || {})) out[k.toLowerCase()] = String(v);
  return out;
}

function headerHas(headersLower, name) {
  const key = String(name || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(headersLower || {}, key);
}

function toHeaderRecord(headersLower) {
  // Convert lower-case map into actual record; keep lower-case keys (fetch treats headers case-insensitively).
  return { ...(headersLower || {}) };
}

function normalizeBaseUrl(baseUrl) {
  const b = String(baseUrl || '').trim();
  if (!b) return null;
  // Ensure it is absolute
  const u = new URL(b);
  return stripTrailingSlash(u.toString());
}

function encodeQueryValue(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  // arrays/objects -> JSON string
  return JSON.stringify(v);
}

function buildQuery(params) {
  if (!params) return '';
  if (params instanceof URLSearchParams) {
    const s = params.toString();
    return s ? `?${s}` : '';
  }

  const sp = new URLSearchParams();
  for (const [k, raw] of Object.entries(params)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const v = encodeQueryValue(item);
        if (v !== null) sp.append(k, v);
      }
      continue;
    }
    const v = encodeQueryValue(raw);
    if (v !== null) sp.set(k, v);
  }

  const s = sp.toString();
  return s ? `?${s}` : '';
}

function buildUrl(path, baseUrl, query) {
  const p = String(path || '');
  const q = buildQuery(query);

  // Absolute path => just append query safely
  if (isAbsoluteUrl(p)) {
    const u = new URL(p);
    if (q) {
      const extra = new URLSearchParams(q.slice(1));
      for (const [k, v] of extra.entries()) u.searchParams.append(k, v);
    }
    return u.toString();
  }

  // Relative path
  const rel = p.startsWith('/') ? p : `/${p}`;
  if (baseUrl) {
    const u = new URL(`${stripTrailingSlash(baseUrl)}${rel}`);
    if (q) {
      const extra = new URLSearchParams(q.slice(1));
      for (const [k, v] of extra.entries()) u.searchParams.append(k, v);
    }
    return u.toString();
  }

  // Browser can resolve relative URLs; on server we should throw a helpful error.
  if (typeof window === 'undefined') {
    throw new Error(`HttpClient: baseUrl wajib di-set untuk request relative di server. Path="${p}". ` + `Contoh: createHttpClient({ baseUrl: process.env.APP_URL })`);
  }

  // Browser: keep relative; just append query
  if (!q) return rel;
  const joiner = rel.includes('?') ? '&' : '?';
  return `${rel}${joiner}${q.slice(1)}`;
}

async function resolveAuth(auth) {
  const type = auth?.type ?? 'none';
  if (type === 'bearer') {
    if (auth?.token) return { type, token: String(auth.token) };
    const provider = auth?.tokenProvider;
    if (typeof provider === 'function') {
      const t = await provider();
      return { type, token: t ? String(t) : null };
    }
    return { type, token: null };
  }
  if (type === 'cookie') {
    return { type, cookie: auth?.cookie ? String(auth.cookie) : null };
  }
  return { type: 'none' };
}

function withTimeoutSignal(timeoutMs, externalSignal) {
  const ms = typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : 0;
  if (!ms && !externalSignal) return { signal: undefined, cleanup: () => {} };

  const controller = new AbortController();

  const onAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) onAbort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }

  const t = ms ? setTimeout(() => controller.abort(new Error('Request timeout')), ms) : null;

  return {
    signal: controller.signal,
    cleanup: () => {
      if (t) clearTimeout(t);
      if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
    },
  };
}

async function safeReadBody(res) {
  // Read body once; parse JSON if content-type indicates JSON.
  const ct = res.headers.get('content-type') || '';
  if (res.status === 204) return { kind: 'empty', data: null };

  let txt = '';
  try {
    txt = await res.text();
  } catch {
    return { kind: 'empty', data: null };
  }

  if (!txt) return { kind: /application\/json/i.test(ct) ? 'json' : 'text', data: null };

  if (/application\/json/i.test(ct)) {
    try {
      return { kind: 'json', data: JSON.parse(txt) };
    } catch {
      // fall back to raw text
    }
  }

  return { kind: 'text', data: txt };
}

function shouldRetryStatus(status, retryOn) {
  const defaultRetryOn = [429, 502, 503, 504];
  const set = new Set(Array.isArray(retryOn) && retryOn.length ? retryOn : defaultRetryOn);
  return set.has(status);
}

function computeBackoff(attempt, baseDelayMs) {
  const base = typeof baseDelayMs === 'number' && baseDelayMs > 0 ? baseDelayMs : 250;
  const exp = Math.min(6, Math.max(0, attempt)); // cap
  const max = base * Math.pow(2, exp);
  // jitter 0.5x..1.0x
  const jitter = 0.5 + Math.random() * 0.5;
  return Math.floor(max * jitter);
}

export class HttpError extends Error {
  /**
   * @param {string} message
   * @param {{
   *  status?: number,
   *  url?: string,
   *  method?: string,
   *  problem?: ProblemDetails | null,
   *  responseBody?: any,
   *  cause?: any
   * }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = 'HttpError';

    this.status = opts.status ?? 0;
    this.url = opts.url ?? '';
    this.method = opts.method ?? '';
    this.problem = opts.problem ?? null;
    this.responseBody = opts.responseBody;

    if (opts.cause) this.cause = opts.cause;
  }

  /** @returns {string} */
  get code() {
    return this.problem?.code || 'http_error';
  }
}

/**
 * Create a reusable HTTP client.
 * @param {HttpClientOptions} [opts]
 */
export function createHttpClient(opts = {}) {
  const baseUrl = normalizeBaseUrl(opts.baseUrl);
  const defaultHeadersLower = mergeHeaders({}, opts.headers);
  const defaultAuth = opts.auth ?? { type: 'none' };
  const defaultCredentials = opts.credentials;
  const defaultTimeoutMs = opts.timeoutMs ?? 0;
  const defaultRetry = opts.retry ?? 0;
  const defaultRetryDelayMs = opts.retryDelayMs ?? 250;
  const defaultRetryOn = opts.retryOn;
  const onRequest = typeof opts.onRequest === 'function' ? opts.onRequest : null;
  const onResponse = typeof opts.onResponse === 'function' ? opts.onResponse : null;

  const fetchImpl = opts.fetchImpl ?? fetch;

  async function request(path, ro = {}) {
    const method = String(ro.method || 'GET').toUpperCase();

    const url = buildUrl(path, baseUrl, ro.query);

    // headers are stored lower-case in this client (simplifies merges)
    const headersLower = mergeHeaders(defaultHeadersLower, ro.headers);

    // body
    let body = ro.body ?? null;

    if (ro.json !== undefined) {
      // If caller uses json option, we override body to JSON
      body = JSON.stringify(ro.json);
      if (!headerHas(headersLower, 'content-type')) headersLower['content-type'] = 'application/json';
    }

    // If FormData is used, browser will set content-type with boundary; don't override.
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (isFormData && headerHas(headersLower, 'content-type')) {
      delete headersLower['content-type'];
    }

    // Auth resolution (merge defaults + per-request)
    const mergedAuth = {
      ...(defaultAuth || {}),
      ...(ro.auth || {}),
      type: ro.auth?.type ?? defaultAuth?.type ?? 'none',
    };

    const resolvedAuth = await resolveAuth(mergedAuth);

    // Apply auth
    if (resolvedAuth.type === 'bearer') {
      if (resolvedAuth.token) headersLower['authorization'] = `Bearer ${resolvedAuth.token}`;
    } else if (resolvedAuth.type === 'cookie') {
      // Browser: cookies are automatic (same-origin). Server: you must pass cookie header.
      if (resolvedAuth.cookie) headersLower['cookie'] = resolvedAuth.cookie;
    }

    // Authenticated requests shouldn't be cached by default (server fetch can cache).
    const isAuthed = resolvedAuth.type === 'bearer' || resolvedAuth.type === 'cookie';
    const cache = ro.cache ?? (isAuthed ? 'no-store' : undefined);

    const { signal, cleanup } = withTimeoutSignal(ro.timeoutMs ?? defaultTimeoutMs, ro.signal ?? null);

    const init = {
      method,
      headers: toHeaderRecord(headersLower),
      body,
      signal,
      cache,
      credentials: ro.credentials ?? defaultCredentials,
      redirect: ro.redirect,
      referrerPolicy: ro.referrerPolicy,
      integrity: ro.integrity,
      keepalive: ro.keepalive,
      mode: ro.mode,
      // Next.js passthrough (harmless in browser; ignored by fetch)
      next: ro.next,
    };

    const retry = ro.retry ?? defaultRetry;
    const retryDelayMs = ro.retryDelayMs ?? defaultRetryDelayMs;
    const retryOn = ro.retryOn ?? defaultRetryOn;

    try {
      if (onRequest) await onRequest({ url, init });

      let lastErr = null;

      for (let attempt = 0; attempt <= retry; attempt++) {
        try {
          const res = await fetchImpl(url, init);

          if (onResponse) await onResponse({ url, init, res });

          if (!res.ok && attempt < retry && shouldRetryStatus(res.status, retryOn)) {
            const delay = computeBackoff(attempt, retryDelayMs);

            // drain body so connection can be reused
            try {
              await res.arrayBuffer();
            } catch {}

            await sleep(delay);
            continue;
          }

          const parsed = await safeReadBody(res);

          if (!res.ok) {
            /** @type {ProblemDetails | null} */
            let problem = null;

            if (parsed.kind === 'json' && parsed.data && typeof parsed.data === 'object') {
              // your API returns { type,title,status,code,detail,errors,stack }
              problem = parsed.data;
            }

            const msg = problem?.detail || problem?.title || (parsed.kind === 'text' && parsed.data ? String(parsed.data) : '') || `HTTP ${res.status}`;

            throw new HttpError(msg, {
              status: res.status,
              url,
              method,
              problem,
              responseBody: parsed.data,
            });
          }

          return parsed.data;
        } catch (err) {
          lastErr = err;

          // Abort/timeout shouldn't retry
          const isAbort = err?.name === 'AbortError' || (typeof err?.message === 'string' && /timeout/i.test(err.message)) || signal?.aborted;

          if (isAbort) throw err;

          // If error is HttpError with retryable status, retry
          if (err instanceof HttpError && attempt < retry && shouldRetryStatus(err.status, retryOn)) {
            const delay = computeBackoff(attempt, retryDelayMs);
            await sleep(delay);
            continue;
          }

          // Network errors may retry
          if (!(err instanceof HttpError) && attempt < retry) {
            const delay = computeBackoff(attempt, retryDelayMs);
            await sleep(delay);
            continue;
          }

          throw err;
        }
      }

      throw lastErr ?? new Error('Request failed');
    } finally {
      cleanup();
    }
  }

  return {
    request,
    get: (path, ro) => request(path, { ...(ro || {}), method: 'GET' }),
    post: (path, ro) => request(path, { ...(ro || {}), method: 'POST' }),
    put: (path, ro) => request(path, { ...(ro || {}), method: 'PUT' }),
    patch: (path, ro) => request(path, { ...(ro || {}), method: 'PATCH' }),
    del: (path, ro) => request(path, { ...(ro || {}), method: 'DELETE' }),

    /**
     * Create a new client with merged defaults (immutable).
     * @param {HttpClientOptions} nextOpts
     */
    withDefaults(nextOpts = {}) {
      return createHttpClient({
        baseUrl: nextOpts.baseUrl ?? baseUrl ?? undefined,
        headers: { ...toHeaderRecord(defaultHeadersLower), ...(nextOpts.headers || {}) },
        auth: { ...(defaultAuth || {}), ...(nextOpts.auth || {}) },
        credentials: nextOpts.credentials ?? defaultCredentials,
        timeoutMs: nextOpts.timeoutMs ?? defaultTimeoutMs,
        retry: nextOpts.retry ?? defaultRetry,
        retryDelayMs: nextOpts.retryDelayMs ?? defaultRetryDelayMs,
        retryOn: nextOpts.retryOn ?? defaultRetryOn,
        onRequest: nextOpts.onRequest ?? onRequest,
        onResponse: nextOpts.onResponse ?? onResponse,
        fetchImpl: nextOpts.fetchImpl ?? fetchImpl,
      });
    },
  };
}

/**
 * Create a CRUD client for a resource.
 *
 * Example resource:
 * - "/api/users"
 * - "/api/lokasi"
 *
 * Methods:
 * - list   GET    /resource?...
 * - get    GET    /resource/:id
 * - create POST   /resource
 * - update PUT    /resource/:id
 * - patch  PATCH  /resource/:id
 * - remove DELETE /resource/:id
 *
 * @template TList
 * @template TItem
 * @template TCreate
 * @template TUpdate
 *
 * @param {string} resourceBase
 * @param {ReturnType<typeof createHttpClient>} client
 * @param {{
 *  idKey?: string, // when item has custom id field, used by updateByItem/removeByItem helpers
 *  buildPath?: ((id: string | number) => string),
 * }} [opts]
 */
export function createCrudClient(resourceBase, client, opts = {}) {
  const base = String(resourceBase || '')
    .trim()
    .replace(/\/+$/g, '');
  if (!base) throw new Error('createCrudClient: resourceBase wajib diisi');

  const buildPath = typeof opts.buildPath === 'function' ? opts.buildPath : (id) => `${base}/${encodeURIComponent(String(id))}`;

  const idKey = opts.idKey ?? 'id';

  return {
    /** @param {{ query?: any, options?: RequestOptions }} [params] */
    async list(params = {}) {
      const { query, options } = params || {};
      return await client.get(base, { ...(options || {}), query: query ?? options?.query });
    },

    /** @param {string|number} id @param {RequestOptions} [options] */
    async get(id, options) {
      return await client.get(buildPath(id), options);
    },

    /** @param {TCreate} data @param {RequestOptions} [options] */
    async create(data, options) {
      return await client.post(base, { ...(options || {}), json: data });
    },

    /** @param {string|number} id @param {TUpdate} data @param {RequestOptions} [options] */
    async update(id, data, options) {
      return await client.put(buildPath(id), { ...(options || {}), json: data });
    },

    /** @param {string|number} id @param {Partial<TUpdate>} data @param {RequestOptions} [options] */
    async patch(id, data, options) {
      return await client.patch(buildPath(id), { ...(options || {}), json: data });
    },

    /** @param {string|number} id @param {RequestOptions} [options] */
    async remove(id, options) {
      return await client.del(buildPath(id), options);
    },

    /**
     * Helper: update from item object (uses idKey).
     * @param {TItem & Record<string, any>} item
     * @param {TUpdate} data
     * @param {RequestOptions} [options]
     */
    async updateByItem(item, data, options) {
      const id = item?.[idKey];
      if (id === undefined || id === null) throw new Error(`updateByItem: item.${idKey} tidak ada`);
      return await client.put(buildPath(id), { ...(options || {}), json: data });
    },

    /**
     * Helper: remove from item object (uses idKey).
     * @param {TItem & Record<string, any>} item
     * @param {RequestOptions} [options]
     */
    async removeByItem(item, options) {
      const id = item?.[idKey];
      if (id === undefined || id === null) throw new Error(`removeByItem: item.${idKey} tidak ada`);
      return await client.del(buildPath(id), options);
    },

    /**
     * Escape hatch: call any sub-path under this resource.
     * @param {string} subPath e.g. "/export" or "export"
     * @param {RequestOptions} [options]
     */
    async raw(subPath, options) {
      const sp = String(subPath || '').trim();
      const full = sp ? `${base}/${stripLeadingSlash(sp)}` : base;
      return await client.request(full, options);
    },
  };
}
