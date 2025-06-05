// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { nativeTheme } from 'electron';
import { updateConf } from './cache-conf';

export type ThemeType = 'system' | 'light' | 'dark';

/**
 * 解析主题配置
 * @param commonCacheConf 缓存的配置信息
 * @returns 主题配置信息
 */
export async function resolveThemeConfiguration(commonCacheConf: {
  theme?: ThemeType;
}): Promise<{ theme: ThemeType }> {
  if (commonCacheConf.theme) {
    return {
      theme: commonCacheConf.theme,
    };
  }

  const isDarkMode = nativeTheme.shouldUseDarkColors;
  const theme = isDarkMode ? 'dark' : 'light';

  updateConf({ theme });

  return { theme };
}

/**
 * 设置应用主题
 * @param theme 主题类型
 */
export function setApplicationTheme(theme: ThemeType): void {
  nativeTheme.themeSource = theme;
  process.env['EULERCOPILOT_THEME'] = theme;
}

/**
 * 切换明暗主题
 * @returns 是否为暗色主题
 */
export function toggleTheme(): boolean {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light';
    updateConf({ theme: 'light' });
  } else {
    nativeTheme.themeSource = 'dark';
    updateConf({ theme: 'dark' });
  }
  return nativeTheme.shouldUseDarkColors;
}

/**
 * 设置为系统主题
 */
export function setSystemTheme(): void {
  nativeTheme.themeSource = 'system';
  updateConf({ theme: 'system' });
}
