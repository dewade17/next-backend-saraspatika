/**
 * Membersihkan dan memvalidasi data form sebelum dikirim ke server.
 */
export function normalizeFormPayload(values) {
  return {
    nama_sekolah: String(values?.nama_sekolah || '').trim(),
    alamat_sekolah: String(values?.alamat_sekolah || '').trim(),
    npsn: String(values?.npsn || '').trim(),
    no_telepon: String(values?.no_telepon || '').trim() || undefined,
  };
}
