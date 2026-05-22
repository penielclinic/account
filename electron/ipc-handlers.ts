import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

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

  // Phase 5 구현 예정
  ipcMain.handle('db:backup', async () => false);

  // Phase 5 구현 예정
  ipcMain.handle('app:check-update', async () => null);

  ipcMain.handle('app:quit', () => {
    app.quit();
  });
}
