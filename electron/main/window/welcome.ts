// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import { BrowserWindow } from 'electron';
import * as path from 'node:path';
import { getConfigManager } from '../common/config';

/**
 * 欢迎窗口引用
 */
let welcomeWindow: BrowserWindow | null = null;

/**
 * 创建欢迎窗口
 */
export function createWelcomeWindow(): BrowserWindow {
  // 如果欢迎窗口已存在且未被销毁，则返回现有窗口
  if (welcomeWindow && !welcomeWindow.isDestroyed()) {
    welcomeWindow.focus();
    return welcomeWindow;
  }

  // 创建欢迎窗口
  welcomeWindow = new BrowserWindow({
    width: 720,
    height: 560,
    minWidth: 720,
    minHeight: 560,
    center: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: false,
    frame: false,
    title: '欢迎使用',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/welcome.js'), // 欢迎界面专用预加载脚本
    },
    show: false,
  });

  // 加载欢迎界面的 HTML 文件
  welcomeWindow.loadFile(path.join(__dirname, '../welcome/index.html'));

  // 开发模式下可以打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    welcomeWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 窗口准备显示时显示窗口
  welcomeWindow.once('ready-to-show', () => {
    if (welcomeWindow && !welcomeWindow.isDestroyed()) {
      welcomeWindow.show();
    }
  });

  // 窗口关闭时清理引用
  welcomeWindow.on('closed', () => {
    welcomeWindow = null;
  });

  // 阻止窗口导航到外部链接
  welcomeWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'data:') {
      event.preventDefault();
    }
  });

  // 阻止新窗口创建
  welcomeWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  return welcomeWindow;
}

/**
 * 显示欢迎窗口
 */
export function showWelcomeWindow(): BrowserWindow {
  if (welcomeWindow && !welcomeWindow.isDestroyed()) {
    welcomeWindow.show();
    welcomeWindow.focus();
    return welcomeWindow;
  }
  return createWelcomeWindow();
}

/**
 * 隐藏欢迎窗口
 */
export function hideWelcomeWindow(): void {
  if (welcomeWindow && !welcomeWindow.isDestroyed()) {
    welcomeWindow.hide();
  }
}

/**
 * 关闭欢迎窗口
 */
export function closeWelcomeWindow(): void {
  if (welcomeWindow && !welcomeWindow.isDestroyed()) {
    welcomeWindow.close();
  }
}

/**
 * 检查是否需要显示欢迎界面
 * 当配置文件不存在时，显示欢迎界面
 */
export function checkAndShowWelcomeIfNeeded(): boolean {
  const configManager = getConfigManager();

  if (!configManager.isConfigExists()) {
    console.log('Configuration file not found, showing welcome window');
    showWelcomeWindow();
    return true;
  }

  return false;
}

/**
 * 完成欢迎流程
 * 初始化配置并关闭欢迎窗口，然后继续应用启动
 */
export async function completeWelcomeFlow(): Promise<void> {
  const configManager = getConfigManager();

  try {
    // 确保配置文件已初始化
    configManager.initializeConfig();

    // 关闭欢迎窗口
    closeWelcomeWindow();

    console.log('Welcome flow completed, configuration initialized');

    // 动态导入主模块以避免循环依赖
    const { continueAppStartup } = await import('../index');
    await continueAppStartup();
  } catch (error) {
    console.error('Failed to complete welcome flow:', error);
  }
}

/**
 * 获取当前欢迎窗口实例
 */
export function getWelcomeWindow(): BrowserWindow | null {
  return welcomeWindow;
}
