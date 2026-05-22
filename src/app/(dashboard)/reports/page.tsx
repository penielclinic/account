import type { Metadata } from 'next';

export const metadata: Metadata = { title: '보고서 — 이음 회계' };

export default function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">보고서</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-sm">Phase 5에서 주간/월간/연간 보고서 생성 기능이 구현됩니다.</p>
      </div>
    </div>
  );
}
