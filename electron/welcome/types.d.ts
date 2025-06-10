// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

// 为欢迎页面定义类型

interface Window {
  eulercopilotWelcome?: {
    config: {
      setProxyUrl(url: string): Promise<boolean>;
      validateServer(url: string): Promise<{
        isValid: boolean;
        error?: string;
        status?: number;
        responseTime?: number;
      }>;
    };
    welcome: {
      show(): Promise<boolean>;
      complete(): Promise<boolean>;
      cancel(): Promise<void>;
    };
    deployment: {
      startDeploymentFromForm(formData: any): Promise<void>;
      stopDeployment(): Promise<void>;
      getStatus(): Promise<any>;
      onStatusChange(callback: (status: any) => void): void;
      removeStatusListener(): void;
      cleanup(): Promise<void>;
      addHostsEntries(domains: string[]): Promise<void>;
    };
    system: {
      platform: string;
      arch: string;
      versions: NodeJS.ProcessVersions;
      env: Record<string, string | undefined>;
    };
    utils: {
      isValidUrl(url: string): boolean;
      formatUrl(url: string): string;
      delay(ms: number): Promise<void>;
    };
  };
}
