// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { ipcMain, BrowserWindow } from 'electron';
import { toggleTheme, setSystemTheme } from './theme';
import { getConfigManager, DesktopConfig } from './config';
import { completeWelcomeFlow, showWelcomeWindow } from '../window/welcome';
import https from 'https';
import http from 'http';

/**
 * 注册所有IPC监听器
 */
export function registerIpcListeners(): void {
  registerThemeListeners();
  registerWindowControlListeners();
  registerConfigListeners();
  registerWelcomeListeners();
}

/**
 * 注册主题相关的IPC监听器
 */
function registerThemeListeners(): void {
  // 切换主题
  ipcMain.handle('copilot:toggle', () => {
    return toggleTheme();
  });

  // 设置系统主题
  ipcMain.handle('copilot:system', () => {
    setSystemTheme();
  });
}

/**
 * 注册窗口控制相关的IPC监听器
 */
function registerWindowControlListeners(): void {
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

/**
 * 注册配置管理相关的IPC监听器
 */
function registerConfigListeners(): void {
  const configManager = getConfigManager();

  // 获取配置
  ipcMain.handle('copilot:get-config', () => {
    try {
      return configManager.readConfig();
    } catch (error) {
      console.error('Failed to get config:', error);
      return null;
    }
  });

  // 更新配置
  ipcMain.handle(
    'copilot:update-config',
    (event, updates: Partial<DesktopConfig>) => {
      try {
        return configManager.updateConfig(updates);
      } catch (error) {
        console.error('Failed to update config:', error);
        return null;
      }
    },
  );

  // 重置配置
  ipcMain.handle('copilot:reset-config', () => {
    try {
      configManager.resetConfig();
      return configManager.readConfig();
    } catch (error) {
      console.error('Failed to reset config:', error);
      return null;
    }
  });

  // 获取代理URL
  ipcMain.handle('copilot:get-proxy-url', () => {
    try {
      return configManager.getConfigValue<string>('base_url') || '';
    } catch (error) {
      console.error('Failed to get proxy URL:', error);
      return '';
    }
  });

  // 设置代理URL
  ipcMain.handle('copilot:set-proxy-url', (event, url: string) => {
    try {
      configManager.setConfigValue('base_url', url);
      return true;
    } catch (error) {
      console.error('Failed to set proxy URL:', error);
      return false;
    }
  });

  // 验证服务器连接
  ipcMain.handle('copilot:validate-server', async (event, url: string) => {
    try {
      return await validateServerConnection(url);
    } catch (error) {
      console.error('Failed to validate server:', error);
      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : '验证服务器时发生未知错误',
      };
    }
  });
}

/**
 * 注册欢迎界面相关的IPC监听器
 */
function registerWelcomeListeners(): void {
  // 显示欢迎界面
  ipcMain.handle('copilot:show-welcome', () => {
    try {
      showWelcomeWindow();
      return true;
    } catch (error) {
      console.error('Failed to show welcome window:', error);
      return false;
    }
  });

  // 完成欢迎流程
  ipcMain.handle('copilot:complete-welcome', async () => {
    try {
      await completeWelcomeFlow();
      return true;
    } catch (error) {
      console.error('Failed to complete welcome flow:', error);
      return false;
    }
  });
}

/**
 * 验证服务器连接性
 */
async function validateServerConnection(url: string): Promise<{
  isValid: boolean;
  error?: string;
  status?: number;
  responseTime?: number;
}> {
  try {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const requestModule = isHttps ? https : http;

    return new Promise((resolve) => {
      const timeout = 1500; // 1.5秒超时

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: '/',
        method: 'HEAD',
        timeout,
        // 对于HTTPS，忽略证书错误（开发环境）
        rejectUnauthorized: false,
      };

      const req = requestModule.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        req.destroy();

        resolve({
          isValid: res.statusCode ? res.statusCode < 500 : false,
          status: res.statusCode,
          responseTime,
        });
      });

      req.on('error', (error: Error) => {
        resolve({
          isValid: false,
          error: error.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          isValid: false,
          error: '连接超时',
        });
      });

      req.end();
    });
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '无效的URL格式',
    };
  }
}
