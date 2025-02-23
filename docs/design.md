# EulerCopilot 桌面客户端

## 整体架构

这是一个基于 Tauri + Vue3 + TypeScript 的桌面应用项目，主要架构如下:

1. 前端架构:

    - Vue3 作为前端框架

    - TypeScript 作为开发语言

    - Element Plus 作为 UI 组件库

    - Vite 作为构建工具

    - Pinia 用于状态管理

    - Vue Router 用于路由管理

2. 后端架构:

    - Rust 作为后端开发语言

    - Tauri 作为桌面应用框架

    - 提供了系统托盘、全局快捷键等原生功能

3. 主要功能模块:

    - 主窗口 (main window)

    - 设置窗口 (settings window)

    - 欢迎窗口 (welcome window)

    - 悬浮球窗口 (floating window)

    - 系统托盘

    - Docker 容器管理

    - API 通信模块

4. 功能:

    - 支持全局快捷键 (Shift+CmdOrCtrl+O)

    - 支持系统托盘操作

    - 支持窗口管理 (显示/隐藏/位置)

    - 支持配置管理 (API key, Base URL等)

    - 支持与 Docker 交互

    - 支持跨平台

整体采用前后端分离架构，前端负责界面展示，后端负责系统交互，通过 Tauri 提供的 API 进行通信。

## 前端架构

1. 技术栈选型:

    - 使用 Vue 3 + `<script setup>` 语法

    - TypeScript 确保类型安全

    - Element Plus 作为主要 UI 框架

    - OpenDesign2 作为补充 UI 组件库

    - Vite 作为构建工具，提供开发服务器和构建优化

2. 项目结构:

    ```text
    src
    ├── apis
    │   └── paths
    ├── assets
    │   ├── fonts
    │   ├── images
    │   ├── styles
    │   │   └── element
    │   └── svgs
    ├── components
    │   ├── commonFooter
    │   ├── dialoguePanel
    │   └── sessionCard
    ├── conf
    ├── router
    ├── store
    ├── utils
    └── views
        └── dialogue
            └── components
    ```

    apis/

    - server.ts: 封装HTTP请求基础方法
    - paths/: API接口定义
        - session.ts: 会话管理接口
        - external.ts: 外部服务接口

    assets/

    - images/: 图片资源
    - svgs/: SVG图标
    - styles/: 样式文件
        - element/: Element Plus主题定制
        - main.scss: 全局样式
    - base.css: 基础样式

    components/

    - dialoguePanel/: 对话面板组件
    - commonFooter/: 公共页脚组件
    - sessionCard/: 会话卡片组件
    - Message.ts: 消息提示组件
    - EulerDialog.vue: 通用对话框组件

    conf/

    - agreement.md: 用户协议文档
    - version.ts: 版本信息配置

    router/

    - 路由配置文件
    - 页面路由管理

    store/

    - session.ts: 会话状态管理
    - 使用Pinia进行状态管理

    utils/

    - marked.ts: Markdown解析工具
    - tools.ts: 通用工具函数

    views/

    - dialogue/: 对话相关页面
        - dialogueView.vue: 对话主视图
        - components/: 对话相关子组件
        - types.ts: 类型定义
        - constants.ts: 常量定义

3. 路由设计:

    - `/welcome` - 欢迎页面

    - `/settings` - 设置页面

    - `/floating` - 悬浮球界面

4. 开发体验优化:

    - 配置了路径别名:
        - src: 项目源码根目录
        - assets: 静态资源目录
        - components: 组件目录

5. 状态管理:

    - 使用 Pinia 进行状态管理

    - 支持响应式数据流

6. 样式管理:

    - 支持 SCSS 预处理器
        - 集成了多个样式主题:
            - Element Plus 主题
            - GitHub Dark 代码高亮主题
            - OpenDesign2 主题

### 主要组件

主要组件结构应该包含：

1. 主要窗口组件：

    - MainWindow - 主应用窗口组件

    - WelcomeWindow - 欢迎窗口组件

    - SettingsWindow - 设置窗口组件

    - FloatingWindow - 悬浮球组件

2. 功能组件：

    - Docker 相关组件：
        - 容器状态检查
        - 容器状态异常提醒

3. 公共组件：

    - 对话框组件

    - 消息提示组件

    - 加载状态组件

4. 布局组件：

    - 顶部 Logo 栏

    - 内容区域

    - 底部信息栏

5. 交互组件：

    - 全局快捷键

    - 系统托盘菜单

    - 设置表单

6. 组件通信：

    - 使用 Pinia 进行状态管理

    - 通过 Tauri 命令与后端通信

    - 组件间事件传递

### 对话功能

前端对话功能采用了三层组件设计:

1. dialogueView.vue (顶层容器)

    - 负责整体布局和主题管理

    - 实现头部导航栏(包含logo、主题切换、设置按钮)

    - 管理全局状态和配置

    - 处理初始化逻辑和插件加载

    - 集成系统设置和协议展示

2. DialogueSession.vue (会话管理)

    - 实现对话列表管理

    - 处理消息发送和接收

    - 集成输入框和发送按钮

    - 支持快捷键操作

    - 管理示例问题展示

    - 处理流式响应数据

    - 支持会话重新生成

    - 实现插件选择功能

