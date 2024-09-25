// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { post } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';

/**
 * 反馈
 * @param params
 * @returns
 */
export const feedback = (params: {
  degree: number;
  request_id: string;
  feedback_tag?: string;
  commont?: string;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return post('/openlabs/qabot/satisfaction', params);
};

/**
 * 反馈
 * @param params
 * @returns
 */
export const report = (params: {
  recordId: string;
  reason: string;
}): Promise<[any, FcResponse<unknown> | undefined]> => {
  return post('/api/blacklist/complaint', params);
};

export const externalApi = {
  feedback, report
};
