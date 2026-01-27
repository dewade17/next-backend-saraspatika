import { storage } from '@/lib/storage.js';

const USER_FORM_FIELDS = ['email', 'name', 'password', 'status', 'nomor_handphone', 'nip', 'foto_profil_url', 'role'];

function isDev() {
  return process.env.NODE_ENV !== 'production';
}

function normalizeFormValue(value) {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '') return null;
    return trimmed;
  }
  return value;
}

function readStringField(form, key) {
  const raw = form.get(key);
  if (typeof raw !== 'string') return undefined;
  return normalizeFormValue(raw);
}

async function uploadFotoProfilOrThrow(file) {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') return null;
  if (file.size === 0) return null;

  const upload = await storage.upload({
    data: file, // File/Blob langsung (Storage akan buffer-kan + validasi size)
    filename: file.name || 'foto-profil.png',
    folder: 'foto_profil',
  });

  const share = await storage.createPublicShare(upload.remotePath);

  return share?.url || upload.remotePath;
}

export async function parseUserRequest(req, schema) {
  const contentType = req.headers.get('content-type') || '';
  if (isDev()) console.log('DEBUG: Content-Type Request:', contentType);

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const payload = {};

    if (isDev()) console.log('DEBUG: FormData keys:', Array.from(form.keys()));

    for (const key of USER_FORM_FIELDS) {
      const value = readStringField(form, key);
      if (value !== undefined) payload[key] = value;
    }

    // Upload file kalau ada
    const file = form.get('foto_profil') || form.get('foto_profile');

    // Kalau user memang mengirim file, dan upload gagal → throw (biar API tidak 200 palsu)
    const fotoUrl = await uploadFotoProfilOrThrow(file);

    if (fotoUrl) {
      if (isDev()) console.log('DEBUG: Menetapkan foto_profil_url ke payload:', fotoUrl);
      payload.foto_profil_url = fotoUrl;
    } else {
      if (isDev()) console.log('DEBUG: Tidak ada URL foto baru yang dihasilkan.');
    }

    return await schema.parseAsync(payload);
  }

  const json = await req.json();
  if (json.foto_profil_url === undefined && json.foto_profile_url !== undefined) {
    json.foto_profil_url = json.foto_profile_url;
    delete json.foto_profile_url;
  }

  return await schema.parseAsync(json);
}
