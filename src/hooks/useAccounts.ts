'use client';

import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '@/lib/supabase/accounts';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    staleTime: 5 * 60 * 1000,
  });
}
