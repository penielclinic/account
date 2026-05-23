'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, PenLine, Camera, FileSpreadsheet, FileText, Mic } from 'lucide-react';
import ManualForm from '@/components/input/ManualForm';
import ReceiptOCR from '@/components/input/ReceiptOCR';
import BankCSVUpload from '@/components/input/BankCSVUpload';
import PDFUpload from '@/components/input/PDFUpload';

type TabId = 'manual' | 'receipt' | 'csv' | 'pdf';

const TABS: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'manual',   label: '수동 입력',   icon: PenLine,         color: 'blue' },
  { id: 'receipt',  label: '영수증 OCR',  icon: Camera,          color: 'green' },
  { id: 'csv',      label: '은행 CSV',    icon: FileSpreadsheet, color: 'purple' },
  { id: 'pdf',      label: 'PDF',         icon: FileText,        color: 'orange' },
];

export default function NewTransactionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('manual');

  const activeTabInfo = TABS.find((t) => t.id === activeTab)!;

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
          <p className="text-sm text-gray-500 mt-0.5">{activeTabInfo.label}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'manual' && <ManualForm />}
        {activeTab === 'receipt' && <ReceiptOCR />}
        {activeTab === 'csv' && <BankCSVUpload />}
        {activeTab === 'pdf' && <PDFUpload />}
      </div>

      {activeTab === 'manual' && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          <Mic size={10} className="inline mr-1" />
          음성 입력은 Phase 3에서 추가됩니다
        </p>
      )}
    </div>
  );
}
