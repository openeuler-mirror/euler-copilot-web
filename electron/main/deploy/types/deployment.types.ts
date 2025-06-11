// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.

export interface ModelConfig {
  endpoint: string;
  key: string;
  name: string;
  ctxLength?: number;
  maxTokens?: number;
}

export interface EmbeddingConfig {
  type: 'openai' | 'mindie';
  endpoint: string;
  key: string;
  name: string;
}

// 与 localDeploy.vue 中的 RuleForm 保持一致
export interface ModelFormData {
  url: string;
  modelName: string;
  apiKey: string;
}

export interface DeploymentFormData {
  ruleForm: ModelFormData;
  embeddingRuleForm: ModelFormData;
}

export interface DeploymentParams {
  mainModel: ModelConfig;
  embeddingModel: EmbeddingConfig;
}

export interface DeploymentStatus {
  status:
    | 'idle'
    | 'preparing'
    | 'cloning'
    | 'configuring'
    | 'deploying'
    | 'success'
    | 'error';
  message: string;
  progress: number;
  currentStep?: string;
  estimatedTime?: number;
}
