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

/**
 * 验证用户信息
 * @returns
 */
export const authorizeUser = (): Promise<
  [
    any,
    (
      | FcResponse<{
        user_sub: string;
        username: string;
        organization: string;
        revision_number: string | null;
      }>
      | undefined
    )
  ]
> => {
  return get('/api/auth/user');
};

/**
 * 退出登录
 * @returns
 */
export const authorizeLogout = (): Promise<[any, FcResponse<unknown> | undefined]> => {
  return get('/api/auth/logout');
};

/**
 * 登录
 * @returns
 */
export const login = (
  code: string
): Promise<
  [
    any,
    (
      | FcResponse<{
        csrf_token: string;
      }>
      | undefined
    )
  ]
> => {
  return get('/api/auth/login', { code });

};

/**
 * USER登录
 * @returns
 */
export const userLogin = (
  passwd: string,
  account: string,
): Promise<
  [
    any,
    (
      | FcResponse<{
        csrf_token: string;
      }>
      | undefined
    )
  ]
> => {
  return get('/api/auth/login', { passwd, account });
};

/**
 * 刷新token
 * @returns
 */
export const refreshToken = (): Promise<
  [
    any,
    (
      | FcResponse<{
        csrf_token: string;
      }>
      | undefined
    )
  ]
> => {
  return get('/api/auth/refresh_token');
};

/**
 * 更新签署服务协议版本
 * @param revisionNumber
 * @returns
 */
export const updateRevision = (
  revisionNumber: number | string
): Promise<
  [
    any,
    (
      | FcResponse<{
        user_sub: string;
        username: string;
        organization: string;
        revision_number: string | null;
      }>
      | undefined
    )
  ]
> => {
  return post('/api/auth/update_revision_number', { revision_num: revisionNumber });
};


function queryAuthUrl(action: string) {
  return get<{
    url: string;
  }>('/api/auth/redirect',{action});
}

export const accountApi = {
  authorizeUser,
  authorizeLogout,
  login,
  userLogin,
  refreshToken,
  updateRevision,
  queryAuthUrl
};
