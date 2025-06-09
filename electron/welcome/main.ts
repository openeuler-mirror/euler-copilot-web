// Welcome 页面 Vue 应用入口
import type { App } from 'vue';
import { createApp } from 'vue';
import WelcomeComponent from './index.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import i18n_welcome from './lang';

// 创建 Vue 应用并挂载
const app: App = createApp(WelcomeComponent);
app.use(ElementPlus).use(i18n_welcome);
app.mount('#app');

console.log('Welcome Vue app initialized');
