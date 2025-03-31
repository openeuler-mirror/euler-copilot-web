import { app, ipcMain } from 'electron';
import { createDefaultWindow, createTray } from './window';

app.whenReady().then(() => {
  const tray = createTray();

  const win = createDefaultWindow();

  tray.on('click', () => {
    win.show();
  });

  win.on('close', (event) => {
    event.preventDefault();
    win.hide();
  });
});

app.on('window-all-closed', () => {
  ipcMain.removeAllListeners();
});
