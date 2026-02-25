import useSWR from 'swr';
import api from '@/lib/api';
import type { PriceData, APIResponse } from '@/types';

const fetcher = (url: string) =>
  api.get(url).then((r) => r.data as APIResponse<PriceData[]>);

interface UsePricesOptions {
  commodity?: string;
  state?: string;
  market?: string;
}

export function usePrices(options: UsePricesOptions = {}) {
  const params = new URLSearchParams();
  if (options.commodity) params.set('commodity', options.commodity);
  if (options.state) params.set('state', options.state);
  if (options.market) params.set('market', options.market);

  const query = params.toString();
  const key = `/prices/current${query ? `?${query}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<APIResponse<PriceData[]>>(
    key,
    fetcher,
    { refreshInterval: 60_000 }
  );

  return {
    prices: data?.data ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
