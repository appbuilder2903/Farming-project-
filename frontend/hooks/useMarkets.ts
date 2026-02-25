import { useState, useCallback } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import type { Market, APIResponse } from '@/types';

const fetcher = (url: string) =>
  api.get(url).then((r) => r.data as APIResponse<Market[]>);

export function useMarkets() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const key = coords
    ? `/markets/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=50`
    : null;

  const { data, error, isLoading } = useSWR<APIResponse<Market[]>>(
    key,
    fetcher
  );

  const findNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocationError('Location access denied. Please enable GPS.');
        setLocating(false);
      }
    );
  }, []);

  return {
    markets: data?.data ?? [],
    isLoading: isLoading || locating,
    isError: !!error,
    locationError,
    coords,
    findNearMe,
  };
}
