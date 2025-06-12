// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
import { post, get, del, put } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';
import {
  QueryAppListParamsType,
  CreateOrUpdateAppParamsType,
  AppDetail,
} from './type';

/**
 * 获取应用列表
 * @param params
 * @returns
 */
export const queryAppList = (
  params: QueryAppListParamsType,
): Promise<
  [
    any,
    (
      | FcResponse<{
          applications: {
            appId: string;
            author: string;
            description: string;
            favorited: boolean;
            appType: 'flow' | 'agent';
            icon: string;
            name: string;
            published: boolean;
          }[];
          currentPage: number;
          totalApps: number;
        }>
      | undefined
    ),
  ]
> => {
  return get('/api/app', params);
};

/**
 * 创建应用/更新应用
 * @param params
 * @returns
 */
export const createOrUpdateApp = (params: CreateOrUpdateAppParamsType) => {
  return post<{ appId: string }>('/api/app', params);
};

/**
 * 获取应用数据
 * @param params
 * @returns
 */
export const querySingleAppData = (params: { id: string }) => {
  return get<AppDetail>(`/api/app/${params.id}`);
};

/**
 * 删除应用
 * @param params
 * @returns
 */
export const deleteSingleAppData = (params: {
  id: string;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return del(`/api/app/${params.id}`, params);
};

/**
 * 发布应用
 * @param params
 * @returns
 */
export const releaseSingleAppData = (params: {
  appId: string;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return post(`/api/app/${params.appId}`);
};

/**
 * 更改应用收藏状态
 * @param params
 * @returns
 */
export const changeSingleAppCollect = (params: {
  id: string;
  favorited: boolean;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return put(`/api/app/${params.id}`, { favorited: params.favorited });
};

/**
 * 获取
 * @param params
 * @returns
 */
export const getPartAppConfgUser = (): Promise<
  [
    any,
    (
      | FcResponse<{ userInfoList: { userName: string; userSub: string }[] }>
      | undefined
    ),
  ]
> => {
  return get('/api/user');
};

export const appCenterApi = {
  queryAppList,
  createOrUpdateApp,
  querySingleAppData,
  deleteSingleAppData,
  releaseSingleAppData,
  changeSingleAppCollect,
  getPartAppConfgUser,
};
