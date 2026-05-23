import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

interface OcrResult {
  date: string | null;
  time: string | null;
  amount: number | null;
  vendor: string | null;
  vendorRegNumber: string | null;
  vendorPhone: string | null;
  cardCompany: string | null;
  cardLast4: string | null;
  items: string[];
  rawText: string;
  confidence: number;
}

interface ClassifyRow {
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

interface AccountInfo {
  code: string;
  name: string;
  type: 'income' | 'expense';
}

interface ClassifyResult {
  accountCode: string;
  confidence: number;
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Anthropic API 키가 설정되지 않았습니다.\n.env.local 파일에 ANTHROPIC_API_KEY를 추가하세요.'
    );
  }
  return new Anthropic({ apiKey });
}

function parseOcrJson(text: string): OcrResult {
  const json = text.replace(/```json\n?|\n?```/g, '').trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  return {
    date: typeof parsed.date === 'string' ? parsed.date : null,
    time: typeof parsed.time === 'string' ? parsed.time : null,
    amount: typeof parsed.amount === 'number' ? parsed.amount : null,
    vendor: typeof parsed.vendor === 'string' ? parsed.vendor : null,
    vendorRegNumber: typeof parsed.vendorRegNumber === 'string' ? parsed.vendorRegNumber : null,
    vendorPhone: typeof parsed.vendorPhone === 'string' ? parsed.vendorPhone : null,
    cardCompany: typeof parsed.cardCompany === 'string' ? parsed.cardCompany : null,
    cardLast4: typeof parsed.cardLast4 === 'string' ? parsed.cardLast4 : null,
    items: Array.isArray(parsed.items) ? (parsed.items as string[]) : [],
    rawText: typeof parsed.rawText === 'string' ? parsed.rawText : '',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
  };
}

