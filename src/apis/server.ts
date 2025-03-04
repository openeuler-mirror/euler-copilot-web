// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import axios from 'axios';
import { IconError } from '@computing/opendesign-icons';
import { handleChangeRequestHeader, handleStatusError } from './tools';
import type { AxiosResponse, InternalAxiosRequestConfig, AxiosError, AxiosHeaders } from 'axios';
import { ElMessage } from 'element-plus';

export interface FcResponse<T> {
  error: string;
  code?: number;
  message?: string;
  errMessage: string;
  result: T;
}

export type IError = null | Error | AxiosError;

export interface IAnyObj {
  [index: string]: unknown;
}

export type Fn = (data: FcResponse<any>) => unknown;

const whiteList: Array<string | undefined> = ['/api/auth/user'];

// 创建 axios 实例
export const server = axios.create({
  // API 请求的默认前缀
  timeout: 60 * 1000, // 请求超时时间
});

// request interceptor
server.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig<any>,
  ): InternalAxiosRequestConfig<any> | Promise<InternalAxiosRequestConfig<any>> => {
    return handleChangeRequestHeader(config);
  },
  error => {
    return Promise.reject(error);
  },
);

// response interceptor
server.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse | Promise<AxiosResponse> => {
    if (response.status !== 200) {
      ElMessage({
        showClose: true,
        message: response.statusText,
        icon: IconError,
        customClass: 'o-message--error',
        duration: 3000,
      });
      return Promise.reject(new Error(response.statusText));
    }
    return Promise.resolve(response);
  },
  async (error: AxiosError) => {
    //防止初始化时出现太多报错
    if (!whiteList.includes(error.config?.url)) {
      ElMessage({
        showClose: true,
        message: error?.response?.data?.message || error.message,
        icon: IconError,
        customClass: 'o-message--error',
        duration: 3000,
      });
    }
    return await handleStatusError(error);
  },
);

/**
 * request with get
 * @param url
 * @param params
 * @constructor
 */
export const get = async <T>(url: string, params: IAnyObj = {}): Promise<[IError, FcResponse<T> | undefined]> => {
  try {
    const result = await server.get(url, { params: params });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error as IError, undefined];
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
  params: IAnyObj = {},
  headers: IAnyObj = {},
): Promise<[IError, FcResponse<T> | undefined]> => {
  try {
    const result = await server.post(url, data, { params: params, headers: headers as AxiosHeaders });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error as IError, undefined];
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
  params: IAnyObj = {},
): Promise<[IError, FcResponse<T> | undefined]> => {
  try {
    const result = await server.put(url, data, { params: params });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error as IError, undefined];
  }
};

/**
 * request with delete
 * @param url
 * @param params
 * @constructor
 */
export const del = async <T>(
  url: string,
  data: IAnyObj = {},
  params: IAnyObj = {},
): Promise<[IError, FcResponse<T> | undefined]> => {
  try {
    const result = await server.delete(url, { data: data, params: params });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error as IError, undefined];
  }
};
