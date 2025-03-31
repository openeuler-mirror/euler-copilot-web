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

  const iconPath = path.join(__dirname, '../app_favicon.ico');
  appTray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate(trayMenus);
  appTray.setToolTip('Eulercopilot');

  appTray.setContextMenu(contextMenu);
  return appTray;
}
