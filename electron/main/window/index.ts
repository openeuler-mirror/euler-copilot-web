// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import { app, BrowserWindow, ipcMain } from 'electron';
import { createDefaultWindow, createChatWindow } from './create';
import { createTray } from './tray'; // 导入createTray函数

// 重新导出以便在index.ts中使用
export { createDefaultWindow, createChatWindow, createTray };

// 存储所有窗口引用
const allWindows: BrowserWindow[] = [];

export function createWindows() {
  // 创建默认窗口
  const defaultWindow = createDefaultWindow();
  allWindows.push(defaultWindow);

  // 添加窗口最大化状态变化事件监听
  defaultWindow.on('maximize', () => {
    if (defaultWindow.webContents) {
      defaultWindow.webContents.send('window-maximized-change', true);
    }
  });

  defaultWindow.on('unmaximize', () => {
    if (defaultWindow.webContents) {
      defaultWindow.webContents.send('window-maximized-change', false);
    }
  });

  // 窗口关闭时退出应用
  defaultWindow.on('closed', () => {
    app.quit();
  });

  // 聊天窗口
  const chatWindow = createChatWindow();
  allWindows.push(chatWindow);

  // 添加聊天窗口最大化状态变化事件监听
  chatWindow.on('maximize', () => {
    if (chatWindow.webContents) {
      chatWindow.webContents.send('window-maximized-change', true);
    }
  });

  chatWindow.on('unmaximize', () => {
    if (chatWindow.webContents) {
      chatWindow.webContents.send('window-maximized-change', false);
    }
  });

  // 添加IPC处理程序，用于查询窗口是否最大化
  ipcMain.handle('window-is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      return win.isMaximized();
    }
    return false;
  });
}

export function destroyWindows() {
  // 关闭所有窗口
  allWindows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.close();
    }
  });
}
