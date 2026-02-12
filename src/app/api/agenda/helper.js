export async function uploadToNextcloud(file, options = {}) {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function' || file.size === 0) return null;

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
