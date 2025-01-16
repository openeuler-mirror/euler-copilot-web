// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { get, put, post, del } from 'src/apis/server';

import type { FcResponse } from 'src/apis/server';
import { ConversationRecordList, ConversationList } from './type';
const BASE_URL = '/api/conversation';

/**
 * 停止生成
 * @returns
 */
export const stopGeneration = (): Promise<
  [
    any,
    (
      | FcResponse<{
          // conversation_id: string;
        }>
      | undefined
    )
  ]
> => {
  return post(`/api/stop`);
};

/**
 * 获取历史session列表
 * @returns
 */
export const getSessionRecord = (): Promise<
  [
    any,
    (
      | FcResponse<ConversationList>
      | undefined
    )
  ]
> => {
  return get(BASE_URL);
};

/**
 * 创建一个会话
 * @returns
 */
export const createSession = (): Promise<
  [
    any,
    (
      | FcResponse<{
          conversation_id: string;
        }>
      | undefined
    )
  ]
> => {
  return post(BASE_URL);
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
  params: {
    conversation_id: string,
    title: string,
  },
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
  return put(BASE_URL, {
    title: params.title,
  }, {
    conversation_id: params.conversation_id,
  });
};

/**
 * 删除会话
 * @param data
 * @returns
 */
export const deleteSession = (data: {
  conversation_list: string[];
}): Promise<[any, FcResponse<Array<{ conversation_list: string[] }>> | undefined]> => {
  return del(`${BASE_URL}`, data);
};

/**
 * 获取会话历史对话记录
 * @param conversation_id 
 * GET /api/record/eccb08c3-0621-4602-a4d2-4eaada892557
 */
export const getHistoryConversation = (
  conversation_id: string
): Promise<
  [
    any,
    (
      | FcResponse<ConversationRecordList>
      | undefined
    )
  ]
> => {
  // return get('/api/record', { conversation_id: conversation_id });
  return get('/api/record/'+ conversation_id);
  // 修改 chat 格式

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
    record_id: qaRecordId,
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
            id: string;
            name: string;
            description: string;
            auth:any;
          }>
        >
      | undefined
    )
  ]
> => {
  return get('/api/plugin');
};

export enum UploadStatus {
  UNUSED = 'unused',
  USED = 'used',
  UPLOADING = 'uploading',
  UPLOADFAIL = 'uploadfail',
  RESOLVEFAIL = 'failed',
  RESOLVING = 'processing',
}

export const getUploadFiles = (
  sessionId: string,
  used = true,
  unused = true
): Promise<
  [
    any,
    (
      | FcResponse<{
          documents: Array<{
            id: string;
            name: string;
            type: string;
            size: number;
            status: UploadStatus.USED | UploadStatus.UNUSED | UploadStatus.RESOLVING | UploadStatus.RESOLVEFAIL;
            created_at: number;
          }>;
        }>
      | undefined
    )
  ]
> => {
  return get(`/api/document/${sessionId}`, { used, unused });
};

export const uploadFiles = (
  formData,
  sessionId
): Promise<
  [
    any,
    (
      | FcResponse<{
          documents: Array<any>;
        }>
      | undefined
    )
  ]
> => {
  return post(`/api/document/${sessionId}`, formData, {}, {
    'Content-Type': 'multipart/form-data',
  });
};

export const deleteUploadedFile = (
  documentId: any
): Promise<[any, FcResponse<any> | undefined]> => {
  return del(`/api/document/${documentId}`);
};

export const sessionApi = {
  createSession,
  updateSession,
  deleteSession,
  getSessionRecord,
  getHistoryConversation,
  commentConversation,
  getRecognitionMode,
  stopGeneration: stopGeneration,
  getUploadFiles,
  uploadFiles,
  deleteUploadedFile,
};
