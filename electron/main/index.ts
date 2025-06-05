// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { app, session, ipcMain, Menu, BrowserWindow } from 'electron';
import {
  createDefaultWindow,
  createChatWindow,
  createTray,
  checkAndShowWelcomeIfNeeded,
} from './window';
import { cachePath, commonCacheConfPath } from './common/cache-conf';
import { mkdirpIgnoreError, getUserDefinedConf } from './common/fs-utils';
import { getOsLocale, resolveNlsConfiguration } from './common/locale';
import { resolveThemeConfiguration, setApplicationTheme } from './common/theme';
import { productObj } from './common/product';
import {
  registerGlobalShortcut,
  checkAccessibilityPermission,
  unregisterAllShortcuts,
} from './common/shortcuts';
import { buildAppMenu } from './common/menu';
import { registerIpcListeners } from './common/ipc';

// 允许本地部署时使用无效证书，仅在 Electron 主进程下生效
if (process.versions.electron) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// 确保应用名称使用productName而不是package.json中的name
app.name = productObj.name;

// 添加表示应用是否正在退出的标志位
let isQuitting = false;

// 获取系统语言环境
const osLocale = getOsLocale();

// 应用初始化
app.once('ready', () => {
  onReady();
});

// 处理证书错误事件，允许所有证书错误
app.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  },
);

// 针对所有 session 处理证书错误
app.on('ready', () => {
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    callback(0); // 0 表示通过所有证书校验
  });
});

// 处理应用退出前的事件，设置退出标志
app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  unregisterAllShortcuts();
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

/**
 * 应用准备好时的处理函数
 */
async function onReady() {
  try {
    // 检查配置文件是否存在，如果不存在则显示欢迎界面
    const shouldShowWelcome = checkAndShowWelcomeIfNeeded();

    if (shouldShowWelcome) {
      console.log('First time startup, showing welcome window');
      // 如果是首次启动，显示欢迎界面后等待用户完成配置
      // 用户完成配置时会触发 continueAppStartup 函数
      return;
    }

    // 继续正常的应用启动流程
    await continueAppStartup();
  } catch (error) {
    console.error('Application startup error:', error);
  }
}

/**
 * 继续应用启动（在配置完成后调用）
 */
export async function continueAppStartup() {
  try {
    // 初始化缓存目录和配置
    await mkdirpIgnoreError(cachePath);
    const commonCacheConf = await getUserDefinedConf(commonCacheConfPath);

    // 解析国际化和主题配置
    const [nlsConfig, themeConfig] = await Promise.all([
      resolveNlsConfiguration(commonCacheConf, osLocale),
      resolveThemeConfiguration(commonCacheConf),
    ]);

    // 设置主题和环境变量
    setApplicationTheme(themeConfig.theme || 'light');
    process.env['EULERCOPILOT_NLS_CONFIG'] = JSON.stringify(nlsConfig);
    process.env['EULERCOPILOT_CACHE_PATH'] = cachePath || '';

    // 启动应用
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
  } catch (error) {
    console.error('Continue app startup error:', error);
  }
}

/**
 * 启动应用
 */
async function startup() {
  // 注册IPC通信监听器
  registerIpcListeners();

  // 创建系统托盘
  createTray();

  // 创建应用窗口
  let win = createDefaultWindow();
  let chatWindow = createChatWindow();

  // 处理窗口激活
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

  // 设置主窗口的关闭行为
  win.on('close', (event) => {
    // 如果应用正在退出（例如通过Cmd+Q触发），则允许窗口正常关闭
    if (isQuitting) {
      return;
    }
    // 否则阻止关闭，只是隐藏窗口
    event.preventDefault();
    win.hide();
  });

  // 设置聊天窗口的关闭行为
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
