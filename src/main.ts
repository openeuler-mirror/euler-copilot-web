// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
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
import {qiankunMounted} from './qiankun'

import App from './App.vue';
import router from './router';

import {
  renderWithQiankun,
  qiankunWindow,
  QiankunProps
} from "vite-plugin-qiankun/dist/helper";


let app: AppInstance<Element> | null = null

const render = (props: any = {}) => {
  let selector: string = "#app"
  if (props && props.container) {
    const { container } = props
    selector = container && container.querySelector("#app") || "#app"
  }
  app = createApp(App)
  app.use(createPinia()).use(router).use(ElementPlus).use(opendesign2).use(i18n).mount(selector)
}

const initQianKun = () => {
  renderWithQiankun({
    bootstrap() {
    },
    mount(props:QiankunProps) {
      render(props)
      if (props) {
        qiankunMounted(props)
      }
    },
    unmount(props) {
      if (app) {
        app.unmount()
        const appContainer = app._container as HTMLElement
        appContainer.innerHTML = ""
        app = null
      }
    },
    update(props) {
    }
  })
}

qiankunWindow.__POWERED_BY_QIANKUN__ ? initQianKun() : render();