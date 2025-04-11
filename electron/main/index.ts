// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import fs from 'node:fs';
import {
  app,
  ipcMain,
  globalShortcut,
  nativeTheme,
  BrowserWindow,
} from 'electron';
import { createDefaultWindow, createTray, createChatWindow } from './window';
import type { INLSConfiguration } from './common/nls';
import { cachePath, commonCacheConfPath, updateConf } from './common/conf';

interface ICacheConf {
  userLocale: string;
  theme: 'system' | 'light' | 'dark';
}

const commonCacheConf: Partial<ICacheConf> = {};

const osLocale = processZhLocale(
  (app.getPreferredSystemLanguages()?.[0] ?? 'en').toLowerCase(),
);

// 添加表示应用是否正在退出的标志位
let isQuitting = false;

app.once('ready', () => {
  onReady();
});

// 处理应用退出前的事件，设置退出标志
app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  ipcMain.removeAllListeners();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在macOS上，当应用图标被点击时重置退出标志
app.on('activate', () => {
  isQuitting = false;
});

async function onReady() {
  try {
    await mkdirpIgnoreError(cachePath);
    await getUserDefinedConf(commonCacheConfPath);
    const [nlsConfig, themeConfig] = await Promise.all([
      resolveNlsConfiguration(),
      resolveThemeConfiguration(),
    ]);

    nativeTheme.themeSource = themeConfig.theme || 'light';
    process.env['EULERCOPILOT_THEME'] = themeConfig.theme || 'light';
    process.env['EULERCOPILOT_NLS_CONFIG'] = JSON.stringify(nlsConfig);
    process.env['EULERCOPILOT_CACHE_PATH'] = cachePath || '';

    await startup();
  } catch (error) {}
}

async function startup() {
  registerIpcListener();

  const tray = createTray();

  let win: BrowserWindow;
  let chatWindow: BrowserWindow;

  win = createDefaultWindow();
  chatWindow = createChatWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      win = createDefaultWindow();
      chatWindow = createChatWindow();
    }
  });

  tray.on('click', () => {
    win.show();
  });
  win.on('close', (event) => {
    // 如果应用正在退出（例如通过Cmd+Q触发），则允许窗口正常关闭
    if (isQuitting) {
      return;
    }
    // 否则阻止关闭，只是隐藏窗口
    event.preventDefault();
    win.hide();
  });

  chatWindow.on('close', (event) => {
    // 如果应用正在退出（例如通过Cmd+Q触发），则允许窗口正常关闭
    if (isQuitting) {
      return;
    }
    // 否则阻止关闭，只是隐藏窗口
    event.preventDefault();
    chatWindow.hide();
  });
}

function registerIpcListener() {
  ipcMain.handle('copilot:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = 'light';
    } else {
      nativeTheme.themeSource = 'dark';
    }
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.handle('copilot:system', () => {
    nativeTheme.themeSource = 'system';
  });

  // 添加窗口控制命令处理程序
  ipcMain.handle('copilot:window-control', (event, command) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    switch (command) {
      case 'minimize':
        win.minimize();
        break;
      case 'maximize':
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
        break;
      case 'close':
        win.close();
        break;
    }
  });

  // 添加获取窗口最大化状态的处理程序
  ipcMain.handle('copilot:window-is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      return win.isMaximized();
    }
    return false;
  });
}

function getUserDefinedConf(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.writeFileSync(dir, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dir, 'utf-8'));
  } catch (error) {
    // Ignore error
    return {};
  }
}

function processZhLocale(appLocale: string): string {
  if (appLocale.startsWith('zh')) {
    const region = appLocale.split('-')[1];

    // On Windows and macOS, Chinese languages returned by
    // app.getPreferredSystemLanguages() start with zh-hans
    // for Simplified Chinese or zh-hant for Traditional Chinese,
    // so we can easily determine whether to use Simplified or Traditional.
    // However, on Linux, Chinese languages returned by that same API
    // are of the form zh-XY, where XY is a country code.
    // For China (CN), Singapore (SG), and Malaysia (MY)
    // country codes, assume they use Simplified Chinese.
    // For other cases, assume they use Traditional.
    if (['hans', 'cn', 'sg', 'my'].includes(region)) {
      return 'zh_cn';
    }

    return 'zh_tw';
  }

  return appLocale;
}

async function resolveThemeConfiguration(): Promise<any> {
  if (commonCacheConf.theme) {
    return {
      theme: commonCacheConf.theme,
    };
  }
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  updateConf({ theme: isDarkMode ? 'dark' : 'light' });
  return {
    theme: isDarkMode ? 'dark' : 'light',
  };
}

/**
 * 国际化支持
 * @returns
 */
async function resolveNlsConfiguration(): Promise<INLSConfiguration> {
  if (commonCacheConf.userLocale) {
    return {
      userLocale: commonCacheConf.userLocale,
      osLocale,
      resolvedLanguage: commonCacheConf.userLocale,
    };
  }

  let userLocale = app.getLocale();

  if (!userLocale) {
    updateConf({ userLocale: 'en' });
    return {
      userLocale: 'en',
      osLocale,
      resolvedLanguage: 'en',
    };
  }

  userLocale = processZhLocale(userLocale.toLowerCase());
  updateConf({ userLocale: 'en' });
  return {
    userLocale,
    osLocale,
    resolvedLanguage: osLocale,
  };
}

async function mkdirpIgnoreError(
  dir: string | undefined,
): Promise<string | undefined> {
  if (typeof dir === 'string') {
    try {
      if (fs.existsSync(dir)) {
        return dir;
      }
      await fs.promises.mkdir(dir, { recursive: true });

      return dir;
    } catch (error) {
      // ignore
    }
  }

  return undefined;
}
