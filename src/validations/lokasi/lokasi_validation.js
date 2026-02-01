import { z } from 'zod';

const latitude = z.coerce.number().finite().min(-90).max(90);
const longitude = z.coerce.number().finite().min(-180).max(180);
const radius = z.coerce.number().int().min(0);

export const lokasiCreateValidation = z.object({
  nama_lokasi: z.string().trim().min(1).max(150),
  latitude,
  longitude,
  radius,
});

export const lokasiUpdateValidation = z
  .object({
    nama_lokasi: z.string().trim().min(1).max(150).optional(),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
    radius: radius.optional(),
  })
  .strict();
