// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
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
  dialog,
  Menu,
} from 'electron';
import { createDefaultWindow, createChatWindow, createTray } from './window';
import type { INLSConfiguration } from './common/nls';
import { cachePath, commonCacheConfPath, updateConf } from './common/conf';

interface ICacheConf {
  userLocale: string;
  theme: 'system' | 'light' | 'dark';
}

let commonCacheConf: Partial<ICacheConf> = {};

const osLocale = processZhLocale(
  (app.getPreferredSystemLanguages()?.[0] ?? 'en').toLowerCase(),
);

// 定义全局快捷键
const CHAT_SHORTCUT_KEY =
  process.platform === 'darwin' ? 'Cmd+Option+O' : 'Ctrl+Alt+O';

// 添加表示应用是否正在退出的标志位
let isQuitting = false;

// 添加是否已注册快捷键的标志
let isShortcutRegistered = false;

// 在macOS上，检查是否已经获得辅助功能权限
function checkAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return true;

  try {
    return app.isAccessibilitySupportEnabled();
  } catch (err) {
    console.error('Failed to check accessibility permission:', err);
    return false;
  }
}

// 注册全局快捷键
function registerGlobalShortcut() {
  // 如果已经注册了快捷键，先取消注册
  if (isShortcutRegistered) {
    globalShortcut.unregister(CHAT_SHORTCUT_KEY);
  }

  // 注册新的快捷键
  const success = globalShortcut.register(CHAT_SHORTCUT_KEY, () => {
    const chatWindow = BrowserWindow.getAllWindows().find((win) =>
      win.webContents.getURL().includes('chat'),
    );

    if (chatWindow) {
      if (chatWindow.isMinimized()) chatWindow.restore();
      chatWindow.show();
      chatWindow.focus();
    } else {
      // 如果没有找到聊天窗口，则创建一个新的
      const newChatWindow = createChatWindow();
      newChatWindow.show();
      newChatWindow.focus();
    }
  });

  isShortcutRegistered = success;

  if (!success) {
    console.error('Failed to register global shortcut');
    // 在macOS上，提示用户需要授予辅助功能权限
    if (process.platform === 'darwin' && !checkAccessibilityPermission()) {
      dialog.showMessageBox({
        type: 'info',
        title: '需要辅助功能权限',
        message: `要使用快捷键 ${CHAT_SHORTCUT_KEY} 功能，请在系统偏好设置中，授予应用辅助功能权限。`,
        buttons: ['好的'],
      });
    }
  }

  return success;
}

