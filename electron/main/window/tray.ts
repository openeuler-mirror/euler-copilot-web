// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import path from 'node:path';
import { app, Tray, Menu } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';

export function createTray(): Tray {
  let appTray: Tray | null = null;

  if (appTray) return appTray;

  const trayMenus: MenuItemConstructorOptions[] = [
    {
      label: '退出',
      click: () => {
        app.exit();
      },
    },
  ];
  const iconPath =
    process.platform === 'darwin'
      ? path.join(__dirname, '../favicon.ico')
      : path.join(__dirname, '../app_favicon.ico');
  appTray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate(trayMenus);
  appTray.setToolTip('EulerCopilot');

  appTray.setContextMenu(contextMenu);
  return appTray;
}
