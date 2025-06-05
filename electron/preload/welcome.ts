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
import type { DesktopConfig } from './types';

/**
 * 欢迎界面专用的 preload 脚本
 * 提供配置管理和欢迎流程相关的 API
 */

/**
 * 欢迎界面 API
 */
const welcomeAPI = {
  // 配置管理
  config: {
    /**
     * 获取当前配置
     */
    get: async (): Promise<DesktopConfig | null> => {
      try {
        return await ipcRenderer.invoke('copilot:get-config');
      } catch (error) {
        console.error('Failed to get config:', error);
        return null;
      }
    },

    /**
     * 更新配置
     */
    update: async (
      updates: Partial<DesktopConfig>,
    ): Promise<DesktopConfig | null> => {
      try {
        return await ipcRenderer.invoke('copilot:update-config', updates);
      } catch (error) {
        console.error('Failed to update config:', error);
        return null;
      }
    },

    /**
     * 重置配置为默认值
     */
    reset: async (): Promise<DesktopConfig | null> => {
      try {
        return await ipcRenderer.invoke('copilot:reset-config');
      } catch (error) {
        console.error('Failed to reset config:', error);
        return null;
      }
    },

    /**
     * 验证服务器连接
     */
    validateServer: async (url: string): Promise<boolean> => {
      try {
        // 这里可以添加服务器连接验证逻辑
        // 暂时返回 true，实际实现时可以通过 IPC 调用主进程进行网络检查
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok || response.type === 'opaque';
      } catch (error) {
        console.warn('Server validation failed:', error);
        return false;
      }
    },
  },

  // 欢迎流程管理
  welcome: {
    /**
     * 完成欢迎设置流程
     */
    complete: async (): Promise<boolean> => {
      try {
        return await ipcRenderer.invoke('copilot:complete-welcome');
      } catch (error) {
        console.error('Failed to complete welcome flow:', error);
        return false;
      }
    },

    /**
     * 取消欢迎流程（关闭窗口）
     */
    cancel: async (): Promise<void> => {
      try {
        await ipcRenderer.invoke('copilot:window-control', 'close');
      } catch (error) {
        console.error('Failed to cancel welcome flow:', error);
      }
    },
  },

  // 窗口控制
  window: {
    /**
     * 关闭窗口
     */
    close: async (): Promise<void> => {
      try {
        await ipcRenderer.invoke('copilot:window-control', 'close');
      } catch (error) {
        console.error('Failed to close window:', error);
      }
    },

    /**
     * 最小化窗口
     */
    minimize: async (): Promise<void> => {
      try {
        await ipcRenderer.invoke('copilot:window-control', 'minimize');
      } catch (error) {
        console.error('Failed to minimize window:', error);
      }
    },
  },

  // 系统信息
  system: {
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
  },

  // 实用工具
  utils: {
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
  },
};

// 类型定义已在 types.d.ts 中声明

// 暴露 API 到渲染进程
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('eulercopilotWelcome', welcomeAPI);
  } catch (error) {
    console.error('Failed to expose welcome API:', error);
  }
} else {
  (window as any).eulercopilotWelcome = welcomeAPI;
}

console.log('Welcome preload script loaded');
