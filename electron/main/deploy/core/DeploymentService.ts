// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getCachePath } from '../../common/cache-conf';
import type {
  DeploymentParams,
  DeploymentStatus,
} from '../types/deployment.types';
import {
  EnvironmentChecker,
  type EnvironmentCheckResult,
} from './EnvironmentChecker';
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
  private environmentCheckResult?: EnvironmentCheckResult;
  private currentStatus: DeploymentStatus = {
    status: 'idle',
    message: '',
    currentStep: 'idle',
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
    // 验证输入状态
    if (!status || typeof status !== 'object') {
      console.warn('DeploymentService: 尝试更新无效状态:', status);
      return;
    }

    this.currentStatus = { ...this.currentStatus, ...status };

    // 确保 currentStep 总是存在
    if (!this.currentStatus.currentStep) {
      this.currentStatus.currentStep = 'unknown';
    }

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
      // 第一阶段：准备安装环境
      this.updateStatus({
        status: 'preparing',
        message: '准备安装环境...',
        currentStep: 'preparing-environment',
      });

      // 1. 检查环境
      await this.checkEnvironment();

      // 2. 克隆仓库
      await this.cloneRepository();

      // 3. 配置 values.yaml
      await this.configureValues(params);

      // 4. 执行部署脚本中的工具安装部分（如果需要）
      await this.installTools();

      // 更新准备环境完成状态
      this.updateStatus({
        message: '准备安装环境完成',
        currentStep: 'environment-ready',
      });

      // 第二到第四阶段：按顺序安装各个服务
      await this.executeDeploymentScripts();

      this.updateStatus({
        status: 'success',
        message: '部署完成！',
        currentStep: 'completed',
      });
    } catch (error) {
      this.updateStatus({
        status: 'error',
        message: `部署失败: ${error instanceof Error ? error.message : String(error)}`,
        currentStep: 'failed',
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
      currentStep: 'preparing-environment',
    });

    // 检查 root 权限（仅限 Linux）
    await this.checkRootPermission();

    const checkResult = await this.environmentChecker.checkAll();

    // 安装缺失的基础工具
    if (checkResult.needsBasicToolsInstall) {
      this.updateStatus({
        message: '安装缺失的基础工具...',
        currentStep: 'preparing-environment',
      });

      await this.environmentChecker.installBasicTools(
        checkResult.missingBasicTools,
      );

      this.updateStatus({
        message: '基础工具安装完成',
        currentStep: 'preparing-environment',
      });
    }

    // 检查是否有严重错误
    if (!checkResult.success) {
      throw new Error(`环境检查失败: ${checkResult.errors.join(', ')}`);
    }

    // 存储检查结果，用于后续决定是否需要执行 2-install-tools
    this.environmentCheckResult = checkResult;

    this.updateStatus({
      message: '环境检查通过',
      currentStep: 'preparing-environment',
    });
  }

  /**
   * 克隆远程仓库
   */
  private async cloneRepository(): Promise<void> {
    this.updateStatus({
      status: 'cloning',
      message: '克隆部署仓库...',
      currentStep: 'preparing-environment',
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
        currentStep: 'preparing-environment',
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
        currentStep: 'preparing-environment',
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
      currentStep: 'preparing-environment',
    });

    const valuesPath = path.join(
      this.deploymentPath,
      'deploy/chart/euler_copilot/values.yaml',
    );
    await this.valuesYamlManager.updateModelsConfig(valuesPath, params);

    this.updateStatus({
      message: '配置部署参数完成',
      currentStep: 'preparing-environment',
    });
  }

  /**
   * 安装工具（准备环境的一部分）
   */
  private async installTools(): Promise<void> {
    // 检查是否需要安装 K8s 工具
    if (!this.environmentCheckResult?.needsK8sToolsInstall) {
      this.updateStatus({
        message: 'K8s 工具已存在，跳过工具安装',
        currentStep: 'preparing-environment',
      });
      return;
    }

    this.updateStatus({
      status: 'preparing',
      message: '安装 K8s 工具 (kubectl, helm)...',
      currentStep: 'preparing-environment',
    });

    const scriptsPath = path.join(this.deploymentPath, 'deploy/scripts');
    const toolsScriptPath = path.join(
      scriptsPath,
      '2-install-tools/install_tools.sh',
    );

    // 检查脚本文件是否存在
    if (fs.existsSync(toolsScriptPath)) {
      // 构建需要权限的命令
      const command = this.buildRootCommand(toolsScriptPath);

      // 执行脚本
      await execAsync(command, {
        cwd: scriptsPath,
        timeout: 300000, // 5分钟超时
      });
    }

    this.updateStatus({
      message: 'K8s 工具安装完成',
      currentStep: 'preparing-environment',
    });
  }

  /**
   * 执行部署脚本
   */
  private async executeDeploymentScripts(): Promise<void> {
    const scriptsPath = path.join(this.deploymentPath, 'deploy/scripts');

    // 按照 timeLine.vue 中的步骤定义，执行指定的脚本（排除工具安装，因为已在准备环境阶段执行）
    const scripts = [
      {
        name: '6-install-databases',
        path: '6-install-databases/install_databases.sh',
        displayName: '数据库服务',
        step: 'install-databases',
        envVars: {},
      },
      {
        name: '7-install-authhub',
        path: '7-install-authhub/install_authhub.sh',
        displayName: 'AuthHub 服务',
        step: 'install-authhub',
        envVars: {
          // 通过环境变量或输入重定向避免交互
          AUTHHUB_DOMAIN: 'authhub.eulercopilot.local',
        },
        useInputRedirection: true, // 标记需要输入重定向
      },
      {
        name: '8-install-EulerCopilot',
        path: '8-install-EulerCopilot/install_eulercopilot.sh',
        displayName: 'Intelligence 服务',
        step: 'install-intelligence',
        envVars: {
          // install_eulercopilot.sh 已支持这些环境变量
          EULERCOPILOT_DOMAIN: 'www.eulercopilot.local',
          AUTHHUB_DOMAIN: 'authhub.eulercopilot.local',
          // 设置非交互模式标志
          CI: 'true',
          DEBIAN_FRONTEND: 'noninteractive',
        },
      },
    ];

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];

      this.updateStatus({
        status: 'deploying',
        message: `正在安装 ${script.displayName}...`,
        currentStep: script.step,
      });

      const scriptPath = path.join(scriptsPath, script.path);

      // 检查脚本文件是否存在
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`脚本文件不存在: ${scriptPath}`);
      }

      // 准备环境变量
      const execEnv = {
        ...process.env,
        ...script.envVars,
      };

      // 构建需要权限的命令
      const command = this.buildRootCommand(
        scriptPath,
        script.useInputRedirection,
        script.useInputRedirection ? 'authhub.eulercopilot.local' : undefined,
      );

      // 给脚本添加执行权限并执行
      await execAsync(command, {
        cwd: scriptsPath,
        timeout: 300000, // 5分钟超时
        env: execEnv,
      });

      // 更新完成状态
      this.updateStatus({
        message: `${script.displayName} 安装完成`,
        currentStep: script.step,
      });
    }
  }

  /**
   * 检查并确保有 root 权限或 sudo 权限（仅限 Linux 系统）
   */
  private async checkRootPermission(): Promise<void> {
    // 只在 Linux 系统上检查权限
    if (process.platform !== 'linux') {
      return;
    }

    try {
      // 检查当前用户 ID，0 表示 root
      const { stdout } = await execAsync('id -u');
      const uid = parseInt(stdout.trim(), 10);

      // 如果是 root 用户，直接通过
      if (uid === 0) {
        return;
      }

      // 如果不是 root 用户，检查是否有 sudo 权限
      try {
        // 检查用户是否在管理员组中（sudo、wheel、admin）
        const { stdout: groupsOutput } = await execAsync('groups');
        const userGroups = groupsOutput.trim().split(/\s+/);

        // 检查常见的管理员组
        const adminGroups = ['sudo', 'wheel', 'admin'];
        const hasAdminGroup = adminGroups.some((group) =>
          userGroups.includes(group),
        );

        if (hasAdminGroup) {
          // 用户在管理员组中，具有 sudo 权限
          // 在实际执行时，buildRootCommand 会使用适当的图形化 sudo 工具
          return;
        }

        // 如果不在管理员组中，尝试检查是否有无密码 sudo 权限
        try {
          await execAsync('sudo -n true', { timeout: 3000 });
          // 如果成功，说明用户有无密码 sudo 权限
          return;
        } catch {
          // 用户既不在管理员组中，也没有无密码 sudo 权限
          throw new Error(
            '部署脚本需要管理员权限才能执行。请确保当前用户具有 sudo 权限。',
          );
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('部署脚本需要管理员权限')
        ) {
          throw error;
        }
        // 无法检查组信息，假设用户可能有权限，在实际执行时再处理
        // 这样避免过于严格的权限检查阻止部署
        return;
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('部署脚本需要 root 权限') ||
          error.message.includes('用户具有管理员权限'))
      ) {
        throw error;
      }
      throw new Error('无法检查用户权限');
    }
  }

  /**
   * 构建需要 root 权限的命令
   */
  private buildRootCommand(
    scriptPath: string,
    useInputRedirection?: boolean,
    inputData?: string,
  ): string {
    // 在 Linux 系统上，如果不是 root 用户，使用图形化 sudo 工具
    const needsSudo =
      process.platform === 'linux' && process.getuid && process.getuid() !== 0;

    // 获取合适的图形化 sudo 工具
    const getSudoCommand = (): string => {
      if (!needsSudo) return '';

      // 优先使用 pkexec（现代 Linux 桌面环境的标准）
      // 如果没有，回退到传统的 sudo
      return 'pkexec env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY ';
    };

    const sudoCommand = getSudoCommand();

    let command = sudoCommand;
    command += `chmod +x "${scriptPath}" && `;
    command += sudoCommand;

    if (useInputRedirection && inputData) {
      command += `bash -c 'echo "${inputData}" | bash "${scriptPath}"'`;
    } else {
      command += `bash "${scriptPath}"`;
    }

    return command;
  }

  /**
   * 停止部署
   */
  async stopDeployment(): Promise<void> {
    this.updateStatus({
      status: 'idle',
      message: '部署已停止',
      currentStep: 'stopped',
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
      currentStep: 'idle',
    });
  }
}
