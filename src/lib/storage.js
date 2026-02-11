import 'server-only';

import crypto from 'node:crypto';
import path from 'node:path';
import { createClient } from 'webdav';
import { env } from '@/lib/env.js';
import { badRequest, forbidden, internal, unauthorized } from '@/lib/error.js';

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB

const ensuredDirs = new Set();

/**
 * @typedef {Object} UploadResult
 * @property {string} remotePath Path relative to Nextcloud user root (e.g. "uploads/abc.png")
 * @property {string} filename Final stored filename
 * @property {number} bytes Stored size in bytes
 * @property {string} sha256 Hex sha256 of content (when buffer-based upload)
 * @property {string | null} etag ETag returned by Nextcloud (if available)
 * @property {string | null} lastmod ISO last modified (if available)
 */

function normalizeTrailingSlash(raw) {
  const u = new URL(raw);
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.toString();
}

function sanitizeFilename(name) {
  const base = String(name || 'file').trim();
  const stripped = base.replace(/[\/\\]/g, '_');
  const safe = stripped
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return safe || 'file';
}

function assertMaxBytes(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return;
  if (bytes > MAX_UPLOAD_BYTES) {
    throw badRequest('Ukuran file maksimal 2MB', {
      code: 'file_too_large',
      errors: { maxBytes: MAX_UPLOAD_BYTES, bytes },
    });
  }
}

function safeJoinRemote(folder, filename) {
  const f = String(folder || '')
    .trim()
    .replace(/^[\/\\]+|[\/\\]+$/g, '');
  const n = sanitizeFilename(filename);

  const joined = f ? `${f}/${n}` : n;
  const normalized = joined.replace(/\\/g, '/');

  if (normalized.includes('..')) {
    throw badRequest('Path file tidak valid', { code: 'invalid_path' });
  }
  return normalized;
}

function makeUniqueName(filename) {
  const safe = sanitizeFilename(filename);
  const ext = path.extname(safe);
  const stem = ext ? safe.slice(0, -ext.length) : safe;

  const rand = crypto.randomBytes(6).toString('hex');
  const stamp = Date.now();
  return `${stem}-${stamp}-${rand}${ext}`;
}

async function blobToBuffer(blob) {
  const ab = await blob.arrayBuffer();
  return Buffer.from(ab);
}

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function extractHttpStatus(err, depth = 0) {
  if (!err || depth > 6) return null;

  const direct = err.status ?? err.statusCode ?? err.response?.status ?? err.res?.status ?? err.cause?.status ?? err.cause?.response?.status;

  if (typeof direct === 'number') return direct;

  const msg = String(err.message || '');
  const m = msg.match(/\b(401|403|404|409|500|502|503)\b/);
  if (m) return Number(m[1]);

  return extractHttpStatus(err.cause, depth + 1);
}

function mapNextcloudError(op, err, code) {
  const status = extractHttpStatus(err);

  if (status === 401) {
    return unauthorized(`Nextcloud Unauthorized saat ${op}. Cek NEXTCLOUD_USER/NEXTCLOUD_PASS (disarankan App Password).`, {
      code: 'nextcloud_unauthorized',
      cause: err,
    });
  }

  if (status === 403) {
    return forbidden(`Nextcloud Forbidden saat ${op}. User tidak punya izin untuk folder target.`, {
      code: 'nextcloud_forbidden',
      cause: err,
    });
  }

  if (status === 404) {
    return badRequest(`Nextcloud endpoint tidak ditemukan saat ${op}. Cek NEXTCLOUD_URL (WebDAV root).`, {
      code: 'nextcloud_not_found',
      cause: err,
    });
  }

  return internal(`Gagal ${op} di Nextcloud`, { code: code ?? 'nextcloud_error', cause: err });
}

function deriveUserFromDavUrl(davBaseUrl) {
  const u = new URL(davBaseUrl);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex((p) => p === 'files');
  return idx >= 0 ? (parts[idx + 1] ?? null) : null;
}

