// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import type { LinkItem, EgItem } from './types';
import OEPKG from 'src/assets/images/oepkg.png';
import PKGSHIP from 'src/assets/images/pkgship.png';
import HISS from 'src/assets/svgs/hiss.svg';
import GENERAL_KNOWLEDGE from 'src/assets/images/light_general_knowledge.png';
import GENERAL_KNOWLEDGE_DARK from 'src/assets/images/dark_general_knowledge.png';
import EXPERTISE from 'src/assets/images/light_expertise.png';
import EXPERTISE_DARK from 'src/assets/images/dark_expertise.png';
import APPLICATION_CASES from 'src/assets/images/light_application_case.png';
import APPLICATION_CASES_DARK from 'src/assets/images/dark_application_case.png';
import EXPANDED_KNOWLEDGE from 'src/assets/images/light_expand_knowledge.png';
import EXPANDED_KNOWLEDGE_DARK from 'src/assets/images/dark_expand_knowledge.png';
import COMMAND_GENNERATION from 'src/assets/images/light_command_generation.png';
import COMMAND_GENNERATION_DARK from 'src/assets/images/dark_command_generation.png';

// 常用工具列表
export const TOOL_LIST: LinkItem[] = [
  {
    key: 'oepkg',
    label: 'oepkg',
    type: 'redirect',
    url: import.meta.env.VITE_OEPKG_URL,
    icon: OEPKG,
  },
  {
    key: 'pkgship',
    label: 'pkgship',
    type: 'redirect',
    url: import.meta.env.VITE_PKGSHIP_URL,
    icon: PKGSHIP,
  },
];
// 热点追踪
export const HOT_SPOT_TRACKING: LinkItem[] = [
  {
    key: 'image warehouse',
    label: '官方及合作镜像仓',
    type: 'redirect',
    url: import.meta.env.VITE_MIRROR_URL,
  },
  {
    key: 'relocation guidance',
    label: '系统迁移指导',
    type: 'redirect',
    url: import.meta.env.VITE_GUIDANCE_URL,
  },
  {
    key: 'developer Forum',
    label: '开发者论坛',
    type: 'redirect',
    url: import.meta.env.VITE_FORUM_URL,
  },
  {
    key: 'mailing list',
    label: 'openEuler邮件列表',
    type: 'redirect',
    url: import.meta.env.VITE_MAIL_URL,
  },
  {
    key: 'security bulletins',
    label: 'openEuler安全公告',
    type: 'redirect',
    url: import.meta.env.VITE_BULLETIN_URL,
  },
];

/**
 * oidc登录链接
 */
export const CALLBACK_URL = import.meta.env.VITE_LOGIN_CALLBACK_URL;
export const LOGOUT_CALLBACK_URL = import.meta.env.VITE_LOGOUT_CALLBACK_URL;

export const FRIENDS_CHAIN = [
  {
    key: 'basic',
    label: '基础软件服务能力平台',
    type: 'redirect',
    url: import.meta.env.VITE_HISS_URL,
    icon: HISS,
  },
];

export const EG_LIST: EgItem[] = [
  {
    icon: GENERAL_KNOWLEDGE,
    iconDark: GENERAL_KNOWLEDGE_DARK,
    key: 'general_knowledge',
    title: 'OS领域通用知识',
    insertMessage:
      '包含Linux常规知识、上游信息和工具链介绍及指导',
  },
  {
    icon: EXPERTISE,
    iconDark: EXPERTISE_DARK,
    key: 'expertise',
    title: 'openEuler专业知识',
    insertMessage: '包含openEuler社区信息、技术原理和使用指导',
  },
  {
    icon: EXPANDED_KNOWLEDGE,
    iconDark: EXPANDED_KNOWLEDGE_DARK,
    key: 'expanded_knowledge',
    title: 'openEuler扩展知识',
    insertMessage:
      '包含openEuler周边硬件特性知识和ISV、OSV相关信息',
  },
  {
    icon: APPLICATION_CASES,
    iconDark: APPLICATION_CASES_DARK,
    key: 'application_cases',
    title: 'openEuler应用案例',
    insertMessage:
      '包含openEuler技术案例、行业应用案例',
  },
  {
    icon: COMMAND_GENNERATION,
    iconDark: COMMAND_GENNERATION_DARK,
    key: 'command_generation',
    title: 'shell命令生成',
    insertMessage:
      '帮助用户生成单条命令或复杂命令',
  },
];
