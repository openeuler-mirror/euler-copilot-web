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

  // 配置管理 API
  config: {
    // 获取完整配置
    get: async (): Promise<any> => {
      return await ipcRenderer.invoke('copilot:get-config');
    },

    // 更新配置（部分更新）
    update: async (updates: Record<string, any>): Promise<any> => {
      return await ipcRenderer.invoke('copilot:update-config', updates);
    },

    // 重置配置
    reset: async (): Promise<any> => {
      return await ipcRenderer.invoke('copilot:reset-config');
    },

    // 设置代理 URL
    setProxyUrl: async (url: string): Promise<boolean> => {
      return await ipcRenderer.invoke('copilot:set-proxy-url', url);
    },

    // 获取代理 URL
    getProxyUrl: async (): Promise<string> => {
      return await ipcRenderer.invoke('copilot:get-proxy-url');
    },
  },

  // 欢迎界面 API
  welcome: {
    // 显示欢迎界面
    show: async (): Promise<boolean> => {
      return await ipcRenderer.invoke('copilot:show-welcome');
    },

    // 完成欢迎流程
    complete: async (): Promise<boolean> => {
      return await ipcRenderer.invoke('copilot:complete-welcome');
    },
  },

  // 窗口控制 API
  window: {
    // 窗口控制
    control: async (
      command: 'minimize' | 'maximize' | 'close',
    ): Promise<void> => {
      return await ipcRenderer.invoke('copilot:window-control', command);
    },

    // 检查窗口是否最大化
    isMaximized: async (): Promise<boolean> => {
      return await ipcRenderer.invoke('copilot:window-is-maximized');
    },

    // 监听窗口最大化状态变化
    onMaximizedChange: (callback: (isMaximized: boolean) => void): void => {
      ipcRenderer.on('window-maximized-change', (event, isMaximized) =>
        callback(isMaximized),
      );
    },

    // 移除窗口最大化状态变化监听
    offMaximizedChange: (): void => {
      ipcRenderer.removeAllListeners('window-maximized-change');
    },
  },

  // 主题 API
  theme: {
    // 切换主题
    toggle: async (): Promise<any> => {
      return await ipcRenderer.invoke('copilot:toggle');
    },

    // 设置系统主题
    setSystem: async (): Promise<any> => {
      return await ipcRenderer.invoke('copilot:system');
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