export function setupIpcHandlers(): void {
  ipcMain.handle('file:open-receipt', async () => {
    const result = await dialog.showOpenDialog({
      title: '영수증 / 증빙 파일 선택',
      properties: ['openFile'],
      filters: [
        { name: '이미지 및 PDF', extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();

    return { path: filePath, data: buffer.toString('base64'), ext };
  });

  ipcMain.handle(
    'claude:ocr-image',
    async (
      _event,
      base64Data: string,
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
    ): Promise<OcrResult> => {
      const client = getAnthropicClient();
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
                text: `이 영수증에서 다음 정보를 JSON으로 추출하세요.
- date: 거래 날짜 (YYYY-MM-DD, 2자리 연도면 20xx 변환, 없으면 null)
- time: 거래 시각 (HH:MM 24시간 형식, 없으면 null)
- amount: 최종 결제 금액 (숫자, 원 단위, 없으면 null)
- vendor: 상호명 또는 거래처명 (없으면 null)
- vendorRegNumber: 사업자등록번호 (xxx-xx-xxxxx 형식, 없으면 null)
- vendorPhone: 거래처 전화번호 (없으면 null)
- cardCompany: 카드사명 (국민/신한/현대/삼성/롯데/하나/우리/BC 등, 없으면 null)
- cardLast4: 카드번호 끝 4자리 (숫자 4자리 문자열, 없으면 null)
- items: 품목 목록 (문자열 배열)
- rawText: 영수증 전체 텍스트
- confidence: 추출 신뢰도 (0.0~1.0)

코드 블록 없이 순수 JSON만 반환하세요.`,
              },
            ],
          },
        ],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '{}';
      return parseOcrJson(text);
    }
  );

  ipcMain.handle(
    'claude:ocr-pdf',
    async (_event, base64Data: string): Promise<OcrResult[]> => {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Data,
                },
              } as unknown as Anthropic.TextBlockParam,
              {
                type: 'text',
                text: `이 PDF에서 거래 내역을 모두 추출해 JSON 배열로 반환하세요.
각 거래마다:
- date: YYYY-MM-DD
- amount: 금액 (숫자, 원 단위)
- vendor: 상호명 (없으면 null)
- items: 품목 (문자열 배열)
- rawText: 해당 거래 원문
- confidence: 신뢰도 (0~1)

코드 블록 없이 순수 JSON 배열만 반환하세요.`,
              },
            ],
          },
        ],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '[]';
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      try {
        const arr = JSON.parse(cleaned) as unknown[];
        return arr.map((item) => {
          const r = item as Record<string, unknown>;
          return {
            date: typeof r.date === 'string' ? r.date : null,
            time: typeof r.time === 'string' ? r.time : null,
            amount: typeof r.amount === 'number' ? r.amount : null,
            vendor: typeof r.vendor === 'string' ? r.vendor : null,
            vendorRegNumber: typeof r.vendorRegNumber === 'string' ? r.vendorRegNumber : null,
            vendorPhone: typeof r.vendorPhone === 'string' ? r.vendorPhone : null,
            cardCompany: typeof r.cardCompany === 'string' ? r.cardCompany : null,
            cardLast4: typeof r.cardLast4 === 'string' ? r.cardLast4 : null,
            items: Array.isArray(r.items) ? (r.items as string[]) : [],
            rawText: typeof r.rawText === 'string' ? r.rawText : '',
            confidence: typeof r.confidence === 'number' ? r.confidence : 0,
          };
        });
      } catch {
        return [];
      }
    }
  );

  ipcMain.handle(
    'claude:classify-transactions',
    async (
      _event,
      rows: ClassifyRow[],
      accounts: AccountInfo[]
    ): Promise<ClassifyResult[]> => {
      const client = getAnthropicClient();

      const incomeList = accounts
        .filter((a) => a.type === 'income')
        .map((a) => `  ${a.code}: ${a.name}`)
        .join('\n');
      const expenseList = accounts
        .filter((a) => a.type === 'expense')
        .map((a) => `  ${a.code}: ${a.name}`)
        .join('\n');

      const rowsText = rows
        .map(
          (r, i) =>
            `${i}: ${r.type === 'income' ? '수입' : '지출'} ${r.amount.toLocaleString()}원 "${r.description}"`
        )
        .join('\n');

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `교회 회계 시스템에서 은행 거래의 계정과목을 분류하세요.

[수입 계정과목]
${incomeList}

[지출 계정과목]
${expenseList}

[분류할 거래 (번호: 구분 금액 "내용")]
${rowsText}

각 번호에 맞는 계정과목 코드와 신뢰도를 JSON 배열로 반환하세요.
형식: [{"accountCode":"4100","confidence":0.9}, ...]
번호 순서를 유지하고, 코드 블록 없이 순수 JSON만 반환하세요.`,
          },
        ],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '[]';
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      try {
        const arr = JSON.parse(cleaned) as unknown[];
        return arr.map((item) => {
          const r = item as Record<string, unknown>;
          return {
            accountCode: typeof r.accountCode === 'string' ? r.accountCode : '',
            confidence: typeof r.confidence === 'number' ? r.confidence : 0,
          };
        });
      } catch {
        return rows.map(() => ({ accountCode: '', confidence: 0 }));
      }
    }
  );

  ipcMain.handle('file:save-report', async (_event, data: Buffer, filename: string) => {
    const ext = path.extname(filename).slice(1).toLowerCase();
    const filters: Electron.FileFilter[] = [];

    if (ext === 'pdf') filters.push({ name: 'PDF', extensions: ['pdf'] });
    else if (ext === 'docx') filters.push({ name: 'Word', extensions: ['docx'] });
    else if (ext === 'xlsx') filters.push({ name: 'Excel', extensions: ['xlsx'] });
    else filters.push({ name: '모든 파일', extensions: ['*'] });

    const result = await dialog.showSaveDialog({
      title: '보고서 저장',
      defaultPath: filename,
      filters,
    });

    if (result.canceled || !result.filePath) return false;
    fs.writeFileSync(result.filePath, data);
    return true;
  });

  ipcMain.handle('db:backup', async () => false);
  ipcMain.handle('app:check-update', async () => null);
  ipcMain.handle('app:quit', () => { app.quit(); });
}
