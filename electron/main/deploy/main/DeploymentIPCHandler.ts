// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import { ipcMain, BrowserWindow } from 'electron';
import { deploymentService } from '../index';
import { LocalDeployHandler } from '../core/LocalDeployHandler';
import type { DeploymentFormData } from '../types/deployment.types';

/**
 * 部署服务 IPC 处理程序
 */
export class DeploymentIPCHandler {
  private localDeployHandler: LocalDeployHandler;
  private mainWindow: BrowserWindow | undefined;

  constructor() {
    this.localDeployHandler = new LocalDeployHandler();
    this.mainWindow = undefined;
    this.setupHandlers();
  }

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;

    // 设置状态变化回调
    this.localDeployHandler.setStatusCallback((status) => {
      // 调试信息：仅在开发环境下记录IPC层状态更新
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 IPC Handler: 收到状态更新', {
          status: status?.status,
          currentStep: status?.currentStep,
          hasMainWindow: !!this.mainWindow,
          isDestroyed: this.mainWindow?.isDestroyed(),
        });
      }

      // 验证状态对象是否有效
      if (
        status &&
        typeof status === 'object' &&
        this.mainWindow &&
        !this.mainWindow.isDestroyed()
      ) {
        try {
          this.mainWindow.webContents.send('deployment:statusChanged', status);
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ IPC Handler: 状态已发送到渲染进程');
          }
        } catch (error) {
          console.error('❌ IPC Handler: 发送状态到渲染进程失败:', error);
        }
      } else if (!status) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ IPC Handler: 收到无效的状态更新:', status);
        }
      } else if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ IPC Handler: 主窗口不可用，无法发送状态更新');
        }
      }
    });
  }

  /**
   * 设置 IPC 处理程序
   */
  setupHandlers() {
    // 处理前端表单提交的部署请求
    ipcMain.handle(
      'deployment:startFromForm',
      async (_event, formData: DeploymentFormData) => {
        try {
          await this.localDeployHandler.handleDeployment(formData);
        } catch (error) {
          console.error('部署失败:', error);
          throw error;
        }
      },
    );

    // 开始部署（原有接口保留兼容性）
    ipcMain.handle('deployment:start', async (_event, params) => {
      try {
        await deploymentService.startDeployment(params);
      } catch (error) {
        console.error('部署失败:', error);
        throw error;
      }
    });

    // 停止部署
    ipcMain.handle('deployment:stop', async () => {
      try {
        await this.localDeployHandler.stopDeployment();
      } catch (error) {
        console.error('停止部署失败:', error);
        throw error;
      }
    });

    // 获取部署状态
    ipcMain.handle('deployment:getStatus', () => {
      return this.localDeployHandler.getStatus();
    });

    // 清理部署文件
    ipcMain.handle('deployment:cleanup', async () => {
      try {
        await this.localDeployHandler.cleanup();
      } catch (error) {
        console.error('清理失败:', error);
        throw error;
      }
    });
  }

  /**
   * 清理处理程序
   */
  cleanup() {
    ipcMain.removeHandler('deployment:startFromForm');
    ipcMain.removeHandler('deployment:start');
    ipcMain.removeHandler('deployment:stop');
    ipcMain.removeHandler('deployment:getStatus');
    ipcMain.removeHandler('deployment:cleanup');
  }
}
