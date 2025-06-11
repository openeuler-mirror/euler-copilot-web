// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.

import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getCachePath } from '../../common/cache-conf';
import type {
  DeploymentParams,
  DeploymentStatus,
  DeploymentConfig,
} from '../types/deployment.types';
import { EnvironmentChecker } from './EnvironmentChecker';
import { ValuesYamlManager } from './ValuesYamlManager';

const execAsync = promisify(exec);

/**
 * 部署服务核心类
 */
export class DeploymentService {
  private cachePath: string;
  private deploymentPath: string;
  private environmentChecker: EnvironmentChecker;
  private valuesYamlManager: ValuesYamlManager;
  private currentStatus: DeploymentStatus = {
    status: 'idle',
    message: '',
    progress: 0,
  };
  private statusCallback?: (status: DeploymentStatus) => void;

  constructor() {
    this.cachePath = getCachePath();
    // 创建专门的部署工作目录
    this.deploymentPath = path.join(
      this.cachePath,
      'deployment',
      'euler-copilot-framework',
    );
    this.environmentChecker = new EnvironmentChecker();
    this.valuesYamlManager = new ValuesYamlManager();
  }

  /**
   * 设置状态回调函数
   */
  setStatusCallback(callback: (status: DeploymentStatus) => void) {
    this.statusCallback = callback;
  }

  /**
   * 更新部署状态
   */
  private updateStatus(status: Partial<DeploymentStatus>) {
    this.currentStatus = { ...this.currentStatus, ...status };
    if (this.statusCallback) {
      this.statusCallback(this.currentStatus);
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): DeploymentStatus {
    return { ...this.currentStatus };
  }

  /**
   * 开始部署流程
   */
  async startDeployment(params: DeploymentParams): Promise<void> {
    try {
      this.updateStatus({
        status: 'preparing',
        message: '准备部署环境...',
        progress: 0,
      });

      // 1. 检查环境
      await this.checkEnvironment();

      // 2. 克隆仓库
      await this.cloneRepository();

      // 3. 配置 values.yaml
      await this.configureValues(params);

      // 4. 执行部署脚本
      await this.executeDeploymentScripts();

      this.updateStatus({
        status: 'success',
        message: '部署完成！',
        progress: 100,
      });
    } catch (error) {
      this.updateStatus({
        status: 'error',
        message: `部署失败: ${error instanceof Error ? error.message : String(error)}`,
        progress: 0,
      });
      throw error;
    }
  }

  /**
   * 检查环境
   */
  private async checkEnvironment(): Promise<void> {
    this.updateStatus({
      status: 'preparing',
      message: '检查系统环境...',
      progress: 10,
    });

    const checkResult = await this.environmentChecker.checkAll();
    if (!checkResult.success) {
      throw new Error(`环境检查失败: ${checkResult.errors.join(', ')}`);
    }

    this.updateStatus({
      message: '环境检查通过',
      progress: 20,
    });
  }

  /**
   * 克隆远程仓库
   */
  private async cloneRepository(): Promise<void> {
    this.updateStatus({
      status: 'cloning',
      message: '克隆部署仓库...',
      progress: 30,
    });

    // 确保部署目录的父目录存在
    const deploymentParentDir = path.dirname(this.deploymentPath);
    if (!fs.existsSync(deploymentParentDir)) {
      fs.mkdirSync(deploymentParentDir, { recursive: true });
    }

    // 检查是否已经克隆过
    const gitDir = path.join(this.deploymentPath, '.git');
    if (fs.existsSync(gitDir)) {
      // 已存在，执行 git pull 更新
      await execAsync('git pull origin master', { cwd: this.deploymentPath });
      this.updateStatus({
        message: '更新部署仓库完成',
        progress: 40,
      });
    } else {
      // 不存在，克隆仓库
      const repoUrl = 'https://gitee.com/openeuler/euler-copilot-framework.git';
      await execAsync(
        `git clone ${repoUrl} ${path.basename(this.deploymentPath)}`,
        {
          cwd: deploymentParentDir,
        },
      );
      this.updateStatus({
        message: '克隆部署仓库完成',
        progress: 40,
      });
    }
  }

  /**
   * 配置 values.yaml 文件
   */
  private async configureValues(params: DeploymentParams): Promise<void> {
    this.updateStatus({
      status: 'configuring',
      message: '配置部署参数...',
      progress: 50,
    });

    const valuesPath = path.join(
      this.deploymentPath,
      'deploy/chart/euler_copilot/values.yaml',
    );
    await this.valuesYamlManager.updateModelsConfig(valuesPath, params);

    this.updateStatus({
      message: '配置部署参数完成',
      progress: 60,
    });
  }

  /**
   * 执行部署脚本
   */
  private async executeDeploymentScripts(): Promise<void> {
    const scriptsPath = path.join(this.deploymentPath, 'deploy/scripts');

    // 按照需求只执行指定的脚本
    const scripts = [
      { name: '2-install-tools', path: '2-install-tools/install_tools.sh' },
      {
        name: '6-install-databases',
        path: '6-install-databases/install_databases.sh',
      },
      {
        name: '7-install-authhub',
        path: '7-install-authhub/install_authhub.sh',
      },
      {
        name: '8-install-EulerCopilot',
        path: '8-install-EulerCopilot/install_eulercopilot.sh',
      },
    ];

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];

      this.updateStatus({
        status: 'deploying',
        message: `执行 ${script.name}...`,
        progress: 70 + i * 7,
      });

      const scriptPath = path.join(scriptsPath, script.path);

      // 检查脚本文件是否存在
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`脚本文件不存在: ${scriptPath}`);
      }

      // 给脚本添加执行权限并执行
      await execAsync(`chmod +x "${scriptPath}" && bash "${scriptPath}"`, {
        cwd: scriptsPath,
        timeout: 300000, // 5分钟超时
      });
    }
  }

  /**
   * 停止部署
   */
  async stopDeployment(): Promise<void> {
    this.updateStatus({
      status: 'idle',
      message: '部署已停止',
      progress: 0,
    });
  }

  /**
   * 清理部署文件
   */
  async cleanup(): Promise<void> {
    if (fs.existsSync(this.deploymentPath)) {
      fs.rmSync(this.deploymentPath, { recursive: true, force: true });
    }
    this.updateStatus({
      status: 'idle',
      message: '清理完成',
      progress: 0,
    });
  }
}
