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
export const getKnowledgeList = (): Promise<
  [
    any,
    (
      | FcResponse<{
        }>
      | undefined
    )
  ]
> => {
  return get('/api/knowledge');
};

/**
 * USER登录
 * @returns
 */
export const updateKnowledgeList = (params: {
    kb_id: string;
  }): Promise<
    [
      any,
      (
        | FcResponse<{
          }>
        | undefined
      )
    ]
  > => {
    return post('/api/knowledge', params);
  };
  


export const knowledgeApi = {
    getKnowledgeList,
    updateKnowledgeList,
};
