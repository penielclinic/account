export {};

declare global {
  interface Window {
    electronAPI: {
      openReceipt: () => Promise<{ path: string; data: string; ext: string } | null>;
      saveReport: (data: Buffer, filename: string) => Promise<boolean>;
      backupDatabase: () => Promise<boolean>;
      checkUpdate: () => Promise<null>;
      quit: () => void;
    };
  }
}
