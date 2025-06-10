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
import { sharedConfigAPI, systemAPI, utilsAPI, safeIPC } from './shared';

// 导入部署服务API
const deploymentAPI = {
  /**
   * 从前端表单开始部署
   */
  startDeploymentFromForm: (formData: {
    ruleForm: {
      url: string;
      modelName: string;
      apiKey: string;
    };
    embeddingRuleForm: {
      url: string;
      modelName: string;
      apiKey: string;
    };
  }): Promise<void> => {
    return safeIPC.invoke('deployment:startFromForm', formData);
  },

  /**
   * 停止部署
   */
  stopDeployment: (): Promise<void> => {
    return safeIPC.invoke('deployment:stop');
  },

  /**
   * 获取部署状态
   */
  getStatus: (): Promise<any> => {
    return safeIPC.invoke('deployment:getStatus');
  },

  /**
   * 监听部署状态变化
   */
  onStatusChange: (callback: (status: any) => void): void => {
    console.log('🔧 Preload: 设置部署状态监听器');
    safeIPC.on('deployment:statusChanged', (_event, status) => {
      console.log('🔄 Preload: 收到部署状态更新:', status);
      callback(status);
    });
  },

  /**
   * 移除状态变化监听器
   */
  removeStatusListener: (): void => {
    safeIPC.removeAllListeners('deployment:statusChanged');
  },

  /**
   * 清理部署文件
   */
  cleanup: (): Promise<void> => {
    return safeIPC.invoke('deployment:cleanup');
  },
};

/**
 * 欢迎界面专用的 preload 脚本
 * 提供配置管理和欢迎流程相关的 API，使用统一的后端验证接口
 */

/**
 * 欢迎流程 API（专用于欢迎界面）
 */
const welcomeFlowAPI = {
  /**
   * 显示欢迎界面
   */
  show: async (): Promise<boolean> => {
    try {
      return await safeIPC.invoke('copilot:show-welcome');
    } catch (error) {
      console.error('Failed to show welcome:', error);
      return false;
    }
  },

  /**
   * 完成欢迎设置流程
   */
  complete: async (): Promise<boolean> => {
    try {
      return await safeIPC.invoke('copilot:complete-welcome');
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
      await safeIPC.invoke('copilot:window-control', 'close');
    } catch (error) {
      console.error('Failed to cancel welcome flow:', error);
    }
  },
};

/**
 * 欢迎界面 API
 * 只提供代理设置、服务器验证和欢迎流程功能
 */
const welcomeAPI = {
  // 配置管理（仅代理设置和服务器验证）
  config: sharedConfigAPI,

  // 欢迎流程管理（专用实现）
  welcome: welcomeFlowAPI,

  // 部署服务（新增）
  deployment: deploymentAPI,

  // 系统信息（使用共享模块）
  system: systemAPI,

  // 实用工具（使用共享模块）
  utils: utilsAPI,
};

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
