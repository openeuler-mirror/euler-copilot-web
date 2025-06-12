// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { defineStore } from 'pinia';
import { reactive } from 'vue';
import { api } from 'src/apis';
import { useRouter } from 'vue-router';
import { LOGOUT_CALLBACK_URL } from 'src/views/dialogue/constants';
import { successMsg } from 'src/components/Message';
import i18n from 'src/i18n';
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

export const useAccountStore = defineStore('account', () => {
  const router = useRouter();

  // 用户信息
  const userinfo = reactive<{
    username: string;
    revsionNumber: string | null;
    organization: string;
    user_sub: string;
    is_admin?: boolean;
  }>({
    username: '',
    revsionNumber: null,
    organization: '',
    user_sub: '', // 用户唯一标识
  });

  /**
   * 登录
   * @param code oidc授权码
   * @returns
   */
  const login = async (code: string): Promise<boolean> => {
    const [_, res] = await api.login(code);
    if (!_ && res) {
      sessionStorage.setItem('csrftk', res.result.csrf_token);
      router.push('/');
      return true;
    }
    return false;
  };

  async function getAuthUrl(action: string) {
    const [_, res] = await api.queryAuthUrl(action);
    if (!_ && res) {
      return res.result.url;
    }
    return null;
  }

  /**
   * 登录
   * @param user password
   * @returns csrftk
   */
  const userLogin = async (
    passwd: string,
    account: string,
  ): Promise<boolean> => {
    const [_, res] = await api.userLogin(passwd, account);
    if (!_ && res) {
      sessionStorage.setItem('csrftk', res.result.csrf_token);
      router.push('/');
      return true;
    }
    return false;
  };
  /**
   * 退出登录
   * @returns
   */
  const logout = async (): Promise<void> => {
    const [_, res] = await api.authorizeLogout();
    if (!_ && res) {
      userinfo.username = '';
      userinfo.organization = '';
      userinfo.revsionNumber = null;
      sessionStorage.removeItem('csrftk');
      successMsg(i18n.global.t('Login.logout'));
      if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
        setTimeout(() => {
          window.open(LOGOUT_CALLBACK_URL, '_self');
        }, 500);
      }
    }
  };
  /**
   * 获取用户信息`
   */
  const getUserInfo = async (): Promise<boolean> => {
    const [_, res] = await api.authorizeUser();
    if (!_ && res) {
      const { organization, username, revision_number, user_sub } = res.result;
      userinfo.username = username;
      userinfo.user_sub = user_sub;
      userinfo.organization = organization;
      userinfo.revsionNumber = revision_number;
      userinfo.is_admin = res.result.is_admin;
      return true;
    }
    return false;
  };
  /**
   * 刷新token
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    const [_, res] = await api.refreshToken();
    if (!_ && res) {
      sessionStorage.setItem('csrftk', res.result.csrf_token);
      return true;
    }
    return false;
  };

  const updateAgreement = async (agreementVersion: string): Promise<void> => {
    const [, res] = await api.updateRevision(agreementVersion);
    if (res) {
      userinfo.revsionNumber = res.result.revision_number;
    }
  };

  return {
    userinfo,
    userLogin,
    login,
    logout,
    getUserInfo,
    refreshAccessToken,
    updateAgreement,
    getAuthUrl,
  };
});
