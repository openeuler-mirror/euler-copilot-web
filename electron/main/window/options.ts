// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
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
      minHeight: 810,
      titleBarStyle: 'hidden',
      icon: 'dist/favicon.ico',
    },
    hash: '/chat',
  },
};
