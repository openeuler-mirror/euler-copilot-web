// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { get, post, put } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';

/**
 * updateKnowledgeList
 * @returns
 */
export const updateKnowledgeList = ({
  kb_ids,
  conversationId,
}: {
  kb_ids: string[];
  conversationId: string;
}): Promise<[any, FcResponse<{}> | undefined]> => {
  let kbIds = kb_ids;
  return put('/api/knowledge', { kbIds }, { conversationId });
};

export const getConvKnowledgeList = (params: {
  conversationId: string;
  kbName?: string;
}): Promise<[any, FcResponse<{}> | undefined]> => {
  return get('/api/knowledge', params);
};

export const knowledgeApi = {
  updateKnowledgeList,
  getConvKnowledgeList,
};
