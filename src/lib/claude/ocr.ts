import Anthropic from '@anthropic-ai/sdk';
import type { OcrResult } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 영수증 이미지 OCR — claude-sonnet-4-6 사용 (CLAUDE.md §6 참조)
export async function extractReceiptData(
  base64Data: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<OcrResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64Data },
          },
          {
            type: 'text',
            text: `이 영수증에서 다음 정보를 JSON으로 추출하세요:
- date: 날짜 (YYYY-MM-DD, 없으면 null)
- amount: 최종 결제 금액 (숫자, 없으면 null)
- vendor: 상호명 (없으면 null)
- items: 품목 목록 (문자열 배열)
- rawText: 영수증 전체 텍스트
- confidence: 추출 신뢰도 (0.0~1.0)

JSON만 반환하세요.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

  return {
    date: parsed.date ?? null,
    amount: parsed.amount ?? null,
    vendor: parsed.vendor ?? null,
    items: parsed.items ?? [],
    rawText: parsed.rawText ?? '',
    confidence: parsed.confidence ?? 0,
  };
}

// PDF 영수증 추출 — document content type
export async function extractPdfData(base64Data: string): Promise<OcrResult[]> {
  // TODO: Phase 2 구현 — 여러 거래가 있는 경우 배열 반환
  throw new Error('PDF 추출은 Phase 2에서 구현됩니다.');
}
