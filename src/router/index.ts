// Copyright (c) Huawei Technologies Co., Ltd. 2023-2024. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { createRouter, createWebHistory } from 'vue-router';
import NotFoundComponent from 'src/views/404.vue';
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

const router = createRouter({
  history: createWebHistory(import.meta.env.MODE === 'micro' ? qiankunWindow.__POWERED_BY_QIANKUN__ ? '/eulercopilot/' : '/' : '/'),
  routes: [
    {
      path: '/',
      name: 'dialogue',
      component: (): Promise<typeof import('src/views/dialogue/dialogueView.vue')> =>
        import('src/views/dialogue/dialogueView.vue'),
    },
    {
      path: '/login',
      name: 'dialogue-login',
      component: (): Promise<typeof import('src/views/dialogue/dialogueView.vue')> =>
        import('src/views/dialogue/dialogueView.vue'),
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
