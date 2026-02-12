import { z } from 'zod';

const normalizeText = z.preprocess(
  (value) => {
    if (value == null) return value;
    const str = String(value).trim();
    return str || undefined;
  },
  z.string().min(1, 'Deskripsi wajib diisi').max(2000, 'Deskripsi maksimal 2000 karakter'),
);

const tanggalSchema = z.preprocess(
  (value) => {
    if (value == null) return value;
    const str = String(value).trim();
    return str || undefined;
  },
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
);

const jamSchema = z.preprocess(
  (value) => {
    if (value == null) return value;
    const str = String(value).trim();
    return str || undefined;
  },
  z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Format jam harus HH:mm atau HH:mm:ss'),
);

export const agendaSchema = z
  .object({
    deskripsi: normalizeText,
    tanggal: tanggalSchema,
    jam_mulai: jamSchema,
    jam_selesai: jamSchema,
  })
  .strict();