function deriveInstanceBaseUrl(davBaseUrl) {
  const u = new URL(davBaseUrl);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex((p) => p === 'remote.php');
  const basePath = idx > 0 ? `/${parts.slice(0, idx).join('/')}` : '';
  return `${u.origin}${basePath}`;
}

/**
 * Mendukung 2 input:
 * 1) NEXTCLOUD_URL sudah WebDAV root: https://host[/subdir]/remote.php/dav/files/USER/
 * 2) NEXTCLOUD_URL hanya base instance: https://host[/subdir]
 */
function resolveDavBaseUrl(raw, username) {
  const user = String(username || '').trim();
  if (!user) throw badRequest('NEXTCLOUD_USER wajib diisi', { code: 'missing_nextcloud_user' });

  const u = new URL(String(raw || '').trim());
  const p0 = u.pathname.replace(/\/+$/g, ''); // no trailing slash

  // Jika user kasih /remote.php/webdav, konversi ke /remote.php/dav/files/USER
  if (p0.endsWith('/remote.php/webdav')) {
    u.pathname = `${p0.replace(/\/remote\.php\/webdav$/g, '')}/remote.php/dav/files/${encodeURIComponent(user)}`;
    return normalizeTrailingSlash(u.toString());
  }

  // Jika sudah /remote.php/dav/files/...
  if (p0.includes('/remote.php/dav/files/')) {
    u.pathname = p0;
    return normalizeTrailingSlash(u.toString());
  }

  // Jika user kasih base /remote.php/dav, tambah /files/USER
  if (p0.endsWith('/remote.php/dav')) {
    u.pathname = `${p0}/files/${encodeURIComponent(user)}`;
    return normalizeTrailingSlash(u.toString());
  }

  // Selain itu, anggap ini base instance → tambah remote.php/dav/files/USER
  const base = p0 || '';
  u.pathname = `${base}/remote.php/dav/files/${encodeURIComponent(user)}`;
  return normalizeTrailingSlash(u.toString());
}

async function ensureDir(client, folder) {
  const f = String(folder || '')
    .trim()
    .replace(/^[\/\\]+|[\/\\]+$/g, '');
  if (!f) return;

  if (ensuredDirs.has(f)) return;

  const segments = f.split('/').filter(Boolean);
  let current = '';
  for (const seg of segments) {
    current = current ? `${current}/${seg}` : seg;
    const exists = await client.exists(current);
    if (!exists) await client.createDirectory(current);
  }

  ensuredDirs.add(f);
}

export class Storage {
  /**
   * @param {{
   *  davBaseUrl?: string,
   *  username?: string,
   *  password?: string,
   *  defaultFolder?: string,
   * }} [opts]
   */
  constructor(opts = {}) {
    this.username = String(opts.username ?? env.NEXTCLOUD_USER ?? '').trim();
    this.password = String(opts.password ?? env.NEXTCLOUD_PASS ?? '').trim();
    this.defaultFolder = String(opts.defaultFolder ?? 'uploads').trim();

    this.davBaseUrl = resolveDavBaseUrl(opts.davBaseUrl ?? env.NEXTCLOUD_URL, this.username);
    this.instanceBaseUrl = deriveInstanceBaseUrl(this.davBaseUrl);
    this.userFromUrl = deriveUserFromDavUrl(this.davBaseUrl);

    if (this.userFromUrl && this.userFromUrl !== this.username && process.env.NODE_ENV !== 'production') {
      console.warn(`WARN: NEXTCLOUD_URL user (${this.userFromUrl}) berbeda dengan NEXTCLOUD_USER (${this.username}). Pastikan konsisten.`);
    }

    this.client = createClient(this.davBaseUrl, {
      username: this.username,
      password: this.password,
    });
  }

