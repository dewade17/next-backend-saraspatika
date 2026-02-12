/**
 * time_helper.js (ESM)
 * Modul utilitas manipulasi waktu (jam saja) untuk sistem HR/Absensi.
 *
 * Representasi waktu:
 * - Selalu dinormalisasi ke objek Date berbasis UTC pada tanggal 1970-01-01 (Epoch),
 *   sehingga hanya komponen jam/menit/detik yang bermakna.
 *
 * Catatan:
 * - Semua fungsi dibuat aman dari error: input tidak valid akan menghasilkan null/false
 *   (tidak melempar error) agar aplikasi tidak crash.
 */

import { formatToDbDate } from '@/lib/date_helper.js';

const EPOCH_YEAR = 1970;
const EPOCH_MONTH = 0; // Januari (0-based)
const EPOCH_DAY = 1;

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/**
 * Regex ketat format waktu:
 * - "HH:mm" atau "HH:mm:ss"
 * - HH: 00-23
 * - mm/ss: 00-59
 */
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

/**
 * Mengecek apakah value adalah Date yang valid.
 * @param {unknown} value
 * @returns {value is Date}
 */
function isValidDateObject(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

/**
 * Membuat Date UTC 1970-01-01 dari jam/menit/detik/milis.
 * @param {number} hours
 * @param {number} minutes
 * @param {number} seconds
 * @param {number} ms
 * @returns {Date}
 */
function makeUtcTimeDate(hours, minutes, seconds, ms) {
  return new Date(Date.UTC(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY, hours, minutes, seconds, ms));
}

/**
 * Menormalisasi Date apapun menjadi Date UTC 1970-01-01 dengan mengambil komponen waktu UTC.
 * @param {Date} date
 * @returns {Date}
 */
function normalizeToEpochUtc(date) {
  return makeUtcTimeDate(date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
}

/**
 * Mem-parsing string waktu "HH:mm" atau "HH:mm:ss" menjadi Date UTC epoch (1970-01-01).
 * @param {string} timeString
 * @returns {Date|null}
 */
function parseTimeStringToDate(timeString) {
  if (typeof timeString !== 'string') return null;
  if (!TIME_REGEX.test(timeString)) return null;

  const parts = timeString.split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = parts.length === 3 ? Number(parts[2]) : 0;

  // Double-check numerik (defensive) walau regex sudah ketat.
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || !Number.isInteger(seconds) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null;
  }

  return makeUtcTimeDate(hours, minutes, seconds, 0);
}

/**
 * parseToDate(value)
 * Menerima input berupa:
 * - String: "HH:mm" atau "HH:mm:ss" (ketat), dikonversi ke Date UTC 1970-01-01
 * - Number: timestamp (ms) -> diubah menjadi Date lalu dinormalisasi ke epoch UTC
 * - Date: dinormalisasi ke epoch UTC
 *
 * Jika input tidak valid, mengembalikan null.
 *
 * @param {string|number|Date} value
 * @returns {Date|null} Date UTC pada 1970-01-01, atau null jika input tidak valid.
 */
export function parseToDate(value) {
  try {
    if (typeof value === 'string') {
      return parseTimeStringToDate(value);
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      const d = new Date(value);
      if (!isValidDateObject(d)) return null;
      return normalizeToEpochUtc(d);
    }

    if (value instanceof Date) {
      if (!isValidDateObject(value)) return null;
      return normalizeToEpochUtc(value);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * formatToTime(date)
 * Mengonversi objek Date menjadi string "HH:mm" menggunakan toISOString() (UTC-safe).
 * Jika input tidak valid, mengembalikan null.
 *
 * @param {Date} date
 * @returns {string|null} Waktu format "HH:mm" atau null jika input tidak valid.
 */
export function formatToTime(date) {
  try {
    if (!isValidDateObject(date)) return null;
    // toISOString() => "1970-01-01THH:mm:ss.sssZ" (UTC)
    return date.toISOString().slice(11, 16);
  } catch {
    return null;
  }
}

/**
 * isValidTime(value)
 * Mengecek apakah string yang dimasukkan memiliki format waktu yang benar:
 * - "HH:mm" atau "HH:mm:ss" (ketat).
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidTime(value) {
  if (typeof value !== 'string') return false;
  return TIME_REGEX.test(value);
}

/**
 * compareTime(timeA, timeB)
 * Membandingkan dua waktu dan mengembalikan:
 * -1 jika timeA < timeB
 *  0 jika sama
 *  1 jika timeA > timeB
 *
 * Input dapat berupa string ("HH:mm"/"HH:mm:ss"), number (timestamp ms), atau Date.
 * Jika salah satu input invalid, mengembalikan null.
 *
 * @param {string|number|Date} timeA
 * @param {string|number|Date} timeB
 * @returns {-1|0|1|null}
 */
export function compareTime(timeA, timeB) {
  const a = parseToDate(timeA);
  const b = parseToDate(timeB);
  if (!a || !b) return null;

  const diff = a.getTime() - b.getTime();
  if (diff === 0) return 0;
  return diff < 0 ? -1 : 1;
}

/**
 * calculateDuration(start, end)
 * Menghitung durasi antara start dan end berdasarkan waktu (jam saja).
 *
 * Perilaku overnight:
 * - Jika end lebih kecil dari start, diasumsikan melewati tengah malam (overnight),
 *   maka durasi = (end + 24 jam) - start.
 *
 * Jika input tidak valid, mengembalikan null.
 *
 * @param {string|number|Date} start
 * @param {string|number|Date} end
 * @returns {{ minutes: number, hours: number }|null}
 *  - minutes: durasi dalam menit (bilangan desimal bisa muncul jika input punya milidetik)
 *  - hours: durasi dalam jam (minutes / 60)
 */
export function calculateDuration(start, end) {
  const s = parseToDate(start);
  const e = parseToDate(end);
  if (!s || !e) return null;

  let diffMs = e.getTime() - s.getTime();
  if (diffMs < 0) diffMs += MS_PER_DAY;

  const minutes = diffMs / MS_PER_MINUTE;
  const hours = diffMs / MS_PER_HOUR;

  return { minutes, hours };
}

/**
 * Menggabungkan tanggal (YYYY-MM-DD/Date) dan jam (HH:mm/HH:mm:ss) menjadi objek Date UTC.
 * @param {string|Date} dateValue
 * @param {string|Date|number} timeValue
 * @returns {Date|null}
 */
export function combineDateAndTime(dateValue, timeValue) {
  const dbDate = formatToDbDate(dateValue);
  if (!dbDate) return null;

  const time = parseToDate(timeValue);
  if (!time) return null;

  const hours = String(time.getUTCHours()).padStart(2, '0');
  const minutes = String(time.getUTCMinutes()).padStart(2, '0');
  const seconds = String(time.getUTCSeconds()).padStart(2, '0');

  return new Date(`${dbDate}T${hours}:${minutes}:${seconds}.000Z`);
}