// 构建原生应用菜单，支持中英文
function buildAppMenu(nlsConfig: { resolvedLanguage: string }) {
  const isZh = nlsConfig.resolvedLanguage.startsWith('zh');
  const isMac = process.platform === 'darwin';
  const template = [
    // macOS App 菜单
    ...(isMac
      ? [
          {
            role: 'appMenu',
            label: app.name,
            submenu: [
              {
                role: 'about',
                label: isZh ? `关于 ${app.name}` : `About ${app.name}`,
              },
              { type: 'separator' },
              { role: 'services', label: isZh ? '服务' : 'Services' },
              { type: 'separator' },
              {
                role: 'hide',
                label: isZh ? `隐藏 ${app.name}` : `Hide ${app.name}`,
              },
              { role: 'hideOthers', label: isZh ? '隐藏其他' : 'Hide Others' },
              { role: 'unhide', label: isZh ? '显示全部' : 'Show All' },
              { type: 'separator' },
              {
                role: 'quit',
                label: isZh ? `退出 ${app.name}` : `Quit ${app.name}`,
              },
            ],
          },
        ]
      : []),
    // File 菜单
    {
      role: 'fileMenu',
      label: isZh ? '文件' : 'File',
      submenu: [{ role: 'close', label: isZh ? '关闭窗口' : 'Close Window' }],
    },
    // Edit 菜单
    {
      role: 'editMenu',
      label: isZh ? '编辑' : 'Edit',
      submenu: [
        { role: 'undo', label: isZh ? '撤销' : 'Undo' },
        { role: 'redo', label: isZh ? '重做' : 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: isZh ? '剪切' : 'Cut' },
        { role: 'copy', label: isZh ? '复制' : 'Copy' },
        { role: 'paste', label: isZh ? '粘贴' : 'Paste' },
        ...(isMac
          ? [
              {
                role: 'pasteAndMatchStyle',
                label: isZh ? '粘贴并匹配样式' : 'Paste and Match Style',
              },
              { role: 'delete', label: isZh ? '删除' : 'Delete' },
              { role: 'selectAll', label: isZh ? '全选' : 'Select All' },
            ]
          : [
              { role: 'delete', label: isZh ? '删除' : 'Delete' },
              { type: 'separator' },
              { role: 'selectAll', label: isZh ? '全选' : 'Select All' },
            ]),
      ],
    },
    // View 菜单
    {
      role: 'viewMenu',
      label: isZh ? '显示' : 'View',
      submenu: [
        { role: 'reload', label: isZh ? '重新加载' : 'Reload' },
        {
          role: 'forcereload',
          label: isZh ? '强制重新加载' : 'Force Reload',
        },
        {
          role: 'toggleDevTools',
          label: isZh ? '切换开发者工具' : 'Toggle Developer Tools',
        },
        { type: 'separator' },
        { role: 'resetZoom', label: isZh ? '重置缩放' : 'Reset Zoom' },
        { role: 'zoomIn', label: isZh ? '放大' : 'Zoom In' },
        { role: 'zoomOut', label: isZh ? '缩小' : 'Zoom Out' },
        { type: 'separator' },
        {
          role: 'togglefullscreen',
          label: isZh ? '切换全屏' : 'Toggle Fullscreen',
        },
      ],
    },
    // Window 菜单
    {
      role: 'windowMenu',
      label: isZh ? '窗口' : 'Window',
      submenu: [
        { role: 'minimize', label: isZh ? '最小化' : 'Minimize' },
        { role: 'zoom', label: isZh ? '缩放' : 'Zoom' },
        { type: 'separator' },
        {
          label: isZh ? '打开快捷问答' : 'Open Quick Chat',
          accelerator: CHAT_SHORTCUT_KEY,
          click: () => {
            const chat = BrowserWindow.getAllWindows().find((win) =>
              win.webContents.getURL().includes('chat'),
            );
            if (chat) {
              if (chat.isMinimized()) chat.restore();
              chat.show();
              chat.focus();
            } else {
              createChatWindow().show();
            }
          },
        },
        { type: 'separator' },
        ...(isMac
          ? [
              {
                role: 'front',
                label: isZh ? '前置全部窗口' : 'Bring All to Front',
              },
            ]
          : []),
      ],
    },
    // Help 菜单
    {
      role: 'help',
      label: isZh ? '帮助' : 'Help',
      submenu: [
        { label: isZh ? '文档' : 'Documentation', click: () => {} },
        { label: isZh ? '社区' : 'Community Discussions', click: () => {} },
        { label: isZh ? '搜索问题' : 'Search Issues', click: () => {} },
      ],
    },
  ];
  return Menu.buildFromTemplate(
    template as Electron.MenuItemConstructorOptions[],
  );
}

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

// 在macOS上，当应用图标被点击时重置退出标志和显示主窗口
app.on('activate', () => {
  isQuitting = false;
});

async function onReady() {
  try {
    await mkdirpIgnoreError(cachePath);
    commonCacheConf = await getUserDefinedConf(commonCacheConfPath);
    const [nlsConfig, themeConfig] = await Promise.all([
      resolveNlsConfiguration(),
      resolveThemeConfiguration(),
    ]);

    nativeTheme.themeSource = themeConfig.theme || 'light';
    process.env['EULERCOPILOT_THEME'] = themeConfig.theme || 'light';
    process.env['EULERCOPILOT_NLS_CONFIG'] = JSON.stringify(nlsConfig);
    process.env['EULERCOPILOT_CACHE_PATH'] = cachePath || '';

    await startup();

    // 设置原生应用菜单
    Menu.setApplicationMenu(buildAppMenu(nlsConfig));

    // 注册全局快捷键
    registerGlobalShortcut();

    // 在macOS上，监听辅助功能权限变化，重新注册快捷键
    if (process.platform === 'darwin') {
      app.accessibilitySupportEnabled = checkAccessibilityPermission();

      app.on(
        'accessibility-support-changed',
        (event, accessibilitySupportEnabled) => {
          console.log(
            'Accessibility support changed:',
            accessibilitySupportEnabled,
          );
          if (accessibilitySupportEnabled) {
            registerGlobalShortcut();
          }
        },
      );
    }
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
    isQuitting = false;
    if (BrowserWindow.getAllWindows().length === 0) {
      // 如果没有窗口，则创建新窗口
      win = createDefaultWindow();
      chatWindow = createChatWindow();
    } else {
      // 如果窗口存在但被隐藏，则显示主窗口
      if (win && !win.isDestroyed()) {
        win.show();
      }
    }
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
