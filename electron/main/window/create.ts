// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import path from 'node:path';
import * as electron from 'electron';
import { BrowserWindow, app, globalShortcut, ipcMain } from 'electron';
import { options as allWindow } from './options';
import { updateConf } from '../common/conf';

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
    win.loadURL(`http://localhost:${process.env.PORT}/#${hash}`);
  }

  return win;
}

let defaultWindow: BrowserWindow | null = null;

export function createDefaultWindow(): BrowserWindow {
  if (defaultWindow) return defaultWindow;

  const hash = allWindow.mainWindow.hash;
  const defaultWindowOptions = allWindow.mainWindow.window;
  const theme = process.env.EULERCOPILOT_THEME || 'light';

  defaultWindowOptions.titleBarOverlay = {
    color: theme === 'dark' ? '#1f2329' : '#ffffff',
    height: 48,
    symbolColor: theme === 'dark' ? 'white' : 'black',
  };

  defaultWindow = createWindow(defaultWindowOptions, hash);

  return defaultWindow;
}

let chatWindow: BrowserWindow | null = null;
export function createChatWindow(): BrowserWindow {
  if (chatWindow) return chatWindow;
  const hash = allWindow.chatWindow.hash;
  const chatWindowOptions = allWindow.chatWindow.window;
  const theme = process.env.EULERCOPILOT_THEME || 'light';

  chatWindowOptions.titleBarOverlay = {
    color: theme === 'dark' ? '#1f2329' : '#ffffff',
    height: 40,
    symbolColor: theme === 'dark' ? 'white' : 'black',
  };
  chatWindow = createWindow(chatWindowOptions, hash);

  const shortcutKey =
    process.platform === 'darwin' ? 'Cmd+Option+O' : 'Ctrl+Alt+O';

  globalShortcut.register(shortcutKey, () => {
    chatWindow && chatWindow.show();
  });

  return chatWindow;
}

ipcMain.handle('copilot:theme', (e, args) => {
  electron.nativeTheme.themeSource = args.theme;
  if (chatWindow) {
    chatWindow.setTitleBarOverlay({
      color: args.backgroundColor,
      height: 40,
      symbolColor: args.theme === 'dark' ? 'white' : 'black',
    });
  }

  if (defaultWindow) {
    defaultWindow.setTitleBarOverlay({
      color: args.backgroundColor,
      height: 48,
      symbolColor: args.theme === 'dark' ? 'white' : 'black',
    });
  }

  updateConf({
    theme: args.theme,
  });
});

ipcMain.handle('copilot:lang', (e, args) => {
  updateConf({
    userLocale: args.lang,
  });
});
