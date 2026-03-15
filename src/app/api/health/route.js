const allowedOrigins = ['https://saraspatika-web.com', 'http://localhost:64704', 'http://localhost:9000', 'http://localhost:52207'];

function getCorsHeaders(request) {
  const origin = request.headers.get('origin');
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request) {
  return Response.json({ message: 'OK' }, { headers: getCorsHeaders(request) });
}
