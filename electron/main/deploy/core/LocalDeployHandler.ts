// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import { DeploymentService } from './DeploymentService';
import type {
  DeploymentParams,
  DeploymentFormData,
} from '../types/deployment.types';

/**
 * 本地部署处理器 - 连接前端表单和部署服务
 */
export class LocalDeployHandler {
  private deploymentService: DeploymentService;

  constructor() {
    this.deploymentService = new DeploymentService();
  }

  /**
   * 处理前端表单提交的部署请求
   * @param formData 来自 localDeploy.vue 的表单数据
   */
  async handleDeployment(formData: DeploymentFormData): Promise<void> {
    // 将前端表单数据转换为部署参数
    const deploymentParams: DeploymentParams = {
      mainModel: {
        endpoint: this.formatEndpoint(formData.ruleForm.url),
        key: formData.ruleForm.apiKey,
        name: formData.ruleForm.modelName,
        ctxLength: 8192,
        maxTokens: 2048,
      },
      embeddingModel: {
        type: 'openai', // 根据需求，只考虑 openai 的情况
        endpoint: this.formatEndpoint(formData.embeddingRuleForm.url),
        key: formData.embeddingRuleForm.apiKey,
        name: formData.embeddingRuleForm.modelName,
      },
    };

    // 验证参数
    this.validateDeploymentParams(deploymentParams);

    // 开始部署
    await this.deploymentService.startDeployment(deploymentParams);
  }

  /**
   * 格式化 API 端点 URL
   * @param url 原始 URL
   * @returns 格式化后的 URL
   */
  private formatEndpoint(url: string): string {
    if (!url) {
      throw new Error('URL 不能为空');
    }

    // 移除尾部斜杠
    url = url.replace(/\/+$/, '');

    // 如果没有协议，默认添加 https://
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    return url;
  }

  /**
   * 验证部署参数
   * @param params 部署参数
   */
  private validateDeploymentParams(params: DeploymentParams): void {
    const { mainModel, embeddingModel } = params;

    // 验证主模型参数
    if (!mainModel.endpoint) {
      throw new Error('主模型 URL 不能为空');
    }
    if (!mainModel.name) {
      throw new Error('主模型名称不能为空');
    }
    if (!mainModel.key) {
      throw new Error('主模型 API Key 不能为空');
    }

    // 验证 embedding 模型参数
    if (!embeddingModel.endpoint) {
      throw new Error('Embedding 模型 URL 不能为空');
    }
    if (!embeddingModel.name) {
      throw new Error('Embedding 模型名称不能为空');
    }
    if (!embeddingModel.key) {
      throw new Error('Embedding 模型 API Key 不能为空');
    }

    // 验证 URL 格式
    try {
      new URL(mainModel.endpoint);
      new URL(embeddingModel.endpoint);
    } catch {
      throw new Error('URL 格式不正确');
    }
  }

  /**
   * 设置状态回调
   */
  setStatusCallback(callback: (status: any) => void) {
    this.deploymentService.setStatusCallback(callback);
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return this.deploymentService.getStatus();
  }

  /**
   * 停止部署
   */
  async stopDeployment(): Promise<void> {
    await this.deploymentService.stopDeployment();
  }

  /**
   * 清理部署文件
   */
  async cleanup(): Promise<void> {
    await this.deploymentService.cleanup();
  }

  /**
   * 添加 hosts 条目
   */
  async addHostsEntries(domains: string[]): Promise<void> {
    await this.deploymentService.addHostsEntries(domains);
  }
}
