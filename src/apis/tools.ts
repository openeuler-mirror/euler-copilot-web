// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { ElNotification, ElMessageBox } from 'element-plus';
import { LOGOUT_CALLBACK_URL } from 'src/views/dialogue/constants';
import { useAccountStore } from 'src/store';

import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { storeToRefs } from 'pinia';
import i18n from 'src/i18n';

function getCookie(name: string) {
  const matches = document.cookie.match(
    new RegExp(
      '(?:^|; )' + name.replace(/([.$?*|{}()[]\\\/\+^])/g, '\\$1') + '=([^;]*)',
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

// 修改请求头
export const handleChangeRequestHeader = (
  config: InternalAxiosRequestConfig<any>,
): InternalAxiosRequestConfig<any> => {
  if (config.headers['Content-Type'] !== 'multipart/form-data') {
    config.headers['Content-Type'] = 'application/json; charset=UTF-8';
  }
  const cookieValue = getCookie('_csrf_tk');
  if (cookieValue) {
    config.headers['X-CSRF-Token'] = cookieValue;
  }
  // TODO 请求携带token 字段待定
  const token = localStorage.getItem('ECSESSION');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

async function toAuthorization() {
  const store = useAccountStore();
  const url = await store.getAuthUrl('login');
  if (!url) return;
  const w = 1000;
  const h = 750;
  const left = (screen.width - w) / 2;
  const top = (screen.height - h) / 2;

  const authWindow = window.open(
    url,
    'loginWindow',
    `width=${w},height=${h},resizable=yes,scrollbars=yes,top=${top},left=${left}`,
  );

  const postMessageListener = async (event: MessageEvent) => {
    // 期望 event.data = { type: 'auth_success', sessionId: 'xxxx' }
    const { sessionId, type } = event.data || {};
    if (type === 'auth_success' && sessionId) {
      window.removeEventListener('message', postMessageListener);
      localStorage.setItem('ECSESSION', sessionId);
      authWindow?.close();
      window.location.reload();
    }
  };

  if (authWindow) {
    const loop = setInterval(() => {
      if (authWindow && authWindow.closed) {
        clearInterval(loop);
        window.location.reload();
      }
    }, 500);
  }

  window.addEventListener('message', postMessageListener);
}

let isAuthorizing = false;
export const handleAuthorize = async (errStatus: number): Promise<void> => {
  const type = import.meta.env.VITE_USER_TYPE;
  const store = useAccountStore();
  const { userinfo } = storeToRefs(store);
  userinfo.value.organization = type;
  if (errStatus === 401 || errStatus === 403) {
    if (isAuthorizing) return;
    isAuthorizing = true;

    ElMessageBox.confirm(
      i18n.global.t('Login.unauthorized'),
      i18n.global.t('history.confirmation_message1'),
      {
        confirmButtonText: i18n.global.t('Login.login'),
        showClose: false,
        showCancelButton: false,
        autofocus: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
      },
    ).then(async () => {
      toAuthorization();
    });
  }
  if (errStatus === 460) {
    window.open(LOGOUT_CALLBACK_URL, '_self');
  } else {
    // errorMsg(`${errStatus} is error`);
  }
};

export const handleNetworkError = (errStatus: number): void => {
  let errMessage: string;
  if (errStatus) {
    switch (errStatus) {
      case 400:
        errMessage = '错误的请求';
        break;
      case 403:
        errMessage = '拒绝访问';
        break;
      case 404:
        errMessage = '请求错误,未找到该资源';
        break;
      case 405:
        errMessage = '请求方法未允许';
        break;
      case 408:
        errMessage = '请求超时';
        break;
      case 500:
        errMessage = '服务器端出错';
        break;
      case 501:
        errMessage = '网络未实现';
        break;
      case 502:
        errMessage = '网络错误';
        break;
      case 503:
        errMessage = '服务不可用';
        break;
      case 504:
        errMessage = '网络超时';
        break;
      case 505:
        errMessage = 'http版本不支持该请求';
        break;
      default:
        errMessage = `其他连接错误 --${errStatus}`;
    }
  } else {
    errMessage = `无法连接到服务器！`;
  }

  ElNotification.error({
    title: '错误',
    message: errMessage,
  });
};

export const handleGeneralError = (
  errno: number,
  errorLabel: string = 'Fail',
  errMessage: string = 'request error',
): boolean => {
  if (
    Number(errno) !== 200 &&
    Number(errno) !== 401 &&
    Number(errno) !== 403 &&
    Number(errno) !== 302 &&
    Number(errno) !== 2001
  ) {
    ElNotification.error({
      title: errorLabel,
      message: errMessage,
    });
    return false;
  }
  return true;
};

/**
 * 处理状态码错误
 */
export const handleStatusError = async (
  error: AxiosError<any>,
): Promise<AxiosResponse<any, any>[] | undefined> => {
  if (!error.response) {
    // 如果没有响应，可能是网络问题或其他非HTTP错误，直接返回错误
    return Promise.reject(error);
  }

  const { status } = error.response;
  if ([401, 403, 460].includes(status)) {
    if (status === 401) {
      handleAuthorize(status);
      return;
    }
  }
  return Promise.reject(error.response);
};
