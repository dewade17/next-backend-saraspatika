import dayjs from 'dayjs';

export function toIdDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function toLower(v) {
  return String(v ?? '').toLowerCase();
}

export function matchQuery(row, q) {
  const query = toLower(q).trim();
  if (!query) return true;

  const fields = [row?.user?.name, row?.user?.nip, row?.jenis_pengajuan, row?.alasan, row?.status, row?.admin_note];

  return fields.some((s) => toLower(s).includes(query));
}

export function matchMonth(row, monthValue) {
  if (!monthValue) return true;
  const raw = row?.tanggal_mulai || row?.tanggal_selesai;
  if (!raw) return true;

  const d = dayjs(raw);
  return d.isValid() && d.year() === monthValue.year() && d.month() === monthValue.month();
}
