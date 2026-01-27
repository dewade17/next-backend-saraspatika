import { errorResponse } from '@/lib/error.js';

/**
 * Wrap route handlers to return standardized error responses.
 * @param {(req: Request, ctx?: any) => Promise<Response>} handler
 */
export function apiRoute(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      console.error('API Error Detail:', err); // Tambahkan baris ini untuk melihat error di terminal
      return errorResponse(err);
    }
  };
}

/**
 * Parse JSON body and validate with Zod schema.
 * @template T
 * @param {Request} req
 * @param {{ parseAsync: (v:any)=>Promise<T> }} schema
 * @returns {Promise<T>}
 */
export async function parseBody(req, schema) {
  const json = await req.json();
  return await schema.parseAsync(json);
}
