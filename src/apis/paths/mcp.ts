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
      },
    ];
    totalModels: number;
  }>(MCP_BASE_URL, params);
};

const getMcpServiceDetail = (id: string) => {
  return get<{
    serviceId: string;
    icon: string;
    name: string;
    description: string;
    data: string;
    mcpType: 'Stdio' | 'SSE' | 'Streamable';
    tools: {
      name: string;
      description: string;
      input_args: {
        name: string;
        description: string;
        type: string;
      }[];
      output_args: {
        name: string;
        description: string;
        type: string;
      }[];
    }[];
  }>(`${MCP_BASE_URL}/${id}`);
};

const createOrUpdateMcpService = (params: {
  serviceId?: string;
  icon: string;
  name: string;
  description: string;
  config: string;
  mcpType: 'Stdio' | 'SSE' | 'Streamable';
}) => {
  return post<{}>(`${MCP_BASE_URL}`, params);
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
