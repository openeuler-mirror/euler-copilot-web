import { app, ipcMain } from 'electron'
import { createDefaultWindow } from './window'

app.whenReady().then(() => {
  createDefaultWindow()
  // const defaultWindow = createDefaultWindow()

  // 监听渲染进程崩溃或被杀死，重新运行程序
  // defaultWindow.webContents.on('render-process-gone', () => {
  //   app.relaunch()
  //   app.exit(0)
  // })
})

app.on('window-all-closed', () => {
  ipcMain.removeAllListeners()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
