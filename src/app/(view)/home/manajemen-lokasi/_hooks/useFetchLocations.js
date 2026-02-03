import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { createHttpClient } from '@/lib/http_client.js';
import { mapLocationFromApi } from '../_utils/locationHelpers';

export function useFetchLocations() {
  const message = useAppMessage();
  const client = React.useMemo(() => createHttpClient(), []);

  const [locations, setLocations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');

  const fetchLocations = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/lokasi', { cache: 'no-store' });
      const rows = Array.isArray(res?.data) ? res.data : [];
      setLocations(rows.map(mapLocationFromApi).filter(Boolean));
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data lokasi.' });
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [client, message]);

  React.useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    setLocations,
    loading,
    q,
    setQ,
    fetchLocations,
    message,
    client,
  };
}
