function pad2(value) {
  return String(value).padStart(2, '0');
}

function toUtcDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function formatUtcTimeDot(value) {
  if (!value) return '-';
  const d = toUtcDate(value);
  if (!Number.isFinite(d.getTime())) return '-';

  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}.${mm}`;
}

export function formatUtcDateIdLong(value) {
  if (!value) return '-';
  const d = toUtcDate(value);
  if (!Number.isFinite(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatUtcDateIdLongWithWeekday(value) {
  if (!value) return '-';
  const d = toUtcDate(value);
  if (!Number.isFinite(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function toAgendaDateKey(value) {
  const d = toUtcDate(value);
  if (!d) return null;

  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function pickAgendaDisplayName(row, fallbackName) {
  return row?.user?.nama_pengguna || row?.user?.name || row?.nama_pengguna || row?.name || fallbackName || '-';
}

export function pickAgendaAvatarUrl(row) {
  return row?.user?.foto_profil_url || row?.foto_profil_url || null;
}
