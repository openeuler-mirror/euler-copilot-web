// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
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
export const getApiKey = (): Promise<
  [
    any,
    (
      | FcResponse<{
          api_key_exists: string;
        }>
      | undefined
    ),
  ]
> => {
  return get('/api/auth/key');
};

/**
 * USER登录
 * @returns
 */
export const changeApiKey = (params: { action: string; query?: string }) => {
  return post<{
    api_key: string;
  }>('/api/auth/key', params, params);
};

export const apiKeyApi = {
  getApiKey,
  changeApiKey,
};
