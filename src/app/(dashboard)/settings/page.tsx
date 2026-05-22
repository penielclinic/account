import type { Metadata } from 'next';

export const metadata: Metadata = { title: '설정 — 이음 회계' };

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">설정</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-sm">Phase 1에서 앱 설정 기능이 구현됩니다.</p>
      </div>
    </div>
  );
}
