import { z } from 'zod';

const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;

function optTrim(max = 120) {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().max(max).optional());
}

function optTime() {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().regex(timePattern, 'Format jam tidak valid').optional());
}

export const polaKerjaCreateValidation = z.object({
  nama_pola_kerja: z.string().trim().min(1).max(120),
  jam_mulai_kerja: z.string().trim().regex(timePattern, 'Format jam tidak valid'),
  jam_selesai_kerja: z.string().trim().regex(timePattern, 'Format jam tidak valid'),
});

export const polaKerjaUpdateValidation = z
  .object({
    nama_pola_kerja: optTrim(120),
    jam_mulai_kerja: optTime(),
    jam_selesai_kerja: optTime(),
  })
  .strict();
