# 桌面配置管理系统开发文档

## 系统概述

桌面配置管理系统是 openEuler Intelligence 桌面应用的核心组件，负责管理应用配置、首次启动欢迎流程以及提供配置相关的 API 接口。该系统采用现代化的架构设计，提供类型安全、可扩展且健壮的配置管理解决方案。

### 1. 核心特性

- **类型安全**: 基于 TypeScript 的完整类型定义
- **健壮性**: 完备的错误处理和恢复机制
- **可扩展性**: 灵活的配置结构，易于添加新配置项
- **安全性**: 配置验证和备份恢复机制
- **用户友好**: 首次启动引导和直观的配置界面

## 系统架构

### 2. 核心组件

#### 配置管理器 (`ConfigManager`)

- **位置**: `electron/main/common/config.ts`
- **模式**: 单例模式
- **职责**: 配置文件的 CRUD 操作、验证、备份和恢复

#### 欢迎窗口管理器 (`WelcomeWindow`)

- **位置**: `electron/main/window/welcome.ts`
- **职责**: 首次启动流程、欢迎界面窗口管理

#### IPC 通信层

- **位置**: `electron/main/common/ipc.ts`
- **职责**: 主进程与渲染进程间的配置管理通信

#### 预加载脚本

- **主预加载**: `electron/preload/index.ts`
- **欢迎预加载**: `electron/preload/welcome.ts`
- **职责**: 安全的 API 桥接

### 3. IPC 接口

新增的 IPC 处理接口：

```typescript
// 配置管理
'copilot:get-config' - 获取完整配置
'copilot:update-config' - 更新配置（部分更新）
'copilot:reset-config' - 重置为默认配置
'copilot:set-proxy-url' - 设置代理 URL（便捷方法）
'copilot:get-proxy-url' - 获取代理 URL（便捷方法）

// 欢迎界面
'copilot:show-welcome' - 显示欢迎界面
'copilot:complete-welcome' - 完成欢迎流程
```

### 4. 使用示例

#### 在渲染进程中使用配置

```typescript
// 获取配置
const config = await window.ipcRenderer.invoke('copilot:get-config');

// 更新配置
await window.ipcRenderer.invoke('copilot:update-config', {
  base_url: 'https://new-server.com'
});

// 完成欢迎流程
await window.ipcRenderer.invoke('copilot:complete-welcome');
```

#### 在主进程中使用配置

```typescript
import { getConfigManager } from './common/config';

const configManager = getConfigManager();

// 读取配置
const config = configManager.readConfig();

// 更新配置
configManager.updateConfig({ base_url: 'new-url' });

// 检查配置是否存在
if (!configManager.isConfigExists()) {
  // 处理首次启动逻辑
}
```

### 5. 配置文件格式

默认配置文件 (`desktop-config.json`) 格式：

```json
{
  "base_url": "https://www.eulercopilot.local"
}
```

配置文件位置：`{userData}/Config/desktop-config.json`

### 6. 待完成的工作

1. **欢迎界面 UI**: 需要创建实际的欢迎界面 HTML/Vue 组件
2. **国际化**: 为欢迎界面添加多语言支持

## API 参考

### ConfigManager 类

#### 接口定义

```typescript
export interface DesktopConfig {
  base_url: string;
  [key: string]: unknown;
}

export class ConfigManager {
  public static getInstance(): ConfigManager;
  public isConfigExists(): boolean;
  public initializeConfig(): void;
  public readConfig(): DesktopConfig;
  public writeConfig(config: DesktopConfig): void;
  public updateConfig(updates: Partial<DesktopConfig>): DesktopConfig;
  public getConfigValue<T = unknown>(key: keyof DesktopConfig): T | undefined;
  public setConfigValue(key: keyof DesktopConfig, value: unknown): void;
  public resetConfig(): void;
}
```

#### 核心方法详解

##### getInstance()

- **作用**: 获取 ConfigManager 单例实例
- **返回**: ConfigManager 实例
- **示例**: `const manager = ConfigManager.getInstance()`

##### isConfigExists()

- **作用**: 检查配置文件是否存在
- **返回**: boolean
- **示例**: `if (!manager.isConfigExists()) { /* 首次启动逻辑 */ }`

