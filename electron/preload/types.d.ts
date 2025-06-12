// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

/**
 * Electron Preload API 类型定义
 */

export interface DesktopConfig {
  base_url: string;
  [key: string]: any;
}

export interface ServerValidationResult {
  isValid: boolean;
  error?: string;
  status?: number;
  responseTime?: number;
}

export interface DesktopAppAPI {
  // IPC 渲染器（原始接口）
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, listener: (...args: any[]) => void): void;
    once(channel: string, listener: (...args: any[]) => void): void;
    removeListener(channel: string, listener: (...args: any[]) => void): void;
    removeAllListeners(channel: string): void;
  };

  // 配置管理
  config: {
    get(): Promise<DesktopConfig | null>;
    update(updates: Partial<DesktopConfig>): Promise<DesktopConfig | null>;
    reset(): Promise<DesktopConfig | null>;
    setProxyUrl(url: string): Promise<boolean>;
    getProxyUrl(): Promise<string>;
    validateServer(url: string): Promise<ServerValidationResult>;
  };

  // 窗口控制
  window: {
    control(command: 'minimize' | 'maximize' | 'close'): Promise<void>;
    close(): Promise<void>;
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    isMaximized(): Promise<boolean>;
    onMaximizedChange(callback: (isMaximized: boolean) => void): void;
    offMaximizedChange(): void;
  };

  // 主题
  theme: {
    toggle(): Promise<any>;
    setSystem(): Promise<any>;
  };

  // 进程信息
  process: {
    platform: string;
    arch: string;
    versions: NodeJS.ProcessVersions;
    env: Record<string, string | undefined>;
  };

  // 实用工具
  utils: {
    isValidUrl(url: string): boolean;
    formatUrl(url: string): string;
    delay(ms: number): Promise<void>;
  };

  // 快捷聊天
  chat: {
    onCleanStorage(fun: () => void): void;
  };
}

export interface DesktopAppWelcomeAPI {
  // 配置管理（代理设置和服务器验证，欢迎界面功能）
  config: {
    setProxyUrl(url: string): Promise<boolean>;
    validateServer(url: string): Promise<ServerValidationResult>;
  };

  // 欢迎流程
  welcome: {
    show(): Promise<boolean>;
    complete(): Promise<boolean>;
    cancel(): Promise<void>;
  };

  // 部署服务
  deployment: {
    startDeploymentFromForm(formData: {
      ruleForm: {
        url: string;
        modelName: string;
        apiKey: string;
      };
      embeddingRuleForm: {
        url: string;
        modelName: string;
        apiKey: string;
      };
    }): Promise<void>;
    stopDeployment(): Promise<void>;
    getStatus(): Promise<any>;
    onStatusChange(callback: (status: any) => void): void;
    removeStatusListener(): void;
    cleanup(): Promise<void>;
    addHostsEntries(domains: string[]): Promise<void>;
  };

  // 系统信息
  system: {
    platform: string;
    arch: string;
    versions: NodeJS.ProcessVersions;
    env: Record<string, string | undefined>;
  };

  // 实用工具
  utils: {
    isValidUrl(url: string): boolean;
    formatUrl(url: string): string;
    delay(ms: number): Promise<void>;
  };
}

declare global {
  interface Window {
    eulercopilot: DesktopAppAPI;
    eulercopilotWelcome: DesktopAppWelcomeAPI;
  }
}

export {};
