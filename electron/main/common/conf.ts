// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import path from 'path';
import fs from 'node:fs';
import { getUserDataPath } from '../node/userDataPath';
import { productObj } from './product';

interface ICacheConf {
  theme: 'system' | 'light' | 'dark';
  userLocale;
}

export const userDataPath = getUserDataPath(productObj.name);
export const cachePath = getCachePath();
export const commonCacheConfPath = path.join(
  cachePath,
  'eulercopilot-common-storage.json',
);

export function getCachePath(): string {
  return path.join(userDataPath, 'CachedData');
}

export function updateConf(conf: Partial<ICacheConf>) {
  const oldConf = fs.readFileSync(commonCacheConfPath, 'utf-8');
  const updateConf = { ...JSON.parse(oldConf), ...conf };
  fs.writeFileSync(commonCacheConfPath, JSON.stringify(updateConf));
}
