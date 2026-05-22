import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ClassifyResult {
  accountCode: string;
  accountName: string;
  confidence: number;
  reason: string;
}

// 은행 CSV 거래 → 계정과목 자동 추천
export async function classifyTransaction(
  description: string,
  vendor: string | null,
  amount: number,
  accounts: { code: string; name: string }[]
): Promise<ClassifyResult> {
  const accountList = accounts.map((a) => `${a.code}: ${a.name}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `다음 거래의 계정과목을 추천해주세요.

거래 내용: ${description}
거래처: ${vendor ?? '미상'}
금액: ${amount.toLocaleString()}원

사용 가능한 계정과목:
${accountList}

JSON으로 답하세요: { accountCode, accountName, confidence (0~1), reason }`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

  return {
    accountCode: parsed.accountCode ?? '',
    accountName: parsed.accountName ?? '',
    confidence: parsed.confidence ?? 0,
    reason: parsed.reason ?? '',
  };
}
