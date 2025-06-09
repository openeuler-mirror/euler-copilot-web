// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import { ipcRenderer } from 'electron';
import type { ServerValidationResult } from './types';

/**
 * 共享的 preload 功能模块
 * 避免在多个 preload 脚本中重复代码
 */

/**
 * IPC 通道验证
 */
export function validateIPC(channel: string): true | never {
  if (
    !channel ||
    (!channel.startsWith('copilot:') && !channel.startsWith('deployment:'))
  ) {
    // 允许窗口状态变化事件通过验证
    if (
      channel === 'window-maximized-change' ||
      channel === 'window-is-maximized' ||
      channel === 'clean:storage'
    ) {
      return true;
    }
    throw new Error(`Unsupported event IPC channel '${channel}'`);
  }
  return true;
}

/**
 * 安全的 IPC 调用包装器
 */
export const safeIPC = {
  invoke: async (channel: string, ...args: any[]): Promise<any> => {
    validateIPC(channel);
    return await ipcRenderer.invoke(channel, ...args);
  },

  on: (channel: string, listener: (...args: any[]) => void): void => {
    validateIPC(channel);
    ipcRenderer.on(channel, (event, ...args) => listener(...args));
  },

  once: (channel: string, listener: (...args: any[]) => void): void => {
    validateIPC(channel);
    ipcRenderer.once(channel, (event, ...args) => listener(...args));
  },

  removeListener: (
    channel: string,
    listener: (...args: any[]) => void,
  ): void => {
    validateIPC(channel);
    ipcRenderer.removeListener(channel, listener);
  },

  removeAllListeners: (channel: string): void => {
    validateIPC(channel);
    ipcRenderer.removeAllListeners(channel);
  },
};

/**
 * 配置管理 API（代理设置和服务器验证，供所有窗口使用）
 */
export const sharedConfigAPI = {
  /**
   * 设置代理URL
   */
  setProxyUrl: async (url: string): Promise<boolean> => {
    try {
      return await safeIPC.invoke('copilot:set-proxy-url', url);
    } catch (error) {
      console.error('Failed to set proxy URL:', error);
      return false;
    }
  },

  /**
   * 验证服务器连接（统一接口）
   */
  validateServer: async (url: string): Promise<ServerValidationResult> => {
    try {
      return await safeIPC.invoke('copilot:validate-server', url);
    } catch (error) {
      console.error('Failed to validate server:', error);
      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : '验证服务器时发生未知错误',
      };
    }
  },
};

/**
 * 窗口控制 API（共享）
 */
export const windowAPI = {
  /**
   * 关闭窗口
   */
  close: async (): Promise<void> => {
    try {
      await safeIPC.invoke('copilot:window-control', 'close');
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  },

  /**
   * 最小化窗口
   */
  minimize: async (): Promise<void> => {
    try {
      await safeIPC.invoke('copilot:window-control', 'minimize');
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  },

  /**
   * 最大化窗口
   */
  maximize: async (): Promise<void> => {
    try {
      await safeIPC.invoke('copilot:window-control', 'maximize');
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  },

  /**
   * 检查窗口是否最大化
   */
  isMaximized: async (): Promise<boolean> => {
    try {
      return await safeIPC.invoke('copilot:window-is-maximized');
    } catch (error) {
      console.error('Failed to check window maximized state:', error);
      return false;
    }
  },

  /**
   * 监听窗口最大化状态变化
   */
  onMaximizedChange: (callback: (isMaximized: boolean) => void): void => {
    safeIPC.on('window-maximized-change', callback);
  },

  /**
   * 移除窗口最大化状态变化监听
   */
  offMaximizedChange: (): void => {
    safeIPC.removeAllListeners('window-maximized-change');
  },
};

/**
 * 系统信息 API（共享）
 */
export const systemAPI = {
  /**
   * 获取平台信息
   */
  get platform(): string {
    return process.platform;
  },

  /**
   * 获取架构信息
   */
  get arch(): string {
    return process.arch;
  },

  /**
   * 获取版本信息
   */
  get versions(): NodeJS.ProcessVersions {
    return process.versions;
  },

  /**
   * 获取环境变量（安全的副本）
   */
  get env(): Record<string, string | undefined> {
    return { ...process.env };
  },
};

/**
 * 实用工具 API（共享）
 */
export const utilsAPI = {
  /**
   * 检查 URL 格式是否有效
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 格式化 URL（确保有协议）
   */
  formatUrl: (url: string): string => {
    if (!url) return '';

    // 移除尾部斜杠
    url = url.replace(/\/+$/, '');

    // 如果没有协议，默认添加 https://
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    return url;
  },

  /**
   * 延迟执行
   */
  delay: (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

/**
 * 主题 API（共享）
 */
export const themeAPI = {
  /**
   * 切换主题
   */
  toggle: async (): Promise<any> => {
    try {
      return await safeIPC.invoke('copilot:toggle');
    } catch (error) {
      console.error('Failed to toggle theme:', error);
      return null;
    }
  },

  /**
   * 设置系统主题
   */
  setSystem: async (): Promise<any> => {
    try {
      return await safeIPC.invoke('copilot:system');
    } catch (error) {
      console.error('Failed to set system theme:', error);
      return null;
    }
  },
};

// 确保此文件被识别为 ES 模块
export default {
  safeIPC,
  sharedConfigAPI,
  windowAPI,
  systemAPI,
  utilsAPI,
  themeAPI,
};
