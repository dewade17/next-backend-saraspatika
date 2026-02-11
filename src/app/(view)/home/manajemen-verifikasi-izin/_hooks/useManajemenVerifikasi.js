import React from 'react';
import { createHttpClient } from '@/lib/http_client.js';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

export function useManajemenVerifikasi() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState(null);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/pengajuan-absensi', { cache: 'no-store' });
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat daftar pengajuan' });
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  const updateStatus = React.useCallback(
    async (item, nextStatus, adminNote) => {
      const id = item?.id_pengajuan;
      if (!id) return;

      setBusyId(id);
      try {
        const payload = {
          status: nextStatus,
          admin_note: adminNote == null ? undefined : String(adminNote),
        };

        await client.patch(`/api/pengajuan-absensi/${encodeURIComponent(String(id))}`, {
          json: payload,
        });

        message.success(`Pengajuan berhasil ${nextStatus === 'SETUJU' ? 'disetujui' : 'ditolak'}`);
        await fetchRows();
      } catch (err) {
        message.errorFrom(err, { fallback: 'Gagal memproses pengajuan' });
      } finally {
        setBusyId(null);
      }
    },
    [client, fetchRows, message],
  );

  React.useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return { rows, loading, busyId, updateStatus, fetchRows };
}
