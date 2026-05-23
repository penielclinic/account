export {};

interface OcrResult {
  date: string | null;
  amount: number | null;
  vendor: string | null;
  items: string[];
  rawText: string;
  confidence: number;
}

declare global {
  interface Window {
    electronAPI: {
      openReceipt: () => Promise<{ path: string; data: string; ext: string } | null>;
      ocrImage: (
        base64: string,
        mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
      ) => Promise<OcrResult>;
      ocrPdf: (base64: string) => Promise<OcrResult[]>;
      classifyTransactions: (
        rows: Array<{ description: string; amount: number; type: 'income' | 'expense' }>,
        accounts: Array<{ code: string; name: string; type: 'income' | 'expense' }>
      ) => Promise<Array<{ accountCode: string; confidence: number }>>;
      saveReport: (data: Buffer, filename: string) => Promise<boolean>;
      backupDatabase: () => Promise<boolean>;
      checkUpdate: () => Promise<null>;
      quit: () => void;
    };
  }
}
