import { z } from 'zod';

function optTrim(max = 255) {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().max(max).optional());
}

function optEmail() {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().email().max(254).optional());
}

function optPassword() {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s ? s : undefined;
  }, z.string().min(8).max(72).optional());
}

function optRole() {
  return z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim().toUpperCase();
    return s ? s : undefined;
  }, z.string().max(40).optional());
}

export const userCreateValidation = z.object({
  email: z.string().trim().email().max(254),
  name: optTrim(120),
  password: z.string().min(8).max(72),
  status: optTrim(80),
  nomor_handphone: optTrim(40),
  nip: optTrim(40),
  foto_profil_url: optTrim(2000),
  role: optRole().default('GURU'),
});

export const userUpdateValidation = z
  .object({
    email: optEmail(),
    name: optTrim(120),
    password: optPassword(),
    status: optTrim(80),
    nomor_handphone: optTrim(40),
    nip: optTrim(40),
    foto_profil_url: optTrim(2000),
    role: optRole(),
  })
  .strict();
