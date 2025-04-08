import { createI18n } from 'vue-i18n';
// 语言包
import zh_cn from './lang/zh-cn';
import en from './lang/en';

const locale = localStorage.getItem('localeLang') || 'zh_cn';

const i18n = createI18n({
  legacy: false, // 设置为 false，启用 composition API 模式
  locale,
  messages: {
    zh_cn,
    en,
  },
});
export default i18n;
