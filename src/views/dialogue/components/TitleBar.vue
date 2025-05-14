<script lang="ts" setup>
import i18n from '@/i18n';
import { storeToRefs } from 'pinia';
import {
  useLangStore,
  useChangeThemeStore,
  useAccountStore,
  useHistorySessionStore,
  useSessionStore,
} from '@/store';
import { computed, CSSProperties, ref } from 'vue';
import { electronProcess, ipcRenderer } from '@/utils/electron';

const { language } = storeToRefs(useLangStore());
const { changeLanguage } = useLangStore();
const themeStore = useChangeThemeStore();

const lang = computed(() => (language.value === 'en' ? 'English' : '简体中文'));

const changeLanguagefun = (lang: 'zh_cn' | 'en') => {
  changeLanguage(lang);
  // 同步语言到iframe
  const iframe = document.querySelector<HTMLIFrameElement>('#my-iframe');
  if (iframe?.contentWindow) {
    const data = { lang: localStorage.getItem('localeLang') };
    let target = `${window.location.origin}/witchaind`;
    iframe.contentWindow.postMessage(data, target);
  }
  if (ipcRenderer) {
    ipcRenderer.invoke('copilot:lang', { lang: lang });
  }
};

const { theme } = storeToRefs(useChangeThemeStore());

const changeTheme = () => {
  const { updateTheme } = useChangeThemeStore();
  updateTheme(theme.value === 'light' ? 'dark' : 'light');
};

const logoutHandler = () => {
  const { logout } = useAccountStore();
  const { historySession } = storeToRefs(useHistorySessionStore());
  const { conversationList } = storeToRefs(useSessionStore());
  logout();
  historySession.value = [];
  conversationList.value = [];
};

const apikeyVisible = ref(false);
const KnowledgeVisible = ref(false);

const headerStyles = computed<CSSProperties>(() => {
  const styles: CSSProperties = {};
  if (!electronProcess) return styles;
  const platform = electronProcess.platform;
  console.log(electronProcess.versions.electron);

  if (electronProcess.versions.electron) {
    if (platform === 'darwin') {
      styles.paddingLeft = 'calc(50% - 60px)';
    } else if (platform === 'win32') {
      styles.paddingRight = '145px';
    } else if (platform === 'linux') {
      styles.paddingRight = '120px';
    }
  }
  return styles;
});
</script>

<template>
  <header class="dialogue-header" :style="headerStyles">
    <span class="dialogue-header-left">
      <img src="@/assets/svgs/euler_copilot_logo.svg" />
      <h4>openEuler Intelligence</h4>
    </span>
    <div class="header-right">
      <el-popover popper-class="popper-class">
        <template #reference>
          <span class="language">{{ lang }}</span>
        </template>
        <div
          class="exit-button lang-button"
          :class="lang === 'English' ? 'lang-selected' : ''"
          @click="changeLanguagefun('en')"
        >
          English
        </div>
        <div class="divider"></div>
        <div
          class="exit-button lang-button"
          :class="lang === '简体中文' ? 'lang-selected' : ''"
          @click="changeLanguagefun('zh_cn')"
        >
          简体中文
        </div>
      </el-popover>
      <div class="mode">
        <span v-if="theme === 'light'" @click="changeTheme">
          <img id="sun-icon" src="@/assets/svgs/sun.svg" alt="" />
        </span>
        <span v-else @click="changeTheme">
          <img id="moon-icon" src="@/assets/svgs/moon.svg" alt="" />
        </span>
      </div>

      <el-popover popper-class="popper-class">
        <template #reference>
          <img class="avatar" src="@/assets/svgs/user.svg" />
        </template>
        <div
          class="exit-button lang-button"
          type="primary"
          @click="logoutHandler"
        >
          {{ $t('Login.logout') }}
        </div>
        <div class="divider"></div>
        <div class="exit-button lang-button" @click="apikeyVisible = true">
          API KEY
        </div>
        <div class="divider"></div>
        <div class="exit-button lang-button" @click="KnowledgeVisible = true">
          {{ i18n.global.t('witChainD.witChainD') }}
        </div>
      </el-popover>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.dialogue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  background-color: var(--o-bg-color-base);
  -webkit-app-region: drag;
  &-left {
    flex: 1;
  }
  span {
    align-items: center;
    display: flex;
    align-content: center;
    vertical-align: top;
    font-size: 16px;
    height: 48px;
    img {
      width: 24px;
      height: 48px;
      border-radius: 50%;
    }
    h4 {
      font-size: 18px;
      margin-left: 5px;
      color: var(--o-text-color-primary);
    }
  }
  .avatar {
    width: 24px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  }
  .header-right {
    -webkit-app-region: no-drag;
    display: flex;
    .mode {
      cursor: pointer;
      margin-right: 18px;
      margin-left: 18px;
    }
  }
}
</style>
