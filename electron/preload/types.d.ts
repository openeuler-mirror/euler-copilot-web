// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.

/**
 * Electron Preload API 类型定义
 */

export interface DesktopConfig {
  base_url: string;
  [key: string]: any;
}

export interface DesktopAppAPI {
  // IPC 渲染器
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, listener: (...args: any[]) => void): void;
    once(channel: string, listener: (...args: any[]) => void): void;
    removeListener(channel: string, listener: (...args: any[]) => void): void;
    removeAllListeners(channel: string): void;
  };

  // 配置管理
  config: {
    get(): Promise<DesktopConfig>;
    update(updates: Partial<DesktopConfig>): Promise<DesktopConfig>;
    reset(): Promise<DesktopConfig>;
    setProxyUrl(url: string): Promise<boolean>;
    getProxyUrl(): Promise<string>;
  };

  // 欢迎界面
  welcome: {
    show(): Promise<boolean>;
    complete(): Promise<boolean>;
  };

  // 窗口控制
  window: {
    control(command: 'minimize' | 'maximize' | 'close'): Promise<void>;
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
    env: Record<string, string>;
  };
}

export interface DesktopAppWelcomeAPI {
  // 配置管理
  config: {
    get(): Promise<DesktopConfig | null>;
    update(updates: Partial<DesktopConfig>): Promise<DesktopConfig | null>;
    reset(): Promise<DesktopConfig | null>;
    validateServer(url: string): Promise<boolean>;
  };

  // 欢迎流程
  welcome: {
    complete(): Promise<boolean>;
    cancel(): Promise<void>;
  };

  // 窗口控制
  window: {
    close(): Promise<void>;
    minimize(): Promise<void>;
  };

  // 系统信息
  system: {
    platform: string;
    arch: string;
    versions: NodeJS.ProcessVersions;
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
