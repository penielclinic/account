'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransactions,
  createTransaction,
  createTransactionsBatch,
  getDashboardStats,
  type TransactionFilters,
  type CreateTransactionInput,
} from '@/lib/supabase/transactions';

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => getTransactions(filters),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      inputMethod,
    }: {
      input: CreateTransactionInput;
      inputMethod?: 'manual' | 'receipt_ocr' | 'bank_csv' | 'pdf';
    }) => createTransaction(input, inputMethod),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useCreateTransactionsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      inputs,
      inputMethod,
    }: {
      inputs: CreateTransactionInput[];
      inputMethod?: 'manual' | 'receipt_ocr' | 'bank_csv' | 'pdf';
    }) => createTransactionsBatch(inputs, inputMethod),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
