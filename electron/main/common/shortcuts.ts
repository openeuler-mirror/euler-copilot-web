// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { app, globalShortcut, BrowserWindow, dialog } from 'electron';
import { createChatWindow } from '../window';

// 定义全局快捷键
export const CHAT_SHORTCUT_KEY =
  process.platform === 'darwin' ? 'Cmd+Option+O' : 'Ctrl+Alt+O';

// 快捷键是否已注册
let isShortcutRegistered = false;

/**
 * 在macOS上，检查是否已经获得辅助功能权限
 */
export function checkAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return true;

  try {
    return app.isAccessibilitySupportEnabled();
  } catch (err) {
    console.error('Failed to check accessibility permission:', err);
    return false;
  }
}

/**
 * 注册全局快捷键
 * @returns 是否注册成功
 */
export function registerGlobalShortcut(): boolean {
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

/**
 * 注销所有全局快捷键
 */
export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
  isShortcutRegistered = false;
}
