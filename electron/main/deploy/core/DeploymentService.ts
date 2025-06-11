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
import { exec, spawn } from 'child_process';
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

/**
 * 支持中断的异步执行函数
 */
const execAsyncWithAbort = (
  command: string,
  options: any = {},
  abortSignal?: AbortSignal,
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          stdout: typeof stdout === 'string' ? stdout : stdout.toString(),
          stderr: typeof stderr === 'string' ? stderr : stderr.toString(),
        });
      }
    });

    // 如果提供了中断信号，监听中断事件
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        childProcess.kill('SIGTERM');
        reject(new Error('部署进程已被用户停止'));
      });
    }
  });
};

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
  private abortController?: AbortController;
  private sudoSessionActive: boolean = false;
  private sudoHelperProcess?: any;
  private sudoHelperMonitorInterval?: NodeJS.Timeout;
  private activeCommandStartTime?: number; // 记录当前活跃命令的开始时间
  private isCommandExecuting: boolean = false; // 标记是否有命令正在执行

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
      if (process.env.NODE_ENV === 'development') {
        console.warn('DeploymentService: 尝试更新无效状态:', status);
      }
      return;
    }

    this.currentStatus = { ...this.currentStatus, ...status };

    // 确保 currentStep 总是存在
    if (!this.currentStatus.currentStep) {
      this.currentStatus.currentStep = 'unknown';
    }

    // 调试信息：仅在开发环境下记录状态更新
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 DeploymentService: 状态更新', {
        status: this.currentStatus.status,
        currentStep: this.currentStatus.currentStep,
        message: this.currentStatus.message,
        hasCallback: !!this.statusCallback,
      });
    }

    if (this.statusCallback) {
      try {
        this.statusCallback(this.currentStatus);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ DeploymentService: 状态回调已调用');
        }
      } catch (error) {
        console.error('❌ DeploymentService: 状态回调执行失败:', error);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ DeploymentService: 没有设置状态回调函数');
      }
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
      // 创建新的 AbortController 用于控制部署流程
      this.abortController = new AbortController();

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

      // 3. 在Linux系统上，一次性获取sudo权限并设置环境
      await this.initializeSudoSession();

      // 4. 配置 values.yaml
      await this.configureValues(params);

      // 5. 执行部署脚本中的工具安装部分（如果需要）
      await this.installTools();

      // 6. 验证K8s集群状态
      await this.verifyK8sCluster();

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
      // 如果是因为手动停止导致的错误，使用停止状态
      if (this.abortController?.signal.aborted) {
        this.updateStatus({
          status: 'idle',
          message: '部署已停止',
          currentStep: 'stopped',
        });
      } else {
        // 如果错误还没有被处理（设置status为error），在这里处理
        if (this.currentStatus.status !== 'error') {
          const friendlyMessage = this.getUserFriendlyErrorMessage(
            error,
            '部署过程',
          );
          this.updateStatus({
            status: 'error',
            message: friendlyMessage,
            currentStep: 'failed',
          });
        }
        throw error;
      }
    } finally {
      // 清理资源
      this.abortController = undefined;
      this.sudoSessionActive = false; // 重置sudo会话状态
      this.cleanupSudoHelper(); // 清理sudo助手进程
    }
  }

  /**
   * 检查环境
   */
  private async checkEnvironment(): Promise<void> {
    try {
      this.updateStatus({
        status: 'preparing',
        message: '检查系统环境...',
        currentStep: 'preparing-environment',
      });

      // 检查 root 权限（仅限 Linux）
      try {
        await this.checkRootPermission();
      } catch (error) {
        throw new Error(
          `权限检查失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      let checkResult;
      try {
        checkResult = await this.environmentChecker.checkAll();
      } catch (error) {
        throw new Error(
          `系统环境检查失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // 存储检查结果，用于后续决定是否需要执行 2-install-tools
      // 基础工具的安装将在 initializeSudoSession 中处理
      this.environmentCheckResult = checkResult;

      // 检查是否有严重错误
      if (!checkResult.success) {
        throw new Error(`环境检查未通过: ${checkResult.errors.join(', ')}`);
      }

      this.updateStatus({
        message: '环境检查通过',
        currentStep: 'preparing-environment',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.updateStatus({
        status: 'error',
        message: `环境检查阶段失败: ${errorMessage}`,
        currentStep: 'preparing-environment',
      });
      throw error;
    }
  }

  /**
   * 克隆远程仓库
   */
  private async cloneRepository(): Promise<void> {
    try {
      this.updateStatus({
        status: 'cloning',
        message: '克隆部署仓库...',
        currentStep: 'preparing-environment',
      });

      // 确保部署目录的父目录存在
      const deploymentParentDir = path.dirname(this.deploymentPath);
      try {
        if (!fs.existsSync(deploymentParentDir)) {
          fs.mkdirSync(deploymentParentDir, { recursive: true });
        }
      } catch (error) {
        throw new Error(
          `创建部署目录失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // 检查是否已经克 clone 过
      const gitDir = path.join(this.deploymentPath, '.git');
      if (fs.existsSync(gitDir)) {
        try {
          // 已存在，执行 git pull 更新
          await execAsyncWithAbort(
            'git pull origin master',
            { cwd: this.deploymentPath },
            this.abortController?.signal,
          );
          this.updateStatus({
            message: '更新部署仓库完成',
            currentStep: 'preparing-environment',
          });
        } catch (error) {
          throw new Error(
            `更新仓库失败: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } else {
        try {
          // 不存在，克隆仓库
          const repoUrl =
            'https://gitee.com/openeuler/euler-copilot-framework.git';
          await execAsyncWithAbort(
            `git clone ${repoUrl} ${path.basename(this.deploymentPath)}`,
            {
              cwd: deploymentParentDir,
            },
            this.abortController?.signal,
          );
          this.updateStatus({
            message: '克隆部署仓库完成',
            currentStep: 'preparing-environment',
          });
        } catch (error) {
          throw new Error(
            `克隆仓库失败: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.updateStatus({
        status: 'error',
        message: `仓库操作阶段失败: ${errorMessage}`,
        currentStep: 'preparing-environment',
      });
      throw error;
    }
  }

  /**
   * 配置 values.yaml 文件
   */
  private async configureValues(params: DeploymentParams): Promise<void> {
    try {
      this.updateStatus({
        status: 'configuring',
        message: '配置部署参数...',
        currentStep: 'preparing-environment',
      });

      const valuesPath = path.join(
        this.deploymentPath,
        'deploy/chart/euler_copilot/values.yaml',
      );

      // 检查 values.yaml 文件是否存在
      if (!fs.existsSync(valuesPath)) {
        throw new Error(`配置文件不存在: ${valuesPath}`);
      }

      try {
        await this.valuesYamlManager.updateModelsConfig(valuesPath, params);
      } catch (error) {
        throw new Error(
          `更新配置文件失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      this.updateStatus({
        message: '配置部署参数完成',
        currentStep: 'preparing-environment',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.updateStatus({
        status: 'error',
        message: `配置阶段失败: ${errorMessage}`,
        currentStep: 'preparing-environment',
      });
      throw error;
    }
  }

  /**
   * 安装工具（准备环境的一部分）
   */
  private async installTools(): Promise<void> {
    try {
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
        message: '安装 K8s 工具 (kubectl, helm, k3s)...',
        currentStep: 'preparing-environment',
      });

      const scriptsPath = path.join(this.deploymentPath, 'deploy/scripts');
      const toolsScriptPath = path.join(
        scriptsPath,
        '2-install-tools/install_tools.sh',
      );

      // 检查脚本文件是否存在
      if (!fs.existsSync(toolsScriptPath)) {
        throw new Error(`工具安装脚本不存在: ${toolsScriptPath}`);
      }

      try {
        // 直接使用已建立的sudo会话执行脚本
        const envVars = {
          KUBECONFIG: '/etc/rancher/k3s/k3s.yaml',
        };

        // 构建环境变量字符串
        const envString = Object.entries(envVars)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');

        // 执行脚本
        await this.executeSudoCommand(
          `${envString} bash "${toolsScriptPath}"`,
          600000, // 10分钟超时，k3s安装可能需要较长时间
        );
      } catch (error) {
        // 检查是否是超时错误
        if (error instanceof Error && error.message.includes('timeout')) {
          throw new Error('K8s 工具安装超时，可能网络较慢或下载失败');
        }
        throw new Error(
          `K8s 工具安装执行失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      this.updateStatus({
        message: 'K8s 工具安装完成',
        currentStep: 'preparing-environment',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.updateStatus({
        status: 'error',
        message: `工具安装阶段失败: ${errorMessage}`,
        currentStep: 'preparing-environment',
      });
      throw error;
    }
  }

  /**
   * 验证K8s集群状态（确保k3s正常运行）
   */
  private async verifyK8sCluster(): Promise<void> {
    // 只在 Linux 系统上需要验证k3s
    if (process.platform !== 'linux') {
      return;
    }

    try {
      this.updateStatus({
        status: 'preparing',
        message: '验证 K8s 集群状态...',
        currentStep: 'preparing-environment',
      });

      // 1. 检查k3s服务状态
      try {
        await this.checkK3sService();
      } catch (error) {
        throw new Error(
          `k3s 服务检查失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // 2. 等待k3s服务完全启动
      try {
        await this.waitForK3sReady();
      } catch (error) {
        throw new Error(
          `k3s 服务启动验证失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // 3. 验证kubectl连接
      try {
        await this.verifyKubectlConnection();
      } catch (error) {
        throw new Error(
          `kubectl 连接验证失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      this.updateStatus({
        message: 'K8s 集群验证通过',
        currentStep: 'preparing-environment',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.updateStatus({
        status: 'error',
        message: `K8s 集群验证阶段失败: ${errorMessage}`,
        currentStep: 'preparing-environment',
      });
      throw error;
    }
  }

  /**
   * 检查k3s服务状态
   */
  private async checkK3sService(): Promise<void> {
    try {
      const { stdout } = await execAsyncWithAbort(
        'systemctl is-active k3s',
        {},
        this.abortController?.signal,
      );

      if (stdout.trim() !== 'active') {
        // 尝试启动k3s服务
        await this.executeSudoCommand('systemctl start k3s', 30000);

        // 再次检查状态
        const { stdout: newStatus } = await execAsyncWithAbort(
          'systemctl is-active k3s',
          {},
          this.abortController?.signal,
        );

        if (newStatus.trim() !== 'active') {
          throw new Error('k3s 服务启动失败');
        }
      }
    } catch (error) {
      throw new Error(
        `k3s 服务检查失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 等待k3s服务完全启动（最多等待60秒）
   */
  private async waitForK3sReady(): Promise<void> {
    const maxWaitTime = 60000; // 60秒
    const checkInterval = 5000; // 5秒检查一次
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // 检查k3s.yaml文件是否存在且可读
        const { stdout } = await this.executeSudoCommand(
          'ls -la /etc/rancher/k3s/k3s.yaml',
          10000,
        );

        if (stdout.includes('k3s.yaml')) {
          // 文件存在，等待几秒确保内容完整
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return;
        }
      } catch {
        // 文件还不存在，继续等待
      }

      // 等待一段时间后重试
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error('k3s 配置文件生成超时，服务可能启动失败');
  }

  /**
   * 验证kubectl连接
   */
  private async verifyKubectlConnection(): Promise<void> {
    try {
      // 设置KUBECONFIG环境变量并测试连接
      const kubeconfigPath = '/etc/rancher/k3s/k3s.yaml';

      // 使用sudo权限执行kubectl命令，因为k3s.yaml文件只有root用户可以读取
      const { stdout } = await this.executeSudoCommand(
        `KUBECONFIG=${kubeconfigPath} kubectl cluster-info`,
        15000,
        { KUBECONFIG: kubeconfigPath },
      );

      if (!stdout.includes('is running at')) {
        throw new Error('kubectl 无法连接到 k3s 集群');
      }

      // 验证节点状态
      const { stdout: nodeStatus } = await this.executeSudoCommand(
        `KUBECONFIG=${kubeconfigPath} kubectl get nodes`,
        15000,
        { KUBECONFIG: kubeconfigPath },
      );

      if (!nodeStatus.includes('Ready')) {
        throw new Error('k3s 节点状态异常');
      }
    } catch (error) {
      throw new Error(
        `kubectl 连接验证失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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

      try {
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

        // 构建需要权限的命令
        const envVars = {
          ...script.envVars,
          // 确保 KUBECONFIG 环境变量正确设置
          KUBECONFIG: '/etc/rancher/k3s/k3s.yaml',
        };

        // 过滤掉 undefined 值，确保所有值都是字符串
        const cleanEnvVars = Object.fromEntries(
          Object.entries(envVars).filter(([, value]) => value !== undefined),
        ) as Record<string, string>;

        try {
          // 使用已建立的sudo会话执行脚本，避免重复输入密码
          let command = `bash "${scriptPath}"`;

          if (
            script.useInputRedirection &&
            script.useInputRedirection === true
          ) {
            // 对于需要输入重定向的脚本，预设输入内容
            const inputData = 'authhub.eulercopilot.local';
            command = `echo "${inputData}" | ${command}`;
          }

          // 增加详细日志
          if (process.env.NODE_ENV === 'development') {
            console.log(`执行脚本: ${script.displayName}`);
            console.log(`脚本路径: ${scriptPath}`);
            console.log(`执行命令: ${command}`);
            console.log(`环境变量:`, cleanEnvVars);
            console.log(`超时时间: ${600000}ms (10分钟)`);
          }

          await this.executeSudoCommand(
            command,
            600000, // 10分钟超时，某些服务安装可能需要较长时间
            cleanEnvVars,
          );
        } catch (error) {
          // 检查是否是超时错误
          if (error instanceof Error && error.message.includes('timeout')) {
            throw new Error(
              `${script.displayName} 安装超时，可能网络较慢或下载失败`,
            );
          }
          // 检查是否是权限错误
          if (
            error instanceof Error &&
            (error.message.includes('permission denied') ||
              error.message.includes('Access denied'))
          ) {
            throw new Error(
              `${script.displayName} 安装权限不足，请确保有管理员权限`,
            );
          }
          // 检查是否是网络错误
          if (
            error instanceof Error &&
            (error.message.includes('network') ||
              error.message.includes('connection') ||
              error.message.includes('resolve'))
          ) {
            throw new Error(
              `${script.displayName} 安装网络错误，请检查网络连接`,
            );
          }
          throw new Error(
            `${script.displayName} 安装失败: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        // 更新完成状态
        this.updateStatus({
          message: `${script.displayName} 安装完成`,
          currentStep: script.step,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.updateStatus({
          status: 'error',
          message: `${script.displayName} 安装失败: ${errorMessage}`,
          currentStep: script.step,
        });
        throw error;
      }
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
      const { stdout } = await execAsyncWithAbort(
        'id -u',
        {},
        this.abortController?.signal,
      );
      const uid = parseInt(stdout.trim(), 10);

      // 如果是 root 用户，直接通过
      if (uid === 0) {
        return;
      }

      // 如果不是 root 用户，检查是否有 sudo 权限
      try {
        // 检查用户是否在管理员组中（sudo、wheel、admin）
        const { stdout: groupsOutput } = await execAsyncWithAbort(
          'groups',
          {},
          this.abortController?.signal,
        );
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
          await execAsyncWithAbort(
            'sudo -n true',
            { timeout: 3000 },
            this.abortController?.signal,
          );
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
   * 初始化sudo会话，一次性获取权限并安装缺失工具、设置脚本权限
   */
  private async initializeSudoSession(): Promise<void> {
    // 只在 Linux 系统上需要sudo会话
    if (process.platform !== 'linux') {
      return;
    }

    // 检查是否为root用户，如果是则不需要sudo
    if (process.getuid && process.getuid() === 0) {
      this.sudoSessionActive = true;
      return;
    }

    try {
      this.updateStatus({
        status: 'preparing',
        message: '获取管理员权限并初始化环境...',
        currentStep: 'preparing-environment',
      });

      // 启动sudo助手进程
      await this.startSudoHelper();

      // 检查是否需要安装基础工具
      const missingTools = this.environmentCheckResult?.missingBasicTools || [];

      // 构建一次性执行的命令列表
      const commands: string[] = [];

      if (missingTools.length > 0) {
        // 添加基础工具安装命令
        commands.push(`dnf install -y ${missingTools.join(' ')}`);
      }

      // 添加脚本权限设置命令（如果部署目录存在）
      const scriptsPath = path.join(this.deploymentPath, 'deploy/scripts');
      if (fs.existsSync(scriptsPath)) {
        commands.push(
          `find "${scriptsPath}" -name "*.sh" -type f -exec chmod +x {} +`,
        );
      }

      if (commands.length > 0) {
        // 使用sudo助手执行命令
        const combinedCommand = commands.join(' && ');
        await this.executeSudoCommand(combinedCommand, 300000); // 5分钟超时

        let message = '管理员权限获取成功';
        if (missingTools.length > 0) {
          message += `，已安装工具: ${missingTools.join(', ')}`;
        }
        if (fs.existsSync(scriptsPath)) {
          message += '，脚本权限已设置';
        }

        this.updateStatus({
          message,
          currentStep: 'preparing-environment',
        });
      } else {
        // 即使没有要执行的命令，也要验证sudo助手是否正常工作
        await this.executeSudoCommand('echo "权限验证成功"', 30000);

        this.updateStatus({
          message: '管理员权限获取成功',
          currentStep: 'preparing-environment',
        });
      }

      this.sudoSessionActive = true;

      // 启动进程监控
      this.startSudoHelperMonitor();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 检查是否是用户取消操作
      if (
        errorMessage.includes('cancelled') ||
        errorMessage.includes('aborted')
      ) {
        throw new Error('用户取消了权限授权操作');
      }

      // 检查是否是权限被拒绝
      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('permission')
      ) {
        throw new Error(
          '管理员权限验证失败，请确保密码正确或用户具有管理员权限',
        );
      }

      this.updateStatus({
        status: 'error',
        message: `权限获取阶段失败: ${errorMessage}`,
        currentStep: 'preparing-environment',
      });

      throw new Error(`获取管理员权限失败: ${errorMessage}`);
    }
  }

  /**
   * 启动sudo助手进程，只需要一次密码输入
   */
  private async startSudoHelper(): Promise<void> {
    if (process.platform !== 'linux') {
      return;
    }

    // 检查是否为root用户
    if (process.getuid && process.getuid() === 0) {
      return;
    }

    try {
      // 创建临时目录
      const tempDir = path.join(this.cachePath, 'temp-sudo');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 创建sudo助手脚本
      const helperScriptPath = path.join(tempDir, 'sudo-helper.sh');
      const helperScriptContent = `#!/bin/bash
# Sudo助手脚本，保持长期运行的sudo会话

# 不使用 set -e，因为我们需要手动处理错误以保持进程运行
# set -o pipefail 也可能导致意外退出，所以也不使用

# 设置信号处理，确保优雅退出
trap 'echo "HELPER_SIGNAL_RECEIVED_$$" >&2; exit 0' SIGTERM SIGINT

# 输出调试信息
echo "HELPER_STARTED_$$" >&2

# 设置读取超时和错误处理
export TIMEOUT=3

# 全局变量来跟踪当前是否有长时间运行的命令
RUNNING_COMMAND_PID=""

# 创建命名管道用于健康检查通信
HEALTH_PIPE="/tmp/health_check_$$"
mkfifo "$HEALTH_PIPE" 2>/dev/null || true

# 后台健康检查处理函数
health_check_handler() {
    while true; do
        if [ -p "$HEALTH_PIPE" ]; then
            if read -t 1 health_cmd < "$HEALTH_PIPE" 2>/dev/null; then
                if [[ "$health_cmd" == echo*HEALTH_CHECK* ]]; then
                    eval "$health_cmd" 2>/dev/null || true
                    echo "COMMAND_DONE_$$"
                    exec 1>&1 2>&2
                fi
            fi
        fi
        sleep 0.1
    done
}

# 启动后台健康检查处理器
health_check_handler &
HEALTH_HANDLER_PID=$!

# 主循环：读取命令并执行
while true; do
    # 检查是否有输入可读，使用更短的超时避免阻塞
    if ! IFS= read -r -t 2 command 2>/dev/null; then
        # 读取超时，检查进程是否还应该继续运行
        # 发送一个心跳信号表明进程仍然活跃（降低频率）
        if [ $((RANDOM % 60)) -eq 0 ]; then
            echo "HELPER_HEARTBEAT_$$" >&2 2>/dev/null || true
        fi
        continue
    fi
    
    # 输出调试信息
    echo "RECEIVED_COMMAND: $command" >&2
    
    # 检查退出命令
    if [ "$command" = "EXIT" ]; then
        echo "HELPER_EXITING_$$" >&2
        # 清理后台健康检查进程
        kill $HEALTH_HANDLER_PID 2>/dev/null || true
        rm -f "$HEALTH_PIPE" 2>/dev/null || true
        break
    fi
    
    # 检查命令是否为空
    if [ -z "$command" ]; then
        echo "EMPTY_COMMAND_$$" >&2
        echo "COMMAND_DONE_$$"
        continue
    fi
    
    # 检查健康检查命令
    if [[ "$command" == echo*HEALTH_CHECK* ]]; then
        # 将健康检查命令发送到后台处理器
        if [ -p "$HEALTH_PIPE" ]; then
            echo "$command" > "$HEALTH_PIPE" &
        else
            # 如果管道不可用，直接处理
            eval "$command" 2>/dev/null || true
            echo "COMMAND_DONE_$$"
            exec 1>&1 2>&2
        fi
        continue
    fi
    
    # 执行命令并捕获退出码，使用子shell避免影响主进程
    # 添加超时保护，避免长时间运行的命令阻塞助手进程
    (
        # 在子shell中执行命令，设置超时保护（30分钟）
        timeout 1800 bash -c "$command" 2>&1 || exit $?
    ) &
    RUNNING_COMMAND_PID=$!
    
    # 等待命令完成
    wait $RUNNING_COMMAND_PID
    cmd_exit_code=$?
    RUNNING_COMMAND_PID=""
    
    # 处理timeout命令的特殊退出码
    if [ $cmd_exit_code -eq 124 ]; then
        echo "COMMAND_ERROR_TIMEOUT_$$" >&2
        echo "COMMAND_ERROR_124_$$"
    elif [ $cmd_exit_code -eq 0 ]; then
        echo "COMMAND_SUCCESS_$$"
    else
        echo "COMMAND_ERROR_\${cmd_exit_code}_$$"
    fi
    
    echo "COMMAND_DONE_$$"
    
    # 强制刷新输出缓冲区
    exec 1>&1
    exec 2>&2
done

# 清理
kill $HEALTH_HANDLER_PID 2>/dev/null || true
rm -f "$HEALTH_PIPE" 2>/dev/null || true

echo "HELPER_TERMINATED_$$" >&2
exit 0
`;

      // 写入助手脚本
      fs.writeFileSync(helperScriptPath, helperScriptContent, { mode: 0o755 });

      // 使用pkexec启动助手进程，只需要输入一次密码
      const sudoCommand = this.getSudoCommand();

      if (!sudoCommand.includes('pkexec')) {
        throw new Error('当前系统不支持图形化权限验证工具');
      }

      // 启动长期运行的sudo助手进程
      const command = `${sudoCommand}bash "${helperScriptPath}"`;

      this.sudoHelperProcess = spawn('bash', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        // 设置进程选项以提高稳定性
        env: {
          ...process.env,
          PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
        },
      });

      // 等待进程启动并准备就绪
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('sudo助手进程启动超时，请检查权限验证是否完成'));
        }, 120000); // 增加到120秒超时，给用户更充足时间输入密码

        let isResolved = false;
        let helperStarted = false;

        this.sudoHelperProcess.stdout?.on('data', (data: Buffer) => {
          const output = data.toString();

          // 检查助手是否已启动
          if (output.includes('HELPER_STARTED_') && !helperStarted) {
            helperStarted = true;
            if (process.env.NODE_ENV === 'development') {
              console.log('Sudo助手进程已启动');
            }
          }

          // 检查是否是我们的命令完成标记，如果是说明进程已经启动并可以接收命令
          if (
            (output.includes('COMMAND_DONE_') ||
              output.includes('COMMAND_SUCCESS_')) &&
            !isResolved
          ) {
            clearTimeout(timeout);
            isResolved = true;
            resolve(void 0);
          }
        });

        this.sudoHelperProcess.stderr?.on('data', (data: Buffer) => {
          const errorOutput = data.toString();

          // 检查助手启动信息
          if (errorOutput.includes('HELPER_STARTED_') && !helperStarted) {
            helperStarted = true;
            if (process.env.NODE_ENV === 'development') {
              console.log('Sudo助手进程已启动 (从stderr)');
            }
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('Sudo Helper Stderr:', errorOutput.trim());
          }
        });

        this.sudoHelperProcess.on('error', (error: Error) => {
          if (!isResolved) {
            clearTimeout(timeout);
            isResolved = true;
            reject(new Error(`sudo助手进程启动失败: ${error.message}`));
          }
        });

        this.sudoHelperProcess.on('exit', (code: number) => {
          if (!isResolved) {
            clearTimeout(timeout);
            isResolved = true;

            if (code === 126) {
              reject(
                new Error(
                  'sudo助手进程启动失败: 权限被拒绝，请确保用户具有管理员权限',
                ),
              );
            } else if (code === 127) {
              reject(
                new Error('sudo助手进程启动失败: 找不到命令，请检查系统配置'),
              );
            } else {
              reject(new Error(`sudo助手进程启动时退出，代码: ${code}`));
            }
          }
        });

        // 等待一小段时间确保进程完全启动，然后发送测试命令
        setTimeout(() => {
          if (this.sudoHelperProcess && !this.sudoHelperProcess.killed) {
            this.sudoHelperProcess.stdin?.write('echo "Helper Ready"\n');
          }
        }, 2000);
      });

      // 清理临时脚本文件
      try {
        fs.unlinkSync(helperScriptPath);
      } catch {
        // 忽略清理错误
      }
    } catch (error) {
      // 清理可能启动的进程
      if (this.sudoHelperProcess) {
        try {
          this.sudoHelperProcess.kill();
        } catch {
          // 忽略清理错误
        }
        this.sudoHelperProcess = undefined;
      }

      throw new Error(
        `启动sudo助手进程失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 尝试重新启动sudo助手进程
   */
  private async restartSudoHelper(): Promise<void> {
    if (process.platform !== 'linux') {
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('尝试重新启动sudo助手进程...');
    }

    // 清理现有进程
    this.cleanupSudoHelper();

    // 等待一小段时间确保清理完成
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 重置状态
    this.sudoSessionActive = false;

    try {
      // 重新启动助手进程，增加重试机制
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          await this.startSudoHelper();
          this.sudoSessionActive = true;

          if (process.env.NODE_ENV === 'development') {
            console.log('sudo助手进程重新启动成功');
          }
          return;
        } catch (error) {
          attempts++;
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `sudo助手进程启动尝试 ${attempts}/${maxAttempts} 失败:`,
              error,
            );
          }

          if (attempts < maxAttempts) {
            // 等待一段时间后重试
            await new Promise((resolve) =>
              setTimeout(resolve, 2000 * attempts),
            );
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      this.sudoSessionActive = false;
      throw new Error(
        `重启sudo助手进程失败（尝试了${3}次）: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 启动sudo助手进程监控
   */
  private startSudoHelperMonitor(): void {
    if (process.platform !== 'linux' || this.sudoHelperMonitorInterval) {
      return;
    }

    // 每60秒检查一次sudo助手进程状态（降低检查频率减少系统压力）
    this.sudoHelperMonitorInterval = setInterval(async () => {
      if (this.sudoSessionActive && this.sudoHelperProcess) {
        try {
          // 检查进程是否仍然活跃
          if (
            this.sudoHelperProcess.killed ||
            this.sudoHelperProcess.exitCode !== null
          ) {
            if (process.env.NODE_ENV === 'development') {
              console.log('检测到sudo助手进程已退出，准备重启...');
            }

            // 尝试重启进程
            try {
              await this.restartSudoHelper();
              if (process.env.NODE_ENV === 'development') {
                console.log('sudo助手进程重启成功');
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('sudo助手进程重启失败:', error);
              }
              // 重启失败，停止监控并标记会话为非活跃状态
              this.stopSudoHelperMonitor();
              this.sudoSessionActive = false;

              // 可以考虑发送错误状态通知给UI
              this.updateStatus({
                status: 'error',
                message: 'sudo助手进程重启失败，部署可能中断',
                currentStep: 'error',
              });
            }
          } else {
            // 进程仍在运行，检查是否有命令正在执行
            if (this.isCommandExecuting) {
              // 有命令正在执行，检查是否超过了合理的执行时间（20分钟）
              const now = Date.now();
              const executionTime = this.activeCommandStartTime
                ? now - this.activeCommandStartTime
                : 0;
              const maxExecutionTime = 20 * 60 * 1000; // 20分钟

              if (executionTime > maxExecutionTime) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(
                    `检测到命令执行时间过长（${Math.round(executionTime / 1000)}秒），可能存在问题`,
                  );
                }
                // 命令执行时间过长，可能出现问题，但不立即重启，只记录警告
                // 让命令继续执行，但下次检查时如果还是这样就考虑重启
              } else {
                if (process.env.NODE_ENV === 'development') {
                  console.log(
                    `跳过健康检查，有命令正在执行（执行时间: ${Math.round(executionTime / 1000)}秒）`,
                  );
                }
                // 跳过健康检查，命令正在正常执行
                return;
              }
            } else {
              // 没有命令正在执行，进行健康检查
              try {
                await this.checkSudoHelperHealth();
                // 健康检查通过，重置错误计数
                if (process.env.NODE_ENV === 'development') {
                  console.log('sudo助手进程健康检查通过');
                }
              } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('sudo助手进程健康检查失败，准备重启:', error);
                }

                try {
                  await this.restartSudoHelper();
                  if (process.env.NODE_ENV === 'development') {
                    console.log('sudo助手进程重启成功');
                  }
                } catch (restartError) {
                  if (process.env.NODE_ENV === 'development') {
                    console.error('sudo助手进程重启失败:', restartError);
                  }
                  // 重启失败，停止监控
                  this.stopSudoHelperMonitor();
                  this.sudoSessionActive = false;

                  // 发送错误状态通知
                  this.updateStatus({
                    status: 'error',
                    message: 'sudo助手进程无法恢复，部署中断',
                    currentStep: 'error',
                  });
                }
              }
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('sudo助手进程监控出错:', error);
          }
          // 发生意外错误，也应该尝试恢复
          try {
            await this.restartSudoHelper();
          } catch (restartError) {
            this.stopSudoHelperMonitor();
            this.sudoSessionActive = false;
          }
        }
      }
    }, 60000); // 改为60秒检查一次
  }

  /**
   * 停止sudo助手进程监控
   */
  private stopSudoHelperMonitor(): void {
    if (this.sudoHelperMonitorInterval) {
      clearInterval(this.sudoHelperMonitorInterval);
      this.sudoHelperMonitorInterval = undefined;
    }
  }

  /**
   * 清理sudo助手进程
   */
  private cleanupSudoHelper(): void {
    // 停止进程监控
    this.stopSudoHelperMonitor();

    // 重置命令执行状态
    this.isCommandExecuting = false;
    this.activeCommandStartTime = undefined;

    if (this.sudoHelperProcess) {
      try {
        // 发送退出命令
        if (!this.sudoHelperProcess.killed && this.sudoHelperProcess.stdin) {
          this.sudoHelperProcess.stdin.write('EXIT\n');
        }

        // 等待一小段时间让进程正常退出
        setTimeout(() => {
          if (this.sudoHelperProcess && !this.sudoHelperProcess.killed) {
            try {
              this.sudoHelperProcess.kill('SIGTERM');

              // 如果SIGTERM不起作用，几秒后使用SIGKILL
              setTimeout(() => {
                if (this.sudoHelperProcess && !this.sudoHelperProcess.killed) {
                  try {
                    this.sudoHelperProcess.kill('SIGKILL');
                  } catch {
                    // 忽略SIGKILL错误
                  }
                }
              }, 3000);
            } catch {
              // 忽略SIGTERM错误
            }
          }
        }, 1000);
      } catch {
        // 如果正常退出失败，强制终止进程
        try {
          if (this.sudoHelperProcess && !this.sudoHelperProcess.killed) {
            this.sudoHelperProcess.kill('SIGKILL');
          }
        } catch {
          // 忽略强制终止的错误
        }
      }

      // 移除所有事件监听器
      try {
        this.sudoHelperProcess.removeAllListeners();
      } catch {
        // 忽略移除监听器的错误
      }

      this.sudoHelperProcess = undefined;
    }

    // 清理临时目录
    const tempDir = path.join(this.cachePath, 'temp-sudo');
    if (fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        files.forEach((file) => {
          try {
            fs.unlinkSync(path.join(tempDir, file));
          } catch {
            // 忽略文件删除错误
          }
        });
        fs.rmdirSync(tempDir);
      } catch {
        // 忽略目录清理错误
      }
    }
  }

  /**
   * 获取合适的sudo命令前缀
   */
  private getSudoCommand(): string {
    // 检查是否为root用户
    if (process.getuid && process.getuid() === 0) {
      return '';
    }

    // 在Linux系统上使用图形化sudo工具
    if (process.platform === 'linux') {
      // 构建完整的环境变量，确保 PATH 包含常用的系统路径
      const currentPath = process.env.PATH || '';
      const additionalPaths = [
        '/usr/local/bin',
        '/usr/bin',
        '/bin',
        '/usr/sbin',
        '/sbin',
      ];

      // 确保所有常用路径都在 PATH 中
      const pathArray = currentPath.split(':');
      additionalPaths.forEach((path) => {
        if (!pathArray.includes(path)) {
          pathArray.push(path);
        }
      });
      const fullPath = pathArray.join(':');

      // 优先使用 pkexec（现代 Linux 桌面环境的标准）
      // 传递必要的环境变量，包括完整的 PATH
      return `pkexec env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY PATH="${fullPath}" `;
    }

    return '';
  }

  /**
   * 构建需要 root 权限的命令（优化版本，减少密码输入）
   */
  private buildRootCommand(
    scriptPath: string,
    useInputRedirection?: boolean,
    inputData?: string,
    envVars?: Record<string, string>,
  ): string {
    // 获取sudo命令前缀
    const sudoCommand = this.getSudoCommand();

    // 构建环境变量字符串
    let envString = '';
    if (envVars && Object.keys(envVars).length > 0) {
      const envPairs = Object.entries(envVars)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      envString = envPairs + ' ';
    }

    // 直接执行脚本，不需要 chmod（权限已在克隆仓库后设置）
    let command = '';
    if (useInputRedirection && inputData) {
      command = `${sudoCommand}bash -c '${envString}echo "${inputData}" | bash "${scriptPath}"'`;
    } else {
      command = `${sudoCommand}bash -c '${envString}bash "${scriptPath}"'`;
    }

    return command;
  }

  /**
   * 获取用户友好的错误消息
   */
  private getUserFriendlyErrorMessage(error: unknown, context: string): string {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 网络相关错误
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('resolve') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED')
    ) {
      return `${context}：网络连接失败，请检查网络连接和防火墙设置`;
    }

    // 权限相关错误
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('EACCES')
    ) {
      return `${context}：权限不足，请确保具有管理员权限`;
    }

    // 文件不存在错误
    if (
      errorMessage.includes('ENOENT') ||
      errorMessage.includes('No such file') ||
      errorMessage.includes('not found')
    ) {
      return `${context}：所需文件或命令不存在，请检查安装是否完整`;
    }

    // 磁盘空间不足
    if (
      errorMessage.includes('ENOSPC') ||
      errorMessage.includes('No space left')
    ) {
      return `${context}：磁盘空间不足，请清理磁盘空间后重试`;
    }

    // 用户取消操作
    if (
      errorMessage.includes('cancelled') ||
      errorMessage.includes('aborted') ||
      errorMessage.includes('用户停止')
    ) {
      return `${context}：操作被用户取消`;
    }

    // Kubernetes相关错误
    if (
      errorMessage.includes('kubectl') ||
      errorMessage.includes('k3s') ||
      errorMessage.includes('cluster') ||
      errorMessage.includes('kubeconfig')
    ) {
      return `${context}：Kubernetes集群配置错误，请检查k3s服务状态`;
    }

    // 端口占用错误
    if (
      errorMessage.includes('port') &&
      errorMessage.includes('already in use')
    ) {
      return `${context}：端口被占用，请检查相关服务是否已在运行`;
    }

    // 默认返回原始错误消息，但添加上下文
    return `${context}：${errorMessage}`;
  }

  /**
   * 停止部署
   */
  async stopDeployment(): Promise<void> {
    try {
      // 如果有正在进行的部署流程，中断它
      if (this.abortController && !this.abortController.signal.aborted) {
        if (process.env.NODE_ENV === 'development') {
          console.log('正在停止部署流程...');
        }

        // 发送中断信号
        this.abortController.abort();
        if (process.env.NODE_ENV === 'development') {
          console.log('已发送中断信号给所有正在运行的进程');
        }

        // 等待一小段时间确保进程能够响应中断信号
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (process.env.NODE_ENV === 'development') {
          console.log('等待进程响应中断信号完成');
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('部署流程已成功停止');
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('没有正在进行的部署流程，直接更新为停止状态');
        }
      }

      // 统一更新为停止状态，不使用前端无法识别的 'stopping' 状态
      this.updateStatus({
        status: 'idle',
        message: '部署已停止',
        currentStep: 'stopped',
      });
    } catch (error) {
      console.error('停止部署时出错:', error);

      // 即使停止过程出错，也要更新状态
      this.updateStatus({
        status: 'idle',
        message: '部署已停止',
        currentStep: 'stopped',
      });
    } finally {
      // 清理资源
      if (process.env.NODE_ENV === 'development') {
        console.log('清理部署相关资源');
      }
      this.abortController = undefined;
      this.sudoSessionActive = false; // 重置sudo会话状态
      this.cleanupSudoHelper(); // 清理sudo助手进程
    }
  }

  /**
   * 添加 hosts 条目，将域名指向本地
   */
  async addHostsEntries(domains: string[]): Promise<void> {
    try {
      // 只在 Linux 和 macOS 系统上执行
      if (process.platform !== 'linux' && process.platform !== 'darwin') {
        throw new Error('当前系统不支持自动配置 hosts 文件');
      }

      const hostsPath = '/etc/hosts';

      // 检查是否已经存在这些条目
      let hostsContent = '';
      try {
        hostsContent = fs.readFileSync(hostsPath, 'utf8');
      } catch (error) {
        throw new Error(`无法读取 hosts 文件: ${error}`);
      }

      // 过滤出需要添加的域名（避免重复添加）
      // 使用正则表达式检测域名是否已存在，处理多个空格/tab的情况
      const domainsToAdd = domains.filter((domain) => {
        // 匹配 127.0.0.1 + 一个或多个空白字符 + 域名 + 行尾或空白字符或注释
        const domainRegex = new RegExp(
          `^127\\.0\\.0\\.1\\s+${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$|#)`,
          'm',
        );
        return !domainRegex.test(hostsContent);
      });

      if (domainsToAdd.length === 0) {
        // 所有域名都已存在，无需添加
        return;
      }

      // 检查是否已经存在 openEuler Intelligence 注释标签
      const commentExists = hostsContent.includes(
        '# openEuler Intelligence Local Deployment',
      );

      // 构建要添加的内容
      const entriesToAdd = domainsToAdd
        .map((domain) => `127.0.0.1 ${domain}`)
        .join('\n');

      let newContent: string;
      if (commentExists) {
        // 如果注释已存在，在注释后面插入新的域名条目
        const commentRegex = /(# openEuler Intelligence Local Deployment\n)/;
        newContent = hostsContent.replace(commentRegex, `$1${entriesToAdd}\n`);
      } else {
        // 如果注释不存在，添加完整的注释块和域名条目
        newContent =
          hostsContent.trim() +
          '\n\n# openEuler Intelligence Local Deployment\n' +
          entriesToAdd +
          '\n';
      }

      // 使用管理员权限写入 hosts 文件
      // 创建临时文件写入内容，然后移动到 hosts 文件位置
      const tempFile = '/tmp/hosts_new';

      // 先将内容写入临时文件，避免直接在命令行中处理复杂的字符串转义
      try {
        fs.writeFileSync(tempFile, newContent);
      } catch (error) {
        throw new Error(`无法创建临时文件: ${error}`);
      }

      // 移动临时文件到 hosts 文件位置
      await this.executeSudoCommand(`mv ${tempFile} ${hostsPath}`, 30000);

      console.log(`已添加以下域名到 hosts 文件: ${domainsToAdd.join(', ')}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`配置 hosts 文件失败: ${errorMessage}`);
    }
  }

  /**
   * 清理部署文件
   */
  async cleanup(): Promise<void> {
    // 清理sudo助手进程
    this.cleanupSudoHelper();

    // 清理部署文件
    if (fs.existsSync(this.deploymentPath)) {
      fs.rmSync(this.deploymentPath, { recursive: true, force: true });
    }

    this.updateStatus({
      status: 'idle',
      message: '清理完成',
      currentStep: 'idle',
    });
  }

  /**
   * 检查sudo助手进程健康状态
   */
  private async checkSudoHelperHealth(): Promise<void> {
    if (!this.sudoHelperProcess || this.sudoHelperProcess.killed) {
      throw new Error('sudo助手进程未运行');
    }

    // 首先检查进程基本状态
    if (this.sudoHelperProcess.exitCode !== null) {
      throw new Error(
        `sudo助手进程已退出，退出码: ${this.sudoHelperProcess.exitCode}`,
      );
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('sudo助手进程健康检查超时'));
      }, 10000); // 增加到10秒超时，给系统更多时间响应

      let isResolved = false;
      const healthCheckId = Date.now();

      const dataHandler = (data: Buffer) => {
        const output = data.toString();
        if (
          output.includes(`HEALTH_CHECK_${healthCheckId}_DONE`) &&
          !isResolved
        ) {
          clearTimeout(timeout);
          isResolved = true;
          cleanup();
          resolve();
        }
      };

      const errorHandler = (error: Error) => {
        if (!isResolved) {
          clearTimeout(timeout);
          isResolved = true;
          cleanup();
          reject(error);
        }
      };

      const exitHandler = (code: number | null) => {
        if (!isResolved) {
          clearTimeout(timeout);
          isResolved = true;
          cleanup();
          reject(new Error(`sudo助手进程在健康检查期间退出，代码: ${code}`));
        }
      };

      const cleanup = () => {
        this.sudoHelperProcess?.stdout?.off('data', dataHandler);
        this.sudoHelperProcess?.off('error', errorHandler);
        this.sudoHelperProcess?.off('exit', exitHandler);
      };

      this.sudoHelperProcess.stdout?.on('data', dataHandler);
      this.sudoHelperProcess.on('error', errorHandler);
      this.sudoHelperProcess.on('exit', exitHandler);

      try {
        // 发送健康检查命令
        this.sudoHelperProcess.stdin?.write(
          `echo "HEALTH_CHECK_${healthCheckId}_DONE"\n`,
        );
      } catch (writeError) {
        cleanup();
        reject(
          new Error(
            `健康检查命令发送失败: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
          ),
        );
      }
    });
  }

  /**
   * 使用sudo助手进程执行命令，无需重复密码输入
   */
  private async executeSudoCommand(
    command: string,
    timeout: number = 60000,
    envVars?: Record<string, string>,
  ): Promise<{ stdout: string; stderr: string }> {
    if (process.platform !== 'linux') {
      // 非Linux系统直接执行
      return await execAsyncWithAbort(
        command,
        { timeout, env: { ...process.env, ...envVars } },
        this.abortController?.signal,
      );
    }

    // 检查是否为root用户
    if (process.getuid && process.getuid() === 0) {
      return await execAsyncWithAbort(
        command,
        { timeout, env: { ...process.env, ...envVars } },
        this.abortController?.signal,
      );
    }

    // 检查sudo助手进程是否仍然活跃
    if (!this.sudoHelperProcess || this.sudoHelperProcess.killed) {
      throw new Error('sudo助手进程未启动或已终止，请重新初始化sudo会话');
    }

    // 检查sudo助手进程健康状态，如果不健康则尝试重启
    try {
      await this.checkSudoHelperHealth();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('sudo助手进程健康检查失败，尝试重启:', error);
      }

      try {
        await this.restartSudoHelper();
      } catch (restartError) {
        // 重启失败，在 Linux 系统上使用后备方案
        if (process.env.NODE_ENV === 'development') {
          console.log('sudo助手进程重启失败，尝试使用后备方案:', restartError);
        }

        // 只在 Linux 系统上尝试后备方案
        if (process.platform === 'linux') {
          try {
            return await this.executeSudoCommandFallback(
              command,
              timeout,
              envVars,
            );
          } catch (fallbackError) {
            throw new Error(
              `sudo助手进程重启失败且后备方案也失败: ${restartError instanceof Error ? restartError.message : String(restartError)}. 后备方案错误: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
            );
          }
        } else {
          // 非 Linux 系统直接抛出重启错误
          throw new Error(
            `sudo助手进程重启失败: ${restartError instanceof Error ? restartError.message : String(restartError)}`,
          );
        }
      }
    }

    return new Promise((resolve, reject) => {
      // 标记命令开始执行
      this.isCommandExecuting = true;
      this.activeCommandStartTime = Date.now();

      const timeoutId = setTimeout(() => {
        // 命令执行完成，清除状态
        this.isCommandExecuting = false;
        this.activeCommandStartTime = undefined;
        reject(new Error(`命令执行超时: ${command}`));
      }, timeout);

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const dataHandler = (data: Buffer) => {
        const output = data.toString();
        stdout += output;

        // 检查命令是否成功完成
        if (
          output.includes(`COMMAND_SUCCESS_${this.sudoHelperProcess?.pid}`) &&
          !isResolved
        ) {
          clearTimeout(timeoutId);
          isResolved = true;
          // 移除状态标记
          stdout = stdout.replace(
            new RegExp(
              `COMMAND_(SUCCESS|DONE)_${this.sudoHelperProcess?.pid}\\s*`,
              'g',
            ),
            '',
          );
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        }
        // 检查命令是否失败
        else if (
          output.includes(`COMMAND_ERROR_`) &&
          output.includes(`_${this.sudoHelperProcess?.pid}`) &&
          !isResolved
        ) {
          clearTimeout(timeoutId);
          isResolved = true;
          // 提取错误码
          const errorMatch = output.match(
            new RegExp(`COMMAND_ERROR_(\\d+)_${this.sudoHelperProcess?.pid}`),
          );
          const errorCode = errorMatch ? errorMatch[1] : 'unknown';

          // 移除状态标记
          stdout = stdout.replace(
            new RegExp(
              `COMMAND_(ERROR_\\d+|DONE)_${this.sudoHelperProcess?.pid}\\s*`,
              'g',
            ),
            '',
          );

          reject(
            new Error(
              `命令执行失败 (退出码: ${errorCode}): ${stderr.trim() || stdout.trim()}`,
            ),
          );
        }
        // 向后兼容：检查旧的完成标记
        else if (
          output.includes(`COMMAND_DONE_${this.sudoHelperProcess?.pid}`) &&
          !isResolved
        ) {
          clearTimeout(timeoutId);
          isResolved = true;
          // 移除完成标记
          stdout = stdout.replace(
            new RegExp(`COMMAND_DONE_${this.sudoHelperProcess?.pid}\\s*`, 'g'),
            '',
          );
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        }
      };

      const errorHandler = (data: Buffer) => {
        const errorOutput = data.toString();
        stderr += errorOutput;

        // 检查是否有调试信息
        if (process.env.NODE_ENV === 'development') {
          if (
            errorOutput.includes('HELPER_STARTED_') ||
            errorOutput.includes('RECEIVED_COMMAND:') ||
            errorOutput.includes('HELPER_EXITING_') ||
            errorOutput.includes('HELPER_TERMINATED_')
          ) {
            console.log('Sudo Helper Debug:', errorOutput.trim());
          }
        }
      };

      const processErrorHandler = (error: Error) => {
        if (!isResolved) {
          clearTimeout(timeoutId);
          isResolved = true;
          reject(new Error(`sudo助手进程错误: ${error.message}`));
        }
      };

      const processExitHandler = (code: number) => {
        if (!isResolved) {
          clearTimeout(timeoutId);
          isResolved = true;

          // 提供更详细的退出信息
          const stderrInfo = stderr.trim() ? `\nStderr: ${stderr.trim()}` : '';
          const stdoutInfo = stdout.trim() ? `\nStdout: ${stdout.trim()}` : '';

          reject(
            new Error(
              `sudo助手进程异常退出，代码: ${code}${stderrInfo}${stdoutInfo}\n` +
                `这可能是由于:\n` +
                `1. 脚本执行时间过长导致进程超时\n` +
                `2. 系统资源不足\n` +
                `3. 权限问题或认证超时\n` +
                `4. 脚本内部错误导致bash退出`,
            ),
          );
        }
      };

      // 绑定事件监听器
      this.sudoHelperProcess.stdout?.on('data', dataHandler);
      this.sudoHelperProcess.stderr?.on('data', errorHandler);
      this.sudoHelperProcess.on('error', processErrorHandler);
      this.sudoHelperProcess.on('exit', processExitHandler);

      // 构建环境变量字符串
      let envString = '';
      if (envVars && Object.keys(envVars).length > 0) {
        const envPairs = Object.entries(envVars)
          .map(([key, value]) => `export ${key}="${value}"`)
          .join('; ');
        envString = envPairs + '; ';
      }

      // 发送命令到助手进程
      const fullCommand = `${envString}${command}`;
      this.sudoHelperProcess.stdin?.write(`${fullCommand}\n`);

      // 设置清理函数
      const cleanup = () => {
        // 清除命令执行状态
        this.isCommandExecuting = false;
        this.activeCommandStartTime = undefined;

        // 清理事件监听器
        this.sudoHelperProcess.stdout?.off('data', dataHandler);
        this.sudoHelperProcess.stderr?.off('data', errorHandler);
        this.sudoHelperProcess.off('error', processErrorHandler);
        this.sudoHelperProcess.off('exit', processExitHandler);
      };

      // 确保在resolve或reject时清理事件监听器和执行状态
      const originalResolve = resolve;
      const originalReject = reject;

      resolve = (value: any) => {
        cleanup();
        originalResolve(value);
      };

      reject = (reason: any) => {
        cleanup();
        originalReject(reason);
      };
    });
  }

  /**
   * 后备方案：当sudo助手进程不可用时，使用传统的sudo方式执行命令
   * 只适用于 Linux 系统
   */
  private async executeSudoCommandFallback(
    command: string,
    timeout: number = 60000,
    envVars?: Record<string, string>,
  ): Promise<{ stdout: string; stderr: string }> {
    // 此方法只应在 Linux 系统上调用
    if (process.platform !== 'linux') {
      throw new Error('executeSudoCommandFallback 只能在 Linux 系统上使用');
    }

    // 检查是否为root用户
    if (process.getuid && process.getuid() === 0) {
      return await execAsyncWithAbort(
        command,
        { timeout, env: { ...process.env, ...envVars } },
        this.abortController?.signal,
      );
    }

    // 使用传统的sudo方式
    const sudoCommand = this.getSudoCommand();

    // 构建环境变量字符串
    let envString = '';
    if (envVars && Object.keys(envVars).length > 0) {
      const envPairs = Object.entries(envVars)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      envString = envPairs + ' ';
    }

    const fullCommand = `${sudoCommand}bash -c '${envString}${command}'`;

    if (process.env.NODE_ENV === 'development') {
      console.log('使用后备方案执行sudo命令:', fullCommand);
    }

    return await execAsyncWithAbort(
      fullCommand,
      { timeout },
      this.abortController?.signal,
    );
  }
}
