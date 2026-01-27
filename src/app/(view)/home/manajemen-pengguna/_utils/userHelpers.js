export const ROLE_OPTIONS = ['GURU', 'PEGAWAI', 'ADMIN'];

export const STATUS_OPTIONS = [
  { label: 'Aktif', value: 'aktif' },
  { label: 'Non-Aktif', value: 'non_aktif' },
];

export function normalizeQuery(q) {
  return String(q || '')
    .trim()
    .toLowerCase();
}

export function matchesQuery(user, q) {
  const s = normalizeQuery(q);
  if (!s) return true;

  const hay = [user?.name, user?.email, user?.nip, user?.nomor_handphone, user?.role, user?.status].map((x) => (x == null ? '' : String(x).toLowerCase())).join(' ');

  return hay.includes(s);
}

export function normalizeStatus(value) {
  const s = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!s) return '';
  if (s === 'aktif') return 'aktif';
  if (s === 'non_aktif' || s === 'non-aktif' || s === 'non aktif') return 'non_aktif';
  return s;
}

export function buildInitialFotoFileList(url) {
  if (!url) return [];
  return [
    {
      uid: 'foto-profil-initial',
      name: 'Foto Profil',
      status: 'done',
      url,
    },
  ];
}

export function pickUploadFile(fileList) {
  if (!Array.isArray(fileList)) return null;
  const hit = fileList.find((f) => f?.originFileObj);
  return hit?.originFileObj ?? null;
}

export function safeText(value, fallback = '-') {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return String(value);
  } catch {
    return fallback;
  }
}
