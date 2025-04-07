import path from 'node:path';
import fs from 'node:fs';
import {
  app,
  ipcMain,
  globalShortcut,
  nativeTheme,
  BrowserWindow,
} from 'electron';
import { createDefaultWindow, createTray, createChatWindow } from './window';
import { getUserDataPath } from './node/userDataPath';
import type { INLSConfiguration } from './common/nls';
import { productObj } from './common/product';

interface ICacheConf {
  userLocale: string;
  theme: 'system' | 'light' | 'dark';
}

const userDataPath = getUserDataPath(productObj.name);
const cachePath = getCachePath();

const commonCacheConf: Partial<ICacheConf> = getUserDefinedConf(userDataPath);

const osLocale = processZhLocale(
  (app.getPreferredSystemLanguages()?.[0] ?? 'en').toLowerCase(),
);

app.once('ready', () => {
  onReady();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  ipcMain.removeAllListeners();
});

async function onReady() {
  try {
    const [, nlsConfig] = await Promise.all([
      mkdirpIgnoreError(cachePath),
      resolveNlsConfiguration(),
    ]);

    nativeTheme.themeSource = commonCacheConf.theme || 'light';
    process.env['EULERCOPILOT_THEME'] = commonCacheConf.theme || 'light';
    process.env['EULERCOPILOT_NLS_CONFIG'] = JSON.stringify(nlsConfig);
    process.env['EULERCOPILOT_CACHE_PATH'] = cachePath || '';

    startup();
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

  ipcMain.handle('copilot:theme', (e, args) => {
    chatWindow.setTitleBarOverlay({
      color: args.backgroundColor,
      height: 40,
      symbolColor: args.theme === 'dark' ? 'white' : 'black',
    });

    win.setTitleBarOverlay({
      color: args.backgroundColor,
      height: 48,
      symbolColor: args.theme === 'dark' ? 'white' : 'black',
    });
  });

  tray.on('click', () => {
    win.show();
  });
  win.on('close', (event) => {
    event.preventDefault();
    win.hide();
  });

  chatWindow.on('close', (event) => {
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
}

function getUserDefinedConf(dir: string) {
  try {
    return fs.readFileSync(
      path.join(dir, 'eulercopilot-common-storage.json'),
      'utf-8',
    );
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
      return 'zh-cn';
    }

    return 'zh-tw';
  }

  return appLocale;
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
    return {
      userLocale: 'en',
      osLocale,
      resolvedLanguage: 'en',
    };
  }

  userLocale = processZhLocale(userLocale.toLowerCase());

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
      await fs.promises.mkdir(dir, { recursive: true });

      return dir;
    } catch (error) {
      // ignore
    }
  }

  return undefined;
}

function getCachePath(): string | undefined {
  return path.join(userDataPath, 'CachedData');
}
