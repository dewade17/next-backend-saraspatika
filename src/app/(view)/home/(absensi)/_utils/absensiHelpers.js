import dayjs from 'dayjs';

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
