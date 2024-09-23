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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dialogue',
      component: (): Promise<typeof import('src/views/dialogue/dialogueView.vue')> =>
        import('src/views/dialogue/dialogueView.vue'),
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: (): Promise<typeof import('src/views/welcomeView.vue')> =>
        import('src/views/welcomeView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: (): Promise<typeof import('src/views/settingsView.vue')> =>
        import('src/views/settingsView.vue'),
    },
  ],
});

export default router;
