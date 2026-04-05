import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc-handlers';
import { WindowManager } from './window-manager';

const isDev = process.env.NODE_ENV === 'development';

let windowManager: WindowManager;

void app.whenReady().then(async () => {
  // Security: Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.openai.com https://*.anthropic.com https://*.googleapis.com http://localhost:*"
      }
    });
  });

  windowManager = new WindowManager();
  const mainWindow = windowManager.createMainWindow();

  setupIpcHandlers(ipcMain);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    windowManager.createMainWindow();
  }
});
