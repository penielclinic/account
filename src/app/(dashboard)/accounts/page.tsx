'use client';

import { useAccounts } from '@/hooks/useAccounts';
import type { Account } from '@/types';

function AccountRow({ account }: { account: Account }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-50">
      <td className="px-4 py-3 font-mono text-sm text-gray-600">{account.code}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{account.name}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            account.type === 'income'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {account.type === 'income' ? '수입' : '지출'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            account.is_active ? 'bg-green-400' : 'bg-gray-300'
          }`}
        />
      </td>
    </tr>
  );
}

export default function AccountsPage() {
  const { data: accounts = [], isLoading, isError } = useAccounts();

  const incomeAccounts = accounts.filter(a => a.type === 'income');
  const expenseAccounts = accounts.filter(a => a.type === 'expense');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">계정과목</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          수입 {incomeAccounts.length}개 · 지출 {expenseAccounts.length}개
        </p>
      </div>

      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
          불러오는 중...
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-red-500">
          데이터를 불러오지 못했습니다.
          <br />
          <span className="text-xs text-gray-400">
            Supabase Settings → API → Exposed schemas에 &quot;accounting&quot;이 추가되었는지 확인하세요.
          </span>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-6">
          {/* 수입 */}
          <section>
            <h2 className="text-sm font-semibold text-blue-700 mb-2 px-1">
              수입 계정 (4xxx)
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5 font-medium">코드</th>
                    <th className="text-left px-4 py-2.5 font-medium">계정명</th>
                    <th className="text-left px-4 py-2.5 font-medium">유형</th>
                    <th className="text-center px-4 py-2.5 font-medium">활성</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeAccounts.map(a => (
                    <AccountRow key={a.id} account={a} />
                  ))}
                  {incomeAccounts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-400">
                        수입 계정이 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 지출 */}
          <section>
            <h2 className="text-sm font-semibold text-red-600 mb-2 px-1">
              지출 계정 (5xxx)
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5 font-medium">코드</th>
                    <th className="text-left px-4 py-2.5 font-medium">계정명</th>
                    <th className="text-left px-4 py-2.5 font-medium">유형</th>
                    <th className="text-center px-4 py-2.5 font-medium">활성</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseAccounts.map(a => (
                    <AccountRow key={a.id} account={a} />
                  ))}
                  {expenseAccounts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-400">
                        지출 계정이 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
