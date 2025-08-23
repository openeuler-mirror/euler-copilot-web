import { createI18n } from 'vue-i18n';
// 语言包
import zh from './lang/zh-cn';
import en from './lang/en';

const localLang = localStorage.getItem('copilot_language');
let locale = 'zh'; // 默认值

if (localLang) {
  try {
    const parsed = JSON.parse(localLang);
    // 处理可能的 language 值：zh, zh_cn, zh-tw 等
    if (parsed.language) {
      locale = parsed.language.startsWith('zh') ? 'zh' : parsed.language;
    }
  } catch (e) {
    console.error('解析语言设置失败:', e);
  }
}

const i18n = createI18n({
  legacy: false, // 设置为 false，启用 composition API 模式
  locale,
  messages: {
    zh,
    en,
  },
});
export default i18n;
