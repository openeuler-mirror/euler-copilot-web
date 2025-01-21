// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { get, post, del, put } from 'src/apis/server';
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
        apis: ApiMessage[];
        }>
      | undefined
    )
  ]
> => {
  return get(`/api/service/${serviceId}/key`,{page, pageSize});
};

/**
 * 查询语义服务列表
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
            services: Service[];
        }>
        | undefined
      )
    ]
  > => {
    return get('/api/auth/key',{
      ...params
    });
  };

/**
 * 通过上传 YAML 文本创建/编辑服务
 * @returns
 */
export const uploadYAML = (params: {
    serviceId?: string;
    yaml: string;
  }
    ): Promise<
      [
        any,
        (
          | FcResponse<{  
            serviceId: string;
            name: string;
            apis: ApiMessage[];
          }>
          | undefined
        )
      ]
    > => {
      return post('/api/service',{
        ...params
      });
    };

/**
 * 获取指定服务的详细信息及 YAML 内容
 * @returns
 */
export const getYAMLByServiceId = (params: {
    serviceId: string;
  }
    ): Promise<
      [
        any,
        (
          | FcResponse<{  
            serviceId: string;
            name: string;
            yaml: string;
          }>
          | undefined
        )
      ]
    > => {
      return get(`/api/service/${params.serviceId}`)
    };

/**
 * 删除指定服务
 * @returns
 */
export const deleteYAMLByServiceId = (params: {
    serviceId: string;
  }
    ): Promise<
      [
        any,
        (
          | FcResponse<{  
            serviceId: string;
          }>
          | undefined
        )
      ]
    > => {
      return del(`/api/service/${params.serviceId}`);
    };
    
/**
 * 更改服务收藏状态
 * @returns
 */
export const likeServiceByServiceId = (params: {
    serviceId: string;
  }
    ): Promise<
      [
        any,
        (
          | FcResponse<{  
            serviceId: string;
          }>
          | undefined
        )
      ]
    > => {
      return put(`/api/service/${params.serviceId}`);
    };

export const apiApi = {
  getApiMessageByServiceId,
  getApiMessageList,
  uploadYAML,
  getYAMLByServiceId,
  deleteYAMLByServiceId,
  likeServiceByServiceId,
};
