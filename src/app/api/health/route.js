const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://saraspatika-web.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  return Response.json({ message: 'OK' }, { headers: corsHeaders });
}
