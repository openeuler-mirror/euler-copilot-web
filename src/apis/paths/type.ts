// 定义文件信息的接口
export interface File {
    id: string;
    name: string;
    type: string;
    size: number;
}

// 定义流程步骤的接口
export interface Step {
    step_name: string;
    step_status: string;
    input: {
        cve_id: string;
        isFixed: boolean;
    };
    output: {
        code: number;
        data: any[]; // 可以根据具体情况细化这个类型
    };
}

// 定义流程信息的接口
export interface Flow {
    appId: string;
    flowId: string;
    steps: Step[];
}

// 定义内容信息的接口
export interface Content {
    question: string;
    answer: string;
    data: any; // 可以根据具体情况细化这个类型
}

// 定义元数据信息的接口
export interface Metadata {
    input_tokens: number;
    output_tokens: number;
    time: number;
}

// 定义问答对数据结构
export interface ConversationRecord {
    id: string;
    groupId: string;
    conversationId: string;
    files: File[];
    flow: Flow;
    content: Content;
    metadata: Metadata;
}

// 定义对话内问答列表数据结构
export interface ConversationRecordList {
    records: ConversationRecord[];
}

/* 推荐问题的格式
 *  "appId": "aops-apollo",  //推荐项关联的插件ID，若不关联则为空
 *  "flowId": "query_cve_info",  //推荐项关联的工作流ID，若不关联则为空
 *  "flow_description": "查询机器192.168.10.1的CVE信息", //推荐项关联的工作流描述，若不关联则为空
 *  "question": "查询机器192.168.10.1的CVE信息", //推荐问题的内容
 */
export interface Suggest {
    appId: string,
    flowId: string,
    flow_description: string,
    question: string,
}

/*
 * 问答列表内项的数据结构
 */
export interface ConversationListItem {
    conversationId: string,
    createdTime: string,
    doc_count: number,
    title: string,
}

/*
 * 问答列表数据结构
 */
export interface ConversationList {
    conversations: Array<ConversationListItem>;
}

/*
 * 应用数据结构
 */
export interface Application {
    appId: string,
    name: string,
}

/*
 * 语意接口数据结构
 */
export interface ApiMessage {
    apiId: string,
    name: string,
    type: string,
    path: string,
    description: string,
}

/*
 * 语意接口数据结构
 */
export interface Service {
    serviceId: string,
    name: string,
    icon: string,
    author: string,
    description: string,
    favorite: boolean,
}