// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
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

export const questions = [
  {
    groupId: 0,
    id: 1,
    question: 'open_euler_community_edition_categories',
  },
  {
    groupId: 0,
    id: 2,
    question: 'lts_release_cycle_and_support',
  },
  {
    groupId: 0,
    id: 3,
    question: 'innovation_release_cycle_and_support',
  },
  {
    groupId: 0,
    id: 4,
    question: 'container_cloud_platform_solution',
  },
  {
    groupId: 1,
    id: 5,
    question: 'sec_gear_main_functions',
  },
  {
    groupId: 1,
    id: 6,
    question: 'dde_description',
  },
  {
    groupId: 1,
    id: 7,
    question: 'lustre_description',
  },
  {
    groupId: 2,
    id: 8,
    question: 'open_euler_testing_management_platform',
  },
  {
    groupId: 2,
    id: 9,
    question: 'open_euler_pkgship',
  },
  {
    groupId: 2,
    id: 10,
    question: 'open_euler_software_package_introduction_principles',
  },
  {
    groupId: 2,
    id: 11,
    question: 'download_rpm_without_installing',
  },
  {
    groupId: 3,
    id: 12,
    question: 'count_the_occurrences_of_the_hello',
  },
  {
    groupId: 3,
    id: 13,
    question: 'convert_uppercase_to_lowercase',
  },
  {
    groupId: 3,
    id: 14,
    question: 'list_files_with_specific_permissions',
  },
  {
    groupId: 3,
    id: 15,
    question: 'search_error_keyword_with_context',
  },
  {
    groupId: 4,
    id: 16,
    question: 'clear_dependencies_for_software_package',
  },
  {
    groupId: 4,
    id: 17,
    question: 'gpgcheck_purpose_in_dnf',
  },
  {
    groupId: 4,
    id: 18,
    question: 'installonly_limit_function_in_dnf',
  },
  {
    groupId: 4,
    id: 19,
    question: 'clean_requirement_on_remove_function_in_dnf',
  },
  {
    groupId: 5,
    id: 20,
    question: 'hunan_tobacco_monopoly_applications_on_openeuler',
  },
  {
    groupId: 5,
    id: 21,
    question: 'xsky_applications_on_openeuler',
  },
];
