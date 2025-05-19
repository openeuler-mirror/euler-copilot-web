export interface QueryAppListParamsType {
  /**
   * 筛选“我创建的”应用
   */
  createdByMe?: boolean;
  /**
   * 筛选“我收藏的”应用
   */
  favorited?: boolean;
  /**
   * 搜索关键字
   */
  keyword?: string;
  /**
   * 页码
   */
  page?: number;
  /**
   * 每页数量
   */
  pageSize?: number;
  /**
   * 搜索类型：全部字段或仅按名称/简介/作者字段；若不填，则视为 'all'
   */
  searchType?: SearchType;
  [property: string]: any;
}

/**
 * 搜索类型：全部字段或仅按名称/简介/作者字段；若不填，则视为 'all'
 */
export enum SearchType {
  All = 'all',
  Agent = 'agent',
  Flow = 'flow',
}

/**
 * CreateAppRequest, 创建/更新应用请求数据结构
 */
export interface CreateOrUpdateAppParamsType {
  /**
   * 应用ID
   */
  appId?: string | null;
  /**
   * 应用类型
   */
  appType: 'flow' | 'agent';
  /**
   * 应用简介
   */
  description?: string;
  /**
   * 对话轮次（1～10）
   */
  dialogRounds?: number;
  /**
   * 图标
   */
  icon?: string;
  /**
   * 相关链接（URL列表，最多5项）
   */
  links?: AppLink[];
  /**
   * 应用名称
   */
  name?: string;
  /**
   * 权限配置
   */
  permission?: AppPermissionData;
  /**
   * 推荐问题（列表，最多3项）
   */
  recommendedQuestions?: string[];
  /**
   * Mcpservice，MCP服务
   */
  mcpService?: string[];
  /**
   * 工作流（列表，每个元素为工作流ID）
   */
  workflows?: string[];
  [property: string]: any;
}

/**
 * MCPServiceMetadata，MCPService的元数据
 */
export interface MCPServiceMetadataInput {
  /**
   * Author，创建者的用户名
   */
  author: string;
  /**
   * MCP服务配置
   */
  config: MCPServiceConfig;
  /**
   * Description，元数据描述
   */
  description: string;
  /**
   * Hashes，资源（App、Service等）下所有文件的hash值
   */
  hashes?: { [key: string]: string } | null;
  /**
   * Icon，图标
   */
  icon?: string;
  /**
   * Id，元数据ID
   */
  id: string;
  /**
   * Name，元数据名称
   */
  name: string;
  /**
   * Tools，MCP服务Tools列表
   */
  tools: MCPServiceToolsdataInput[];
  type?: MetadataType;
  [property: string]: any;
}

/**
 * MCPServiceToolsdata，MCP Service中tool信息
 */
export interface MCPServiceToolsdataInput {
  /**
   * Description，Tool功能描述
   */
  description: string;
  /**
   * Input Args，Tool参数列表
   */
  input_args: MCPServiceToolsArgs[];
  /**
   * Name，Tool名称
   */
  name: string;
  /**
   * Output Args，Tool参数列表
   */
  output_args: MCPServiceToolsArgs[];
  [property: string]: any;
}

/**
 * MetadataType，元数据类型
 */
export enum MetadataType {
  Agent = 'agent',
  Flow = 'flow',
  McpService = 'mcp_service',
  Model = 'model',
  Prompt = 'prompt',
  Service = 'service',
}

/**
 * MCPServiceToolsArgs，MCP Service中tool参数信息
 */
export interface MCPServiceToolsArgs {
  /**
   * Description，Tool参数描述
   */
  description: string;
  /**
   * Name，Tool参数名称
   */
  name: string;
  /**
   * Tool参数类型
   */
  type: MCPServiceToolsArgsType;
  [property: string]: any;
}

/**
 * 传输协议（Stdio/SSE/Streamable）
 *
 * MCPTransmitProto，MCP传输方式
 */
export enum MCPTransmitProto {
  SSE = 'sse',
  Stdio = 'stdio',
  Streamable = 'stream',
}

/**
 * MCP服务配置
 *
 * MCPServiceConfig，MCPService的API配置
 */
export interface MCPServiceConfig {
  /**
   * Config，对应MCP的配置
   */
  config: { [key: string]: any };
  /**
   * 传输协议（Stdio/SSE/Streamable）
   */
  transmitProto?: MCPTransmitProto;
  [property: string]: any;
}

/**
 * Tool参数类型
 *
 * MCPServiceToolsArgsType，MCPService tool参数数据类型
 */
export enum MCPServiceToolsArgsType {
  Boolean = 'boolean',
  Double = 'double',
  Integer = 'integer',
  String = 'string',
}

/**
 * AppLink, 应用链接数据结构
 */
export interface AppLink {
  /**
   * 链接标题
   */
  title?: string;
  /**
   * 链接地址
   */
  url: string;
  [property: string]: any;
}

/**
 * 权限配置
 *
 * AppPermissionData, 应用权限配置数据结构
 */
export interface AppPermissionData {
  /**
   * 附加人员名单（如果可见性为部分人可见）
   */
  authorizedUsers?: string[];
  visibility: Visibility;
  [property: string]: any;
}

export enum Visibility {
  private = 'private',
  protected = 'protected',
  public = 'public',
}

export interface AppDetail {
  type: 'flow' | 'agent';
  icon?: string;
  name: string;
  description: string;
  dialogRounds?: number;
  permission?: {
    visibility: keyof typeof Visibility;
    authorizedUsers: string[];
  };
  links?: AppLink[];
  recommendedQuestions?: string[];
  workflows?: {
    id: string;
    name: string;
    description: string;
    debug: boolean;
  };
  mcpService?: string[];
  model?: {
    provider: string;
    icon?: string;
    url: string;
    model: string;
    apiKey: string;
    maxTokens: number;
    id: string;
    author: string;
    hashes?: any;
  };
  prompt?: string;
  knowledge?: string;
  appId: string;
  published: boolean;
}
