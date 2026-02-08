import { z } from 'zod';

const statusEnum = z.enum(['MENUNGGU', 'SETUJU', 'DITOLAK']);

function optTrim(max = 2000) {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().max(max).optional());
}

export const faceResetRequestCreateValidation = z.object({
  alasan: z.string().trim().min(1).max(2000),
});

export const faceResetRequestUpdateValidation = z
  .object({
    status: statusEnum.optional(),
    admin_note: optTrim(2000),
  })
  .strict();
