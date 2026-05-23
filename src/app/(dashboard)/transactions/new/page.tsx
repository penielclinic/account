'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import ManualForm from '@/components/input/ManualForm';

export default function NewTransactionPage() {
  const router = useRouter();
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/transactions/')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래 입력</h1>
          <p className="text-sm text-gray-500 mt-0.5">수동 입력 — Ctrl+S로 저장</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ManualForm />
      </div>
    </div>
  );
}
