import type { Metadata } from 'next';

export const metadata: Metadata = { title: '분석 — 이음 회계' };

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">분석</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-sm">Phase 3에서 주/월/연 비교 대시보드가 구현됩니다.</p>
      </div>
    </div>
  );
}
