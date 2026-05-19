import { listUserFaces } from '@/repositories/faces/face_repo.js';

export async function listFacesService({ q, page, limit } = {}) {
  return await listUserFaces({ q, page, limit });
}
