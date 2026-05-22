import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '거래 내역 — 이음 회계' };

export default function TransactionsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래 내역</h1>
          <p className="text-sm text-gray-500 mt-1">모든 수입·지출 내역</p>
        </div>
        <Link
          href="/transactions/new/"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + 거래 입력
        </Link>
      </div>

      {/* Phase 1에서 구현: 거래 목록 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-sm">Phase 1에서 구현됩니다.</p>
      </div>
    </div>
  );
}
