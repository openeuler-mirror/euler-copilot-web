<script lang="ts" setup>
import { computed, ComputedRef, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { onHtmlEventDispatch } from 'src/utils';
import {
  useHistorySessionStore,
  useSessionStore,
  useAccountStore,
} from 'src/store';
import { useChangeThemeStore } from 'src/store';
import { api } from 'src/apis';
import { ElMessage } from 'element-plus';
import { watch } from 'vue';
import i18n from 'src/i18n';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import CopilotIcon from '@/assets/svgs/routerCopilot.svg';
import CopilotIconSelected from '@/assets/svgs/routerCopilotSelected.svg';
import ApiIcon from '@/assets/svgs/routerApi.svg';
import ApiIconSelected from '@/assets/svgs/routerApiSelected.svg';
import AppIcon from '@/assets/svgs/routerApp.svg';
import AppIconSelected from '@/assets/svgs/routerAppSelected.svg';
import WitChainDIcon from '@/assets/svgs/witChainD.svg';
import WitChainDIconSelected from '@/assets/svgs/witChainDSelected.svg';
import tools from '../tools/index.vue';
import TitleBar from './components/TitleBar.vue';

const { userinfo } = storeToRefs(useAccountStore());
const { getUserInfo } = useAccountStore();
const { getHistorySession } = useHistorySessionStore();
const { app } = storeToRefs(useSessionStore());
const { createNewSession } = useHistorySessionStore();

// 挂载全局事件
window.onHtmlEventDispatch = onHtmlEventDispatch as any;
const themeStore = useChangeThemeStore();
const apikeyVisible = ref(false);
const KnowledgeVisible = ref(false);
const apikey = ref();
const hidden = ref(false);
const revoke = ref(true);
const isSubmitDisabled = ref(true);
const ruleFormRef = ref<any>();
const router = useRouter();
const type = import.meta.env.VITE_USER_TYPE;
let routerList: ComputedRef<
  Array<{
    name: string;
    path: string;
    src: string;
    selectedSrc: string;
    routerName: string;
    anotherName?: string | undefined; // 路由别名，辅助匹配选中的路由图标
  }>
> = computed(() => {
  return [
    {
      name: i18n.global.t('menu.dialogue'),
      path: '/',
      src: CopilotIcon,
      selectedSrc: CopilotIconSelected,
      routerName: 'dialogue',
      anotherName: 'copilot',
    },
    {
      name: i18n.global.t('menu.semantic_center'),
      path: '/api',
      src: ApiIcon,
      selectedSrc: ApiIconSelected,
      routerName: 'api',
    },
    {
      name: i18n.global.t('menu.app_center'),
      path: '/app',
      src: AppIcon,
      selectedSrc: AppIconSelected,
      routerName: 'app',
      anotherName: 'createApp',
    },
    {
      name: i18n.global.t('menu.sql'),
      path: '/witchainD',
      src: WitChainDIcon,
      selectedSrc: WitChainDIconSelected,
      routerName: 'witchainD',
    },
  ];
});

export interface ModelForm {
  max_tokens?: number;
  model_name?: string;
  openai_api_base?: string;
  openai_api_key?: string;
  [property: string]: any;
}
const kb_id = localStorage.getItem('kb_id') || '';
const ruleForm = reactive<ModelForm>({
  kb_id: kb_id,
});
const rules = ref();

const formValidateStatus = ref<any>({
  kb_id: true,
});

const theme = ref(localStorage.getItem('theme') || 'light');

const createApi = async () => {
  apikey.value = '';
  revoke.value = false;
  let action = 'create';
  await api.getApiKey();
  const [_, res] = await api.changeApiKey({ action });
  if (!_ && res) {
    apikey.value = res.result.api_key;
  }
};

const updateApi = async () => {
  apikey.value = '';
  let action = 'update';
  await api.changeApiKey({ action });
  revoke.value = false;
};

const revokeApi = async () => {
  let action = 'revoke';
  await api.changeApiKey({ action });
  revoke.value = true;
  apikey.value = false;
  hidden.value = false;
};

const handleDialogClose = () => {
  apikey.value = false;
  hidden.value = true;
  apikeyVisible.value = false;
};

const handleKnowledgeDialogClose = () => {
  KnowledgeVisible.value = false;
};

const copy = () => {
  navigator.clipboard.writeText(apikey.value);
};

const handleConfirmCreateModel = async (formData: any | undefined) => {
  const [_, res] = await api.updateKnowledgeList({
    kb_id: ruleForm.kb_id || '',
  });
  if (!_ && res) {
    localStorage.setItem('kb_id', ruleForm.kb_id || '');
    ElMessage.success('成功');
    KnowledgeVisible.value = false;
  } else {
    ruleForm.kb_id = '';
    ElMessage.error('失败');
    KnowledgeVisible.value = false;
  }
};

const handleFormValidate = (prop: any, isValid: boolean, message: string) => {
  formValidateStatus.value[prop] = isValid;
};
onMounted(() => {
  if (localStorage.getItem('theme')) {
    document.body.setAttribute(
      'theme',
      localStorage.getItem('theme') || 'light',
    );
  }
  if (localStorage.getItem('kb_id')) {
    ruleForm.kb_id = localStorage.getItem('kb_id');
  }
  console.log('onMounted', window.location.host);
  initCopilot();
  const iframe = document.getElementById('my-iframe') as HTMLIFrameElement;
  if (iframe) {
    if (window.location.origin === 'http://localhost:3000') {
      iframe.src = `http://localhost:3002`;
    } else {
      iframe.src = `${window.location.origin}/witchaind`;
    }
  }
});

watch(
  ruleForm,
  () => {
    let flag = false;
    Object.keys(ruleForm).forEach((item) => {
      if (rules.value?.[item]?.[0]?.required) {
        if (!ruleForm?.[item]?.toString()?.length) {
          flag = true;
        }
      }
    });

    isSubmitDisabled.value = flag;
  },
  { deep: true },
);

const addNewSession = async (routerName: string) => {
  if (routerName === 'dialogue') {
    await createNewSession();
  }
};

const initCopilot = async (): Promise<void> => {
  if (localStorage.getItem('theme')) {
    theme.value = localStorage.getItem('theme') || 'light';
  } else {
    localStorage.setItem('theme', 'light');
  }
  const currRoute = router.currentRoute;
  if (currRoute.value.query.appId) {
    app.value = {
      appId: String(currRoute.value.query.appId),
      name: String(currRoute.value.query.name),
    };
  }
  userinfo.value.organization = type;
  const isLogin = await getUserInfo();
  if (isLogin) {
    await api.stopGeneration();
    await getHistorySession();
  }
  return;
};

watch(
  () => router,
  () => {
    const currRoute = router.currentRoute;
    if (currRoute.value.query.appId) {
      app.value = {
        appId: String(currRoute.value.query.appId),
        name: String(currRoute.value.query.name),
      };
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="dialogue" id="dialogId">
    <TitleBar />
    <div class="dialogue-container">
      <div class="dialogue-menu">
        <router-link
          v-for="item in routerList"
          :key="item.path"
          :to="item.path"
          class="menu-item"
        >
          <span class="menu-icon">
            <el-icon class="menu-icon" @click="addNewSession(item.routerName)">
              <img
                v-if="
                  router.currentRoute.value.name
                    ?.toString()
                    .indexOf(item.routerName) !== -1 ||
                  router.currentRoute.value.name
                    ?.toString()
                    .indexOf(item.anotherName!) !== -1
                "
                class="create-button__icon"
                :src="item.selectedSrc"
              />
              <img v-else class="create-button__icon" :src="item.src" />
            </el-icon>
          </span>
          <span class="menu-text">{{ item.name }}</span>
        </router-link>
      </div>
      <div class="dialogue-content">
        <KeepAlive v-show="router.currentRoute.value.name === 'witchainD'">
          <tools />
        </KeepAlive>
        <RouterView v-show="router.currentRoute.value.name !== 'witchainD'" />
      </div>
    </div>
    <el-dialog
      class="apikey"
      v-model="apikeyVisible"
      title="API KEY"
      width="50%"
      align-center
      :before-close="handleDialogClose"
    >
      <div class="apikey_view">
        <el-alert
          v-if="apikey"
          class="apikey_view_alert"
          type="info"
          :show-icon="true"
          :closable="false"
        >
          {{ i18n.global.t('apikey.save_apikey') }}
        </el-alert>
        <div class="apikey_view_main">
          <div class="main">
            <div class="main_view" v-if="!apikey && hidden">
              <span>******************************</span>
            </div>
            <div class="main_view" v-else-if="!apikey">
              <img
                v-if="themeStore.theme === 'dark'"
                src="src/assets/svgs/dark_null.svg"
              />
              <img v-else src="src/assets/svgs/light_null.svg" alt="" />
              <span>{{ i18n.global.t('apikey.no_apikey') }}</span>
            </div>
            <div class="main_view" v-else>
              <div class="main_view_span">
                <div>{{ apikey }}</div>
              </div>
            </div>
            <div v-if="apikey">
              <el-button type="primary" @click="copy">
                {{ i18n.global.t('feedback.copy') }}
              </el-button>
              <el-button @click="revokeApi">
                {{ i18n.global.t('feedback.revoke') }}
              </el-button>
            </div>
            <div v-else-if="!apikey && !revoke">
              <el-button type="primary" @click="updateApi">
                {{ i18n.global.t('feedback.refresh') }}
              </el-button>
              <el-button @click="revokeApi">
                {{ i18n.global.t('feedback.revoke') }}
              </el-button>
            </div>
            <div v-else>
              <el-button type="primary" @click="createApi">
                {{ i18n.global.t('apikey.create_apikey') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      align-center
      v-model="KnowledgeVisible"
      class="model-dialog"
      width="560"
      @close="handleKnowledgeDialogClose"
      title="WitChainD"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="rules"
        label-position="left"
        @validate="handleFormValidate"
      >
        <el-form-item
          :label="$t('witChainD.witChainD_id')"
          prop="openai_api_key"
          class="docName"
        >
          <el-input
            v-model="ruleForm.kb_id"
            :placeholder="$t('witChainD.describe_the_witChainD')"
          ></el-input>
        </el-form-item>
        <el-form-item class="model-ops-btn">
          <el-button
            class="resetBtn"
            type="primary"
            :disabled="isSubmitDisabled"
            @click="handleConfirmCreateModel(ruleFormRef)"
          >
            {{ i18n.global.t('history.ok') }}
          </el-button>
          <el-button class="resetBtn" @click="handleKnowledgeDialogClose">
            {{ i18n.global.t('history.cancel') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<style lang="scss">
.dialogue-container {
  display: flex;
  height: calc(100% - 48px);
}
//hover active selected 样式待填充
.dialogue-menu {
  position: relative;
  z-index: 1;
  width: 64px;
  height: 100%;
  padding-top: 8px;
  background-color: var(--o-bg-color-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  .menu-item {
    display: flex;
    font-style: none;
    text-decoration: none;
    width: 64px;
    height: 64px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
    cursor: pointer;
    .menu-icon {
      align-items: center;
      img {
        //hover颜色待改进
        width: 40px;
        &:hover {
          filter: invert(43%) sepia(94%) saturate(1622%) hue-rotate(190deg)
            brightness(101%) contrast(101%);
        }
        &:active {
          filter: invert(43%) sepia(94%) saturate(1622%) hue-rotate(190deg)
            brightness(101%) contrast(101%);
        }
      }
    }
    .menu-text {
      font-style: none;
      display: block;
      font-size: 12px;
      color: var(--o-text-color-primary);
      text-align: center;
      padding: 0 1px;
    }
  }
}
.dialogue-content {
  width: 100%;
  height: 100%;
  flex: 1;
}
.model-dialog {
  padding: 0 !important;
  .el-dialog__title {
    font-family: 'HarmonyOS Sans SC Bold', sans-serif !important;
    font-weight: 800;
  }
  .el-input {
    width: 100%;
  }
  .el-dialog__body {
    padding: 24px 38px 0 16px;
    margin-right: 0 !important;
  }
  .model-ops-btn {
    height: 24px !important;
    min-height: unset !important;
    margin-bottom: 24px;
    margin-top: 32px !important;
    .el-form-item__content {
      margin-left: 0 !important;
      height: 24px !important;
      display: flex;
      min-height: unset !important;
      justify-content: center;
      .el-button {
        height: 24px !important;
        min-height: unset !important;
      }
    }
  }
  .el-form-item {
    gap: 24px;
  }
  .el-form-item__label {
    padding: 0 !important;
    height: 32px !important;
    align-items: center !important;
  }
  .el-input-number__increase,
  .el-input-number__decrease {
    background: transparent !important;
    .el-icon {
      color: #8d98aa !important;
    }
  }

  .token-size {
    width: 111px !important;
    .el-input__wrapper {
      width: 50px !important;
      overflow: hidden !important;
      padding-left: 30px !important;
      padding-right: 30px !important;
    }
    .el-input__inner {
      width: 50px !important;
      overflow: hidden !important;
      padding-left: 5px !important;
      padding-right: 5px !important;
    }
  }

  .warning-icon {
    svg {
      color: rgb(228, 33, 33) !important;
    }
    path {
      background: rgb(228, 33, 33) !important;
    }
  }
}

.el-dialog__body {
  overflow: hidden;
}

.apikey {
  &_view {
    // height: 400px;
    &_alert {
      margin-bottom: 8px;
    }

    &_main {
      // background-color: pink;
      // height: 336px;
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
          &_span {
            height: 80px;
            margin: 0px;
            div {
              margin: 0px;
              width: 300px;
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
        div {
          button {
            margin-top: 32px;
          }
        }
      }
    }
  }
}

.el-popover.popper-class {
  padding: 5px 0 !important;
  border-radius: 8px;
  .exit-button {
    width: 100%;
    border-radius: 0;
  }
  .lang-button {
    text-align: center;
    cursor: pointer;
    line-height: 32px;
    height: 32px;

    &:hover {
      color: white;
      background-color: var(--o-color-primary-tertiary);
    }
  }
  .lang-selected {
    color: white;
    background-color: var(--o-color-primary-secondary);
  }
  .divider {
    border-bottom: 1px solid var(--o-text-color-tertiary);
  }
}

.language {
  color: var(--o-text-color-primary);
  cursor: pointer;
}

#sun-icon {
  // background-color: pink;
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
  height: 100%;
  min-height: 768px;
  min-width: 1388px;
  overflow: scroll;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-image: var(--o-bg-image);
  background-size: cover;
}
</style>
