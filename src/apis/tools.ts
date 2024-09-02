// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { ElNotification, ElMessageBox } from 'element-plus';
import { CALLBACK_URL, LOGOUT_CALLBACK_URL } from 'src/views/dialogue/constants';
import { useAccountStore } from 'src/store';
import { server } from './server';

import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storeToRefs } from 'pinia';
import { refreshToken } from './paths';



// 修改请求头
export const handleChangeRequestHeader = (
  config: InternalAxiosRequestConfig<any>
): InternalAxiosRequestConfig<any> => {
  config.headers['Content-Type'] = 'application/json; charset=UTF-8';
  // 让每个请求携带自定义 token 请根据实际情况自行修改
  if (sessionStorage.getItem('csrftk')) {
    const token = sessionStorage.getItem('csrftk');
    config.headers['X-CSRF-Token'] = `${token}`;
  }
  return config;
};

export const handleAuthorize = (errStatus: number): boolean => {
  const type = import.meta.env.VITE_USER_TYPE;
  const store = useAccountStore();
  const { userinfo } = storeToRefs(store);
  userinfo.value.organization = type;
  if ((errStatus === 401 || errStatus === 403)) {
    userinfo.value.status = false;
  }
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

//单例对象
let refreshTokenPromise  = null;
const refreshToken = async(originalRequest) => {  
  //不在刷新状态
  if (refreshTokenPromise) { 
    return ; 
   } 
  //不在刷新状态
    refreshTokenPromise =new Promise(async (resolve, reject) => { 
      //执行逻辑 
        const store = useAccountStore(); 
        // 开始refreshtoken
        await store.refreshAccessToken().then(()=>{
        server(originalRequest);
        return true;
        }).catch((e) => {
          refreshTokenPromise = null;
          return false;
        }) 
    })
  // 返回Promise，确保后续调用也能等待同一个刷新令牌操作完成  
  return refreshTokenPromise;  
}
/**
 * 处理状态码错误
 */
export const handleStatusError = async (  
  error: AxiosError<any>  
): Promise<AxiosResponse<any, any>[] | undefined> => {  
  if (!error.response) {  
    // 如果没有响应，可能是网络问题或其他非HTTP错误，直接返回错误  
    return Promise.reject(error);  
  }  
  
  const { status } = error.response;  
  if ([401, 403, 460].includes(status)) {  
    const originalRequest = error.config;  
    if (originalRequest.url === '/api/authorize/refresh_token') {  
      // 长token过期,需要重新登录
      handleAuthorize(status);  
      return Promise.reject(error.response);  
    }  
    if (originalRequest.url === '/api/auth/user') {  
      return;  
    }  
    const suc = await refreshToken(originalRequest);
    if(!suc){
      return Promise.reject(error.response);
    }
    return server(originalRequest);
  }    
  return Promise.reject(error.response);  
};  
