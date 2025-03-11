// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import type { UserDialoguePanelType, RobotDialoguePanelType } from 'src/components/dialoguePanel/type';

// 引入图片--系统下相关的图标
import KENOWLEDGE_BASE from '@/assets/svgs/knowledgeBase.svg';
import LLM from '@/assets/svgs/LLM.svg';
import CONDITION from '@/assets/svgs/condition.svg';
import LOOP from '@/assets/svgs/loop.svg';
import TEMPLATE_CONVERSION from '@/assets/svgs/templateConversion.svg';
// 引入图片--Aops-apollo相关图标
import QUERY from '@/assets/svgs/query.svg';
import get_CVE_DETAIL from '@/assets/svgs/getCveDetail.svg';
// 引入图片--Euler-Copilot-tune相关图标
import GATHER_METRICS from '@/assets/svgs/gatherMetrics.svg';
// 引入图片--其他相关图标
import API from '@/assets/svgs/API.svg';
import TASK_CHOICE from '@/assets/svgs/taskChoice.svg';
// 引入图片--用户自上传相关图标
import USER_CODE from '@/assets/svgs/userCode.svg';
import USER_DATABASE_CLASS from '@/assets/svgs/userDatabaseClass.svg';
import USER_DOCUMENT_CLASS from '@/assets/svgs/userDatabaseClass.svg';
// 工具类型
export type LinkType = 'redirect' | 'action';

export enum BranchSourceIdType {
  SOURCEA = "source_a",
  SOURCEB = "source_b",
}

export const StatusInfoTitle = {
  default: '',
  success: '运行成功',
  error: '运行失败',
  running: '运行中',
  pending: '运行中',
};

// 这里是对应的图标
export const nodeTypeToIcon = {
  // 系统相关图标
  KENOWLEDGE_BASE,
  LLM,
  CONDITION,
  LOOP,

  // Aops-apollo相关
  QUERY,
  get_CVE_DETAIL,

  // Euler-Copilot-tune相关图标
  GATHER_METRICS,

  // 其他相关图标
  API,
  TASK_CHOICE,

  // 用户自上传相关图标
  USER_CODE,
  USER_DATABASE_CLASS,
  USER_DOCUMENT_CLASS,
}

// 这里是对应的图标
export const iconTypeList = [
  {name: 'HTTP请求', value: 'API', icon: API, class: 'otherNode'},
  {name: '大模型', value: 'LLM', icon: LLM, class: 'systemNode'},
  {name: '知识库', value: 'RAG', icon: KENOWLEDGE_BASE, class: 'systemNode'},
  {name: '问题推荐', value: 'Suggestion', icon: get_CVE_DETAIL, class: 'aposNode'},
];

// 根据类型获取类名
export const getNodeClass = (node) => {
  // 默认类名
  let defaultClass = 'systemNode';
  iconTypeList.forEach(item => {
    if (item.value === node?.callId) {
      defaultClass = item.class;
    }
  })
  return defaultClass;
}

// 获取节点图标
export const getSrcIcon = (node) => {
  // 默认的图标
  let defaultIcon = nodeTypeToIcon.TASK_CHOICE;
  iconTypeList.forEach(item => {
    if (item.value === node?.callId) {
      defaultIcon = item.icon;
    }
  })
  return defaultIcon;
}

export interface LinkItem {
  key: string;
  label: string;
  type: LinkType;
  url?: string;
  icon?: any;
}

export interface EgItem {
  icon?: any;
  iconDark?: any;
  key: string;
  insertMessage: string;
  style?: string;
  title: string;
  des?: string;
}

export interface ChainItem {
  key: string;
  label: string;
  type: string;
  url?: string;
  icon?: any;
}

export interface ListItem {
  id: string;
  value: string | null;
}
