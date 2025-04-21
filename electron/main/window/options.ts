// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import path from 'path';
import { isLinux } from '../common/platform';
import electron from 'electron';

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

// 调整Linux平台窗口尺寸，为16px阴影留出空间
const adjustWindowSize = (
  options: Electron.BrowserWindowConstructorOptions,
): Electron.BrowserWindowConstructorOptions => {
  if (!isLinux) return options;

  // 阴影在各个方向增加16px，所以宽高各需要增加32px
  const shadowOffset = 32; // 16px * 2
  const result = { ...options };

  if (result.width) result.width += shadowOffset;
  if (result.height) result.height += shadowOffset;
  if (result.minWidth) result.minWidth += shadowOffset;
  if (result.minHeight) result.minHeight += shadowOffset;

  return result;
};

export const options: allWindowType = {
  mainWindow: {
    id: 'mainWindow',
    window: adjustWindowSize({
      width: 1440,
      height: 810,
      minWidth: 1440,
      minHeight: 810,
      titleBarStyle: 'hidden',
      resizable: true,
      show: true,
      alwaysOnTop: false,
      useContentSize: true,
      icon: 'dist/icon.png',
      ...getLinuxSpecificOptions(),
    }),
    hash: '/',
  },
  chatWindow: {
    id: 'chatWindow',
    window: adjustWindowSize({
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
      icon: 'dist/icon.png',
      ...getLinuxSpecificOptions(),
    }),
    hash: '/chat',
  },
};
