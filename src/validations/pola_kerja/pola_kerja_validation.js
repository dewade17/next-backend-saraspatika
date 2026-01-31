import { z } from 'zod';

export const polaKerjaCreateValidation = z.object({
  nama_pola_kerja: z.string().trim().min(1).max(120),
  jam_mulai_kerja: z.string().trim().min(1).max(20),
  jam_selesai_kerja: z.string().trim().min(1).max(20),
});
