import { z } from 'zod';

function optTrim(max = 255) {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().max(max).optional());
}

const npsnRequired = z
  .string()
  .trim()
  .regex(/^\d{8}$/, 'NPSN harus terdiri dari 8 digit');

const npsnOptional = z.preprocess((v) => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}, npsnRequired.optional());

export const profileSekolahCreateValidation = z.object({
  nama_sekolah: z.string().trim().min(1, 'Nama sekolah wajib diisi').max(160),
  alamat_sekolah: z.string().trim().min(1, 'Alamat sekolah wajib diisi').max(2000),
  npsn: npsnRequired,
  no_telepon: optTrim(40),
});

export const profileSekolahUpdateValidation = z
  .object({
    nama_sekolah: z.string().trim().min(1).max(160).optional(),
    alamat_sekolah: z.string().trim().min(1).max(2000).optional(),
    npsn: npsnOptional,
    no_telepon: optTrim(40),
  })
  .strict();
