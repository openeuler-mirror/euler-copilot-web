// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { ElNotification } from 'element-plus';

import type { InternalAxiosRequestConfig } from 'axios';
import { storeToRefs } from 'pinia';

// 修改请求头
export const handleChangeRequestHeader = (
  config: InternalAxiosRequestConfig<any>
): InternalAxiosRequestConfig<any> => {
  config.headers['Content-Type'] = 'application/json; charset=UTF-8';
  //全局获取apikey
  const apikey = '7a779fee04d8486c8bb0f7131b5852b9'
  if(localStorage.getItem('cookie')){
      document.cookie=`ECSESSION=${localStorage.getItem('cookie')};path=/`;
  }
  
  config.headers['Authorization'] = `Bearer ${apikey}`;
  return config;
};

export const handleAuthorize = (errStatus: number): boolean => {
  return true;
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
  errMessage: string = 'request error'
): boolean => {
  const checkone = Number(errno) !== 200 && Number(errno) !== 401;
  const checktwo = Number(errno) !== 403 && Number(errno) !== 302;
  const checkthree = checktwo && Number(errno) !== 2001;
  if (checkone && checkthree) {
    ElNotification.error({
      title: errorLabel,
      message: errMessage,
    });
    return false;
  }
  return true;
};
