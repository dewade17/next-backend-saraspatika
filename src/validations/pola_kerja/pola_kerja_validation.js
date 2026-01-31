import { z } from 'zod';

function optTrim(max = 120) {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().max(max).optional());
}

export const polaKerjaCreateValidation = z.object({
  nama_pola_kerja: z.string().trim().min(1).max(120),
  jam_mulai_kerja: z.string().trim().min(1).max(20),
  jam_selesai_kerja: z.string().trim().min(1).max(20),
});

export const polaKerjaUpdateValidation = z
  .object({
    nama_pola_kerja: optTrim(120),
    jam_mulai_kerja: optTrim(20),
    jam_selesai_kerja: optTrim(20),
  })
  .strict();
