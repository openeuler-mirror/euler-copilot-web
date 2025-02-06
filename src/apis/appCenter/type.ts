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
    All = "all",
    Author = "author",
    Description = "description",
    Name = "name",
}

/**
 * CreateAppRequest, 创建/更新应用请求数据结构
 */
export interface CreateOrUpdateAppParamsType {
    /**
     * 应用ID
     */
    appId?: string;
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
     * 工作流（列表，每个元素为工作流ID）
     */
    workflows?: string[];
    [property: string]: any;
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
    Private = "private",
    Protected = "protected",
    Public = "public",
}
