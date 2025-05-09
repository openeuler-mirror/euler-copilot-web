// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { successMsg } from 'src/components/Message';
import i18n from 'src/i18n';

/**
 * 随机整数范围 min <= return < max
 * @param min
 * @param max
 * @returns
 */
export const randomInt = (): number => {
  return window.crypto.getRandomValues(new Uint32Array(1))[0];
};

type HtmlEvent = 'copyPreCode';
/**
 * HTML事件分发
 * @param _t dom节点
 * @param _ty event 类型
 * @param event 事件 e
 * @param type 自定义类型type
 * @param data 自定义属性
 */
export const onHtmlEventDispatch = (
  _t: EventTarget | null,
  _ty: string,
  _event: Event,
  type: HtmlEvent,
  data: string,
): void => {
  if (type === 'copyPreCode') {
    const code = document.getElementById(data);
    if (code) {
      writeText(code.innerText);
    }
    successMsg(i18n.global.t('feedback.copied_successfully'));
  }
};

/**
 * 复制code
 * @param text code内容
 */
export const writeText = (text: string): void => {
  if (navigator.clipboard && window.isSecureContext) {
    const type = 'text/plain';
    const blob = new Blob([text], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    navigator.clipboard.write(data).then(
      () => {},
      () => {},
    );
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    new Promise<void>((res, rej) => {
      if (document.execCommand('copy')) {
        res();
      } else {
        rej(new Error('复制失败'));
      }
      textArea.remove();
    });
  }
};

/**
 * 获取后端代理URL，兼容web、electron开发和electron生产
 */
export async function getBaseProxyUrl(): Promise<string> {
  // Electron 生产环境（file:协议）读取配置
  if (
    window.eulercopilot &&
    typeof window.eulercopilot.ipcRenderer?.getProxyUrl === 'function' &&
    window.location.protocol === 'file:'
  ) {
    const url = await window.eulercopilot.ipcRenderer.getProxyUrl();
    if (url) return url;
  }
  // 本地开发环境（localhost:3000），直接返回空字符串，确保 axios 只拼接 path
  if (window.location.hostname === 'localhost') {
    return '';
  }
  return import.meta.env.VITE_BASE_PROXY_URL;
}
