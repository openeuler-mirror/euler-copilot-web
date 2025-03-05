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
import { useAccountStore } from 'src/store';

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
      name: 'login',
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
      path: '/api',
      name: 'api',
      component: (): Promise<typeof import('src/views/api/index.vue')> =>
        import('src/views/api/index.vue'),
      meta: { requiresAuth: true } // 标记需要登录的页面
    },
    {
      path: '/app',
      name: 'app',
      component: (): Promise<typeof import('src/views/app/index.vue')> =>
        import('src/views/app/index.vue'),
      meta: { requiresAuth: true } // 标记需要登录的页面
    },
    {
      path: '/createApp',
      name: 'createApp',
      component: (): Promise<typeof import('src/views/createapp/index.vue')> =>
        import('src/views/createapp/index.vue'),
      meta: { requiresAuth: true } // 标记需要登录的页面
    },
    {
      path: '/witchainD',
      name: 'witchainD',
      component: (): Promise<typeof import('src/views/tools/index.vue')> =>
        import('src/views/tools/index.vue'),
      meta: { requiresAuth: true } // 标记需要登录的页面
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

router.beforeEach((to, from, next) => {
  const {userinfo} = useAccountStore();
  // 检查是否需要登录
  if (to.meta.requiresAuth && !userinfo.user_sub) {
    next('/'); // 未登录时跳转首页
  } else {
    next();
  }
})

export default router;
