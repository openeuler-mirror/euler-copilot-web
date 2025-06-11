// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

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
