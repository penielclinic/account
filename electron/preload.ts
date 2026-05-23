import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openReceipt: (): Promise<{ path: string; data: string; ext: string } | null> =>
    ipcRenderer.invoke('file:open-receipt'),

  ocrImage: (
    base64: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  ): Promise<{
    date: string | null;
    amount: number | null;
    vendor: string | null;
    items: string[];
    rawText: string;
    confidence: number;
  }> => ipcRenderer.invoke('claude:ocr-image', base64, mimeType),

  ocrPdf: (base64: string): Promise<
    Array<{
      date: string | null;
      amount: number | null;
      vendor: string | null;
      items: string[];
      rawText: string;
      confidence: number;
    }>
  > => ipcRenderer.invoke('claude:ocr-pdf', base64),

  classifyTransactions: (
    rows: Array<{ description: string; amount: number; type: 'income' | 'expense' }>,
    accounts: Array<{ code: string; name: string; type: 'income' | 'expense' }>
  ): Promise<Array<{ accountCode: string; confidence: number }>> =>
    ipcRenderer.invoke('claude:classify-transactions', rows, accounts),

  saveReport: (data: Buffer, filename: string): Promise<boolean> =>
    ipcRenderer.invoke('file:save-report', data, filename),

  backupDatabase: (): Promise<boolean> =>
    ipcRenderer.invoke('db:backup'),

  checkUpdate: (): Promise<null> =>
    ipcRenderer.invoke('app:check-update'),

  quit: (): void => {
    ipcRenderer.invoke('app:quit');
  },
});
