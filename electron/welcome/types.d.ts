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
