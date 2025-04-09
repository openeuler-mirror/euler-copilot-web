// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import type { EgItem } from './types';
import GENERAL_KNOWLEDGE from 'src/assets/images/light_general_knowledge.png';
import GENERAL_KNOWLEDGE_DARK from 'src/assets/images/dark_general_knowledge.png';
import EXPERTISE from 'src/assets/images/light_expertise.png';
import EXPERTISE_DARK from 'src/assets/images/dark_expertise.png';
import APPLICATION_CASES from 'src/assets/images/light_application_case.png';
import APPLICATION_CASES_DARK from 'src/assets/images/dark_application_case.png';
import EXPANDED_KNOWLEDGE from 'src/assets/images/light_expand_knowledge.png';
import EXPANDED_KNOWLEDGE_DARK from 'src/assets/images/dark_expand_knowledge.png';

/**
 * oidc登录链接
 */
export const CALLBACK_URL = import.meta.env.VITE_LOGIN_CALLBACK_URL;
export const LOGOUT_CALLBACK_URL = import.meta.env.VITE_LOGOUT_CALLBACK_URL;

export const EG_LIST: EgItem[] = [
  {
    icon: GENERAL_KNOWLEDGE,
    iconDark: GENERAL_KNOWLEDGE_DARK,
    key: 'os_knowledge',
    title: 'OS领域通用知识',
    insertMessage: 'os_knowledge_describe',
  },
  {
    icon: EXPERTISE,
    iconDark: EXPERTISE_DARK,
    key: 'openEuler_expertise',
    title: 'openEuler专业知识',
    insertMessage: 'openEuler_expertise_describe',
  },
  {
    icon: EXPANDED_KNOWLEDGE,
    iconDark: EXPANDED_KNOWLEDGE_DARK,
    key: 'beyond_openEuler',
    title: 'openEuler扩展知识',
    insertMessage: 'beyond_openEuler_describe',
  },
  {
    icon: APPLICATION_CASES,
    iconDark: APPLICATION_CASES_DARK,
    key: 'openEuler_use_cases',
    title: 'openEuler应用案例',
    insertMessage: 'openEuler_use_cases_describe',
  },
];
