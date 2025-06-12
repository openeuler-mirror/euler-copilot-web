import { RouteRecordRaw } from 'vue-router';

const dynamicRoutes: Array<RouteRecordRaw> = [
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/chat/index.vue'),
  },
];

export { dynamicRoutes };
