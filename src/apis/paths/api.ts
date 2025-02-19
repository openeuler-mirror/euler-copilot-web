// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
import { post, get, del, put } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';
import { QueryApiListParamsType, CreateOrUpdateApiParamsType } from './type';
/**
 * 获取语义接口列表
 * @param params
 * @returns
 */
export const queryApiList = (params: QueryApiListParamsType): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get('/api/api', params);
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
export const querySingleApiData = (params: { serviceId: string }): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get(`/api/service/${params.serviceId}`);
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



export const apiCenterApi = {
  queryApiList,
  createOrUpdateApi,
  querySingleApiData,
  deleteSingleApiData,
  changeSingleApiCollect
};