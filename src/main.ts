// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { createApp, App as AppInstance } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import i18n from 'src/i18n';

import 'element-plus/dist/index.css';
import 'highlight.js/styles/github-dark.css';
import 'src/assets/base.css';
import 'src/assets/styles/main.scss';
import 'src/assets/styles/element/index.scss';
import opendesign2 from '@computing/opendesign2';
import '@computing/opendesign2/themes/es/css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import App from './App.vue';
import router from './router';

// 添加平台检测逻辑，为HTML添加平台特定类名
const setPlatformClass = () => {
  const electronProcess = window.electronProcess;
  if (electronProcess) {
    const platform = electronProcess.platform;
    document.documentElement.classList.add(`platform-${platform}`);
  }
};

let app: AppInstance<Element> | null = null;

const render = (props: any = {}) => {
  // 在渲染前设置平台类名
  setPlatformClass();

  let selector: string = '#app';
  if (props && props.container) {
    const { container } = props;
    selector = (container && container.querySelector('#app')) || '#app';
  }
  const pinia = createPinia().use(piniaPluginPersistedstate);
  app = createApp(App);
  app
    .use(pinia)
    .use(router)
    .use(ElementPlus, {
      locale: zhCn,
    })
    .use(opendesign2)
    .use(i18n)
    .mount(selector);
};

render();
