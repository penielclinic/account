import { accountingClient } from './accounting';
import type { Account } from '@/types';

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await accountingClient
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('code');
  if (error) throw new Error(error.message);
  return data ?? [];
}
