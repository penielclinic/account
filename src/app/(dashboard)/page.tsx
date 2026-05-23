'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Clock, Wallet } from 'lucide-react';
import { useDashboardStats, useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/lib/utils';

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentData, isLoading: txLoading } = useTransactions({ limit: 5, page: 1 });

  const now = new Date();
  const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  const balance =
    stats ? stats.monthIncome - stats.monthExpense : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">해운대순복음교회 회계 현황 — {monthLabel}</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="이번 달 수입"
          value={statsLoading ? '—' : formatCurrency(stats?.monthIncome ?? 0)}
          sub={monthLabel}
          icon={TrendingUp}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="이번 달 지출"
          value={statsLoading ? '—' : formatCurrency(stats?.monthExpense ?? 0)}
          sub={monthLabel}
          icon={TrendingDown}
          color="bg-red-50 text-red-500"
        />
        <KpiCard
          label="수지 차액"
          value={statsLoading ? '—' : formatCurrency(Math.abs(balance))}
          sub={balance >= 0 ? '흑자' : '적자'}
          icon={Wallet}
          color={balance >= 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}
        />
        <KpiCard
          label="검토 대기"
          value={statsLoading ? '—' : `${stats?.pendingApproval ?? 0}건`}
          sub="승인 대기 중"
          icon={Clock}
          color="bg-yellow-50 text-yellow-600"
        />
      </div>

      {/* 최근 거래 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">최근 거래</h2>
          <Link href="/transactions/" className="text-xs text-blue-600 hover:underline">
            전체 보기 →
          </Link>
        </div>

        {txLoading ? (
          <div className="p-6 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : recentData?.data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400 mb-3">아직 거래 내역이 없습니다.</p>
            <Link
              href="/transactions/new/"
              className="text-sm text-blue-600 hover:underline"
            >
              첫 거래를 입력하세요 →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-2.5 font-medium">날짜</th>
                <th className="text-left px-5 py-2.5 font-medium">계정과목</th>
                <th className="text-left px-5 py-2.5 font-medium">적요</th>
                <th className="text-right px-5 py-2.5 font-medium">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentData?.data.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDate(t.transaction_date)}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {t.accounts ? `${t.accounts.code} ${t.accounts.name}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-900 max-w-[220px] truncate">
                    {t.description}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-semibold ${
                      t.type === 'income' ? 'text-blue-700' : 'text-red-600'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
