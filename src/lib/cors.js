const exactAllowedOrigins = new Set([
  'https://www.saraspatika.com',
  'https://saraspatika-web.com',
]);

const defaultAllowedHeaders = 'Content-Type, Authorization';
const allowedMethods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

export function isAllowedOrigin(origin) {
  if (!origin) {
    return false;
  }

  if (exactAllowedOrigins.has(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);

    // Allow local frontend dev servers to use arbitrary ports.
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export function getCorsHeaders(request) {
  const origin = request.headers.get('origin') ?? '';
  const requestHeaders =
    request.headers.get('access-control-request-headers') ??
    defaultAllowedHeaders;

  return {
    ...(isAllowedOrigin(origin)
      ? { 'Access-Control-Allow-Origin': origin }
      : {}),
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': requestHeaders,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin, Access-Control-Request-Headers',
  };
}
