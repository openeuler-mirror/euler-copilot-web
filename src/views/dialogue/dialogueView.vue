<script lang="ts" setup>
import { useRouter, useRoute } from "vue-router";
import { onMounted, ref, watch } from "vue";
import { HtmlEvent, onHtmlEventDispatch } from "src/utils";
import { useChangeThemeStore } from "src/store";
import DialogueSession from "./components/DialogueSession.vue";
import CommonFooter from "src/components/commonFooter/CommonFooter.vue";
import EulerDialog from "src/components/EulerDialog.vue";
import { reactive } from "vue";
import { invoke } from "@tauri-apps/api/tauri";

declare global {
  interface Window {
    onHtmlEventDispatch?: (
      _t: any,
      _ty: any,
      _event: any,
      type: HtmlEvent,
      data: any
    ) => void;
  }
}

// 挂载全局事件
window.onHtmlEventDispatch = onHtmlEventDispatch;

const router = useRouter();
const route = useRoute();
const themeStore = useChangeThemeStore();
const dialogVisible = ref(false);
const modeOptions = reactive([
  {
    label: "自动识别",
    value: "auto",
    disabled: false,
  },
]);

const isDark = ref(localStorage.getItem("theme") === "dark");
const loginDialogVisible = ref(false);

/**
 * 初始化
 */
const initCopilot = async (): Promise<void> => {
  const themeValue = localStorage.getItem("theme");
  if (themeValue) {
    themeStore.theme = themeValue;
  } else {
    localStorage.setItem("theme", "light");
  }
  const currRoute = router.currentRoute;
  if (currRoute.value.path === "/") {
    // await invoke('refresh_session_id')
    //   .then(async (sessionID: any) => {
    //     if (sessionID) {
    //       localStorage.setItem('session', sessionID);
    //       await getModeOptions();
    //       await invoke('stop');
    //       readAgreement();
    //     }
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });
  }
};

const settingsHandler = () => {
  invoke("show_settings_window");
};

// 协议内容
const agreement = ref<string>("");

const handleSubmit = async () => {
  dialogVisible.value = false;
};

const changeTheme = () => {
  isDark.value = !isDark.value;
  isDark.value
    ? document.body.setAttribute("theme", "dark")
    : document.body.setAttribute("theme", "light");
  const theme = isDark.value ? "dark" : "light";
  localStorage.setItem("theme", theme);
  themeStore.theme = theme;
  themeStore.$patch({ theme: theme });
};

onMounted(() => {
  const theme = localStorage.getItem("theme");
  if (theme) {
    document.body.setAttribute("theme", theme);
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
</script>

<template>
  <div class="dialogue" id="dialogId">
    <header class="dialogue-header" data-tauri-drag-region>
      <span>
        <img src="src/assets/svgs/euler_copilot_logo.svg" />
        <h4>EulerCopilot</h4>
      </span>
      <div class="header-right">
        <div class="mode">
          <span v-if="isDark" @click="changeTheme">
            <img src="src/assets/svgs/sun.svg" alt="" />
          </span>
          <span v-else @click="changeTheme">
            <img id="moon-icon" src="src/assets/svgs/moon.svg" alt="" />
          </span>
        </div>
        <div class="mode">
          <span @click="settingsHandler">
            <img class="settings" src="src/assets/svgs/settings.svg" />
          </span>
        </div>
      </div>
    </header>
    <div class="dialogue-container">
      <div class="dialogue-container-main">
        <DialogueSession
          :modeOptions="modeOptions"
          :login="!loginDialogVisible"
        />
      </div>
    </div>
    <footer class="dialogue-footer">
      <CommonFooter />
    </footer>
    <EulerDialog
      :visible="dialogVisible"
      :content="agreement"
      agreement-name="《服务协议》"
      @submit="handleSubmit"
    >
    </EulerDialog>
    <EulerDialog
      :visible="dialogVisible"
      :content="agreement"
      :need-check="false"
      agreement-name="《服务协议》"
      @submit="dialogVisible = false"
    ></EulerDialog>
  </div>
</template>

<style lang="scss">
body {
  overflow: hidden;
  position: fixed;
  width: 100vw;
  height: 100vh;
}

.el-dialog__body {
  overflow: hidden;
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

#sun-icon {
  &:hover {
    filter: invert(51%) sepia(95%) saturate(146%) hue-rotate(168deg)
      brightness(94%) contrast(83%);
  }
  &:active {
    filter: invert(50%) sepia(31%) saturate(458%) hue-rotate(168deg)
      brightness(101%) contrast(87%);
  }
}

#moon-icon {
  &:hover {
    filter: invert(51%) sepia(95%) saturate(146%) hue-rotate(168deg)
      brightness(94%) contrast(83%);
  }
  &:active {
    filter: invert(50%) sepia(31%) saturate(458%) hue-rotate(168deg)
      brightness(101%) contrast(87%);
  }
}
</style>
<style lang="scss" scoped>
.dialogue {
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  min-height: 810px;
  min-width: 680px;
  display: flex;
  flex-direction: column;
  background-image: var(--o-bg-image);
  background-size: cover;
  border-radius: 24px;
  border: 2px outset rgb(201, 228, 255, 0.4);
  position: relative;
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

      h4 {
        font-size: 18px;
        margin-left: 5px;
        color: var(--o-text-color-primary);
      }
    }

    .settings {
      width: 24px;
      height: 24px;
      cursor: pointer;
    }

    .header-right {
      display: flex;
      align-items: center;
      .mode {
        margin-left: 18px;
      }
    }
  }

  &-container {
    display: flex;
    padding: 16px 24px 16px 24px;
    height: calc(100% - 70px);
    justify-content: space-between;

    &-main {
      max-width: 100%;
      display: flex;
      flex: 1;
    }
  }
  &-footer {
    margin-bottom: 12px;
  }
}
</style>
