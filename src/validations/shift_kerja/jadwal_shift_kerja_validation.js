import { z } from 'zod';

function reqTrim() {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().min(1));
}

function optTrimNullable() {
  return z.preprocess((v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s ? s : null;
  }, z.string().min(1).nullable());
}

export const shiftAssignmentUpsertValidation = z
  .object({
    id_user: reqTrim(),
    tanggal: reqTrim(),
    id_pola_kerja: optTrimNullable().optional(),
  })
  .strict();

export const shiftAssignmentBulkValidation = z
  .object({
    assignments: z.array(shiftAssignmentUpsertValidation).min(1),
  })
  .strict();
