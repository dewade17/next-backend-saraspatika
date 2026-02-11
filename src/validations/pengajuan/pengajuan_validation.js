import { z } from 'zod';

const jenisPengajuanEnum = z.preprocess((v) => (typeof v === 'string' ? v.trim().toUpperCase() : v), z.enum(['IZIN', 'SAKIT', 'CUTI']));

const requestStatusEnum = z.preprocess((v) => (typeof v === 'string' ? v.trim().toUpperCase() : v), z.enum(['MENUNGGU', 'SETUJU', 'DITOLAK']));

const normalizedDate = z.preprocess(
  (v) => {
    if (v == null) return v;
    const s = String(v).trim();
    return s || undefined;
  },
  z.string().min(1, 'Tanggal wajib diisi'),
);

const normalizedText = (max = 2000) =>
  z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s || undefined;
  }, z.string().min(1).max(max));

export const pengajuanCreateValidation = z.object({
  jenis_pengajuan: jenisPengajuanEnum,
  tanggal_mulai: normalizedDate,
  tanggal_selesai: normalizedDate,
  alasan: z.string().trim().min(1).max(2000),
  foto_bukti_url: normalizedText(2048).optional(),
});

export const pengajuanUpdateStatusValidation = z
  .object({
    status: requestStatusEnum,
    admin_note: normalizedText(2000).optional(),
  })
  .strict();
