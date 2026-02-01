export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function toNumber(val) {
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : null;
}

export function matchesQuery(location, q) {
  const query = String(q || '')
    .trim()
    .toLowerCase();
  if (!query) return true;
  const name = String(location?.name || '').toLowerCase();
  return name.includes(query);
}

export function buildLocationPayload(values) {
  const name = String(values?.name || '').trim();

  return {
    name,
    latitude: toNumber(values?.latitude),
    longitude: toNumber(values?.longitude),
    radius: toNumber(values?.radius),
  };
}
