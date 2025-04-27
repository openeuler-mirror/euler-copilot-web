import { createI18n } from 'vue-i18n';
// 语言包
import CN from './lang/zh-cn';
import EN from './lang/en';

const i18n = createI18n({
  legacy: false, // 设置为 false，启用 composition API 模式
  locale: localStorage.getItem('localeLang') || 'CN',
  messages: {
    CN,
    EN,
  },
});
export default i18n;
