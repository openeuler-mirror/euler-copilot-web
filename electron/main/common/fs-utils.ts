// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import fs from 'node:fs';
import path from 'node:path';

/**
 * 创建目录（如果不存在）
 * @param dir 目录路径
 * @returns 成功创建的目录路径，如果创建失败则返回undefined
 */
export async function mkdirpIgnoreError(
  dir: string | undefined,
): Promise<string | undefined> {
  if (typeof dir === 'string') {
    try {
      if (fs.existsSync(dir)) {
        return dir;
      }
      await fs.promises.mkdir(dir, { recursive: true });

      return dir;
    } catch {
      // ignore
    }
  }

  return undefined;
}

/**
 * 获取用户定义的配置
 * @param dir 配置文件路径
 * @returns 配置对象
 */
export function getUserDefinedConf(dir: string): Record<string, unknown> {
  try {
    if (!fs.existsSync(dir)) {
      fs.writeFileSync(dir, JSON.stringify({}));
    }

    return JSON.parse(fs.readFileSync(dir, 'utf-8'));
  } catch {
    // Ignore error
    return {};
  }
}

/**
 * 检查配置文件是否存在，不存在则创建默认内容
 * @param filePath 配置文件路径
 * @param defaultContent 默认内容对象
 */
export function ensureConfigFile(filePath: string, defaultContent: object) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 4));
    }
  } catch {
    // ignore
  }
}