  /**
   * @param {{
   *  data: Buffer | Uint8Array | ArrayBuffer | Blob,
   *  filename: string,
   *  folder?: string,
   *  overwrite?: boolean,
   *  ensureUnique?: boolean,
   * }} params
   * @returns {Promise<UploadResult>}
   */
  async upload(params) {
    const { data, filename, folder = this.defaultFolder, overwrite = false, ensureUnique = true } = params || {};

    if (!filename) throw badRequest('filename wajib diisi', { code: 'missing_filename' });
    if (!data) throw badRequest('data file wajib diisi', { code: 'missing_file' });

    let buf;
    if (Buffer.isBuffer(data)) buf = data;
    else if (data instanceof Uint8Array) buf = Buffer.from(data);
    else if (data instanceof ArrayBuffer) buf = Buffer.from(data);
    else if (typeof Blob !== 'undefined' && data instanceof Blob) buf = await blobToBuffer(data);
    else throw badRequest('Tipe data file tidak didukung', { code: 'unsupported_file_input' });

    assertMaxBytes(buf.length);

    const finalName = ensureUnique ? makeUniqueName(filename) : sanitizeFilename(filename);
    const remotePath = safeJoinRemote(folder, finalName);

    try {
      await ensureDir(this.client, folder);
      await this.client.putFileContents(remotePath, buf, { overwrite });

      let etag = null;
      let lastmod = null;
      try {
        const st = await this.client.stat(remotePath);
        etag = st?.etag ?? null;
        lastmod = st?.lastmod ?? null;
      } catch {}

      return {
        remotePath,
        filename: finalName,
        bytes: buf.length,
        sha256: sha256Hex(buf),
        etag,
        lastmod,
      };
    } catch (err) {
      throw mapNextcloudError('upload', err, 'nextcloud_upload_failed');
    }
  }

  async remove(remotePath) {
    if (!remotePath) throw badRequest('remotePath wajib diisi', { code: 'missing_remote_path' });
    const rp = String(remotePath).replace(/\\/g, '/');
    if (rp.includes('..')) throw badRequest('Path file tidak valid', { code: 'invalid_path' });

    try {
      const exists = await this.client.exists(rp);
      if (!exists) return { ok: true, deleted: false };
      await this.client.deleteFile(rp);
      return { ok: true, deleted: true };
    } catch (err) {
      throw mapNextcloudError('delete file', err, 'nextcloud_delete_failed');
    }
  }

  /**
   * Create a public share link (requires Nextcloud Files Sharing app).
   * Uses OCS API: /ocs/v2.php/apps/files_sharing/api/v1/shares
   *
   * @param {string} remotePath e.g. "uploads/a.png"
   */
  async createPublicShare(remotePath) {
    if (!remotePath) throw badRequest('remotePath wajib diisi', { code: 'missing_remote_path' });

    const rp = String(remotePath).replace(/\\/g, '/');
    if (rp.includes('..')) throw badRequest('Path file tidak valid', { code: 'invalid_path' });

    const ocsPath = rp.startsWith('/') ? rp : `/${rp}`;

    const body = new URLSearchParams();
    body.set('path', ocsPath);
    body.set('shareType', '3'); // public link
    body.set('permissions', '1'); // read

    const url = `${this.instanceBaseUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
          'OCS-APIRequest': 'true',
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/xml',
        },
        body,
      });

      const txt = await res.text();
      if (!res.ok) {
        const e = new Error(`OCS share failed (${res.status})`);
        e.status = res.status;
        e.responseText = txt?.slice(0, 400);
        throw e;
      }

      const getTag = (tag) => {
        const m = txt.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
        return m ? m[1].trim() : null;
      };

      const shareUrl = getTag('url');
      const token = getTag('token');
      const id = getTag('id');

      if (!shareUrl) {
        throw new Error(`OCS response missing url: ${txt?.slice(0, 200)}`);
      }
      const normalizedShareUrl = `${shareUrl.replace(/\/+$/, '')}?editing=false&openfile=true`;
      const directLink = `${shareUrl.replace(/\/+$/, '')}/download`;
      return {
        ok: true,
        id,
        token,
        url: normalizedShareUrl,
        directLink,
      };
    } catch (err) {
      throw mapNextcloudError('create public share', err, 'nextcloud_share_failed');
    }
  }
}

export const storage = new Storage();
