// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';

import 'element-plus/dist/index.css';
import 'highlight.js/styles/github-dark.css';
import 'src/assets/base.css';
import 'src/assets/styles/main.scss';
import 'src/assets/styles/element/index.scss';
import opendesign2 from '@computing/opendesign2';
import '@computing/opendesign2/themes/es/css';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.use(opendesign2);

app.mount('#app');
