'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency, formatDate } from '@/lib/utils';

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = {
  recorded: '기록됨',
  pending_approval: '검토중',
  approved: '승인됨',
  rejected: '반려됨',
};

const STATUS_CLASS: Record<string, string> = {
  recorded: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | ''>('');
  const [accountFilter, setAccountFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: accounts = [] } = useAccounts();
  const { data, isLoading, isError } = useTransactions({
    type: typeFilter || undefined,
    account_id: accountFilter || undefined,
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래 내역</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `총 ${data.count.toLocaleString()}건` : ''}
          </p>
        </div>
        <Link
          href="/transactions/new/"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + 거래 입력
        </Link>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        {/* 구분 */}
        <select
          value={typeFilter}
          onChange={e => {
            setTypeFilter(e.target.value as typeof typeFilter);
            setAccountFilter('');
            resetPage();
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 구분</option>
          <option value="income">수입</option>
          <option value="expense">지출</option>
        </select>

        {/* 계정과목 */}
        <select
          value={accountFilter}
          onChange={e => { setAccountFilter(e.target.value); resetPage(); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 계정</option>
          {accounts
            .filter(a => !typeFilter || a.type === typeFilter)
            .map(a => (
              <option key={a.id} value={a.id}>
                {a.code} {a.name}
              </option>
            ))}
        </select>

        {/* 검색 */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="적요 검색..."
            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">
            데이터를 불러오지 못했습니다.
            <br />
            <span className="text-xs text-gray-400">
              Supabase Settings → API → Exposed schemas에 &quot;accounting&quot;이 추가되었는지 확인하세요.
            </span>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            거래 내역이 없습니다.
            <br />
            <Link href="/transactions/new/" className="text-blue-600 hover:underline mt-1 inline-block">
              첫 거래를 입력하세요 →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">날짜</th>
                <th className="text-left px-4 py-3 font-medium">구분</th>
                <th className="text-left px-4 py-3 font-medium">계정과목</th>
                <th className="text-left px-4 py-3 font-medium">적요</th>
                <th className="text-left px-4 py-3 font-medium">거래처</th>
                <th className="text-right px-4 py-3 font-medium">금액</th>
                <th className="text-center px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(t.transaction_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        t.type === 'income'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {t.type === 'income' ? '수입' : '지출'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {t.accounts ? `${t.accounts.code} ${t.accounts.name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">
                    {t.description}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.vendor ?? '—'}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      t.type === 'income' ? 'text-blue-700' : 'text-red-600'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_CLASS[t.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
