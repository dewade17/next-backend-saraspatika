import dayjs from 'dayjs';

export const ABSENSI_MODEL = {
  SEKOLAH: 'SEKOLAH',
  WFH: 'WFH',
};

export function getAbsensiModelLabel(model) {
  const m = String(model ?? '')
    .trim()
    .toUpperCase();
  return m === ABSENSI_MODEL.WFH ? 'WFH' : 'Sekolah';
}

function normalizeAbsensiModel(model) {
  const m = String(model ?? '')
    .trim()
    .toUpperCase();
  return m === ABSENSI_MODEL.WFH ? ABSENSI_MODEL.WFH : ABSENSI_MODEL.SEKOLAH;
}

function normalizeModelSlot(slot, sourceModel) {
  if (sourceModel !== ABSENSI_MODEL.WFH) return slot ?? null;
  if (!slot || typeof slot !== 'object') return slot ?? null;
  if (slot.lokasi) return slot;
  return {
    ...slot,
    lokasi: {
      nama_lokasi: 'WFH',
    },
  };
}

export function normalizeAbsensiRow(row, { model = ABSENSI_MODEL.SEKOLAH, index = 0 } = {}) {
  if (!row || typeof row !== 'object') return row;

  const sourceModel = normalizeAbsensiModel(model);
  const primaryId = sourceModel === ABSENSI_MODEL.WFH ? (row.id_absensi_wfh ?? row.id_absensi) : (row.id_absensi ?? row.id_absensi_wfh);
  const fallbackId = row.correlation_id ?? index;

  return {
    ...row,
    row_key: row.row_key ?? `${sourceModel.toLowerCase()}:${String(primaryId ?? fallbackId)}`,
    source_absensi: row.source_absensi ?? sourceModel,
    model_absensi: row.model_absensi ?? getAbsensiModelLabel(sourceModel),
    in: normalizeModelSlot(row.in, sourceModel),
    out: normalizeModelSlot(row.out, sourceModel),
  };
}

function toTimeMs(value) {
  if (!value) return 0;
  const n = Date.parse(value);
  return Number.isFinite(n) ? n : 0;
}

export function sortAbsensiRows(rows) {
  return [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
    const timeDiff = toTimeMs(b?.waktu_masuk) - toTimeMs(a?.waktu_masuk);
    if (timeDiff !== 0) return timeDiff;
    return String(a?.row_key ?? '').localeCompare(String(b?.row_key ?? ''));
  });
}

export function toDateKey(value) {
  if (!value) return null;
  const d = dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD') : null;
}

export function formatHeaderID(dateKey) {
  const x = dayjs(dateKey);
  if (!x.isValid()) return String(dateKey || '');
  const DAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
  const MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dd = String(x.date()).padStart(2, '0');
  return `${DAY[x.day()]}, ${dd} ${MON[x.month()]} ${x.year()}`;
}

export function formatTimeDot(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '-';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}.${mm}`;
}

export function groupByTanggal(rows) {
  const map = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const k = r?.tanggal || toDateKey(r?.waktu_masuk);
    const key = k || 'unknown';
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  }
  return map;
}

export function countTotalKehadiran(rows) {
  const users = new Set();
  for (const r of Array.isArray(rows) ? rows : []) {
    const idUser = r?.id_user;
    if (idUser == null || idUser === '') continue;
    users.add(String(idUser));
  }
  return users.size;
}

export function countStatusMasuk(rows) {
  let tepatWaktu = 0;
  let terlambat = 0;

  for (const r of Array.isArray(rows) ? rows : []) {
    if (r?.status_masuk === 'TEPAT') tepatWaktu += 1;
    if (r?.status_masuk === 'TERLAMBAT') terlambat += 1;
  }

  return { tepatWaktu, terlambat };
}

export function aggregateAbsensiHarian(rows) {
  const grouped = groupByTanggal(rows);
  const result = [];

  for (const [tanggal, items] of grouped.entries()) {
    const { tepatWaktu, terlambat } = countStatusMasuk(items);
    result.push({
      tanggal,
      totalAbsensi: items.length,
      totalKehadiran: countTotalKehadiran(items),
      tepatWaktu,
      terlambat,
    });
  }

  return result;
}

export function summarizeAbsensi(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const { tepatWaktu, terlambat } = countStatusMasuk(safeRows);

  return {
    totalPresensi: countTotalKehadiran(safeRows),
    tepatWaktu,
    terlambat,
  };
}

export function buildOsmEmbedUrl(lat, lon, zoom = 17) {
  const lt = Number(lat);
  const ln = Number(lon);
  if (!Number.isFinite(lt) || !Number.isFinite(ln)) return null;

  const d = 0.005;
  const left = ln - d;
  const right = ln + d;
  const bottom = lt - d;
  const top = lt + d;

  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lt}%2C${ln}`;
}

export function buildOsmLink(lat, lon, zoom = 18) {
  const lt = Number(lat);
  const ln = Number(lon);
  if (!Number.isFinite(lt) || !Number.isFinite(ln)) return null;
  return `https://www.openstreetmap.org/?mlat=${lt}&mlon=${ln}#map=${zoom}/${lt}/${ln}`;
}

export function pickCoords(slot) {
  const lat = slot?.latitude ?? slot?.lokasi?.latitude ?? null;
  const lon = slot?.longitude ?? slot?.lokasi?.longitude ?? null;
  const name = slot?.lokasi?.nama_lokasi ?? null;

  const lt = lat != null ? Number(lat) : null;
  const ln = lon != null ? Number(lon) : null;

  return {
    latitude: Number.isFinite(lt) ? lt : null,
    longitude: Number.isFinite(ln) ? ln : null,
    name,
  };
}
