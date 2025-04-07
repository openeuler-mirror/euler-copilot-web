export interface allWindowType {
  [propName: string]: {
    id: string;
    window: Electron.BrowserWindowConstructorOptions;
    hash: string;
  };
}

export const options: allWindowType = {
  mainWindow: {
    id: 'mainWindow',
    window: {
      width: 1440,
      height: 810,
      minWidth: 1440,
      minHeight: 810,
      titleBarStyle: 'hidden',
      resizable: true,
      show: true,
      alwaysOnTop: false,
      useContentSize: true,
      icon: 'dist/favicon.ico',
    },
    hash: '/',
  },
  chatWindow: {
    id: 'chatWindow',
    window: {
      width: 680,
      height: 960,
      resizable: true,
      show: false,
      alwaysOnTop: false,
      useContentSize: true,
      minWidth: 680,
      minHeight: 960,
      titleBarStyle: 'hidden',
      icon: 'dist/favicon.ico',
    },
    hash: '/chat',
  },
};
