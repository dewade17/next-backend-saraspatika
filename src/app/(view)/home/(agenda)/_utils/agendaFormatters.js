export function formatUtcTimeDot(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '-';

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}.${mm}`;
}

export function formatUtcDateIdLong(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function pickAgendaDisplayName(row, fallbackName) {
  return row?.user?.nama_pengguna || row?.user?.name || row?.nama_pengguna || row?.name || fallbackName || '-';
}

export function pickAgendaAvatarUrl(row) {
  return row?.user?.foto_profil_url || row?.foto_profil_url || null;
}
