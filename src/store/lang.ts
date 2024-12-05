import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const useLangStore = defineStore('lang', () => {
    const i18n = useI18n()
    const language = ref<string>(sessionStorage.getItem('localeLang') || 'CN');
    const changeLanguage = (data: 'CN' | 'EN') => {
        language.value = data.toString();
        i18n.locale.value = language.value;
        sessionStorage.setItem('localeLang', data);
    }
    return {
        language,
        changeLanguage
    }
})
