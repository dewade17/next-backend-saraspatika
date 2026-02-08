import { badRequest } from '@/lib/error.js';
import { createFaceResetRequest, deleteFaceResetRequest, findFaceResetRequestById, listFaceResetRequests, updateFaceResetRequest } from '@/repositories/face_reset_requests/face_reset_request_repo.js';

const allowedStatuses = new Set(['MENUNGGU', 'SETUJU', 'DITOLAK']);

function normalizeStatus(status) {
  if (status == null) return undefined;
  const normalized = String(status).trim().toUpperCase();
  if (!normalized) return undefined;
  if (!allowedStatuses.has(normalized)) {
    throw badRequest('Status tidak valid', { code: 'status_invalid' });
  }
  return normalized;
}

function normalizeText(value) {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : null;
}

export async function listFaceResetRequestsService({ status, id_user } = {}) {
  const normalizedStatus = normalizeStatus(status);
  const normalizedUserId = String(id_user ?? '').trim();

  return await listFaceResetRequests({
    status: normalizedStatus,
    id_user: normalizedUserId || undefined,
  });
}

export async function getFaceResetRequestByIdService(id_request) {
  const id = String(id_request ?? '').trim();
  if (!id) throw badRequest('ID request tidak valid', { code: 'id_request_invalid' });

  const data = await findFaceResetRequestById(id);
  if (!data) throw badRequest('Request tidak ditemukan', { code: 'request_not_found', status: 404 });
  return data;
}

export async function createFaceResetRequestService({ id_user, alasan }) {
  const userId = String(id_user ?? '').trim();
  if (!userId) throw badRequest('ID user tidak valid', { code: 'id_user_invalid' });

  const reason = normalizeText(alasan);
  if (!reason) throw badRequest('Alasan wajib diisi', { code: 'alasan_required' });

  return await createFaceResetRequest({
    id_user: userId,
    alasan: reason,
  });
}

export async function updateFaceResetRequestService(id_request, input, adminId) {
  const id = String(id_request ?? '').trim();
  if (!id) throw badRequest('ID request tidak valid', { code: 'id_request_invalid' });

  const data = {};

  if (input?.status !== undefined) {
    data.status = normalizeStatus(input.status);
  }

  if (input?.admin_note !== undefined) {
    data.admin_note = normalizeText(input.admin_note);
  }

  if (adminId) {
    data.id_admin = String(adminId).trim() || undefined;
  }

  if (Object.keys(data).length === 0) {
    throw badRequest('Tidak ada data untuk diperbarui', { code: 'request_no_changes' });
  }

  return await updateFaceResetRequest(id, data);
}

export async function deleteFaceResetRequestService(id_request) {
  const id = String(id_request ?? '').trim();
  if (!id) throw badRequest('ID request tidak valid', { code: 'id_request_invalid' });

  return await deleteFaceResetRequest(id);
}
