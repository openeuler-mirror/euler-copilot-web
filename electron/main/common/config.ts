// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { userDataPath } from './cache-conf';

/**
 * 桌面应用配置接口
 */
export interface DesktopConfig {
  base_url: string;
  // 可扩展其他配置项
  [key: string]: unknown;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: DesktopConfig = {
  base_url: 'https://www.eulercopilot.local',
};

/**
 * 配置文件路径
 */
export const CONFIG_DIR = path.join(userDataPath, 'Config');
export const CONFIG_FILE_PATH = path.join(CONFIG_DIR, 'desktop-config.json');
export const CONFIG_BACKUP_PATH = path.join(
  CONFIG_DIR,
  'desktop-config.backup.json',
);

/**
 * 配置管理类
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: DesktopConfig | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 检查配置文件是否存在
   */
  public isConfigExists(): boolean {
    return fs.existsSync(CONFIG_FILE_PATH);
  }

  /**
   * 确保配置目录存在
   */
  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  /**
   * 配置验证函数
   */
  private validateConfig(config: any): config is DesktopConfig {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // 检查必需的 base_url 字段
    if (typeof config.base_url !== 'string' || !config.base_url.trim()) {
      return false;
    }

    // 检查 URL 格式
    try {
      new URL(config.base_url);
    } catch {
      return false;
    }

    return true;
  }

  /**
   * 创建备份配置文件
   */
  private createBackup(config: DesktopConfig): void {
    try {
      fs.writeFileSync(
        CONFIG_BACKUP_PATH,
        JSON.stringify(config, null, 2),
        'utf8',
      );
    } catch (error) {
      console.warn('Failed to create config backup:', error);
    }
  }

  /**
   * 从备份恢复配置
   */
  private restoreFromBackup(): DesktopConfig | null {
    try {
      if (fs.existsSync(CONFIG_BACKUP_PATH)) {
        const backupData = fs.readFileSync(CONFIG_BACKUP_PATH, 'utf8');
        const backupConfig = JSON.parse(backupData);

        if (this.validateConfig(backupConfig)) {
          console.log('Restored config from backup');
          return backupConfig;
        }
      }
    } catch (error) {
      console.warn('Failed to restore from backup:', error);
    }

    return null;
  }

  /**
   * 初始化配置文件（使用默认配置）
   */
  public initializeConfig(): void {
    try {
      this.ensureConfigDir();
      if (!this.isConfigExists()) {
        this.writeConfig(DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('Failed to initialize config:', error);
      throw error;
    }
  }

  /**
   * 读取配置文件
   */
  public readConfig(): DesktopConfig {
    if (this.config) {
      return { ...this.config };
    }

    try {
      if (!this.isConfigExists()) {
        this.initializeConfig();
        return { ...DEFAULT_CONFIG };
      }

      const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsedConfig = JSON.parse(configContent);

      // 验证配置文件的有效性
      if (!this.validateConfig(parsedConfig)) {
        console.warn('Invalid config file detected, attempting recovery...');

        // 尝试从备份恢复
        const backupConfig = this.restoreFromBackup();
        if (backupConfig) {
          this.config = backupConfig;
          // 重写配置文件
          this.writeConfig(backupConfig);
          return { ...backupConfig };
        }

        // 备份恢复失败，使用默认配置
        console.warn('Backup recovery failed, using default config');
        this.config = { ...DEFAULT_CONFIG };
        this.writeConfig(this.config);
        return { ...this.config };
      }

      // 合并默认配置，确保必需字段存在
      this.config = { ...DEFAULT_CONFIG, ...parsedConfig };
      return { ...this.config };
    } catch (error) {
      console.error('Failed to read config:', error);
      // 返回默认配置
      this.config = { ...DEFAULT_CONFIG };
      return { ...this.config };
    }
  }

  /**
   * 写入配置文件
   */
  public writeConfig(config: DesktopConfig): void {
    try {
      // 验证配置
      if (!this.validateConfig(config)) {
        throw new Error('Invalid config provided');
      }

      this.ensureConfigDir();

      // 在写入新配置前，如果存在旧配置，先创建备份
      if (this.isConfigExists() && this.config) {
        this.createBackup(this.config);
      }

      // 写入新配置
      fs.writeFileSync(
        CONFIG_FILE_PATH,
        JSON.stringify(config, null, 2),
        'utf-8',
      );
      this.config = { ...config };
    } catch (error) {
      console.error('Failed to write config:', error);
      throw error;
    }
  }

  /**
   * 更新配置（部分更新）
   */
  public updateConfig(updates: Partial<DesktopConfig>): DesktopConfig {
    const currentConfig = this.readConfig();
    const newConfig = { ...currentConfig, ...updates };
    this.writeConfig(newConfig);
    return newConfig;
  }

  /**
   * 获取配置项
   */
  public getConfigValue<T = unknown>(key: keyof DesktopConfig): T | undefined {
    const config = this.readConfig();
    return config[key] as T;
  }

  /**
   * 设置配置项
   */
  public setConfigValue(key: keyof DesktopConfig, value: unknown): void {
    this.updateConfig({ [key]: value });
  }

  /**
   * 重置为默认配置
   */
  public resetConfig(): void {
    this.writeConfig(DEFAULT_CONFIG);
  }
}

/**
 * 获取配置管理器实例的便捷函数
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}
