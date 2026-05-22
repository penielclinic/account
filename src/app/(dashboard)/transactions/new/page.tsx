import type { Metadata } from 'next';

export const metadata: Metadata = { title: '거래 입력 — 이음 회계' };

export default function NewTransactionPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">거래 입력</h1>
        <p className="text-sm text-gray-500 mt-1">5가지 방식으로 거래를 입력하세요</p>
      </div>

      {/* Phase 1: 수동 입력 폼 (ManualForm) */}
      {/* Phase 2: OCR / CSV / 음성 / PDF 추가 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-sm">Phase 1에서 수동 입력 폼이 구현됩니다.</p>
      </div>
    </div>
  );
}
