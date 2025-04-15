// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { ipcRenderer, contextBridge } from 'electron';

function validateIPC(channel: string): true | never {
  if (!channel || !channel.startsWith('copilot:')) {
    // 允许窗口状态变化事件通过验证
    if (
      channel === 'window-maximized-change' ||
      channel === 'window-is-maximized'
    ) {
      return true;
    }
    throw new Error(`Unsupported event IPC channel '${channel}'`);
  }

  return true;
}

const globals = {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any> {
      validateIPC(channel);
      return ipcRenderer.invoke(channel, ...args);
    },

    // 添加事件监听方法
    on(channel: string, listener: (...args: any[]) => void): void {
      validateIPC(channel);
      ipcRenderer.on(channel, (event, ...args) => listener(...args));
    },

    // 添加一次性事件监听方法
    once(channel: string, listener: (...args: any[]) => void): void {
      validateIPC(channel);
      ipcRenderer.once(channel, (event, ...args) => listener(...args));
    },

    // 添加移除特定事件监听器的方法
    removeListener(channel: string, listener: (...args: any[]) => void): void {
      validateIPC(channel);
      ipcRenderer.removeListener(channel, listener);
    },

    // 添加移除所有事件监听器的方法
    removeAllListeners(channel: string): void {
      validateIPC(channel);
      ipcRenderer.removeAllListeners(channel);
    },
  },

  process: {
    get platform() {
      return process.platform;
    },
    get arch() {
      return process.arch;
    },
    get versions() {
      return process.versions;
    },
    get env() {
      return { ...process.env };
    },
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('eulercopilot', globals);
  } catch (error) {
    console.error(error);
  }
} else {
  (window as any).eulercopilot = globals;
}
