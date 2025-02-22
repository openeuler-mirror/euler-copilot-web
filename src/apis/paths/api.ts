// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
import { post, get, del, put } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';
import { QueryApiListParamsType, CreateOrUpdateApiParamsType } from './type';
/**
 * 获取语义接口列表
 * @param params
 * @returns
 */
// 导出一个函数queryApiList，用于查询API列表
export const queryApiList = (params: QueryApiListParamsType): Promise<[any, FcResponse<unknown> | undefined]> => {
  // 调用get函数，传入/api/service路径和params参数，返回一个Promise对象
  return get('/api/service', params);
};

/**
 * 创建语义接口/更新语义接口
 * @param params
 * @returns
 */
export const createOrUpdateApi = (
  params: CreateOrUpdateApiParamsType,
): Promise<[any, FcResponse<unknown> | undefined]> => {
  return post('/api/service', params);
};

/**
 * 获取指定语义接口数据
 * @param params
 * @returns
 */
export const querySingleApiData = (params: { serviceId: string,edit?: boolean}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get(`/api/service/${params.serviceId}`,{edit: params.edit});
};

/**
 * 删除语义接口
 * @param params
 * @returns
 */
export const deleteSingleApiData = (params: { serviceId: string }): Promise<[any, FcResponse<unknown> | undefined]> => {
  return del(`/api/service/${params.serviceId}`, params);
};

/**
 * 更改语义接口收藏状态
 * @param params
 * @returns
 */
export const changeSingleApiCollect = (params: { serviceId: string,favorited:boolean }): Promise<[any, FcResponse<unknown> | undefined]> => {
  return put(`/api/service/${params.serviceId}`, {favorited:params.favorited});
};
export const apiApi = {
  queryApiList,
  createOrUpdateApi,
  querySingleApiData,
  deleteSingleApiData,
  changeSingleApiCollect
};