##### readConfig()

- **作用**: 读取完整配置，自动处理错误恢复
- **返回**: DesktopConfig 对象
- **特性**:
  - 自动初始化不存在的配置文件
  - 验证配置有效性
  - 备份恢复机制
  - 默认配置合并

##### writeConfig(config)

- **作用**: 写入完整配置
- **参数**: config - DesktopConfig 对象
- **特性**:
  - 配置验证
  - 自动备份旧配置
  - 原子性写入

##### updateConfig(updates)

- **作用**: 部分更新配置
- **参数**: updates - Partial&lt;DesktopConfig&gt; 对象
- **返回**: 更新后的完整配置
- **示例**: `manager.updateConfig({ base_url: 'new-url' })`

### IPC API 参考

#### 主要接口

##### 配置管理接口

```typescript
// 获取配置
ipcRenderer.invoke('copilot:get-config'): Promise<DesktopConfig | null>

// 更新配置
ipcRenderer.invoke('copilot:update-config', updates: Partial<DesktopConfig>): Promise<DesktopConfig | null>

// 重置配置
ipcRenderer.invoke('copilot:reset-config'): Promise<DesktopConfig | null>

// 设置代理 URL（便捷方法）
ipcRenderer.invoke('copilot:set-proxy-url', url: string): Promise<boolean>

// 获取代理 URL（便捷方法）
ipcRenderer.invoke('copilot:get-proxy-url'): Promise<string>

// 验证服务器连接
ipcRenderer.invoke('copilot:validate-server', url: string): Promise<{
  isValid: boolean;
  error?: string;
  status?: number;
  responseTime?: number;
}>
```

##### 欢迎流程接口

```typescript
// 显示欢迎窗口
ipcRenderer.invoke('copilot:show-welcome'): Promise<boolean>

// 完成欢迎流程
ipcRenderer.invoke('copilot:complete-welcome'): Promise<boolean>
```

### 前端 API 使用

#### 通过 electronAPI 使用

```typescript
// 类型定义
interface DesktopAppAPI {
  config: {
    get(): Promise<DesktopConfig | null>;
    update(updates: Partial<DesktopConfig>): Promise<DesktopConfig | null>;
    reset(): Promise<DesktopConfig | null>;
    setProxyUrl(url: string): Promise<boolean>;
    getProxyUrl(): Promise<string>;
  };
  welcome: {
    show(): Promise<boolean>;
    complete(): Promise<boolean>;
  };
}

// 使用示例
const config = await window.eulercopilot.config.get();
await window.eulercopilot.config.update({ base_url: 'https://new-server.com' });
await window.eulercopilot.welcome.complete();
```

## 配置文件规范

### 文件位置

- **配置目录**: `{userData}/Config/`
- **主配置文件**: `desktop-config.json`
- **备份文件**: `desktop-config.backup.json`

其中 `{userData}` 为系统用户数据目录：

- **Windows**: `%APPDATA%/{AppName}`
- **macOS**: `~/Library/Application Support/{AppName}`
- **Linux**: `~/.config/{AppName}`

### 配置结构

```typescript
interface DesktopConfig {
  base_url: string;          // 后端服务器地址
  [key: string]: unknown;    // 扩展字段支持
}
```

### 默认配置

```json
{
  "base_url": "https://www.eulercopilot.local"
}
```

### 配置验证规则

1. **base_url 验证**
   - 必须为非空字符串
   - 必须为有效的 URL 格式
   - 支持 HTTP 和 HTTPS 协议

2. **扩展性支持**
   - 支持任意额外字段
   - 保持向后兼容性

## 欢迎流程设计

### 流程概述

1. **启动检查**: 应用启动时检查配置文件是否存在
2. **首次启动**: 配置文件不存在时显示欢迎界面
3. **配置设置**: 用户在欢迎界面中配置必要参数
4. **配置保存**: 完成配置并保存到文件
5. **继续启动**: 自动关闭欢迎界面，继续应用启动流程

### 欢迎窗口特性

```typescript
// 窗口配置
{
  width: 720,
  height: 560,
  minWidth: 720,
  minHeight: 560,
  center: true,
  resizable: false,
  maximizable: false,
  minimizable: false,
  modal: true,
  alwaysOnTop: true,
  title: '欢迎使用'
}
```

