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
import { computed, CSSProperties, ref, onMounted } from 'vue';
import { electronProcess, ipcRenderer } from '@/utils/electron';
import { getBaseUrl } from 'src/utils/tools';

const { language } = storeToRefs(useLangStore());
const { changeLanguage } = useLangStore();
const themeStore = useChangeThemeStore();

const lang = computed(() => (language.value === 'en' ? 'English' : '简体中文'));
const iframeTarget = ref('');

onMounted(async () => {
  const baseUrl = await getBaseUrl();
  const origin = window.location.origin;
  const isElectron = window.navigator.userAgent.includes('Electron');
  iframeTarget.value = isElectron
    ? `${baseUrl}/witchaind`
    : `${origin}/witchaind`;
});

const changeLanguagefun = (lang: 'zh_cn' | 'en') => {
  changeLanguage(lang);
  // 同步语言到iframe
  const iframe = document.querySelector<HTMLIFrameElement>('#my-iframe');
  if (iframe?.contentWindow) {
    const data = {
      lang: lang,
      type: 'changeLanguage',
    };
    iframe.contentWindow.postMessage(data, iframeTarget.value);
  }
};

const { theme } = storeToRefs(useChangeThemeStore());

const changeTheme = () => {
  const { updateTheme } = useChangeThemeStore();
  const newTheme = theme.value === 'light' ? 'dark' : 'light';
  updateTheme(newTheme);
  // 同步主题到iframe
  const iframe = document.querySelector<HTMLIFrameElement>('#my-iframe');
  if (iframe?.contentWindow) {
    const data = {
      theme: newTheme,
      type: 'changeTheme',
    };
    iframe.contentWindow.postMessage(data, iframeTarget.value);
  }
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
      <div class="language">
        <span v-if="lang === 'English'" @click="changeLanguagefun('zh_cn')">
          <img id="sun-icon" src="@/assets/svgs/language-en.svg" alt="" />
        </span>
        <span v-else @click="changeLanguagefun('en')">
          <img id="moon-icon" src="@/assets/svgs/language-cn.svg" alt="" />
        </span>
      </div>
      <div class="mode">
        <span v-if="theme === 'light'" @click="changeTheme">
          <img id="sun-icon" src="@/assets/svgs/moon.svg" alt="" />
        </span>
        <span v-else @click="changeTheme">
          <img id="moon-icon" src="@/assets/svgs/sun.svg" alt="" />
        </span>
      </div>

      <el-popover popper-class="popper-class" :offset="4">
        <template #reference>
          <div class="avatar" ></div>
        </template>
        <div
          class="exit-button lang-button"
          type="primary"
          @click="logoutHandler"
        >
          {{ $t('Login.logout') }}
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
    background-image: url('@/assets/svgs/user.svg');
    background-repeat: no-repeat; /* 防止重复 */
    background-position: center; /* 居中 */
    background-size: contain; /* 适应容器 */
    //待替换icon资源
    &:hover {
      height: 48px;
      background-image: url('@/assets/svgs/user.svg');
    }
    &:active {
      background-image: url('@/assets/svgs/user.svg');
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
.popper-class{
  height: 42px !important;
}
</style>
