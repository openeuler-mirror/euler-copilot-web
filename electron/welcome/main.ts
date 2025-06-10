// Welcome 页面 Vue 应用入口
import type { App } from 'vue';
import { createApp } from 'vue';
import WelcomeComponent from './index.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import i18n_welcome, { redetectLanguageOnReady } from './lang';

/**
 * 开发模式日志输出
 * 只在开发环境下输出日志
 */
function devLog(...args: any[]) {
  if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

// 创建 Vue 应用并挂载
const app: App = createApp(WelcomeComponent);
app.use(ElementPlus).use(i18n_welcome);
app.mount('#app');

// 在应用挂载后重新检测语言
redetectLanguageOnReady();

devLog('Welcome Vue app initialized');
