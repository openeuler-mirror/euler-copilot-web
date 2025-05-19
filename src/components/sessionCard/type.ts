// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import { AddedModalList, teamKnowledgeList } from 'src/apis/paths/type';

// 更新接口
export interface SessionItem {
  conversationId: string;
  title: string;
  createdTime?: string | Date;
  docCount?: number;
  appId?: string;
  debug?: boolean;
  model?: AddedModalList;
  llm?:{
    icon: string;
    modelName: string;
  }
  kbList?: teamKnowledgeList[];
}
// 新增接口
export interface modelItem  {
  icon: string;
  modelName: string;
}
