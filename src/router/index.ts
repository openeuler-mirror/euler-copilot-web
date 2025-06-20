// Copyright (c) Huawei Technologies Co., Ltd. 2023-2025. All rights reserved.
// licensed under the Mulan PSL v2.
// You can use this software according to the terms and conditions of the Mulan PSL v2.
// You may obtain a copy of Mulan PSL v2 at:
//      http://license.coscl.org.cn/MulanPSL2
// THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR
// PURPOSE.
// See the Mulan PSL v2 for more details.
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import NotFoundComponent from '@/views/404.vue';
import { dynamicRoutes } from './route';
import { isElectron } from '@/utils/electron';

const staticRoutes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/',
    component: () => import('src/views/dialogue/dialogueView.vue'),
    children: [
      {
        path: '/',
        name: 'dialogue',
        component: () => import('src/views/dialogue/Copilot.vue'),
      },
      {
        path: '/api',
        name: 'api',
        component: (): Promise<typeof import('src/views/api/index.vue')> =>
          import('src/views/api/index.vue'),
      },
      {
        path: '/app',
        name: 'app',
        component: (): Promise<typeof import('src/views/app/index.vue')> =>
          import('src/views/app/index.vue'),
      },
      {
        path: '/createApp',
        name: 'createApp',
        component: (): Promise<
          typeof import('src/views/createapp/index.vue')
        > => import('src/views/createapp/index.vue'),
      },
      {
        path: '/witchainD',
        name: 'witchainD',
        children: [], // 这里不要添加component内容，否则会导致iframe重复渲染
      },
      {
        path: '/settings',
        name: 'settings',
        component: () => import('src/views/settings/index.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: (): Promise<typeof import('src/views/dialogue/Copilot.vue')> =>
      import('src/views/dialogue/Copilot.vue'),
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
];

const dynamic = isElectron ? dynamicRoutes : [];
const routes = [...staticRoutes, ...dynamic];

const router = createRouter({
  history: createWebHashHistory(
    '/',
  ),
  routes,
});

export default router;
