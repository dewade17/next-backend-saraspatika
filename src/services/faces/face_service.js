import { listUserFaces } from '@/repositories/faces/face_repo.js';

export async function listFacesService() {
  return await listUserFaces();
}
