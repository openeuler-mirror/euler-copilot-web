// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import type { DeploymentParams } from '../types/deployment.types';

/**
 * Values.yaml 文件管理器
 */
export class ValuesYamlManager {
  /**
   * 更新 values.yaml 中的 models 配置
   */
  async updateModelsConfig(
    valuesPath: string,
    params: DeploymentParams,
  ): Promise<void> {
    try {
      // 读取现有的 values.yaml 文件
      const valuesContent = fs.readFileSync(valuesPath, 'utf8');
      const valuesData = yaml.load(valuesContent) as any;

      // 确保 models 节点存在
      if (!valuesData.models) {
        valuesData.models = {};
      }

      // 配置 answer 模型（主模型）
      valuesData.models.answer = {
        endpoint: params.mainModel.endpoint,
        key: params.mainModel.key,
        name: params.mainModel.name,
        ctxLength: params.mainModel.ctxLength || 8192,
        maxTokens: params.mainModel.maxTokens || 2048,
      };

      // 配置 functionCall 模型（使用相同的主模型）
      valuesData.models.functionCall = {
        backend: 'function_call', // 根据需求文档，这里应该是 "function_call" 而不是 "openai"
        endpoint: params.mainModel.endpoint,
        key: params.mainModel.key,
        name: params.mainModel.name,
        ctxLength: params.mainModel.ctxLength || 8192,
        maxTokens: params.mainModel.maxTokens || 2048,
      };

      // 配置 embedding 模型 (只考虑 openai 类型)
      valuesData.models.embedding = {
        type: 'openai', // 只考虑 openai 的情况
        endpoint: params.embeddingModel.endpoint,
        key: params.embeddingModel.key,
        name: params.embeddingModel.name,
      };

      // 写回文件
      const updatedYaml = yaml.dump(valuesData, {
        indent: 2,
        lineWidth: -1, // 禁用行宽限制
        noRefs: true,
        sortKeys: false,
      });

      fs.writeFileSync(valuesPath, updatedYaml, 'utf8');
    } catch (error) {
      throw new Error(
        `更新 values.yaml 失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 验证 values.yaml 文件格式
   */
  validateValuesFile(valuesPath: string): boolean {
    try {
      const content = fs.readFileSync(valuesPath, 'utf8');
      yaml.load(content);
      return true;
    } catch (error) {
      console.error('Values.yaml 验证失败:', error);
      return false;
    }
  }

  /**
   * 备份 values.yaml 文件
   */
  backupValuesFile(valuesPath: string): string {
    const backupPath = `${valuesPath}.backup.${Date.now()}`;
    fs.copyFileSync(valuesPath, backupPath);
    return backupPath;
  }

  /**
   * 恢复 values.yaml 文件
   */
  restoreValuesFile(valuesPath: string, backupPath: string): void {
    fs.copyFileSync(backupPath, valuesPath);
  }
}
