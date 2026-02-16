import React from 'react';
import { createHttpClient } from '@/lib/http_client.js';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';

const DEFAULT_STATS = {
  guruPegawai: 0,
  verifikasiPengajuan: 0,
  agendaMengajar: 0,
  agendaKerja: 0,
};

function toArrayData(result) {
  if (result?.status !== 'fulfilled') return [];
  return Array.isArray(result?.value?.data) ? result.value.data : [];
}

function countGuruPegawai(rows) {
  return rows.filter((item) => {
    const role = String(item?.role || '').trim().toUpperCase();
    return role === 'GURU' || role === 'PEGAWAI';
  }).length;
}

export function useDashboardData() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [profile, setProfile] = React.useState(null);
  const [stats, setStats] = React.useState(DEFAULT_STATS);
  const [loading, setLoading] = React.useState(true);

  const fetchDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, usersRes, pengajuanRes, agendaMengajarRes, agendaKerjaRes] = await Promise.allSettled([
        client.get('/api/profile-sekolah', { cache: 'no-store' }),
        client.get('/api/users', { cache: 'no-store' }),
        client.get('/api/pengajuan-absensi', {
          cache: 'no-store',
          query: { status: 'MENUNGGU' },
        }),
        client.get('/api/agenda', {
          cache: 'no-store',
          query: { kategori: 'MENGAJAR' },
        }),
        client.get('/api/agenda', {
          cache: 'no-store',
          query: { kategori: 'KERJA' },
        }),
      ]);

      const profileRows = toArrayData(profileRes);
      const userRows = toArrayData(usersRes);
      const pengajuanRows = toArrayData(pengajuanRes);
      const agendaMengajarRows = toArrayData(agendaMengajarRes);
      const agendaKerjaRows = toArrayData(agendaKerjaRes);

      setProfile(profileRows[0] || null);
      setStats({
        guruPegawai: countGuruPegawai(userRows),
        verifikasiPengajuan: pengajuanRows.length,
        agendaMengajar: agendaMengajarRows.length,
        agendaKerja: agendaKerjaRows.length,
      });

      const firstError = [profileRes, usersRes, pengajuanRes, agendaMengajarRes, agendaKerjaRes].find((res) => res.status === 'rejected');
      if (firstError?.reason) {
        message.errorFrom(firstError.reason, { fallback: 'Sebagian data dashboard gagal dimuat.' });
      }
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data dashboard.' });
      setProfile(null);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    profile,
    stats,
    loading,
    fetchDashboard,
  };
}
