import dayjs from 'dayjs';

export function startOfWeekMonday(d) {
  const x = dayjs(d).startOf('day');
  const dow = x.day(); // 0..6 (Sun..Sat)
  const offset = (dow + 6) % 7; // Mon=0
  return x.subtract(offset, 'day');
}

export function buildWeekDates(weekStart) {
  const s = dayjs(weekStart).startOf('day');
  return Array.from({ length: 7 }).map((_, i) => s.add(i, 'day'));
}

export function toDateKey(d) {
  return dayjs(d).format('YYYY-MM-DD');
}

export function formatHeaderID(d) {
  const x = dayjs(d);
  const DAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${DAY[x.day()]}, ${x.date()} ${MON[x.month()]} ${x.year()}`;
}

export function formatMonthID(d) {
  const x = dayjs(d);
  const MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${MON[x.month()]} ${x.year()}`;
}
