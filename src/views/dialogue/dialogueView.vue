<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import { onHtmlEventDispatch } from 'src/utils';
import { useChangeThemeStore } from 'src/store';
import DialogueSession from './components/DialogueSession.vue';
import CommonFooter from 'src/components/commonFooter/CommonFooter.vue';
import EulerDialog from 'src/components/EulerDialog.vue';
import { reactive } from 'vue';
import { invoke } from '@tauri-apps/api/tauri';
// Given hello.txt pointing to file with "Hello world", which is 11 bytes long:
// 挂载全局事件
window.onHtmlEventDispatch = onHtmlEventDispatch;
const router = useRouter();
const route = useRoute();
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
  const themeValue = localStorage.getItem('theme');
  if (themeValue) {
    themeStore.theme = themeValue;
  }
  else {
    localStorage.setItem('theme', 'dark');
  }
  const currRoute = router.currentRoute;
  if (currRoute.value.path === '/') {
    await invoke('refresh_session_id').then(async (sessionID: any) => {
      if (sessionID) {
        localStorage.setItem('session', sessionID);
        await getModeOptions();
        await invoke('stop');
      }
    }).catch(err => {
      console.error(err);
    });
  }
};

const settingsHandler = () => {
  invoke('show_settings_window')
};

// 协议内容
const agreement = ref<string>('');

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
  const theme = localStorage.getItem('theme');
  if (theme) {
    document.body.setAttribute('theme', theme);
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
  await invoke('plugin').then(async (data: any) => {
    if (data && data.result) {
      data.result.forEach((item: any) => {
        const opt = {
          label: item.plugin_name,
          value: item.id,
          disabled: false
        };
        const plugin = modeOptions.find((item) => {
          return item.label === opt.label
        })
        if (!plugin) {
          modeOptions.push(opt);
        }
      });
    }
  }).catch(err => {
    console.error(err);
  });
}

</script>

<template>
  <div class="dialogue" id="dialogId">
    <header class="dialogue-header">
      <span>
        <img src="src/assets/svgs/euler_copilot_logo.svg" />
        <h4>openEuler Copilot System</h4>
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
          <el-button class="exit-button" @click="settingsHandler">设置</el-button>
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
  min-width: 500px;
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
