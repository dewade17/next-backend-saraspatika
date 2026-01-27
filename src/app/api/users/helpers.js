import { storage } from '@/lib/storage.js';

const USER_FORM_FIELDS = ['email', 'name', 'password', 'status', 'nomor_handphone', 'nip', 'foto_profil_url', 'role'];

function normalizeFormValue(value) {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return value;
}

function readStringField(form, key) {
  const raw = form.get(key);
  if (typeof raw !== 'string') return undefined;
  return normalizeFormValue(raw);
}

async function uploadFotoProfil(file) {
  if (!file || typeof file.arrayBuffer !== 'function') return null;
  if (typeof file.size === 'number' && file.size <= 0) return null;

  const buf = Buffer.from(await file.arrayBuffer());
  const upload = await storage.upload({
    data: buf,
    filename: file.name || 'foto-profil',
    folder: 'foto_profile',
  });

  try {
    const share = await storage.createPublicShare(upload.remotePath);
    return share?.url ?? upload.remotePath;
  } catch {
    return upload.remotePath;
  }
}

export async function parseUserRequest(req, schema) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const payload = {};

    for (const key of USER_FORM_FIELDS) {
      const value = readStringField(form, key);
      if (value !== undefined) payload[key] = value;
    }

    const file = form.get('foto_profil');
    const fotoUrl = await uploadFotoProfil(file);
    if (fotoUrl) payload.foto_profil_url = fotoUrl;

    return await schema.parseAsync(payload);
  }

  const json = await req.json();
  return await schema.parseAsync(json);
}
