import { getCorsHeaders } from '@/lib/cors.js';

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request) {
  return Response.json({ message: 'OK' }, { headers: getCorsHeaders(request) });
}
