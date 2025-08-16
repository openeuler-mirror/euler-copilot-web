// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import i18n from 'src/i18n';

import type {
  UserDialoguePanelType,
  RobotDialoguePanelType,
} from 'src/components/dialoguePanel/type';

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
import CODE from '@/assets/svgs/userCode.svg';
// 引入图片--用户自上传相关图标
import USER_CODE from '@/assets/svgs/userCode.svg';
import USER_DATABASE_CLASS from '@/assets/svgs/userDatabaseClass.svg';
import USER_DOCUMENT_CLASS from '@/assets/svgs/userDatabaseClass.svg';
// 引入图片--循环控制相关图标
import REFRESH from '@/assets/svgs/Refresh.svg';
import STOP_FILLED from '@/assets/svgs/StopFilled.svg';
// 引入图片--文件处理相关图标
import DOCUMENT from '@/assets/svgs/document.svg';
// 工具类型
export type LinkType = 'redirect' | 'action';

export enum BranchSourceIdType {
  SOURCEA = 'source_a',
  SOURCEB = 'source_b',
}

// 这里配置的是各节点运行状态
export const StatusInfoTitle = {
  default: '',
  success: 'success',
  error: 'error',
  running: 'running',
  pending: 'pending',
};

// 这里配置工作流画布默认的viewPort缩放级别
export const DefaultViewPortZoom = 0.8;

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
  CODE,

  // 用户自上传相关图标
  USER_CODE,
  USER_DATABASE_CLASS,
  USER_DOCUMENT_CLASS,

  // 循环控制相关图标
  REFRESH,
  STOP_FILLED,
  continue: REFRESH,
  break: STOP_FILLED,
  
  // 文件处理相关图标
  DOCUMENT,
};

// 这里是对应的图标
export const iconTypeList = [
  { name: i18n.global.t('opertion.api'), value: 'API', icon: API, class: 'otherNode' },
  { name: i18n.global.t('opertion.mcp'), value: 'MCP', icon: API, class: 'otherNode' },
  { name: i18n.global.t('opertion.sql'), value: 'SQL', icon: API, class: 'otherNode' },
  { name: i18n.global.t('opertion.gcraph'), value: 'Graph', icon: API, class: 'otherNode' },
  { name: i18n.global.t('opertion.llm'), value: 'LLM', icon: LLM, class: 'systemNode' },
  { name: i18n.global.t('opertion.rag'), value: 'RAG', icon: KENOWLEDGE_BASE, class: 'systemNode' },
  {
    name: i18n.global.t('opertion.suggestion'),
    value: 'Suggestion',
    icon: get_CVE_DETAIL,
    class: 'aposNode',
  },
  // 循环控制节点
  {
    name: i18n.global.t('opertion.skip_round'),
    value: 'continue',
    icon: REFRESH,
    class: 'systemNode',
  },
  {
    name: i18n.global.t('opertion.exit_loop'),
    value: 'break',
    icon: STOP_FILLED,
    class: 'systemNode',
  },
  {
    name: i18n.global.t('opertion.variable_assign'),
    value: 'VariableAssign',
    icon: CODE, // 暂时使用CODE图标，与菜单保持一致
    class: 'systemNode',
  },
  {
    name: i18n.global.t('opertion.file_extract'),
    value: 'FileExtract',
    icon: CODE,
    class: 'systemNode',
  },
];

// 根据类型获取类名
export const getNodeClass = (node) => {
  // 默认类名
  let defaultClass = 'systemNode';
  iconTypeList.forEach((item) => {
    if (item.value === node?.callId) {
      defaultClass = item.class;
    }
  });
  return defaultClass;
};

// 获取节点图标
export const getSrcIcon = (node) => {
  // 默认的图标
  let defaultIcon = nodeTypeToIcon.TASK_CHOICE;
  iconTypeList.forEach((item) => {
    if (item.value === node?.callId) {
      defaultIcon = item.icon;
    }
  });
  return defaultIcon;
};

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

const opertionList = [
  // Number operations
  {value: 'number_equal', label: i18n.global.t('opertion.equal'), str: '='},
  {value: 'number_not_equal', label: i18n.global.t('opertion.not_equal'), str: '≠'},
  {value: 'number_greater_than', label: i18n.global.t('opertion.greater_than'), str: '>'},
  {value: 'number_less_than', label: i18n.global.t('opertion.less_than'), str: '<'},
  {value: 'number_greater_than_or_equal', label: i18n.global.t('opertion.greater_than_or_equal'), str: '≥'},
  {value: 'number_less_than_or_equal', label: i18n.global.t('opertion.less_than_or_equal'), str: '≤'},

  // String operations
  {value: 'string_equal', label: i18n.global.t('opertion.equal'), str: '='},
  {value: 'string_not_equal', label: i18n.global.t('opertion.not_equal'), str: '≠'},
  {value: 'string_contains', label: i18n.global.t('opertion.contains'), str: ''},
  {value: 'string_not_contains', label: i18n.global.t('opertion.does_not_contain'), str: ''},
  {value: 'string_starts_with', label: i18n.global.t('opertion.starts_with'), str: '='},
  {value: 'string_ends_with', label: i18n.global.t('opertion.ends_with'), str: '='},
  {value: 'string_length_equal', label: i18n.global.t('opertion.length_equal'), str: '|...|='},
  {value: 'string_length_greater_than', label: i18n.global.t('opertion.length_greater_than'), str: '|...|>'},
  {value: 'string_length_greater_than_or_equal', label: i18n.global.t('opertion.length_greater_than_or_equal'), str: '|...|≥'},
  {value: 'string_length_less_than', label: i18n.global.t('opertion.length_less_than'), str: '|...|<'},
  {value: 'string_length_less_than_or_equal', label: i18n.global.t('opertion.length_less_than_or_equal'), str: '|...|≤'},
  {value: 'string_regex_match', label: i18n.global.t('opertion.regex_match'), str: '\\+'},

  // List operations
  {value: 'list_equal', label: i18n.global.t('opertion.equal'), str: '='},
  {value: 'list_not_equal', label: i18n.global.t('opertion.not_equal'), str: '≠'},
  {value: 'list_contains', label: i18n.global.t('opertion.contains'), str: ''},
  {value: 'list_not_contains', label: i18n.global.t('opertion.does_not_contain'), str: ''},
  {value: 'list_length_equal', label: i18n.global.t('opertion.length_equal'), str: '|...|='},
  {value: 'list_length_greater_than', label: i18n.global.t('opertion.length_greater_than'), str: '|...|>'},
  {value: 'list_length_greater_than_or_equal', label: i18n.global.t('opertion.length_greater_than_or_equal'), str: '|...|≥'},
  {value: 'list_length_less_than', label: i18n.global.t('opertion.length_less_than'), str: '|...|<'},
  {value: 'list_length_less_than_or_equal', label: i18n.global.t('opertion.length_less_than_or_equal'), str: '|...|≤'},

  // Boolean operations
  {value: 'bool_equal', label: i18n.global.t('opertion.equal'), str: '='},
  {value: 'bool_not_equal', label: i18n.global.t('opertion.not_equal'), str: '≠'},

  // Dictionary operations
  {value: 'dict_equal', label: i18n.global.t('opertion.equal'), str: '='},
  {value: 'dict_not_equal', label: i18n.global.t('opertion.not_equal'), str: '≠'},
  {value: 'dict_contains_key', label: i18n.global.t('opertion.contains_key'), str: ''},
  {value: 'dict_not_contains_key', label: i18n.global.t('opertion.does_not_contain_key'), str: ''}
]

 export const opertionListMap = new Map(opertionList.map(item => [item.value, item]));
