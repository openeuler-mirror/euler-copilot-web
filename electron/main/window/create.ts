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
import { isLinux } from '../common/platform';

// 存储所有创建的窗口实例，用于全局访问
const windowInstances: Map<string, BrowserWindow> = new Map();

export function createWindow(
  options: Electron.BrowserWindowConstructorOptions,
  hash: string,
  id?: string,
): BrowserWindow {
  const win = new BrowserWindow({
    ...options,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  // 存储窗口实例以便全局访问
  if (id) {
    windowInstances.set(id, win);
  }

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, `../index.html`), { hash });
  } else {
    win.loadURL(`http://localhost:${process.env.PORT}/#${hash}`);
  }

  // 无论平台如何，都设置窗口控制事件处理
  // 这样确保即使在其他平台添加自定义标题栏也能工作
  setupWindowControls(win);

  return win;
}

/**
 * 为窗口设置控制事件（适用于所有平台）
 */
function setupWindowControls(win: BrowserWindow) {
  // 监听窗口最大化/还原事件
  win.on('maximize', () => {
    if (win.webContents) {
      win.webContents.send('window-maximized-change', true);
    }
  });

  win.on('unmaximize', () => {
    if (win.webContents) {
      win.webContents.send('window-maximized-change', false);
    }
  });

  // 添加关闭前确认
  win.on('close', (e) => {
    if (win === defaultWindow) {
      // 可以在这里添加关闭确认逻辑
    }
  });
}

let defaultWindow: BrowserWindow | null = null;

/**
 * 获取窗口标题栏的样式配置
 * @param theme 主题类型 'dark'|'light'
 * @returns Electron.TitleBarOverlay 配置
 */
function getDefaultTitleBarOverlay(
  theme: string = 'light',
): Electron.TitleBarOverlay {
  return {
    color: theme === 'dark' ? '#1f2329' : '#ffffff',
    symbolColor: theme === 'dark' ? 'white' : 'black',
    height: 48,
  };
}

export function createDefaultWindow(): BrowserWindow {
  if (defaultWindow) return defaultWindow;

  const hash = allWindow.mainWindow.hash;
  const defaultWindowOptions = allWindow.mainWindow.window;
  const theme = process.env.EULERCOPILOT_THEME || 'light';

  // 仅在非Linux平台设置titleBarOverlay
  if (!isLinux) {
    defaultWindowOptions.titleBarOverlay = getDefaultTitleBarOverlay(theme);
  }

  defaultWindow = createWindow(defaultWindowOptions, hash, 'mainWindow');

  return defaultWindow;
}

let chatWindow: BrowserWindow | null = null;
export function createChatWindow(): BrowserWindow {
  if (chatWindow) return chatWindow;
  const hash = allWindow.chatWindow.hash;
  const chatWindowOptions = allWindow.chatWindow.window;
  const theme = process.env.EULERCOPILOT_THEME || 'light';

  // 仅在非Linux平台设置titleBarOverlay
  if (!isLinux) {
    chatWindowOptions.titleBarOverlay = getDefaultTitleBarOverlay(theme);
  }

  chatWindow = createWindow(chatWindowOptions, hash, 'chatWindow');

  const shortcutKey =
    process.platform === 'darwin' ? 'Cmd+Option+O' : 'Ctrl+Alt+O';

  globalShortcut.register(shortcutKey, () => {
    chatWindow && chatWindow.show();
  });

  return chatWindow;
}

// 全局设置IPC事件处理
ipcMain.on('window-control', (e, command) => {
  console.log('Received window control command:', command);

  // 确保命令来自正确的窗口
  const webContents = e.sender;
  const win = BrowserWindow.fromWebContents(webContents);

  if (!win) {
    console.error('Cannot find window for the command');
    return;
  }

  switch (command) {
    case 'minimize':
      console.log('Minimizing window');
      win.minimize();
      break;
    case 'maximize':
      if (win.isMaximized()) {
        console.log('Unmaximizing window');
        win.unmaximize();
      } else {
        console.log('Maximizing window');
        win.maximize();
      }
      break;
    case 'close':
      console.log('Closing window');
      win.close();
      break;
    default:
      console.error('Unknown window command:', command);
  }
});

// 添加查询窗口最大化状态的处理程序
ipcMain.handle('window-is-maximized', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) {
    return win.isMaximized();
  }
  return false;
});

ipcMain.handle('copilot:theme', (e, args) => {
  electron.nativeTheme.themeSource = args.theme;

  // 仅在非Linux平台上更新titleBarOverlay
  if (!isLinux) {
    if (chatWindow) {
      chatWindow.setTitleBarOverlay({
        color: args.backgroundColor,
        symbolColor: args.theme === 'dark' ? 'white' : 'black',
      });
    }

    if (defaultWindow) {
      defaultWindow.setTitleBarOverlay({
        color: args.backgroundColor,
        symbolColor: args.theme === 'dark' ? 'white' : 'black',
      });
    }
  }

  // 通知渲染进程主题已更改，以更新Linux自定义标题栏
  if (isLinux) {
    if (chatWindow && chatWindow.webContents) {
      chatWindow.webContents.send('theme-updated', args);
    }
    if (defaultWindow && defaultWindow.webContents) {
      defaultWindow.webContents.send('theme-updated', args);
    }
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
