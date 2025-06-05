// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import { contextBridge } from 'electron';
import {
  safeIPC,
  sharedConfigAPI,
  windowAPI,
  systemAPI,
  themeAPI,
  utilsAPI,
} from './shared';
import type { DesktopConfig } from './types';

/**
 * 主窗口 preload 脚本
 * 提供主应用所需的所有 API
 */

const globals = {
  // 原始 IPC 接口（兼容性）
  ipcRenderer: safeIPC,

  // 配置管理（主程序完整功能）
  config: {
    /**
     * 获取当前配置
     */
    get: async (): Promise<DesktopConfig | null> => {
      try {
        return await safeIPC.invoke('copilot:get-config');
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
        return await safeIPC.invoke('copilot:update-config', updates);
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
        return await safeIPC.invoke('copilot:reset-config');
      } catch (error) {
        console.error('Failed to reset config:', error);
        return null;
      }
    },

    /**
     * 设置代理URL
     */
    setProxyUrl: sharedConfigAPI.setProxyUrl,

    /**
     * 获取代理URL
     */
    getProxyUrl: async (): Promise<string> => {
      try {
        return await safeIPC.invoke('copilot:get-proxy-url');
      } catch (error) {
        console.error('Failed to get proxy URL:', error);
        return '';
      }
    },

    /**
     * 验证服务器连接（统一接口）
     */
    validateServer: sharedConfigAPI.validateServer,
  },

  // 窗口控制
  window: {
    // 统一的窗口控制接口
    control: async (
      command: 'minimize' | 'maximize' | 'close',
    ): Promise<void> => {
      switch (command) {
        case 'minimize':
          return await windowAPI.minimize();
        case 'maximize':
          return await windowAPI.maximize();
        case 'close':
          return await windowAPI.close();
        default:
          throw new Error(`Unknown window command: ${command}`);
      }
    },

    // 单独的方法（向后兼容）
    ...windowAPI,
  },

  // 主题管理
  theme: themeAPI,

  // 系统信息
  process: systemAPI,

  // 实用工具
  utils: utilsAPI,
};

// 暴露 API 到渲染进程
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('eulercopilot', globals);
  } catch (error) {
    console.error('Failed to expose main API:', error);
  }
} else {
  (window as any).eulercopilot = globals;
}

console.log('Main preload script loaded');
