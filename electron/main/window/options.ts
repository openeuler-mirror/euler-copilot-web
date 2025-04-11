// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { isLinux } from '../common/platform';

export interface allWindowType {
  [propName: string]: {
    id: string;
    window: Electron.BrowserWindowConstructorOptions;
    hash: string;
  };
}

// Linux平台专用窗口配置，添加圆角支持
const getLinuxSpecificOptions =
  (): Partial<Electron.BrowserWindowConstructorOptions> => {
    if (!isLinux) return {};

    return {
      transparent: true,
      backgroundColor: '#00000000',
    };
  };

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
      ...getLinuxSpecificOptions(),
    },
    hash: '/',
  },
  chatWindow: {
    id: 'chatWindow',
    window: {
      width: 680,
      height: 960,
      minWidth: 680,
      minHeight: 810,
      resizable: true,
      show: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      useContentSize: true,
      titleBarStyle: 'hidden',
      icon: 'dist/favicon.ico',
      ...getLinuxSpecificOptions(),
    },
    hash: '/chat',
  },
};
