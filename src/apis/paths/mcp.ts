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
  config: string;
  mcpType: 'stdio' | 'sse' | 'stream';
}) => {
  return post(`${MCP_BASE_URL}`, params);
};

const deleteMcpService = (id: string) => {
  return del<{ serviceId: string }>(`${MCP_BASE_URL}/${id}`);
};

const activeMcpService = (id: string, active: boolean) => {
  return post<{ serviceId: string }>(`${MCP_BASE_URL}/${id}`, { active });
};

export const mcpApi = {
  getMcpList,
  getMcpServiceDetail,
  createOrUpdateMcpService,
  deleteMcpService,
  activeMcpService,
};
