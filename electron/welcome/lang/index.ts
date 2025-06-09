import { createI18n } from 'vue-i18n';
// 语言包
import zh from './zh';
import en from './en';

const locale = 'zh';

const i18n_welcome = createI18n({
  legacy: false, // 设置为 false，启用 composition API 模式
  locale,
  messages: {
    zh,
    en,
  },
});
export default i18n_welcome;