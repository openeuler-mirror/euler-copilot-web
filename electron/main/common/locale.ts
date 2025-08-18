// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { app } from 'electron';
import type { INLSConfiguration } from './nls';
import { updateConf } from './cache-conf';

/**
 * 处理中文语言环境
 * @param appLocale 应用语言环境
 * @returns 处理后的语言标识
 */
export function processZhLocale(appLocale: string): string {
  if (appLocale.startsWith('zh')) {
    const region = appLocale.split('-')[1];

    // On Windows and macOS, Chinese languages returned by
    // app.getPreferredSystemLanguages() start with zh-hans
    // for Simplified Chinese or zh-hant for Traditional Chinese,
    // so we can easily determine whether to use Simplified or Traditional.
    // However, on Linux, Chinese languages returned by that same API
    // are of the form zh-XY, where XY is a country code.
    // For China (CN), Singapore (SG), and Malaysia (MY)
    // country codes, assume they use Simplified Chinese.
    // For other cases, assume they use Traditional.
    if (['hans', 'cn', 'sg', 'my'].includes(region)) {
      return 'zh';
    }

    return 'zh_tw';
  }

  return appLocale;
}

/**
 * 获取系统语言环境
 */
export const getOsLocale = (): string => {
  return processZhLocale(
    (app.getPreferredSystemLanguages()?.[0] ?? 'en').toLowerCase(),
  );
};

/**
 * 国际化配置解析
 * @param commonCacheConf 缓存配置
 * @param osLocale 系统语言环境
 * @returns INLSConfiguration
 */
export async function resolveNlsConfiguration(
  commonCacheConf: { userLocale?: string },
  osLocale: string,
): Promise<INLSConfiguration> {
  if (commonCacheConf.userLocale) {
    return {
      userLocale: commonCacheConf.userLocale,
      osLocale,
      resolvedLanguage: commonCacheConf.userLocale,
    };
  }

  let userLocale = app.getLocale();

  if (!userLocale) {
    updateConf({ userLocale: 'en' });
    return {
      userLocale: 'en',
      osLocale,
      resolvedLanguage: 'en',
    };
  }

  userLocale = processZhLocale(userLocale.toLowerCase());
  updateConf({ userLocale: 'en' });
  return {
    userLocale,
    osLocale,
    resolvedLanguage: osLocale,
  };
}
