import { storage } from '@/lib/storage.js';

function isUploadableFile(file) {
  if (!file || typeof file === 'string') return false;

  if (typeof File !== 'undefined' && file instanceof File) {
    return file.size > 0;
  }

  return typeof file.arrayBuffer === 'function' && typeof file.size === 'number' && file.size > 0;
}

export async function uploadToNextcloud(file, options = {}) {
  if (!isUploadableFile(file)) return null;

  const filename = String(options.filename || file.name || 'file').trim() || 'file';
  const folder = String(options.folder || 'uploads').trim() || 'uploads';

  const upload = await storage.upload({
    data: file,
    filename,
    folder,
  });

  const share = await storage.createPublicShare(upload.remotePath);
  return share?.url || upload.remotePath;
}
