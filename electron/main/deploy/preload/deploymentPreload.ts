// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.

import { contextBridge, ipcRenderer } from 'electron';
import type {
  DeploymentParams,
  DeploymentStatus,
  DeploymentFormData,
} from '../types/deployment.types';

// 暴露给渲染进程的部署服务 API
const deploymentAPI = {
  /**
   * 从前端表单开始部署
   */
  startDeploymentFromForm: (formData: DeploymentFormData): Promise<void> => {
    return ipcRenderer.invoke('deployment:startFromForm', formData);
  },

  /**
   * 开始部署（原有接口）
   */
  startDeployment: (params: DeploymentParams): Promise<void> => {
    return ipcRenderer.invoke('deployment:start', params);
  },

  /**
   * 停止部署
   */
  stopDeployment: (): Promise<void> => {
    return ipcRenderer.invoke('deployment:stop');
  },

  /**
   * 获取部署状态
   */
  getStatus: (): Promise<DeploymentStatus> => {
    return ipcRenderer.invoke('deployment:getStatus');
  },

  /**
   * 监听部署状态变化
   */
  onStatusChange: (callback: (status: DeploymentStatus) => void): void => {
    ipcRenderer.on('deployment:statusChanged', (_event, status) => {
      callback(status);
    });
  },

  /**
   * 移除状态变化监听器
   */
  removeStatusListener: (): void => {
    ipcRenderer.removeAllListeners('deployment:statusChanged');
  },

  /**
   * 清理部署文件
   */
  cleanup: (): Promise<void> => {
    return ipcRenderer.invoke('deployment:cleanup');
  },
};

// 注册到全局对象
contextBridge.exposeInMainWorld('deploymentService', deploymentAPI);

// 类型声明
declare global {
  interface Window {
    deploymentService: typeof deploymentAPI;
  }
}
