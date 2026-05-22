import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openReceipt: (): Promise<{ path: string; data: string; ext: string } | null> =>
    ipcRenderer.invoke('file:open-receipt'),

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
