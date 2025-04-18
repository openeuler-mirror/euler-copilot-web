// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { app, Menu, BrowserWindow } from 'electron';
import { CHAT_SHORTCUT_KEY } from './shortcuts';
import { createChatWindow } from '../window';

/**
 * 构建原生应用菜单，支持中英文
 * @param nlsConfig 国际化配置
 * @returns 构建的菜单
 */
export function buildAppMenu(nlsConfig: { resolvedLanguage: string }): Menu {
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
