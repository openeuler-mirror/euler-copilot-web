import { get, post, del } from '../server';

const MCP_BASE_URL = '/api/mcpservice';
/**
 * 获取用户的模型列表
 * @returns
 */
const getMcpList = (params: {
  searchType: string;
  keyword: string;
  page: number;
  pageSize: number;
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
      },
    ];
    totalModels: number;
  }>(MCP_BASE_URL, params);
};

const getMcpServiceDetail = (mcpserviceId: string) => {
  return get<{
    serviceId: string;
    icon: string;
    name: string;
    description: string;
    data: {
      transmitProto: 'Stdio' | 'Streamable' | 'SSE';
      config: string;
    };
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
  }>(`${MCP_BASE_URL}/${mcpserviceId}`);
};

const createMcpService = (params: {
  icon: string;
  name: string;
  description: string;
  config: { transmitProto: 'Stdio' | 'Streamable' | 'SSE'; config: string };
}) => {
  return post<{}>(`${MCP_BASE_URL}`, params);
};

export const mcpApi = {
  getMcpList,
  getMcpServiceDetail,
  createMcpService,
};
