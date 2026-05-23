'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { FileSpreadsheet, Loader2, Sparkles, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateTransactionsBatch } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/utils';
import type { Account } from '@/types';

interface CsvRow {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  accountId: string;
  include: boolean;
}

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

// ─── 은행 CSV 파서 ────────────────────────────────────────────

function parseAmount(raw: string): number {
  return Math.abs(parseInt(raw.replace(/[^0-9-]/g, ''), 10) || 0);
}

function normalizeDate(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return '';
}

function parseRows(headers: string[], data: Record<string, string>[]): CsvRow[] {
  // 유연한 컬럼 매핑
  const dateKey = headers.find((h) => /거래일(자|시)|날짜/.test(h));
  const descKey = headers.find((h) => /적요|거래내역|내용|메모/.test(h));
  const creditKey = headers.find((h) => /입금|맡기/.test(h));
  const debitKey = headers.find((h) => /출금|찾으/.test(h));
  const amountKey = !creditKey && !debitKey
    ? headers.find((h) => /거래금액|금액/.test(h) && !/잔/.test(h))
    : undefined;

  if (!dateKey) return [];

  const result: CsvRow[] = [];
  data.forEach((row, i) => {
    const rawDate = row[dateKey] ?? '';
    const date = normalizeDate(rawDate);
    if (!date) return;

    const description = descKey ? (row[descKey] ?? '').trim() : '';

    let amount = 0;
    let type: 'income' | 'expense' = 'expense';

    if (creditKey && debitKey) {
      const credit = parseAmount(row[creditKey] ?? '');
      const debit = parseAmount(row[debitKey] ?? '');
      if (credit > 0) { amount = credit; type = 'income'; }
      else if (debit > 0) { amount = debit; type = 'expense'; }
      else return;
    } else if (amountKey) {
      const raw = row[amountKey] ?? '';
      const signed = parseInt(raw.replace(/[^0-9-]/g, ''), 10);
      if (signed > 0) { amount = signed; type = 'income'; }
      else if (signed < 0) { amount = Math.abs(signed); type = 'expense'; }
      else return;
    } else {
      return;
    }

    if (amount === 0) return;
    result.push({ id: i, date, description, amount, type, accountId: '', include: true });
  });

  return result;
}

// ─── 컴포넌트 ─────────────────────────────────────────────────

export default function BankCSVUpload() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const batchCreate = useCreateTransactionsBatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [classifying, setClassifying] = useState(false);

  function updateRow(id: number, patch: Partial<CsvRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        const parsed = parseRows(headers, result.data);
        if (parsed.length === 0) {
          toast.error('인식된 거래 내역이 없습니다. 지원 형식: 국민·우리·신한은행 CSV (UTF-8)');
          return;
        }
        setRows(parsed);
        toast.success(`${parsed.length}건 로드됨`);
      },
      error: () => {
        toast.error('CSV 파싱 오류. UTF-8 인코딩으로 저장 후 다시 시도하세요');
      },
    });
    e.target.value = '';
  }

  async function autoClassify() {
    if (!isElectron) { toast.error('이 기능은 데스크탑 앱에서만 사용 가능합니다'); return; }
    setClassifying(true);
    try {
      const classifyRows = rows.map((r) => ({
        description: r.description,
        amount: r.amount,
        type: r.type,
      }));
      const accountList = accounts.map((a: Account) => ({
        code: a.code,
        name: a.name,
        type: a.type,
      }));
      const results = await window.electronAPI.classifyTransactions(classifyRows, accountList);
      setRows((prev) =>
        prev.map((r, i) => {
          const res = results[i];
          if (!res?.accountCode) return r;
          const matched = accounts.find((a: Account) => a.code === res.accountCode);
          return matched ? { ...r, accountId: matched.id } : r;
        })
      );
      toast.success('계정과목 자동 추천 완료');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '자동 추천 실패');
    } finally {
      setClassifying(false);
    }
  }

  async function handleImport() {
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
          amount: r.amount,
          description: r.description || '은행 이체',
        })),
        inputMethod: 'bank_csv',
      });
      toast.success(`${count}건 등록 완료`);
      router.push('/transactions/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '등록 실패');
    }
  }

  if (rows.length === 0) {
    return (
      <div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-10 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
        >
          <FileSpreadsheet size={36} className="mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
          <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
            은행 CSV 파일 선택
          </p>
          <p className="text-xs text-gray-400 mt-1">국민·우리·신한은행 내역 (UTF-8 저장)</p>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  const selectedCount = rows.filter((r) => r.include).length;
  const classifiedCount = rows.filter((r) => r.include && r.accountId).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{fileName}</p>
          <p className="text-xs text-gray-400">{rows.length}건 / 선택 {selectedCount}건 / 계정 지정 {classifiedCount}건</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setRows([]); setFileName(''); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
          >
            <Upload size={12} className="inline mr-1" />
            다시 선택
          </button>
          <button
            onClick={autoClassify}
            disabled={classifying || !isElectron}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-300 rounded-lg text-xs text-purple-700 hover:bg-purple-50 disabled:opacity-50"
          >
            {classifying ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI 자동 추천
          </button>
          <button
            onClick={handleImport}
            disabled={batchCreate.isPending || classifiedCount === 0}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {batchCreate.isPending ? '등록 중...' : `${classifiedCount}건 등록`}
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-gray-500 uppercase tracking-wide">
                <th className="w-8 px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={rows.every((r) => r.include)}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => ({ ...r, include: e.target.checked })))
                    }
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-2 text-left font-medium">날짜</th>
                <th className="px-3 py-2 text-left font-medium">내용</th>
                <th className="px-3 py-2 text-right font-medium">금액</th>
                <th className="px-3 py-2 text-left font-medium w-44">계정과목</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors ${row.include ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 opacity-50'}`}
                >
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.date}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-[180px] truncate">{row.description || '—'}</td>
                  <td
                    className={`px-3 py-2 text-right font-medium whitespace-nowrap ${
                      row.type === 'income' ? 'text-blue-700' : 'text-red-600'
                    }`}
                  >
                    {row.type === 'income' ? '+' : '-'}
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.accountId}
                      onChange={(e) => updateRow(row.id, { accountId: e.target.value })}
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
