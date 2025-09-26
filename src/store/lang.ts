import { defineStore } from 'pinia';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { electronProcess, ipcRenderer } from '@/utils/electron';

export const useLangStore = defineStore(
  'lang',
  () => {
    const i18n = useI18n();
    const language = ref<string>();

    const changeLanguage = (lang: 'zh' | 'en') => {
      language.value = lang;
      i18n.locale.value = language.value;
      if (ipcRenderer) {
        ipcRenderer.invoke('copilot:lang', { lang });
      }
    };

    onMounted(() => {
      if (electronProcess) {
        const nlsConfig = JSON.parse(
          electronProcess.env['EULERCOPILOT_NLS_CONFIG'],
        );

        electronProcess.env['EULERCOPILOT_NLS_CONFIG'] &&
          changeLanguage(nlsConfig.userLocale);
      } else {
        !language.value && changeLanguage('zh');
      }
    });
    return {
      language,
      changeLanguage,
    };
  },
  {
    persist: {
      key: 'copilot_language',
      pick: ['language'],
    },
  },
);
