// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { get, post } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';
import { ApiMessage, Service } from './type';

/**
 * 查询服务下接口信息
 * @returns
 */
export const getApiMessageByServiceId = (
    serviceId: string,
    page: number,
    pageSize: number,
): Promise<
  [
    any,
    (
      | FcResponse<{
        serviceId: string;
        name: string;
        apis:ApiMessage[];
        }>
      | undefined
    )
  ]
> => {
  return get(`/api/service/${serviceId}/key`,{page, pageSize});
};

/**
 * USER登录
 * @returns
 */
export const getApiMessageList = (params: {
  createdByMe?: string;
  favorited?: string;
  searchType?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
  ): Promise<
    [
      any,
      (
        | FcResponse<{  
            services:Service[];
        }>
        | undefined
      )
    ]
  > => {
    return get('/api/auth/key',{
      ...params
    });
  };
  


export const apiApi = {
  getApiMessageByServiceId,
  getApiMessageList,
};
