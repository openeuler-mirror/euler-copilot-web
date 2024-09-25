// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import axios from "axios";

import { handleChangeRequestHeader } from "./tools";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

export interface FcResponse<T> {
  error: string;
  errMessage: string;
  result: T;
}

export interface IAnyObj {
  [index: string]: unknown;
}

export type Fn = (data: FcResponse<any>) => unknown;

// 创建 axios 实例
export const server = axios.create({
  // API 请求的默认前缀
  timeout: 60 * 1000, // 请求超时时间
});

// request interceptor
server.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig<any>
  ): InternalAxiosRequestConfig<any> | Promise<InternalAxiosRequestConfig<any>> => {
    return handleChangeRequestHeader(config);
  },
  (error) => {
    return Promise.reject(error);
  }
);

// response interceptor
server.interceptors.response.use(
  (response: AxiosResponse<any, any>): any => {
    if (response.status !== 200) {
      return Promise.reject(response.data);
    }
    return response;
  },
  async (error) => {
    console.error("request error", error);
  }
);

/**
 * request with get
 * @param url
 * @param params
 * @param clearFn
 * @constructor
 */
export const get = async <T>(
  url: string,
  params: IAnyObj = {}
): Promise<[any, FcResponse<T> | undefined]> => {
  try {
    const result = await server.get(url, { params });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error, undefined];
  }
};

/**
 * request with post
 * @param url
 * @param data
 * @param params
 * @constructor
 */
export const post = async <T>(
  url: string,
  data: IAnyObj = {},
  params: IAnyObj = {}
): Promise<[any, FcResponse<T> | undefined]> => {
  try {
    const result = await server.post(url, data, { params });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error, undefined];
  }
};

/**
 * request with put
 * @param url
 * @param data
 * @param params
 * @constructor
 */
export const put = async <T>(
  url: string,
  data: IAnyObj = {},
  params: IAnyObj = {}
): Promise<[any, FcResponse<T> | undefined]> => {
  try {
    const result = await server.put(url, data, { params });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error, undefined];
  }
};

/**
 * request with delete
 * @param url
 * @param params
 * @constructor
 */
export const del = <T>(
  url: string,
  params: IAnyObj = {}
): Promise<[any, FcResponse<T> | undefined]> => {
  return new Promise((resolve) => {
    server
      .delete(url, { params })
      .then((result) => {
        resolve([null, result.data as FcResponse<T>]);
      })
      .catch((err) => {
        resolve([err, undefined]);
      });
  });
};
