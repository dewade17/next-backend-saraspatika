import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  /**
   * @param {string} message
   * @param {{
   *  status?: number,
   *  code?: string,
   *  type?: string,
   *  title?: string,
   *  detail?: string,
   *  errors?: any,
   *  expose?: boolean,
   *  cause?: any
   * }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = 'AppError';

    this.status = opts.status ?? 500;
    this.code = opts.code ?? 'internal_error';
    this.type = opts.type ?? 'about:blank';
    this.title = opts.title ?? (this.status >= 500 ? 'Internal Server Error' : 'Error');
    this.detail = opts.detail ?? message;

    this.errors = opts.errors;
    this.expose = opts.expose ?? this.status < 500;

    if (opts.cause) this.cause = opts.cause;
  }
}

const make = (status, title, detail, opts = {}) => new AppError(detail, { status, title, detail, expose: status < 500, ...opts });

export const badRequest = (detail = 'Bad Request', opts = {}) => make(400, 'Bad Request', detail, { code: 'bad_request', ...opts });
export const unauthorized = (detail = 'Unauthorized', opts = {}) => make(401, 'Unauthorized', detail, { code: 'unauthorized', ...opts });
export const forbidden = (detail = 'Forbidden', opts = {}) => make(403, 'Forbidden', detail, { code: 'forbidden', ...opts });
export const notFound = (detail = 'Not Found', opts = {}) => make(404, 'Not Found', detail, { code: 'not_found', ...opts });
export const conflict = (detail = 'Conflict', opts = {}) => make(409, 'Conflict', detail, { code: 'conflict', ...opts });
export const tooManyRequests = (detail = 'Too Many Requests', opts = {}) => make(429, 'Too Many Requests', detail, { code: 'too_many_requests', ...opts });
export const internal = (detail = 'Internal Server Error', opts = {}) => new AppError(detail, { status: 500, title: 'Internal Server Error', detail, code: 'internal_error', expose: false, ...opts });

function prismaToAppError(err) {
  const name = String(err?.name || '');
  const code = String(err?.code || '');

  if (name === 'PrismaClientKnownRequestError') {
    if (code === 'P2002') {
      return conflict('Data sudah ada', {
        code: 'unique_violation',
        errors: { target: err?.meta?.target },
        cause: err,
      });
    }
    if (code === 'P2025') {
      return notFound('Data tidak ditemukan', { code: 'record_not_found', cause: err });
    }
  }
  return null;
}

export function normalizeToAppError(err) {
  if (err instanceof AppError) return err;

  // Zod
  if (err instanceof ZodError) {
    return badRequest('Validasi gagal', { code: 'validation_error', errors: err.issues, cause: err });
  }

  // Prisma
  const p = prismaToAppError(err);
  if (p) return p;

  // Invalid JSON (req.json() often throws SyntaxError)
  if (err instanceof SyntaxError && /JSON/i.test(String(err.message))) {
    return badRequest('Body JSON tidak valid', { code: 'invalid_json', cause: err });
  }

  // JWT/Jose errors (based on name)
  const n = String(err?.name || '');
  if (n === 'JWTExpired' || n === 'JWTExpiredError') {
    return unauthorized('Token sudah kedaluwarsa', { code: 'token_expired', cause: err });
  }
  if (n === 'JWTInvalid' || n === 'JWTInvalidError' || n === 'JWSSignatureVerificationFailed') {
    return unauthorized('Token tidak valid', { code: 'token_invalid', cause: err });
  }

  return internal('Internal Server Error', { cause: err });
}

export function toProblem(err) {
  const ae = normalizeToAppError(err);
  const isProd = process.env.NODE_ENV === 'production';

  return {
    type: ae.type || 'about:blank',
    title: ae.title || (ae.status >= 500 ? 'Internal Server Error' : 'Error'),
    status: ae.status || 500,
    code: ae.code,
    detail: ae.expose ? ae.detail : 'Internal Server Error',
    errors: ae.expose ? ae.errors : undefined,
    ...(isProd ? {} : { stack: ae.cause?.stack || ae.stack }),
  };
}

export function errorResponse(err, init) {
  const ae = normalizeToAppError(err);
  const body = toProblem(ae);
  return NextResponse.json(body, { status: ae.status ?? 500, ...init });
}