3. DialoguePanel.vue (对话面板)

    - 展示单条对话内容

    - 支持用户/AI消息区分

    - 实现复制功能

    - 支持代码高亮

    - 处理点赞和反馈

    - 提供重新生成选项

    - 实现分页功能

    - 支持建议问题展示

核心功能:

- 消息流处理
- Markdown 渲染
- 代码高亮
- 主题切换
- 复制功能
- 反馈系统
- 分页控制
- 插件集成

数据流向:

```text
dialogueView
  ↓
DialogueSession (状态管理)
  ↓
DialoguePanel (展示层)
```

## 后端架构

后端使用 Rust + Tauri 构建,架构设计如下:

1. 核心模块划分:

    ```rust
    mod api        // API 通信模块
    mod config     // 配置管理模块  
    mod positioner // 窗口位置管理
    mod utility    // 工具函数模块
    ```

2. 窗口管理系统:

    - 主窗口管理 (create_main_window)

    - 设置窗口 (create_settings_window)

    - 欢迎窗口 (create_welcome_window)

    - 悬浮球窗口 (create_floating_icon)

3. 系统功能集成:

    - 全局快捷键注册 (register_shortcut)

    - 系统托盘实现

    - 自动启动支持

    - 窗口状态管理

4. API 通信层:

    - ChatState 状态管理

    - HTTP 客户端封装

    - 流式响应处理

    - 错误处理机制

5. 配置管理:

    - API Key 管理

    - Base URL 配置

    - 配置持久化

6. 系统交互:

    - Docker 容器管理

    - 系统命令执行

    - 文件系统操作

7. 特性支持:

    - 跨平台适配

    - 窗口样式定制

    - 系统级集成

### API 通信模块

1. 状态管理设计:

    ```rust
    pub struct ChatState(pub Mutex<bool>);
    ```

    - 使用 Mutex 保证线程安全
    - 用于追踪聊天状态

2. 网络请求封装:

    - 使用 reqwest 作为 HTTP 客户端
    - 支持异步请求处理
    - 集成 header 管理
    - 支持流式响应

3. 数据结构:

    ```rust
    #[derive(Clone, serde::Serialize)]
    pub struct StreamPayload {
        pub message: String,
    }
    ```

    - 使用 serde 进行序列化
    - 定义清晰的数据传输结构

4. 配置集成:

    - 与配置模块紧密结合
    - 动态获取 API Key
    - 动态获取 Base URL
    - 支持配置热更新

API 模块包含以下核心接口:

1. `chat` 接口

    ```rust
    #[tauri::command]
    pub async fn chat<R: Runtime>(...)
    ```

    - 主要聊天通信接口
    - 支持会话管理 (session, conversation)
    - 支持语言设置
    - 支持插件系统
    - 支持工作流
    - 返回流式响应
    - 可中断控制

2. `create_conversation` 接口

    ```rust
    #[tauri::command]
    pub async fn create_conversation()
    ```

    - 创建新的对话
    - 返回 conversation_id
    - 用于对话管理

3. `refresh_session_id` 接口

    ```rust
    #[tauri::command]
    pub async fn refresh_session_id(session_id: Option<&str>)
    ```

    - 刷新或创建会话 ID
    - 支持可选的 session_id 参数
        - 传入 session_id 参数不为空：校验/刷新 session_id
        - 传入 session_id 参数为空值：新建 session_id
    - 用于会话状态维护

4. `stop` 接口

    ```rust
    #[tauri::command]
    pub async fn stop(state: State<'_, ChatState>)
    ```

    - 停止当前进行的对话
    - 更新聊天状态
    - 发送停止信号

5. `plugin` 接口

    ```rust
    #[tauri::command]
    pub async fn plugin()
    ```

    - 获取插件信息
    - 返回插件配置数据

辅助函数:

- `emit_message`: 发送消息到前端
- `get_base_headers`: 生成基础请求头

### 配置管理模块

1. 数据结构设计:

    ```rust
    #[derive(Debug, Serialize, Deserialize)]
    pub struct Config {
        framework_url: String,
        framework_api_key: String,
    }
    ```

    - 使用 serde 序列化支持
    - 包含框架 URL 和 API 密钥配置

2. 对外接口:

    ```rust
    #[tauri::command]
    pub fn get_base_url() -> String
    #[tauri::command]
    pub fn get_api_key() -> String
    #[tauri::command]
    pub fn update_config(url: Option<&str>, api_key: Option<&str>)
    ```

    - 提供配置读取接口
    - 提供配置更新接口
    - 支持可选参数更新

3. 配置文件管理:

    - 配置文件路径: `~/.config/eulercopilot/desktop.json`
    - 支持目录自动创建
    - 支持配置文件读写
    - 提供默认配置

4. 核心方法:

    ```rust
    impl Config {
        fn config_dir()
        fn config_file()
        fn default()
        pub fn load()
        pub fn save()
    }
    ```

    - 配置路径管理
    - 默认配置生成
    - 配置加载保存
