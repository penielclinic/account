import type { Metadata } from 'next';

export const metadata: Metadata = { title: '대시보드 — 이음 회계' };

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">해운대순복음교회 회계 현황</p>
      </div>

      {/* Phase 3에서 구현: KPI 카드, 차트, 최근 거래 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['이번 달 수입', '이번 달 지출', '예산 잔여', '검토 대기'].map((label) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-2">{label}</p>
            <p className="text-xl font-bold text-gray-400">—</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-sm">Phase 1 완료 후 대시보드 데이터가 표시됩니다.</p>
      </div>
    </div>
  );
}
