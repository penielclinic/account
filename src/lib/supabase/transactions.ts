import { accountingClient } from './accounting';
import type { Transaction } from '@/types';

export interface TransactionFilters {
  type?: 'income' | 'expense';
  account_id?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionRow extends Transaction {
  accounts: { code: string; name: string } | null;
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const { type, account_id, from, to, search, page = 1, limit = 20 } = filters;

  let query = accountingClient
    .from('transactions')
    .select('*, accounts(code, name)', { count: 'exact' })
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (type) query = query.eq('type', type);
  if (account_id) query = query.eq('account_id', account_id);
  if (from) query = query.gte('transaction_date', from);
  if (to) query = query.lte('transaction_date', to);
  if (search) query = query.ilike('description', `%${search}%`);

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: (data ?? []) as TransactionRow[], count: count ?? 0 };
}

export interface CreateTransactionInput {
  transaction_date: string;
  type: 'income' | 'expense';
  account_id: string;
  amount: number;
  description: string;
  vendor?: string | null;
  payment_method?: string | null;
  memo?: string | null;
}

export async function createTransaction(
  input: CreateTransactionInput,
  inputMethod: 'manual' | 'receipt_ocr' | 'bank_csv' | 'pdf' = 'manual'
): Promise<Transaction> {
  const { data, error } = await accountingClient
    .from('transactions')
    .insert({ ...input, input_method: inputMethod, status: 'recorded' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createTransactionsBatch(
  inputs: CreateTransactionInput[],
  inputMethod: 'manual' | 'receipt_ocr' | 'bank_csv' | 'pdf' = 'bank_csv'
): Promise<number> {
  const rows = inputs.map((input) => ({
    ...input,
    input_method: inputMethod,
    status: 'recorded',
  }));
  const { error, count } = await accountingClient
    .from('transactions')
    .insert(rows, { count: 'exact' });
  if (error) throw new Error(error.message);
  return count ?? inputs.length;
}

export interface DashboardStats {
  monthIncome: number;
  monthExpense: number;
  pendingApproval: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [incomeRes, expenseRes, pendingRes] = await Promise.all([
    accountingClient
      .from('transactions')
      .select('amount')
      .eq('type', 'income')
      .gte('transaction_date', firstDay)
      .lte('transaction_date', lastDay),
    accountingClient
      .from('transactions')
      .select('amount')
      .eq('type', 'expense')
      .gte('transaction_date', firstDay)
      .lte('transaction_date', lastDay),
    accountingClient
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
  ]);

  const monthIncome = (incomeRes.data ?? []).reduce((s, t) => s + (t.amount as number), 0);
  const monthExpense = (expenseRes.data ?? []).reduce((s, t) => s + (t.amount as number), 0);

  return { monthIncome, monthExpense, pendingApproval: pendingRes.count ?? 0 };
}
