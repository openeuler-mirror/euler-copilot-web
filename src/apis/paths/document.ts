// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { witchainDGet } from 'src/apis/server';
import type { FcResponse } from 'src/apis/server';

/**
 * 获取文档解析方法列表
 * @returns Promise<[any, FcResponse<ParseMethod[]> | undefined]>
 */
export const getParseMethodList = (): Promise<[any, FcResponse<string[]> | undefined]> => {
  return witchainDGet('/witchainD/other/parse_method');
};

/**
 * 文档解析方法接口类型定义
 */
export interface ParseMethod {
  id: string;
  name: string;
  description?: string;
  supported_formats?: string[];
}

export const documentApi = {
  getParseMethodList,
}; 