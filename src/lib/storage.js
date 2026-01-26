import 'server-only';

import crypto from 'node:crypto';
import path from 'node:path';
import { createClient } from 'webdav';
import { env } from '@/lib/env.js';
import { badRequest, internal } from '@/lib/error.js';

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

function normalizeDavBaseUrl(raw) {
  const u = new URL(raw);
  // Ensure trailing slash so webdav client path joining behaves predictably.
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.toString();
}

function sanitizeFilename(name) {
  const base = String(name || 'file').trim();

  // remove path separators just in case
  const stripped = base.replace(/[\/\\]/g, '_');

  // allow a-z A-Z 0-9 . _ - and spaces; collapse others
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

  // prevent traversal
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

function getNextcloudRootInfo() {
  // NEXTCLOUD_URL in your .env is already the user WebDAV root:
  // https://<host>/remote.php/dav/files/<user>/
  const baseUrl = normalizeDavBaseUrl(env.NEXTCLOUD_URL);
  const u = new URL(baseUrl);

  // try to derive "/remote.php/dav/files/<user>" for path calculations
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex((p) => p === 'files');
  const userFromUrl = idx >= 0 ? parts[idx + 1] : null;

  return {
    davBaseUrl: baseUrl,
    origin: u.origin,
    userFromUrl,
  };
}

async function ensureDir(client, folder) {
  const f = String(folder || '')
    .trim()
    .replace(/^[\/\\]+|[\/\\]+$/g, '');
  if (!f) return;

  if (ensuredDirs.has(f)) return;

  // Create recursively folder-by-folder for compatibility.
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
    const info = getNextcloudRootInfo();

    this.davBaseUrl = normalizeDavBaseUrl(opts.davBaseUrl ?? info.davBaseUrl);
    this.username = opts.username ?? env.NEXTCLOUD_USER;
    this.password = opts.password ?? env.NEXTCLOUD_PASS;
    this.defaultFolder = String(opts.defaultFolder ?? 'uploads').trim();

    this.client = createClient(this.davBaseUrl, {
      username: this.username,
      password: this.password,
    });

    this.origin = info.origin;
  }

  /**
   * Upload any file format (no mime restriction) with max size 2MB.
   *
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

      // webdav: putFileContents(remotePath, data, { overwrite })
      await this.client.putFileContents(remotePath, buf, { overwrite });

      let etag = null;
      let lastmod = null;
      try {
        const st = await this.client.stat(remotePath);
        etag = st?.etag ?? null;
        lastmod = st?.lastmod ?? null;
      } catch {
        // ignore stat failures
      }

      return {
        remotePath,
        filename: finalName,
        bytes: buf.length,
        sha256: sha256Hex(buf),
        etag,
        lastmod,
      };
    } catch (err) {
      throw internal('Gagal upload ke Nextcloud', { code: 'nextcloud_upload_failed', cause: err });
    }
  }

  /**
   * Upload from multipart/form-data Request (Next.js route handler).
   * Expects a File in form field (default: "file").
   *
   * @param {Request} req
   * @param {{
   *  fieldName?: string,
   *  folder?: string,
   *  overwrite?: boolean,
   *  ensureUnique?: boolean,
   * }} [opts]
   * @returns {Promise<UploadResult>}
   */
  async uploadFromRequest(req, opts = {}) {
    const fieldName = opts.fieldName ?? 'file';
    const folder = opts.folder ?? this.defaultFolder;

    let form;
    try {
      form = await req.formData();
    } catch (err) {
      throw badRequest('Request harus multipart/form-data', { code: 'invalid_multipart', cause: err });
    }

    const file = form.get(fieldName);
    if (!file) throw badRequest(`Field "${fieldName}" tidak ditemukan`, { code: 'missing_file_field' });

    // In Next.js (Node runtime), multipart files are provided as File.
    if (typeof File !== 'undefined' && file instanceof File) {
      assertMaxBytes(file.size);

      const buf = await blobToBuffer(file);
      return await this.upload({
        data: buf,
        filename: file.name || 'file',
        folder,
        overwrite: Boolean(opts.overwrite),
        ensureUnique: opts.ensureUnique !== false,
      });
    }

    // Some runtimes may return Blob
    if (typeof Blob !== 'undefined' && file instanceof Blob) {
      const buf = await blobToBuffer(file);
      assertMaxBytes(buf.length);
      return await this.upload({
        data: buf,
        filename: 'file',
        folder,
        overwrite: Boolean(opts.overwrite),
        ensureUnique: opts.ensureUnique !== false,
      });
    }

    throw badRequest('Field file bukan tipe File/Blob', { code: 'invalid_file_type' });
  }

  /**
   * Delete a stored file.
   * @param {string} remotePath
   */
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
      throw internal('Gagal menghapus file di Nextcloud', { code: 'nextcloud_delete_failed', cause: err });
    }
  }

  /**
   * Create a public share link (requires Nextcloud Files Sharing app).
   * Uses OCS API: /ocs/v2.php/apps/files_sharing/api/v1/shares
   *
   * @param {string} remotePath e.g. "uploads/a.png"
   * @param {{
   *  password?: string,
   *  expireDate?: string, // YYYY-MM-DD
   *  permissions?: number, // default 1 (read)
   * }} [opts]
   */
  async createPublicShare(remotePath, opts = {}) {
    if (!remotePath) throw badRequest('remotePath wajib diisi', { code: 'missing_remote_path' });

    const rp = String(remotePath).replace(/\\/g, '/');
    if (rp.includes('..')) throw badRequest('Path file tidak valid', { code: 'invalid_path' });

    // OCS expects path starting with "/"
    const ocsPath = rp.startsWith('/') ? rp : `/${rp}`;

    const body = new URLSearchParams();
    body.set('path', ocsPath);
    body.set('shareType', '3'); // public link
    body.set('permissions', String(opts.permissions ?? 1)); // 1 = read
    if (opts.password) body.set('password', String(opts.password));
    if (opts.expireDate) body.set('expireDate', String(opts.expireDate));

    const url = `${this.origin}/ocs/v2.php/apps/files_sharing/api/v1/shares`;

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
        throw new Error(`OCS share failed (${res.status}): ${txt?.slice(0, 200)}`);
      }

      // Minimal XML extraction without adding deps
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

      return { ok: true, id, token, url: shareUrl };
    } catch (err) {
      throw internal('Gagal membuat public share link Nextcloud', { code: 'nextcloud_share_failed', cause: err });
    }
  }
}

// Default singleton (useful across API routes/services)
export const storage = new Storage();
