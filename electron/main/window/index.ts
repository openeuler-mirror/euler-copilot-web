// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.

import { createDefaultWindow, createChatWindow } from './create';
import { createTray } from './tray'; // 导入createTray函数
import {
  createWelcomeWindow,
  showWelcomeWindow,
  hideWelcomeWindow,
  closeWelcomeWindow,
  checkAndShowWelcomeIfNeeded,
  completeWelcomeFlow,
} from './welcome';

// 重新导出以便在index.ts中使用
export {
  createDefaultWindow,
  createChatWindow,
  createTray,
  createWelcomeWindow,
  showWelcomeWindow,
  hideWelcomeWindow,
  closeWelcomeWindow,
  checkAndShowWelcomeIfNeeded,
  completeWelcomeFlow,
};
