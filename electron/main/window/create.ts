import path from 'node:path';
import * as electron from 'electron';
import { BrowserWindow, app, globalShortcut } from 'electron';
import { options as allWindow } from './options';

class BaseWindow {
  constructor() {}
}

export function createWindow(
  options: Electron.BrowserWindowConstructorOptions,
  hash: string,
): BrowserWindow {
  const win = new BrowserWindow({
    ...options,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, `../index.html`), { hash });
  } else {
    // win.webContents.openDevTools();
    win.loadURL(`http://localhost:${process.env.PORT}/#${hash}`);
  }

  return win;
}

let defaultWindow: BrowserWindow | null = null;
const theme = process.env.EULERCOPILOT_THEME || 'light';

export function createDefaultWindow(): BrowserWindow {
  if (defaultWindow) return defaultWindow;

  const hash = allWindow.mainWindow.hash;
  const defaultWindowOptions = allWindow.mainWindow.window;

  defaultWindowOptions.titleBarOverlay = {
    color: theme === 'dark' ? '#1f2329' : '#ffffff',
    height: 48,
    symbolColor: theme === 'dark' ? 'white' : 'black',
  };

  defaultWindow = createWindow(defaultWindowOptions, hash);

  return defaultWindow;
}

export function createChatWindow(): BrowserWindow {
  const hash = allWindow.chatWindow.hash;
  const chatWindowOptions = allWindow.chatWindow.window;
  chatWindowOptions.titleBarOverlay = {
    color: theme === 'dark' ? '#1f2329' : '#ffffff',
    height: 40,
    symbolColor: theme === 'dark' ? 'white' : 'black',
  };
  const chatWindow = createWindow(chatWindowOptions, hash);

  const shortcutKey =
    process.platform === 'darwin' ? 'Cmd+Option+O' : 'Ctrl+Alt+O';

  globalShortcut.register(shortcutKey, () => {
    chatWindow.show();
  });

  return chatWindow;
}
