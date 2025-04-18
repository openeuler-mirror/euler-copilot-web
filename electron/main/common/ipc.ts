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

/**
 * 注册所有IPC监听器
 */
export function registerIpcListeners(): void {
  registerThemeListeners();
  registerWindowControlListeners();
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
