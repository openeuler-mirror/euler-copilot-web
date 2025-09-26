import { get, post, del } from '../server';

const MCP_BASE_URL = '/api/mcp';
/**
 * 获取mcp服务列表
 * @returns
 */
const getMcpList = (params: {
  searchType?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  isInstall?: boolean | null;
  isActive?: boolean | null;
}) => {
  return get<{
    currentPage: number;
    totalCount: 0;
    services: [
      {
        mcpserviceId: string;
        name: string;
        description: string;
        icon: string;
        author: string;
        isActive: boolean;
        status: 'installing' | 'ready' | 'failed';
      },
    ];
    totalModels: number;
  }>(MCP_BASE_URL, params);
};

const getMcpServiceDetail = (id: string, edit?: boolean) => {
  return get<{
    serviceId: string;
    icon: string;
    name: string;
    overview: string;
    description: string;
    data: string;
    mcpType: 'stdio' | 'sse' | 'stream';
    tools: {
      id: string;
      name: string;
      description: string;
      mcp_id: string;
      input_schema: {
        properties: {
          [key: string]: {
            description: string;
            type: string;
          };
        };
      };
      output_schema: {
        properties: {
          [key: string]: {
            description: string;
            type: string;
          };
        };
      };
    }[];
  }>(`${MCP_BASE_URL}/${id}`, { edit });
};

const createOrUpdateMcpService = (params: {
  serviceId?: string;
  icon: string;
  name: string;
  overview: string;
  description: string;
  config: object;
  mcpType: 'stdio' | 'sse' | 'stream';
}) => {
  return post<{
    service_id: string;
    name: string;
  }>(`${MCP_BASE_URL}`, params, { 'Content-Type': 'application/json' });
};

const deleteMcpService = (id: string) => {
  return del<{ serviceId: string }>(`${MCP_BASE_URL}/${id}`);
};

const activeMcpService = (id: string, active: boolean, mcpEnv?: any) => {
  return post<{ serviceId: string }>(`${MCP_BASE_URL}/${id}`, { active, mcpEnv },
    { 'Content-Type': 'multipart/form-data' },);
};

const installMcpService = (id: string) => {
  return post<{ serviceId: string }>(`${MCP_BASE_URL}/${id}/install`);
};

// 定义一个名为uploadMcpIcon的函数，接收两个参数serviceId和icon
const uploadMcpIcon = (params: {
  serviceId: string;
  icon: File;
}) => {
  console.log('uploadMcpIcon', params.icon);
  const formData = new FormData();
  formData.append('icon', params.icon);
  // 使用post方法向MCP_BASE_URL/${id}发送请求，请求体为{ icon: params.icon }
  return post<{ icon: string }>(
    `${MCP_BASE_URL}/icon/${params.serviceId}`,
    formData,
    {
      serviceId: params.serviceId,
    },
    { 'Content-Type': 'multipart/form-data' },
  );
};

export const mcpApi = {
  getMcpList,
  getMcpServiceDetail,
  createOrUpdateMcpService,
  deleteMcpService,
  activeMcpService,
  installMcpService,
  uploadMcpIcon
};
