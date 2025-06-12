// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
//
// notarize.js
const path = require('path');

// 加载.env文件中的环境变量
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

// 保留此空函数以确保 electron-builder 触发 notarize 逻辑
exports.default = async function notarizing(context) {
  const { electronPlatformName } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }
};
