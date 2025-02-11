// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { createRouter, createWebHashHistory } from 'vue-router';
import NotFoundComponent from 'src/views/404.vue';
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

const router = createRouter({
  history: createWebHashHistory(qiankunWindow.__POWERED_BY_QIANKUN__ ? '/eulercopilot/' : '/'),
  routes: [
    {
      path: '/',
      name: 'dialogue',
      component: (): Promise<typeof import('src/views/dialogue/Copilot.vue')> =>
        import('src/views/dialogue/Copilot.vue'),
    },
    {
      path: '/login',
      name: 'dialogue-login',
      component: (): Promise<typeof import('src/views/dialogue/Copilot.vue')> =>
        import('src/views/dialogue/Copilot.vue'),
    },
    {
      path: '/copilot',
      name: 'copilot',
      component: (): Promise<typeof import('src/views/dialogue/Copilot.vue')> =>
        import('src/views/dialogue/Copilot.vue'),
    },
    {
      path: '/tools',
      name: 'tools',
      component: (): Promise<typeof import('src/views/tools/index.vue')> =>
        import('src/views/tools/index.vue'),
      beforeEnter: (to, from, next) => {
        window.location.href = 'https://www.baidu.com'
        //之后改成 witchain——D
      }
    },
    {
      path: '/404',
      component: NotFoundComponent,
      name: 'NotFound',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
    },
  ],
});

export default router;
