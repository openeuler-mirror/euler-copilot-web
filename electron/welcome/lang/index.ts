import { createI18n } from 'vue-i18n';
// 语言包
import zh from './zh';
import en from './en';

/**
 * 开发模式日志输出
 * 只在开发环境下输出日志
 */
function devLog(...args: any[]) {
  if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

/**
 * 开发模式警告输出
 * 只在开发环境下输出警告
 */
function devWarn(...args: any[]) {
  if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
}

/**
 * 检测系统语言
 * 支持多种操作系统的语言检测
 * @returns {'zh' | 'en'} 语言代码 'zh' 或 'en'
 */
function detectSystemLanguage(): 'zh' | 'en' {
  let systemLanguage: 'zh' | 'en' = 'zh'; // 默认中文

  try {
    // 优先级1: 检查 Electron 环境中的系统信息
    if (typeof window !== 'undefined' && window.eulercopilotWelcome?.system) {
      const { platform, env } = window.eulercopilotWelcome.system;

      devLog(`检测到系统平台: ${platform}`);

      // 根据不同操作系统检测语言
      if (platform === 'win32') {
        // Windows 系统语言检测
        const winLang = env.LANG || env.LC_ALL || env.LANGUAGE || '';
        if (
          winLang.toLowerCase().includes('zh') ||
          winLang.toLowerCase().includes('chinese') ||
          winLang.toLowerCase().includes('chs') ||
          winLang.toLowerCase().includes('cn')
        ) {
          systemLanguage = 'zh';
        } else if (winLang && !winLang.toLowerCase().includes('zh')) {
          systemLanguage = 'en';
        }
      } else if (platform === 'darwin') {
        // macOS 系统语言检测
        const macLang =
          env.LANG || env.LC_ALL || env.LC_MESSAGES || env.LANGUAGE || '';
        if (
          macLang.toLowerCase().includes('zh') ||
          macLang.toLowerCase().includes('chinese') ||
          macLang.toLowerCase().includes('cn')
        ) {
          systemLanguage = 'zh';
        } else if (macLang && !macLang.toLowerCase().includes('zh')) {
          systemLanguage = 'en';
        }
      } else if (platform === 'linux') {
        // Linux 系统语言检测
        const linuxLang =
          env.LANG || env.LC_ALL || env.LC_MESSAGES || env.LANGUAGE || '';
        if (
          linuxLang.toLowerCase().includes('zh') ||
          linuxLang.toLowerCase().includes('chinese') ||
          linuxLang.toLowerCase().includes('cn')
        ) {
          systemLanguage = 'zh';
        } else if (linuxLang && !linuxLang.toLowerCase().includes('zh')) {
          systemLanguage = 'en';
        }
      }

      devLog(`根据环境变量检测到语言: ${systemLanguage}`);
      return systemLanguage; // 如果 Electron 环境可用，直接返回结果
    }

    // 优先级2: 浏览器语言检测 (作为后备方案)
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.toLowerCase();

      devLog(`浏览器语言: ${browserLang}`);

      // 检测是否为中文相关语言
      if (
        browserLang.startsWith('zh') ||
        browserLang.includes('china') ||
        browserLang.includes('chinese') ||
        browserLang === 'zh-cn' ||
        browserLang === 'zh-tw' ||
        browserLang === 'zh-hk'
      ) {
        systemLanguage = 'zh';
      }
      // 检测是否为英文相关语言
      else if (
        browserLang.startsWith('en') ||
        browserLang.includes('english') ||
        browserLang.includes('us') ||
        browserLang.includes('gb')
      ) {
        systemLanguage = 'en';
      }
      // 其他语言默认使用英文
      else {
        systemLanguage = 'en';
      }
    }

    devLog(`最终检测到的系统语言: ${systemLanguage}`);
  } catch (error) {
    devWarn('检测系统语言失败，使用默认中文:', error);
    systemLanguage = 'zh';
  }

  return systemLanguage;
}

// 检测系统语言，默认中文
const locale = detectSystemLanguage();

const i18n_welcome = createI18n({
  legacy: false, // 设置为 false，启用 composition API 模式
  locale,
  messages: {
    zh,
    en,
  },
});

/**
 * 在 Electron 环境准备好后重新检测语言
 * 这个函数会在应用初始化后调用，确保能获取到正确的系统语言
 */
export function redetectLanguageOnReady() {
  // 等待一小段时间让 Electron preload 脚本完成初始化
  setTimeout(() => {
    const newLocale = detectSystemLanguage();
    if (newLocale !== i18n_welcome.global.locale.value) {
      devLog(
        `重新检测到语言变化，从 ${i18n_welcome.global.locale.value} 切换到 ${newLocale}`,
      );
      i18n_welcome.global.locale.value = newLocale;
    }
  }, 100);
}

/**
 * 切换语言
 * @param {string} newLocale 新的语言代码 'zh' 或 'en'
 */
export function changeLanguage(newLocale: 'zh' | 'en') {
  if (i18n_welcome.global.locale) {
    i18n_welcome.global.locale.value = newLocale;
    devLog(`语言已切换到: ${newLocale}`);
  }
}

/**
 * 获取当前语言
 * @returns {'zh' | 'en'} 当前语言代码
 */
export function getCurrentLanguage(): 'zh' | 'en' {
  return i18n_welcome.global.locale.value as 'zh' | 'en';
}

export default i18n_welcome;
