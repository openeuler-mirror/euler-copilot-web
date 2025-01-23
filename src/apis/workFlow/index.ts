// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
import { post, get, del, put } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';
import { CreateOrUpdateFlowParamsType, CreateOrUpdataFlowBodyType } from './type';
/**
 * 获取所有服务
 * @param params
 * @returns
 */
export const queryAllFlowService = (params: {
  page: number;
  pageSize: number;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get('/flow/service', params);
};

/**
 * 获取服务下的所有节点的元数据
 * @param params
 * @returns
 */
export const querySingleFlowServiceNode = (params: {
  serviceId: string;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get('/flow/service/node', params);
};

/**
 * 获取工作流拓扑结构
 * @param params
 * @returns
 */
export const querySingleFlowTopology = (params: {
  appId: number;
  flowId: number;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get('/flow', params);
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
  return put('/flow', data, params);
};

/**
 * 删除工作流拓扑结构
 * @param params
 * @returns
 */
export const delFlowTopology = (params: {
  appId: number;
  flowId: number;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return del('/flow', params);
};
