// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
import { post, get, del, put } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';
import {
  CreateOrUpdateFlowParamsType,
  CreateOrUpdataFlowBodyType,
} from './type';
/**
 * 获取所有服务
 * @param params
 * @returns
 */
export const queryAllFlowService = (params: {
  page: number;
  pageSize: number;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get('/api/flow/service');
};

/**
 * 获取服务下的所有节点的元数据
 * @param params
 * @returns
 */
export const querySingleFlowServiceNode = (params: {
  serviceId: string;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get('/api/flow/service/node', params);
};

/**
 * 获取工作流拓扑结构
 * @param params
 * @returns
 */
export const querySingleFlowTopology = (params: {
  appId: string;
  flowId: string;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get('/api/flow', params);
};

/**
 * 创建/修改工作流拓扑结构
 * @param params
 * @returns
 */
export const createOrUpdateFlowTopology = (
  params: CreateOrUpdateFlowParamsType,
  data: CreateOrUpdataFlowBodyType,
): Promise<[any, FcResponse<unknown> | undefined]> => {
  return put('/api/flow', data, params);
};

/**
 * 删除工作流拓扑结构
 * @param params
 * @returns
 */
export const delFlowTopology = (params: {
  appId: string;
  flowId: string;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return del(`/api/flow?appId=${params.appId}&flowId=${params.flowId}`);
};

export const workFlowApi = {
  queryAllFlowService,
  querySingleFlowServiceNode,
  querySingleFlowTopology,
  delFlowTopology,
  createOrUpdateFlowTopology,
};
