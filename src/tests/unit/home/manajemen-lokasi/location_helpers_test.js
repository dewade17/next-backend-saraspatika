import { describe, expect, it } from 'vitest';
import { mapLocationFromApi, toNumber } from '@/app/(view)/home/manajemen-lokasi/_utils/locationHelpers';

describe('manajemen-lokasi/locationHelpers.toNumber', () => {
  it('returns null for nullish and empty string values', () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber('')).toBeNull();
    expect(toNumber('   ')).toBeNull();
  });

  it('parses valid numeric inputs including zero', () => {
    expect(toNumber(0)).toBe(0);
    expect(toNumber('0')).toBe(0);
    expect(toNumber('-8.409518')).toBe(-8.409518);
  });
});

describe('manajemen-lokasi/locationHelpers.mapLocationFromApi', () => {
  it('keeps null coordinates as null instead of converting to zero', () => {
    expect(
      mapLocationFromApi({
        id_lokasi: 10,
        nama_lokasi: 'Lokasi Uji',
        latitude: null,
        longitude: null,
        radius: null,
      }),
    ).toEqual({
      id: 10,
      name: 'Lokasi Uji',
      latitude: null,
      longitude: null,
      radius: null,
    });
  });
});
