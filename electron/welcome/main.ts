// Welcome 页面 Vue 应用入口
import type { App } from 'vue';
import { createApp } from 'vue';
import WelcomeComponent from './index.vue';

// 创建 Vue 应用并挂载
const app: App = createApp(WelcomeComponent);
app.mount('#app');

console.log('Welcome Vue app initialized');