### 欢迎界面 API

欢迎界面专用预加载脚本提供的 API：

```typescript
interface WelcomeAPI {
  config: {
    get(): Promise<DesktopConfig | null>;
    update(updates: Partial<DesktopConfig>): Promise<DesktopConfig | null>;
    reset(): Promise<DesktopConfig | null>;
    validateServer(url: string): Promise<ValidationResult>;
  };
  welcome: {
    complete(): Promise<boolean>;
    close(): Promise<boolean>;
  };
  utils: {
    openExternal(url: string): Promise<boolean>;
    showMessageBox(options: MessageBoxOptions): Promise<MessageBoxResponse>;
  };
}
```

## 开发指南

### 项目结构

```text
electron/
├── main/
│   ├── common/
│   │   ├── config.ts          # 配置管理器
│   │   ├── ipc.ts             # IPC 处理器
│   │   └── conf.ts            # 基础配置
│   └── window/
│       └── welcome.ts         # 欢迎窗口管理
├── preload/
│   ├── index.ts               # 主预加载脚本
│   ├── welcome.ts             # 欢迎预加载脚本
│   └── types.ts               # 类型定义
└── welcome/
    └── index.html             # 欢迎界面 HTML
```

### 本地开发

1. **安装依赖**

   ```bash
   pnpm install
   ```

2. **开发模式启动**

   ```bash
   pnpm run dev:desktop
   ```

3. **构建应用**

   ```bash
   pnpm run package:win64  # Windows
   ```

   ```bash
   pnpm run package:mac    # macOS
   ```

   ```bash
   pnpm run package:linux  # Linux
   ```

### 添加新配置项

1. **更新接口定义**

   ```typescript
   // electron/main/common/config.ts
   export interface DesktopConfig {
     base_url: string;
     new_option: string;  // 新增配置项
     [key: string]: unknown;
   }
   ```

2. **更新默认配置**

   ```typescript
   export const DEFAULT_CONFIG: DesktopConfig = {
     base_url: 'https://www.eulercopilot.local',
     new_option: 'default_value',  // 新增默认值
   };
   ```

3. **更新验证逻辑**

   ```typescript
   private validateConfig(config: any): config is DesktopConfig {
     // 添加新字段验证逻辑
     if (typeof config.new_option !== 'string') {
       return false;
     }
     // ... 其他验证
   }
   ```

### 自定义 IPC 处理器

```typescript
// electron/main/common/ipc.ts
function registerCustomListeners(): void {
  ipcMain.handle('copilot:custom-action', async (event, params) => {
    try {
      // 自定义处理逻辑
      const result = await performCustomAction(params);
      return { success: true, data: result };
    } catch (error) {
      console.error('Custom action failed:', error);
      return { success: false, error: error.message };
    }
  });
}
```

## 测试指南

### 单元测试

```typescript
// tests/config.test.ts
import { ConfigManager, DEFAULT_CONFIG } from '../electron/main/common/config';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = ConfigManager.getInstance();
  });

  test('should create default config when not exists', () => {
    const config = configManager.readConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  test('should update config partially', () => {
    const updates = { base_url: 'https://test.com' };
    const result = configManager.updateConfig(updates);
    expect(result.base_url).toBe('https://test.com');
  });
});
```

### 集成测试

```typescript
// tests/integration/welcome-flow.test.ts
import { app } from 'electron';

describe('Welcome Flow Integration', () => {
  test('should show welcome window on first launch', async () => {
    // 清除配置文件
    await clearConfigFile();
    
    // 启动应用
    await app.whenReady();
    
    // 验证欢迎窗口显示
    expect(getWelcomeWindow()).toBeDefined();
  });
});
```

### 手动测试场景

1. **首次启动测试**
   - 删除配置文件
   - 启动应用
   - 验证欢迎界面显示
   - 配置并完成欢迎流程
   - 验证配置文件创建

2. **配置恢复测试**
   - 损坏配置文件
   - 启动应用
   - 验证从备份恢复或使用默认配置

3. **IPC 通信测试**
   - 通过开发者工具测试各种 IPC 调用
   - 验证错误处理和返回值
