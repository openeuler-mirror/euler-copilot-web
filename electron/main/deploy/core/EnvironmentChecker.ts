// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import * as os from 'os';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface EnvironmentCheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 环境检查器 - 迁移自 reference-scripts/scripts/1-check-env/check_env.sh
 * 但根据需求调整了检查条件
 */
export class EnvironmentChecker {
  /**
   * 执行所有环境检查
   * 迁移自 reference-scripts/scripts/1-check-env，但跳过了 OS 版本检查和离线模式
   */
  async checkAll(): Promise<EnvironmentCheckResult> {
    const result: EnvironmentCheckResult = {
      success: true,
      errors: [],
      warnings: [],
    };

    // 检查主机名
    try {
      await this.checkHostname();
    } catch (error) {
      result.warnings.push(`主机名检查: ${error}`);
    }

    // 检查DNS
    try {
      await this.checkDns();
    } catch (error) {
      result.warnings.push(`DNS检查: ${error}`);
    }

    // 检查内存 (调整为4GB)
    try {
      await this.checkRam();
    } catch (error) {
      result.errors.push(`内存检查: ${error}`);
      result.success = false;
    }

    // 检查磁盘空间 (调整为4GB)
    try {
      await this.checkDiskSpace();
    } catch (error) {
      result.errors.push(`磁盘空间检查: ${error}`);
      result.success = false;
    }

    // 检查网络连接 (只考虑联网部署)
    try {
      await this.checkNetwork();
    } catch (error) {
      result.errors.push(`网络检查: ${error}`);
      result.success = false;
    }

    // 检查必需的系统工具
    try {
      await this.checkRequiredTools();
    } catch (error) {
      result.errors.push(`系统工具检查: ${error}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 检查主机名
   */
  private async checkHostname(): Promise<void> {
    const hostname = os.hostname();
    if (!hostname || hostname.trim() === '') {
      throw new Error('未设置主机名');
    }
  }

  /**
   * 检查DNS配置
   */
  private async checkDns(): Promise<void> {
    try {
      const resolvConf = fs.readFileSync('/etc/resolv.conf', 'utf8');
      if (!resolvConf.includes('nameserver')) {
        throw new Error('DNS未配置');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('resolv.conf文件不存在');
      }
      throw error;
    }
  }

  /**
   * 检查内存 (最低4GB)
   */
  private async checkRam(): Promise<void> {
    const totalMem = os.totalmem();
    const totalMemMB = Math.floor(totalMem / (1024 * 1024));
    const requiredMB = 4 * 1024; // 4GB

    if (totalMemMB < requiredMB) {
      throw new Error(`内存不足，当前: ${totalMemMB}MB，需要: ${requiredMB}MB`);
    }
  }

  /**
   * 检查磁盘空间 (最低4GB可用空间)
   */
  private async checkDiskSpace(): Promise<void> {
    try {
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('无法获取磁盘信息');
      }

      // 解析df输出，获取可用空间
      const diskInfo = lines[1].split(/\s+/);
      const availableStr = diskInfo[3]; // 第4列是可用空间

      // 转换为MB进行比较
      const availableMB = this.parseDiskSize(availableStr);
      const requiredMB = 4 * 1024; // 4GB

      if (availableMB < requiredMB) {
        throw new Error(
          `磁盘空间不足，可用: ${Math.floor(availableMB)}MB，需要: ${requiredMB}MB`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('磁盘空间检查失败');
    }
  }

  /**
   * 解析磁盘大小字符串 (如 "1.5G", "500M") 并转换为MB
   */
  private parseDiskSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)(.)$/);
    if (!match) {
      return 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    switch (unit) {
      case 'K':
        return value / 1024;
      case 'M':
        return value;
      case 'G':
        return value * 1024;
      case 'T':
        return value * 1024 * 1024;
      default:
        return value / (1024 * 1024); // 假设为字节
    }
  }

  /**
   * 检查网络连接
   */
  private async checkNetwork(): Promise<void> {
    try {
      // 使用curl检查网络连接
      await execAsync(
        'curl -s --connect-timeout 5 https://www.baidu.com > /dev/null',
        {
          timeout: 10000,
        },
      );
    } catch {
      throw new Error('无法访问外部网络，请检查网络连接');
    }
  }

  /**
   * 检查必需的系统工具
   */
  private async checkRequiredTools(): Promise<void> {
    const requiredTools = ['git', 'curl', 'docker', 'kubectl', 'helm'];
    const missingTools: string[] = [];

    for (const tool of requiredTools) {
      try {
        await execAsync(`which ${tool}`);
      } catch {
        missingTools.push(tool);
      }
    }

    if (missingTools.length > 0) {
      throw new Error(`缺少必需工具: ${missingTools.join(', ')}`);
    }
  }
}
