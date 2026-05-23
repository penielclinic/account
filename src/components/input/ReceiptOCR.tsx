'use client';

import { useState } from 'react';
import { Upload, Camera, Loader2, CheckCircle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/utils';

type Stage = 'idle' | 'preview' | 'processing' | 'review';

interface OcrResult {
  date: string | null;
  amount: number | null;
  vendor: string | null;
  vendorRegNumber: string | null;
  items: string[];
  confidence: number;
}

interface ReviewState {
  date: string;
  time: string;
  amount: string;
  vendor: string;
  vendorRegNumber: string;
  vendorPhone: string;
  cardCompany: string;
  cardLast4: string;
  description: string;
  type: 'income' | 'expense';
  accountId: string;
}

interface FileData {
  data: string;
  ext: string;
  name: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

const EXT_MIME: Record<string, 'image/jpeg' | 'image/png' | 'image/webp'> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function formatAmount(raw: string): string {
  const n = raw.replace(/\D/g, '');
  return n ? Number(n).toLocaleString('ko-KR') : '';
}

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

export default function ReceiptOCR() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const create = useCreateTransaction();

  const [stage, setStage] = useState<Stage>('idle');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [review, setReview] = useState<ReviewState>({
    date: new Date().toISOString().slice(0, 10),
    time: '',
    amount: '',
    vendor: '',
    vendorRegNumber: '',
    vendorPhone: '',
    cardCompany: '',
    cardLast4: '',
    description: '',
    type: 'expense',
    accountId: '',
  });

  const filteredAccounts = accounts.filter((a) => a.type === review.type);

  function setReviewField(key: keyof ReviewState, value: string) {
    setReview((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'type') next.accountId = '';
      return next;
    });
  }

  async function openFile() {
    if (!isElectron) {
      toast.error('이 기능은 데스크탑 앱에서만 사용 가능합니다');
      return;
    }
    const result = await window.electronAPI.openReceipt();
    if (!result) return;

    const mime = EXT_MIME[result.ext];
    if (!mime) {
      toast.error('이미지 파일(JPG, PNG, WEBP)을 선택하세요');
      return;
    }
    setFileData({ data: result.data, ext: result.ext, name: result.path.split(/[\\/]/).pop() ?? '', mimeType: mime });
    setStage('preview');
  }

  async function runOcr() {
    if (!fileData || !isElectron) return;
    setStage('processing');
    try {
      const result = await window.electronAPI.ocrImage(fileData.data, fileData.mimeType);
      setOcrResult(result);
      setReview({
        date: result.date ?? new Date().toISOString().slice(0, 10),
        time: result.time ?? '',
        amount: result.amount ? result.amount.toLocaleString('ko-KR') : '',
        vendor: result.vendor ?? '',
        vendorRegNumber: result.vendorRegNumber ?? '',
        vendorPhone: result.vendorPhone ?? '',
        cardCompany: result.cardCompany ?? '',
        cardLast4: result.cardLast4 ?? '',
        description: result.vendor ? `${result.vendor} 구매` : '',
        type: 'expense',
        accountId: '',
      });
      setStage('review');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'OCR 분석에 실패했습니다');
      setStage('preview');
    }
  }

  async function handleSave() {
    const amount = Number(review.amount.replace(/,/g, ''));
    if (!review.date) { toast.error('날짜를 입력하세요'); return; }
    if (!amount || amount <= 0) { toast.error('금액을 입력하세요'); return; }
    if (!review.accountId) { toast.error('계정과목을 선택하세요'); return; }
    if (!review.description.trim()) { toast.error('적요를 입력하세요'); return; }

    try {
      await create.mutateAsync({
        input: {
          transaction_date: review.date,
          transaction_time: review.time || null,
          type: review.type,
          account_id: review.accountId,
          amount,
          description: review.description,
          vendor: review.vendor || null,
          vendor_reg_number: review.vendorRegNumber || null,
          vendor_phone: review.vendorPhone || null,
          card_company: review.cardCompany || null,
          card_last4: review.cardLast4 || null,
        },
        inputMethod: 'receipt_ocr',
      });
      toast.success('영수증 거래가 저장되었습니다');
      router.push('/transactions/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했습니다');
    }
  }

  function reset() {
    setStage('idle');
    setFileData(null);
    setOcrResult(null);
  }

  if (!isElectron) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 text-sm">
        영수증 OCR은 데스크탑 앱에서만 사용 가능합니다
      </div>
    );
  }

  if (stage === 'idle') {
    return (
      <button
        onClick={openFile}
        className="w-full p-10 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
      >
        <Camera size={36} className="mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
        <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
          영수증 사진 선택
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP 지원</p>
      </button>
    );
  }

  if (stage === 'preview') {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
          {fileData && (
            <img
              src={`data:${fileData.mimeType};base64,${fileData.data}`}
              alt="영수증 미리보기"
              className="w-full max-h-80 object-contain"
            />
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{fileData?.name}</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw size={14} />
            다시 선택
          </button>
          <button
            onClick={runOcr}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            AI 분석 →
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'processing') {
    return (
      <div className="py-16 text-center">
        <Loader2 size={36} className="mx-auto mb-4 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-600 font-medium">AI가 영수증을 분석 중...</p>
        <p className="text-xs text-gray-400 mt-1">잠시만 기다려주세요</p>
      </div>
    );
  }

  // stage === 'review'
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
        <CheckCircle size={16} />
        <span>
          분석 완료 — 신뢰도 {Math.round((ocrResult?.confidence ?? 0) * 100)}%
        </span>
        <button onClick={reset} className="ml-auto text-xs text-gray-400 hover:text-gray-600">
          다시 선택
        </button>
      </div>

      {ocrResult?.items && ocrResult.items.length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          품목: {ocrResult.items.join(', ')}
        </div>
      )}

      {/* 구분 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">구분 *</label>
        <div className="flex gap-3">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setReviewField('type', t)}
              className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                review.type === t
                  ? t === 'income'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {t === 'income' ? '수입' : '지출'}
            </button>
          ))}
        </div>
      </div>

      {/* 날짜 + 시간 + 금액 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
          <input
            type="date"
            value={review.date}
            onChange={(e) => setReviewField('date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
          <input
            type="time"
            value={review.time}
            onChange={(e) => setReviewField('time', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">금액 *</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={review.amount}
              onChange={(e) => setReviewField('amount', formatAmount(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-7"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">원</span>
          </div>
        </div>
      </div>

      {/* 거래처 정보 */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">거래처 정보</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">거래처명</label>
            <input
              type="text"
              value={review.vendor}
              onChange={(e) => setReviewField('vendor', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">전화번호</label>
            <input
              type="tel"
              value={review.vendorPhone}
              onChange={(e) => setReviewField('vendorPhone', e.target.value)}
              placeholder="02-0000-0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">사업자등록번호</label>
          <input
            type="text"
            value={review.vendorRegNumber}
            onChange={(e) => setReviewField('vendorRegNumber', e.target.value)}
            placeholder="000-00-00000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        {(review.cardCompany || review.cardLast4) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">카드사</label>
              <input
                type="text"
                value={review.cardCompany}
                onChange={(e) => setReviewField('cardCompany', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">카드번호 끝 4자리</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={review.cardLast4}
                onChange={(e) => setReviewField('cardLast4', e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white tracking-widest"
              />
            </div>
          </div>
        )}
      </div>

      {/* 계정과목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">계정과목 *</label>
        <select
          value={review.accountId}
          onChange={(e) => setReviewField('accountId', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          {filteredAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* 적요 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">적요 *</label>
        <input
          type="text"
          value={review.description}
          onChange={(e) => setReviewField('description', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={reset}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={create.isPending}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {create.isPending ? '저장 중...' : `저장 ${review.amount ? `(${formatCurrency(Number(review.amount.replace(/,/g, '')))})` : ''}`}
        </button>
      </div>
    </div>
  );
}
