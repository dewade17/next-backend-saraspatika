'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';

export default function PermissionPage() {
  const searchParams = useSearchParams();
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const userId = searchParams.get('userId') || '';

  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState(null);

  const fetchUser = React.useCallback(async () => {
    if (!userId) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      const res = await client.get(`/api/users/${encodeURIComponent(userId)}`, { cache: 'no-store' });
      setUser(res?.user ?? null);
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat detail pengguna' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [client, message, userId]);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: 16 }}>
        <AppCard
          bordered
          style={{ borderRadius: 10 }}
        >
          <AppTypography
            as='title'
            level={4}
            style={{ marginTop: 0, marginBottom: 8, fontWeight: 700 }}
          >
            Pengaturan Permission
          </AppTypography>

          {!userId ? (
            <AppTypography
              as='text'
              tone='secondary'
            >
              Pilih pengguna dari halaman Manajemen Pengguna untuk mengatur permission per user.
            </AppTypography>
          ) : loading ? (
            <AppSkeleton active />
          ) : user ? (
            <>
              <AppTypography
                as='text'
                style={{ display: 'block', marginBottom: 8 }}
              >
                <span style={{ fontWeight: 700 }}>User</span> : {user?.name} ({user?.email})
              </AppTypography>
              <AppTypography
                as='text'
                tone='secondary'
              >
                Halaman ini masih placeholder. Nanti bisa diisi UI untuk pengaturan role/permission khusus untuk user ini.
              </AppTypography>
            </>
          ) : (
            <AppTypography
              as='text'
              tone='secondary'
            >
              Pengguna tidak ditemukan atau Anda tidak memiliki akses untuk melihatnya.
            </AppTypography>
          )}
        </AppCard>
      </div>
    </div>
  );
}
