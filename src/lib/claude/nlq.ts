import Anthropic from '@anthropic-ai/sdk';
import { validateSql } from './sql-validator';
import type { NlqResult } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 해운대순복음교회 회계 시스템의 SQL 생성 어시스턴트입니다.

규칙:
1. SELECT 쿼리만 생성하세요. INSERT/UPDATE/DELETE/DROP/ALTER는 절대 생성하지 마세요.
2. 스키마는 반드시 accounting. 접두사를 사용하세요.
3. public.members, public.cells, public.missions는 읽기 전용으로 JOIN 가능합니다.
4. 결과를 JSON으로 반환하세요: { sql, chartType, explanation }
5. chartType은 "bar" | "line" | "pie" | "table" | null 중 하나입니다.`;

export async function runNlq(question: string, schemaContext: string): Promise<NlqResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `스키마 정보:\n${schemaContext}\n\n질문: ${question}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

  const sql: string = parsed.sql ?? '';
  validateSql(sql); // SELECT-only 검증 (throws on violation)

  return {
    sql,
    chartType: parsed.chartType ?? null,
    explanation: parsed.explanation ?? '',
  };
}
