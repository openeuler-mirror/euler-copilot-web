// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.

export interface DeploymentConfig {
  repoUrl: string;
  branch: string;
  deployPath: string;
}

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

export interface DeploymentResult {
  success: boolean;
  message: string;
  deploymentId?: string;
  services?: {
    mainModel: ModelConfig;
    embeddingModel: EmbeddingConfig;
  };
  logs?: string[];
  error?: DeploymentError;
}

export interface DeploymentError {
  code: string;
  message: string;
  details?: any;
  recoverable?: boolean;
  userAction?: string;
  timestamp?: Date;
}

export interface SystemCheck {
  platform: string;
  architecture: string;
  nodeVersion: string;
  availableCommands: string[];
  missingCommands: string[];
  passed: boolean;
  diskSpace?: number;
  networkConnected?: boolean;
}

export interface RepositoryInfo {
  branch: string;
  commit: string;
  timestamp: Date;
  valid: boolean;
}

export interface DeploymentOptions {
  repoUrl?: string;
  branch?: string;
  useCache?: boolean;
  forceClean?: boolean;
  timeout?: number;
  dryRun?: boolean;
  skipSystemCheck?: boolean;
  customConfigPath?: string;
}
