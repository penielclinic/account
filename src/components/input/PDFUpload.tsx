'use client';

import { useState } from 'react';
import { FileText, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateTransactionsBatch } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/utils';
import type { Account } from '@/types';

interface PdfRow {
  id: number;
  date: string;
  amount: string;
  vendor: string;
  description: string;
  type: 'income' | 'expense';
  accountId: string;
  confidence: number;
  include: boolean;
}

type Stage = 'idle' | 'processing' | 'review';

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

function formatAmount(raw: string): string {
  const n = raw.replace(/\D/g, '');
  return n ? Number(n).toLocaleString('ko-KR') : '';
}

export default function PDFUpload() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const batchCreate = useCreateTransactionsBatch();

  const [stage, setStage] = useState<Stage>('idle');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<PdfRow[]>([]);

  function updateRow(id: number, patch: Partial<PdfRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function openPdf() {
    if (!isElectron) {
      toast.error('이 기능은 데스크탑 앱에서만 사용 가능합니다');
      return;
    }
    const result = await window.electronAPI.openReceipt();
    if (!result) return;
    if (result.ext !== 'pdf') {
      toast.error('PDF 파일을 선택하세요');
      return;
    }
    setFileName(result.path.split(/[\\/]/).pop() ?? 'document.pdf');
    setStage('processing');

    try {
      const ocrResults = await window.electronAPI.ocrPdf(result.data);
      if (ocrResults.length === 0) {
        toast.error('PDF에서 거래 내역을 찾을 수 없습니다');
        setStage('idle');
        return;
      }
      setRows(
        ocrResults.map((r, i) => ({
          id: i,
          date: r.date ?? new Date().toISOString().slice(0, 10),
          amount: r.amount ? r.amount.toLocaleString('ko-KR') : '',
          vendor: r.vendor ?? '',
          description: r.vendor ? `${r.vendor} 구매` : `거래 ${i + 1}`,
          type: 'expense' as const,
          accountId: '',
          confidence: r.confidence,
          include: true,
        }))
      );
      setStage('review');
      toast.success(`${ocrResults.length}건 추출됨`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF 분석 실패');
      setStage('idle');
    }
  }

  async function handleSave() {
    const selected = rows.filter((r) => r.include && r.accountId);
    if (selected.length === 0) {
      toast.error('계정과목이 선택된 거래가 없습니다');
      return;
    }
    try {
      const count = await batchCreate.mutateAsync({
        inputs: selected.map((r) => ({
          transaction_date: r.date,
          type: r.type,
          account_id: r.accountId,
          amount: Number(r.amount.replace(/,/g, '')),
          description: r.description,
          vendor: r.vendor || null,
        })),
        inputMethod: 'pdf',
      });
      toast.success(`${count}건 등록 완료`);
      router.push('/transactions/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패');
    }
  }

  if (!isElectron) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 text-sm">
        PDF 업로드는 데스크탑 앱에서만 사용 가능합니다
      </div>
    );
  }

  if (stage === 'idle') {
    return (
      <button
        onClick={openPdf}
        className="w-full p-10 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-orange-400 hover:bg-orange-50 transition-colors group"
      >
        <FileText size={36} className="mx-auto mb-3 text-gray-400 group-hover:text-orange-500" />
        <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">
          PDF 파일 선택
        </p>
        <p className="text-xs text-gray-400 mt-1">거래명세서·영수증 PDF — AI가 내역을 추출합니다</p>
      </button>
    );
  }

  if (stage === 'processing') {
    return (
      <div className="py-16 text-center">
        <Loader2 size={36} className="mx-auto mb-4 text-orange-500 animate-spin" />
        <p className="text-sm text-gray-600 font-medium">PDF 분석 중...</p>
        <p className="text-xs text-gray-400 mt-1">{fileName}</p>
      </div>
    );
  }

  const selectedCount = rows.filter((r) => r.include && r.accountId).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{fileName}</p>
          <p className="text-xs text-gray-400">
            {rows.length}건 추출 / 계정 지정 {selectedCount}건
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setStage('idle'); setRows([]); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
          >
            다시 선택
          </button>
          <button
            onClick={handleSave}
            disabled={batchCreate.isPending || selectedCount === 0}
            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {batchCreate.isPending ? '등록 중...' : `${selectedCount}건 저장`}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`border rounded-xl p-4 transition-colors ${
              row.include ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={row.include}
                onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                className="mt-0.5 rounded"
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={14}
                    className={row.confidence >= 0.7 ? 'text-green-500' : 'text-yellow-500'}
                  />
                  <span className="text-xs text-gray-400">
                    신뢰도 {Math.round(row.confidence * 100)}%
                  </span>
                  {row.vendor && (
                    <span className="text-xs text-gray-500 font-medium">{row.vendor}</span>
                  )}
                  <button
                    onClick={() => updateRow(row.id, { include: false })}
                    className="ml-auto text-gray-300 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">날짜</label>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, { date: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">금액 (원)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, { amount: formatAmount(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">구분</label>
                    <div className="flex gap-2">
                      {(['expense', 'income'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateRow(row.id, { type: t, accountId: '' })}
                          className={`flex-1 py-1 rounded text-xs font-medium border transition-colors ${
                            row.type === t
                              ? t === 'income'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-red-500 text-white border-red-500'
                              : 'bg-white text-gray-500 border-gray-200'
                          }`}
                        >
                          {t === 'income' ? '수입' : '지출'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">계정과목 *</label>
                    <select
                      value={row.accountId}
                      onChange={(e) => updateRow(row.id, { accountId: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">선택</option>
                      {accounts
                        .filter((a: Account) => a.type === row.type)
                        .map((a: Account) => (
                          <option key={a.id} value={a.id}>
                            {a.code} {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">적요</label>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {row.amount && row.accountId && (
                  <p className="text-xs text-gray-400">
                    {row.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(row.amount.replace(/,/g, '')))}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
