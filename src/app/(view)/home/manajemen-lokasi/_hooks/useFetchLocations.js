import React from 'react';
import { useAppMessage } from '@/app/(view)/components_shared/AppMessage.jsx';
import { makeId } from '../_utils/locationHelpers';

function buildSeed() {
  return [
    {
      id: makeId(),
      name: 'SD Saraswati 4 Denpasar',
      latitude: -6.193125,
      longitude: 106.82181,
      radius: 0.1,
    },
  ];
}

export function useFetchLocations() {
  const message = useAppMessage();

  const [locations, setLocations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');

  const fetchLocations = React.useCallback(async () => {
    setLoading(true);
    try {
      // placeholder: nanti ganti ke API call kalau endpoint sudah ada
      await new Promise((r) => setTimeout(r, 250));
      setLocations(buildSeed());
    } catch (err) {
      message.errorFrom(err, { fallback: 'Gagal memuat data lokasi.' });
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [message]);

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
  };
}
