// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { get, put, post } from 'src/apis/server';

import type { FcResponse } from 'src/apis/server';
const BASE_URL = '/api/client/conversation';

/**
 * 获取历史session列表
 * @returns
 */
export const getSessionRecord = (): Promise<
  [
    any,
    (
      | FcResponse<
          Array<{
            conversation_id: string;
            title: string;
            created_time: Date;
          }>
        >
      | undefined
    )
  ]
> => {
  return get(BASE_URL);
};

/**
 * 更新会话标题
 * @param params
 * {
 *    conversation_id:（number）会话id
 *    title：（string）会话标题
 * }
 * @returns
 */
export const updateSession = (
  params: { sessionId: string },
  data: { title: string }
): Promise<
  [
    any,
    (
      | FcResponse<
          Array<{
            conversation_id: string;
          }>
        >
      | undefined
    )
  ]
> => {
  return put(BASE_URL, data, {
    conversation_id: params.sessionId,
  });
};

/**
 * 删除会话
 * @param params
 * @returns
 */
export const deleteSession = (params: {
  conversation_id_list: string[];
}): Promise<[any, FcResponse<Array<{ conversation_id_list: string[] }>> | undefined]> => {
  return post(`${BASE_URL}/delete`, params);
};

/**
 * 获取会话历史对话记录
 * @param sessionId 会话id
 */
export const getHistoryConversation = (
  sessionId: string
): Promise<
  [
    any,
    (
      | FcResponse<
          Array<{
            conversation_id: string;
            record_id: string;
            question: string;
            answer: string;
            created_time: string | Date;
            is_like?:number|undefined;
            group_id:string,
          }>
        >
      | undefined
    )
  ]
> => {
  return get('/api/qa_record', { conversation_id: sessionId });
};

/**
 * 评论对话
 * @param params
 * @returns
 */
export const commentConversation = (params: {
  qaRecordId: string;
  isLike: number;
  dislikeReason?: string;
  reasonLink?: string;
  reasonDescription?: string;
}): Promise<[any, FcResponse<Record<string, unknown>> | undefined]> => {
  const { qaRecordId, isLike, dislikeReason, reasonLink, reasonDescription } = params;
  return post(`/api/comment`, {
    qa_record_id: qaRecordId,
    is_like: isLike,
    dislike_reason: dislikeReason,
    reason_link: reasonLink,
    reason_description: reasonDescription,
  });
};

export const getRecognitionMode = (): Promise<
[
  any, 
  (
    | FcResponse<
      Array<{
        plugin_id: string,
        plugin_name: string
      }>>
    | undefined)
]> => {
  return get('api/client/plugin');
}

export const sessionApi = {
  updateSession,
  deleteSession,
  getSessionRecord,
  getHistoryConversation,
  commentConversation,
  getRecognitionMode,
};
