import { QiankunProps } from 'vite-plugin-qiankun/dist/helper';
import i18n from 'src/i18n';
import { useAccountStore } from 'src/store';

export function qiankunMounted(props: QiankunProps) {
  const { theme, lang } = props.inittailData;
  const language = lang;
  localStorage.setItem('localeLang', language);
  localStorage.setItem('theme', theme);
  i18n.global.locale.value = language;
  props.onGlobalStateChange((state: any) => {
    onQiankunGlobalChange(state);
  });
}

function onQiankunGlobalChange(globalState: any) {
  if (globalState.logout) {
    const { logout } = useAccountStore();
    logout();
  }

  if (globalState.lang) {
    const language = globalState.lang;
    localStorage.setItem('localeLang', language);
    i18n.global.locale.value = language;
  }

  if (globalState.theme) {
    localStorage.setItem('theme', globalState.theme);
    document.body.setAttribute('theme', globalState.theme);
  }
}
