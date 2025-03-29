export interface allWindowType {
  [propName: string]: {
    window: Electron.BrowserWindowConstructorOptions
    hash: string
  }
}

export const options: allWindowType = {
  defaultWin: {
    window: {
      width: 800,
      height: 600,
      resizable: true,
      show: true,
      alwaysOnTop: false,
      useContentSize: true,
      frame: true,
      backgroundColor: '#ffffff',
      icon: 'dist/favicon.ico',
    },
    hash: 'defaultWin',
  },
}
