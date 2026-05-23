'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateTransaction } from '@/hooks/useTransactions';

const schema = z.object({
  transaction_date: z.string().min(1, '날짜를 선택하세요'),
  type: z.enum(['income', 'expense']),
  account_id: z.string().min(1, '계정과목을 선택하세요'),
  amount: z
    .number({ invalid_type_error: '금액을 입력하세요' })
    .positive('0보다 큰 금액을 입력하세요'),
  description: z
    .string()
    .min(1, '적요를 입력하세요')
    .max(200, '200자 이내로 입력하세요'),
  vendor: z.string().max(100).optional(),
  payment_method: z.string().optional(),
  memo: z.string().max(500).optional(),
});

type FormState = {
  transaction_date: string;
  type: 'income' | 'expense';
  account_id: string;
  amount: string;
  description: string;
  vendor: string;
  payment_method: string;
  memo: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const PAYMENT_METHODS = ['현금', '계좌이체', '신용카드', '체크카드', '기타'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatAmount(raw: string): string {
  const n = raw.replace(/\D/g, '');
  return n ? Number(n).toLocaleString('ko-KR') : '';
}

export default function ManualForm() {
  const router = useRouter();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const create = useCreateTransaction();

  const [form, setForm] = useState<FormState>({
    transaction_date: todayStr(),
    type: 'expense',
    account_id: '',
    amount: '',
    description: '',
    vendor: '',
    payment_method: '',
    memo: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef(form);
  formRef.current = form;

  const incomeAccounts = accounts.filter(a => a.type === 'income');
  const expenseAccounts = accounts.filter(a => a.type === 'expense');
  const filteredAccounts = form.type === 'income' ? incomeAccounts : expenseAccounts;

  function set(key: keyof FormState, value: string) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'type') next.account_id = '';
      return next;
    });
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const f = formRef.current;

    const parsed = schema.safeParse({
      ...f,
      amount: f.amount ? Number(f.amount.replace(/,/g, '')) : undefined,
      vendor: f.vendor || undefined,
      payment_method: f.payment_method || undefined,
      memo: f.memo || undefined,
    });

    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const err of parsed.error.errors) {
        const key = err.path[0] as keyof FormState;
        if (!errs[key]) errs[key] = err.message;
      }
      setErrors(errs);
      return;
    }

    try {
      await create.mutateAsync({
        input: {
          transaction_date: parsed.data.transaction_date,
          type: parsed.data.type,
          account_id: parsed.data.account_id,
          amount: parsed.data.amount,
          description: parsed.data.description,
          vendor: parsed.data.vendor ?? null,
          payment_method: parsed.data.payment_method ?? null,
          memo: parsed.data.memo ?? null,
        },
        inputMethod: 'manual',
      });
      toast.success('거래가 저장되었습니다');
      router.push('/transactions/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했습니다');
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 구분 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">구분 *</label>
        <div className="flex gap-3">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                form.type === t
                  ? t === 'income'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {t === 'income' ? '수입' : '지출'}
            </button>
          ))}
        </div>
      </div>

      {/* 날짜 + 금액 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
          <input
            type="date"
            value={form.transaction_date}
            onChange={e => set('transaction_date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.transaction_date && (
            <p className="text-red-500 text-xs mt-1">{errors.transaction_date}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">금액 *</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={form.amount}
              onChange={e => set('amount', formatAmount(e.target.value))}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-7"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">원</span>
          </div>
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
          )}
        </div>
      </div>

      {/* 계정과목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">계정과목 *</label>
        <select
          value={form.account_id}
          onChange={e => set('account_id', e.target.value)}
          disabled={accountsLoading}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        >
          <option value="">선택하세요</option>
          {filteredAccounts.map(a => (
            <option key={a.id} value={a.id}>
              {a.code} {a.name}
            </option>
          ))}
        </select>
        {errors.account_id && (
          <p className="text-red-500 text-xs mt-1">{errors.account_id}</p>
        )}
      </div>

      {/* 적요 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">적요 *</label>
        <input
          type="text"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="거래 내용을 입력하세요"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      {/* 거래처 + 결제수단 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">거래처</label>
          <input
            type="text"
            value={form.vendor}
            onChange={e => set('vendor', e.target.value)}
            placeholder="선택 사항"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">결제 수단</label>
          <select
            value={form.payment_method}
            onChange={e => set('payment_method', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택 사항</option>
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          value={form.memo}
          onChange={e => set('memo', e.target.value)}
          rows={2}
          placeholder="선택 사항"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push('/transactions/')}
          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={create.isPending}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {create.isPending ? '저장 중...' : '저장 (Ctrl+S)'}
        </button>
      </div>
    </form>
  );
}
