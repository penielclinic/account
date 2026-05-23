import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'AI 질의 — 이음 회계' };

export default function AiQueryPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">AI 자연어 질의</h1>
      <p className="text-sm text-gray-500 mb-6">
        &quot;이번 달 선교비 얼마야?&quot; 같이 자연어로 물어보세요.
      </p>
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-sm">Phase 4에서 자연어 질의응답 기능이 구현됩니다.</p>
      </div>
    </div>
  );
}
