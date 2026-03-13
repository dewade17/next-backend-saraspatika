import { describe, expect, it } from 'vitest';
import {
  aggregateAbsensiHarian,
  countTotalKehadiran,
  summarizeAbsensi,
} from '@/app/(view)/home/(absensi)/_utils/absensiHelpers';

describe('absensiHelpers.countTotalKehadiran - hitung total kehadiran', () => {
  it('menghitung id_user unik dan mengabaikan nilai nullish atau kosong', () => {
    const rows = [{ id_user: 1 }, { id_user: '1' }, { id_user: 2 }, { id_user: null }, { id_user: undefined }, { id_user: '' }];
    expect(countTotalKehadiran(rows)).toBe(2);
  });
});

describe('absensiHelpers.aggregateAbsensiHarian - agregasi absensi harian', () => {
  it('membangun agregasi harian dengan total per tanggal', () => {
    const rows = [
      { id_user: 'u1', tanggal: '2026-02-01', status_masuk: 'TEPAT' },
      { id_user: 'u2', waktu_masuk: '2026-02-01T08:03:00Z', status_masuk: 'TERLAMBAT' },
      { id_user: 'u2', tanggal: '2026-02-02', status_masuk: 'TEPAT' },
      { id_user: 'u3', waktu_masuk: 'invalid-date', status_masuk: 'TEPAT' },
    ];

    expect(aggregateAbsensiHarian(rows)).toEqual([
      {
        tanggal: '2026-02-01',
        totalAbsensi: 2,
        totalKehadiran: 2,
        tepatWaktu: 1,
        terlambat: 1,
      },
      {
        tanggal: '2026-02-02',
        totalAbsensi: 1,
        totalKehadiran: 1,
        tepatWaktu: 1,
        terlambat: 0,
      },
      {
        tanggal: 'unknown',
        totalAbsensi: 1,
        totalKehadiran: 1,
        tepatWaktu: 1,
        terlambat: 0,
      },
    ]);
  });
});

describe('absensiHelpers.summarizeAbsensi - ringkasan absensi', () => {
  it('mengembalikan ringkasan untuk total kehadiran dan distribusi status', () => {
    const rows = [
      { id_user: 101, status_masuk: 'TEPAT' },
      { id_user: 102, status_masuk: 'TERLAMBAT' },
      { id_user: 101, status_masuk: 'TEPAT' },
      { id_user: null, status_masuk: 'TEPAT' },
    ];

    expect(summarizeAbsensi(rows)).toEqual({
      totalPresensi: 2,
      tepatWaktu: 3,
      terlambat: 1,
    });
  });
});
