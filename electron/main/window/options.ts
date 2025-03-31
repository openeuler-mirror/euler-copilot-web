export interface allWindowType {
  [propName: string]: {
    window: Electron.BrowserWindowConstructorOptions;
    hash: string;
  };
}

export const options: allWindowType = {
  defaultWin: {
    window: {
      width: 1700,
      height: 900,
      resizable: true,
      show: true,
      alwaysOnTop: false,
      useContentSize: true,
      autoHideMenuBar: true,
      frame: true,
      backgroundColor: '#ffffff',
      icon: 'dist/favicon.ico',
    },
    hash: 'defaultWin',
  },
};
