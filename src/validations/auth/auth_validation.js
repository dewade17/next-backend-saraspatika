import { z } from 'zod';

export const registerValidation = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
  role_name: z.string().trim().toUpperCase().optional(),
  autoLogin: z.boolean().optional().default(true),
});

export const loginValidation = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

export const requestTokenValidation = z.object({
  email: z.string().trim().email().max(254),
});

export const resetPasswordValidation = z.object({
  email: z.string().trim().email().max(254),
  code: z.preprocess((v) => String(v ?? '').trim(), z.string().regex(/^\d{6}$/, 'Kode harus 6 digit')),
  newPassword: z.string().min(8).max(72),
});
