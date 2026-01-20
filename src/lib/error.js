// src/lib/errors.js
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
    this.name = this.constructor.name;

    this.status = Number.isInteger(opts.status) ? opts.status : 500;
    this.code = opts.code || 'internal_error';
    this.type = opts.type || 'about:blank';
    this.title = opts.title || defaultTitle(this.status);
    this.detail = opts.detail || message;
    this.errors = opts.errors;
    this.expose = typeof opts.expose === 'boolean' ? opts.expose : this.status < 500;

    if (opts.cause) this.cause = opts.cause;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validasi gagal', errors) {
    super(message, {
      status: 422,
      code: 'validation_error',
      title: 'Unprocessable Entity',
      errors,
      expose: true,
    });
  }
}

export const badRequest = (detail = 'Bad Request', opts = {}) => new AppError(detail, { status: 400, code: 'bad_request', title: 'Bad Request', expose: true, ...opts });

export const unauthorized = (detail = 'Unauthorized', opts = {}) => new AppError(detail, { status: 401, code: 'unauthorized', title: 'Unauthorized', expose: true, ...opts });

export const forbidden = (detail = 'Forbidden', opts = {}) => new AppError(detail, { status: 403, code: 'forbidden', title: 'Forbidden', expose: true, ...opts });

export const notFound = (detail = 'Not Found', opts = {}) => new AppError(detail, { status: 404, code: 'not_found', title: 'Not Found', expose: true, ...opts });

export const conflict = (detail = 'Conflict', opts = {}) => new AppError(detail, { status: 409, code: 'conflict', title: 'Conflict', expose: true, ...opts });

export const tooManyRequests = (detail = 'Too Many Requests', opts = {}) => new AppError(detail, { status: 429, code: 'too_many_requests', title: 'Too Many Requests', expose: true, ...opts });

export const internal = (detail = 'Internal Server Error', opts = {}) => new AppError(detail, { status: 500, code: 'internal_error', title: 'Internal Server Error', expose: false, ...opts });

export function isAppError(err) {
  return err instanceof AppError;
}

export function defaultTitle(status) {
  if (status === 400) return 'Bad Request';
  if (status === 401) return 'Unauthorized';
  if (status === 403) return 'Forbidden';
  if (status === 404) return 'Not Found';
  if (status === 409) return 'Conflict';
  if (status === 422) return 'Unprocessable Entity';
  if (status === 429) return 'Too Many Requests';
  if (status >= 500) return 'Internal Server Error';
  return 'Error';
}

/**
 * Konversi error jadi Problem JSON yang konsisten.
 * @param {any} err
 * @param {{ requestId: string, path?: string, includeStack?: boolean }} meta
 */
export function toProblem(err, meta) {
  const includeStack = Boolean(meta.includeStack);
  const path = meta.path || '';
  const requestId = meta.requestId;

  const appErr = normalizeToAppError(err);

  const safeDetail = appErr.expose ? appErr.detail : 'Terjadi kesalahan pada server. Silakan coba lagi.';

  const problem = {
    type: appErr.type || 'about:blank',
    title: appErr.title || defaultTitle(appErr.status),
    status: appErr.status,
    code: appErr.code || 'internal_error',
    detail: safeDetail,
    instance: path,
    requestId,
  };

  if (appErr.expose && appErr.errors !== undefined) {
    problem.errors = appErr.errors;
  }

  if (includeStack) {
    problem.debug = {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    };
  }

  return problem;
}

function normalizeToAppError(err) {
  if (err instanceof AppError) return err;

  // Invalid JSON (req.json() sering melempar SyntaxError)
  if (err instanceof SyntaxError && /JSON/i.test(String(err.message))) {
    return badRequest('Body JSON tidak valid', { code: 'invalid_json' });
  }

  // JWT/Jose errors (berdasarkan name)
  const n = String(err?.name || '');
  if (n === 'JWTExpired' || n === 'JWTExpiredError') {
    return unauthorized('Token sudah kedaluwarsa', { code: 'token_expired' });
  }
  if (n === 'JWTInvalid' || n === 'JWTInvalidError' || n === 'JWSSignatureVerificationFailed') {
    return unauthorized('Token tidak valid', { code: 'token_invalid' });
  }

  // Fallback
  return internal('Internal Server Error', { cause: err });
}
