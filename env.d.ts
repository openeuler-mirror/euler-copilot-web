// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
/// <reference types="vite/client" />
declare interface Window {
  onHtmlEventDispatch: any;
  eulercopilot: any;
  // 添加electronProcess属性定义
  electronProcess?: {
    platform: 'win32' | 'darwin' | 'linux';
    versions: {
      electron: string;
    };
    env?: Record<string, any>;
  };
}

declare interface ImportMetaEnv {
  readonly VITE_LOGIN_CALLBACK_URL: string;
  readonly VITE_LOGOUT_CALLBACK_URL: string;

  readonly VITE_BASE_PROXY_URL: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_USER_TYPE: string;
  readonly VITE_QABOT_URL: string;

  readonly VITE_OEPKG_URL: string;
  readonly VITE_PKGSHIP_URL: string;
  readonly VITE_MIRROR_URL: string;
  readonly VITE_GUIDANCE_URL: string;
  readonly VITE_FORUM_URL: string;
  readonly VITE_MAIL_URL: string;
  readonly VITE_BULLETIN_URL: string;
  readonly VITE_HISS_URL: string;
}
