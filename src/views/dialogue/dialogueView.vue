<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { onHtmlEventDispatch } from 'src/utils';
import { useHistorySessionStore, useSessionStore, useChangeThemeStore } from 'src/store';
import DialogueSession from './components/DialogueSession.vue';
import CommonFooter from 'src/components/commonFooter/CommonFooter.vue';
import EulerDialog from 'src/components/EulerDialog.vue';
import { marked } from 'marked';
import { ARGEEMENT_VERSION } from 'src/conf/version';
import { reactive } from 'vue';
import { errorMsg, successMsg } from 'src/components/Message';
import { api } from 'src/apis';
import { stopGeneraterion } from 'src/apis/paths';
// Given hello.txt pointing to file with "Hello world", which is 11 bytes long:
// 挂载全局事件
window.onHtmlEventDispatch = onHtmlEventDispatch;
const router = useRouter();
const route = useRoute();
const { historySession } = storeToRefs(useHistorySessionStore());
const { conversationList } = storeToRefs(useSessionStore());
const themeStore = useChangeThemeStore();
const dialogVisible = ref(false);
const modeOptions = reactive([
  {
    label: '自动识别',
    value: 'auto',
    disabled: false,
  },
]);

const isDark = ref(localStorage.getItem('theme') === 'dark');
const loginDialogVisible = ref(false);

/**
 * 初始化
 */

const initCopilot = async (): Promise<void> => {
// await writeTextFile('app.conf', 'file contents', { dir: BaseDirectory.AppConfig });
  if(localStorage.getItem('theme')){
    themeStore.theme = localStorage.getItem('theme');
  }
  else {
    localStorage.setItem('theme', 'dark');
  }
  const currRoute = router.currentRoute;
  if (currRoute.value.path === '/') {
    const [_ , res] = await api.getSessionID();
    if (!_ && res) {
      const cookie = res.result.session_id;
      localStorage.setItem('session',cookie);
      await getModeOptions();
      await stopGeneraterion();
    }
    return;
  }
};

const setPlugins = async() => {
  const [_, res] = await api.getRecognitionMode();
    if (!_ && res) {
      res.result.forEach(item => {
        const opt = {
          label: item.plugin_name,
          value: item.plugin_name,
          disabled: false
        };
        modeOptions.value.push(opt);
      });
    }
}

const logoutHandler = () => {
  historySession.value = [];
  conversationList.value = [];
  loginDialogVisible.value = true;
};

// 协议内容
const agreement = ref<string>('');
// 协议版本
const agreementVersion = ref<string>(ARGEEMENT_VERSION);

/**
 * 读取协议
 */
const readAgreement = async () => {
  const response = await import('src/conf/agreement.md?raw');
  agreement.value = marked.parse(response.default) as string;
};

/**
 * 处理服务协议是否显示
 * @param CheckedVersion
 */
const handleAgreement = async (CheckedVersion: string | null) => {
  if (agreementVersion.value === CheckedVersion) {
    return;
  }
  await readAgreement();
  dialogVisible.value = true;
};

/**ss
 *
 */
const handleSubmit = async () => {
  dialogVisible.value = false;
};

const changeTheme = () => {
  isDark.value = !isDark.value;
  isDark.value ? document.body.setAttribute('theme', 'dark') :
    document.body.setAttribute('theme', 'light');
  const theme = isDark.value ? 'dark' : 'light';
  localStorage.setItem('theme',theme);
  themeStore.theme = theme;
  themeStore.$patch({theme: theme});
};

onMounted(() => {
  if (localStorage.getItem('theme')) {
    document.body.setAttribute('theme', localStorage.getItem('theme'));
  }
});

watch(
  () => route.path,
  () => {
    initCopilot();
  },
  {
    immediate: true,
  }
);

const getModeOptions = async() => {
  await api.getRecognitionMode().then(data => {
        const [_,res] = data;
        res.result.forEach(item => {
        const opt = {
          label: item.plugin_name,
          value: item.plugin_name,
          disabled: false
        };
        const a = modeOptions.find((item) => {return item.label === opt.label})
        if(!a){
          modeOptions.push(opt);
        }
      });
      });
}

</script>

<template>
  <div class="dialogue" id="dialogId">
    <header class="dialogue-header">
      <span>
        <img src="src/assets/svgs/euler_copilot_logo.svg" />
        <h4>EulerCopilot</h4>
      </span>
      <div class="header-right">
        <div class="mode">
          <span v-if="isDark" @click="changeTheme">
            <img src="src/assets/svgs/sun.svg" alt="">
          </span>
          <span v-else @click="changeTheme">
            <img id='moon-icon' src="src/assets/svgs/moon.svg" alt="">
          </span>
        </div>

        <el-popover popper-class="popper-class">
          <template #reference>
            <img class="avatar" src="src/assets/svgs/user.svg" />
          </template>
          <el-button class="exit-button" @click="logoutHandler">退出登录</el-button>
        </el-popover>
      </div>
    </header>
    <div class="dialogue-container">
      <div class="dialogue-container-main">
        <DialogueSession :modeOptions="modeOptions" :login="!loginDialogVisible" />
      </div>
    </div>
    <footer class="dialogue-footer">
      <CommonFooter />
    </footer>
    <EulerDialog :visible="dialogVisible" :content="agreement" agreement-name="《服务协议》" @submit="handleSubmit">
    </EulerDialog>
  </div>
</template>

<style lang="scss">
.el-dialog__body {
  overflow: hidden;
}

.apikey {
  &_view {
    &_alert {
      margin-bottom: 8px;
    }

    &_main {
      .main {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4%;
        height: 300px;
        &_view {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 32px;
          &_span{
            height: 80px;  
            margin: 0px;
            div{
              margin: 0px;
              width:300px;
              font-size: 20px;
              word-wrap: break-word;
            }
          }
        }

        img {
          width: 180px;
        }

        span {
          font-size: 12px;
        }
        div{
          button{
            margin-top: 32px;
          }
        }
      }
    }
  }
}

.popper-class {
  padding: 3px 0 !important;

  .exit-button {
    margin: 0px;
    width: 100%;
    border-radius: 0;
    border-style: none;
  }
}

#sun-icon{
  // background-color: pink;
  &:hover{
    filter: invert(51%) sepia(95%) saturate(146%) hue-rotate(168deg) brightness(94%) contrast(83%);
  }
  &:active{
    filter: invert(50%) sepia(31%) saturate(458%) hue-rotate(168deg) brightness(101%) contrast(87%);
  }
}

#moon-icon{
  &:hover{
    filter: invert(51%) sepia(95%) saturate(146%) hue-rotate(168deg) brightness(94%) contrast(83%);
  }
  &:active{
    filter: invert(50%) sepia(31%) saturate(458%) hue-rotate(168deg) brightness(101%) contrast(87%);
  }
}
</style>
<style lang="scss" scoped>
.dialogue {
  height: 100vh;
  width: 100vw;
  min-height: 680px;
  min-width: 400px;
  overflow: scroll;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-image: var(--o-bg-image);
  background-size: cover;
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    padding: 0 24px;
    background-color: var(--o-bg-color-base);
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
      display: flex;

      .mode {
        margin-right: 18px;
      }
    }
  }

  &-container {
    display: flex;
    padding: 16px 24px 16px 24px;
    height: calc(100% - 70px);
    justify-content: space-between;

    &-main {
      display: flex;
      flex: 1;
    }
  }
  &-footer{
    margin-bottom: 12px;
  }
}
</style>
