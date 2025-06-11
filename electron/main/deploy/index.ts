// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.

import { DeploymentService } from './core/DeploymentService';
import { LocalDeployHandler } from './core/LocalDeployHandler';
import type {
  DeploymentParams,
  DeploymentStatus,
  DeploymentFormData,
  ModelFormData,
} from './types/deployment.types';

export { DeploymentService, LocalDeployHandler };
export type {
  DeploymentParams,
  DeploymentStatus,
  DeploymentFormData,
  ModelFormData as RuleForm,
};

// 导出单例实例
export const deploymentService = new DeploymentService();
export const localDeployHandler = new LocalDeployHandler();
