// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
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
import i18n from 'src/i18n';

const BASE_URL = '/api/conversation';
const { t } = i18n.global;

/**
 * 停止生成
 * @returns
 */
export const stopGeneration = (taskId: string): Promise<
  [any, FcResponse<object> | undefined]
> => {
  const url = taskId === undefined ? '/api/stop' : `/api/stop?taskId=${taskId}`;
  return post(url);
};

/**
 * 获取历史session列表
 * @returns
 */
export const getSessionRecord = (): Promise<
  [any, FcResponse<ConversationList> | undefined]
> => {
  return get(BASE_URL);
};

/**
 * 创建一个会话
 * @returns
 */
export const createSession = ({
  appId,
  debug = false,
  llm_id = '',
  title = t('history.new_conversation'),
  kb_ids = [],
}: {
  appId: string;
  debug?: boolean;
  llm_id?: string;
  title?: string;
  kb_ids?: string[];
}): Promise<
  [
    any,
    (
      | FcResponse<{
          conversationId: string;
        }>
      | undefined
    ),
  ]
> => {
  return post(BASE_URL, { appId, debug }, { llm_id, kb_ids, title });
};

/**
 * 创建工作流debug会话
 * @param params
 * @returns
 */
export const createSessionDebug = (params: any): Promise<[any, any]> => {
  return post(`/api/conversation?debug=${params.debug}`);
};
/**
 * 更新会话标题
 * @param params
 * {
 *    conversationId:（number）会话id
 *    title：（string）会话标题
 * }
 * @returns
 */
export const updateSession = (params: {
  conversationId: string;
  modelId?: string;
  kbIds?: string[];
  title?: string;
}): Promise<
  [
    any,
    (
      | FcResponse<
          Array<{
            conversationId: string;
          }>
        >
      | undefined
    ),
  ]
> => {
  return put(
    BASE_URL,
    {
      title: params.title,
      modelId: params.modelId,
      kbIds: params.kbIds,
    },
    {
      conversationId: params.conversationId,
    },
  );
};

/**
 * 删除会话
 * @param data
 * @returns
 */
export const deleteSession = (data: {
  conversationList: string[];
}): Promise<
  [any, FcResponse<Array<{ conversationList: string[] }>> | undefined]
> => {
  return del(`${BASE_URL}`, data);
};

/**
 * 获取会话历史对话记录
 * @param conversationId
 * GET /api/record/eccb08c3-0621-4602-a4d2-4eaada892557
 */
export const getHistoryConversation = (
  conversationId: string,
): Promise<[any, FcResponse<ConversationRecordList> | undefined]> => {
  // return get('/api/record', { conversationId: conversationId });
  return get('/api/record/' + conversationId);
  // 修改 chat 格式
};

/**
 * 点踩
 * @param params
 * @returns
 */
export const commentConversation = (params: {
  type: string;
  qaRecordId: string;
  comment: string;
  dislikeReason?: string;
  reasonLink?: string;
  reasonDescription?: string;
  groupId: string | undefined;
}): Promise<[any, FcResponse<Record<string, unknown>> | undefined]> => {
  const {
    qaRecordId,
    comment,
    dislikeReason,
    reasonLink,
    reasonDescription,
    groupId,
    type,
  } = params;
  if (type === 'disliked') {
    return post(`/api/comment`, {
      record_id: qaRecordId,
      comment: comment,
      group_id: groupId,
      dislike_reason: dislikeReason,
      reason_link: reasonLink,
      reason_description: reasonDescription,
    });
  } else {
    return post(`/api/comment`, {
      record_id: qaRecordId,
      group_id: groupId,
      comment: comment,
    });
  }
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
            auth: any;
          }>
        >
      | undefined
    ),
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
  unused = true,
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
            status:
              | UploadStatus.USED
              | UploadStatus.UNUSED
              | UploadStatus.RESOLVING
              | UploadStatus.RESOLVEFAIL;
            created_at: number;
          }>;
        }>
      | undefined
    ),
  ]
> => {
  return get(`/api/document/${sessionId}`, { used, unused });
};

export const uploadFiles = (
  formData,
  sessionId,
): Promise<
  [
    any,
    (
      | FcResponse<{
          documents: Array<any>;
        }>
      | undefined
    ),
  ]
> => {
  return post(
    `/api/document/${sessionId}`,
    formData,
    {},
    {
      'Content-Type': 'multipart/form-data',
    },
  );
};

// 新增：专门用于变量文件上传的API
export const uploadFilesForVariable = (
  formData,
  sessionId,
  varName,
  varType,
  scope = 'conversation',
  flowId?: string
): Promise<
  [
    any,
    (
      | FcResponse<{
          documents: Array<any>;
        }>
      | undefined
    ),
  ]
> => {
  // 方式1：URL查询参数（推荐，符合后端接口定义）
  const params = new URLSearchParams({
    scope,
    var_name: varName,
    var_type: varType
  });
  
  // 如果提供了flowId，添加到查询参数中
  if (flowId) {
    params.append('flow_id', flowId);
  }
  
  return post(
    `/api/document/${sessionId}?${params.toString()}`,
    formData,
    {},
    {
      'Content-Type': 'multipart/form-data',
    },
  );
};

// 新增：支持Form字段方式的文件上传API（备用方案）
export const uploadFilesForVariableWithFormFields = (
  files,
  sessionId,
  varName,
  varType,
  scope = 'conversation'
): Promise<
  [
    any,
    (
      | FcResponse<{
          documents: Array<any>;
        }>
      | undefined
    ),
  ]
> => {
  // 方式2：Form字段方式
  const formData = new FormData();
  
  // 添加文件
  if (Array.isArray(files)) {
    files.forEach(file => {
      formData.append('documents', file);
    });
  } else {
    formData.append('documents', files);
  }
  
  // 添加变量相关参数作为Form字段
  formData.append('scope', scope);
  formData.append('var_name', varName);
  formData.append('var_type', varType);
  
  return post(
    `/api/document/${sessionId}`,
    formData as any,
    {},
    {
      'Content-Type': 'multipart/form-data',
    },
  );
};

export const deleteUploadedFile = (
  documentId: any,
): Promise<[any, FcResponse<any> | undefined]> => {
  return del(`/api/document/${documentId}`);
};

export const sessionApi = {
  createSession,
  createSessionDebug,
  updateSession,
  deleteSession,
  getSessionRecord,
  getHistoryConversation,
  commentConversation,
  getRecognitionMode,
  stopGeneration: stopGeneration,
  getUploadFiles,
  uploadFiles,
  uploadFilesForVariable,
  uploadFilesForVariableWithFormFields,
  deleteUploadedFile,
};
