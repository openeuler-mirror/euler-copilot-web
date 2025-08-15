// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
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
import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosHeaders,
} from 'axios';
import { ElMessage } from 'element-plus';
import { successMsg } from 'src/components/Message';
import { getBaseProxyUrl, getWitchainDProxyUrl } from 'src/utils/tools';
import i18n from 'src/i18n';

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

const baseURL: string = './';
if (import.meta.env.MODE === 'electron-production') {
  getBaseProxyUrl().then((url) => {
    server.defaults.baseURL = url;
  });
}

let server: ReturnType<typeof axios.create>; // 主API服务 axios 实例
let witchainDServer: ReturnType<typeof axios.create>; // WitchainD服务 axios 实例

export const initServer = async () => {
  const baseURL = await getBaseProxyUrl();
  const witchainDURL = await getWitchainDProxyUrl();
  
  // 初始化主API服务实例
  server = axios.create({
    baseURL,
    timeout: 60 * 1000, // 请求超时时间
  });
  
  // 初始化WitchainD服务实例
  witchainDServer = axios.create({
    baseURL: witchainDURL,
    timeout: 60 * 1000, // 请求超时时间
  });

  // 设置拦截器的通用函数
  const setupInterceptors = (axiosInstance: ReturnType<typeof axios.create>) => {
    // request interceptor
    axiosInstance.interceptors.request.use(
      (
        config: InternalAxiosRequestConfig<any>,
      ):
        | InternalAxiosRequestConfig<any>
        | Promise<InternalAxiosRequestConfig<any>> => {
        return handleChangeRequestHeader(config);
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // response interceptor
    axiosInstance.interceptors.response.use(
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
        if (
          error.status !== 401 &&
          error.status !== 403 &&
          error.status !== 409
        ) {
          ElMessage({
            showClose: true,
            message:
              ((error as any)?.response?.data?.message as string) ||
              error.message,
            icon: IconError,
            customClass: 'o-message--error',
            duration: 3000,
          });
        }
        if (error.status === 409) {
          // 处理错误码为409的情况
          successMsg(i18n.global.t('history.latestConversation'));
          return Promise.reject(error as any);
        }
        return await handleStatusError(error);
      },
    );
  };

  // 为两个服务实例设置拦截器
  setupInterceptors(server);
  setupInterceptors(witchainDServer);
};
/**
 * request with get
 * @param url
 * @param params
 * @constructor
 */
export const get = async <T>(
  url: string,
  params: IAnyObj = {},
): Promise<[IError, FcResponse<T> | undefined]> => {
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
    const result = await server.post(url, data, {
      params: params,
      headers: headers as AxiosHeaders,
    });
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

// WitchainD 服务专用方法
/**
 * WitchainD service - request with get
 */
export const witchainDGet = async <T>(
  url: string,
  params: IAnyObj = {},
): Promise<[IError, FcResponse<T> | undefined]> => {
  try {
    const result = await witchainDServer.get(url, { params: params });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error as IError, undefined];
  }
};

/**
 * WitchainD service - request with post
 */
export const witchainDPost = async <T>(
  url: string,
  data: IAnyObj = {},
  params: IAnyObj = {},
  headers: IAnyObj = {},
): Promise<[IError, FcResponse<T> | undefined]> => {
  try {
    const result = await witchainDServer.post(url, data, {
      params: params,
      headers: headers as AxiosHeaders,
    });
    return [null, result.data as FcResponse<T>];
  } catch (error) {
    return [error as IError, undefined];
  }
};

/**
 * 获取 WitchainD axios 实例（用于更复杂的请求）
 */
export const getWitchainDServer = () => witchainDServer;
