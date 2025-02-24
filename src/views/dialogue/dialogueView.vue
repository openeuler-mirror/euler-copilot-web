<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { onHtmlEventDispatch } from 'src/utils';
import { useHistorySessionStore, useSessionStore, useAccountStore, useLangStore } from 'src/store';
import { marked } from 'marked';
import { ARGEEMENT_VERSION } from 'src/conf/version';
import Copilot from './Copilot.vue';
import { useChangeThemeStore } from 'src/store';
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import { api } from 'src/apis';
import { ElMessage } from 'element-plus';
import { watch } from 'vue';
import i18n from 'src/i18n'
import { reactive } from 'vue';
import { successMsg } from 'src/components/Message';

// 挂载全局事件
window.onHtmlEventDispatch = onHtmlEventDispatch as any;
const { logout } = useAccountStore();
const { historySession } = storeToRefs(useHistorySessionStore());
const { conversationList } = storeToRefs(useSessionStore());
const { language } = storeToRefs(useLangStore());
const { changeLanguage } = useLangStore();
const dialogVisible = ref(false);
const themeStore = useChangeThemeStore();
const apikeyVisible = ref(false);
const KnowledgeVisible = ref(false);
const apikey = ref();
const hidden = ref(false);
const revoke = ref(true);
const isSubmitDisabled = ref(true);
const ruleFormRef = ref<any>();



export interface ModelForm {
  max_tokens?: number;
  model_name?: string;
  openai_api_base?: string;
  openai_api_key?: string;
  [property: string]: any;
}
const kb_id = localStorage.getItem("kb_id")||"";
const ruleForm = reactive<ModelForm>({
  kb_id: kb_id,
});
const rules = ref();

const formValidateStatus = ref<any>({
  kb_id: true,
});



const logoutHandler = () => {
  logout();
  historySession.value = [];
  conversationList.value = [];
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

const theme = ref(localStorage.getItem('theme') || 'light');

const changeTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('theme', theme.value);
  localStorage.setItem('theme', theme.value);
  themeStore.theme = theme.value;
};

const createApi = async() => {
  apikey.value = '';
  revoke.value = false;
  let action = 'create'
  await api.getApiKey()
  const [_, res] = await api.changeApiKey({action});
    if (!_ && res) {
      apikey.value = res.result.api_key;
    }
}

const updateApi = async() => {
  apikey.value = '';
  let action = 'update'
  await api.changeApiKey({action});
  revoke.value = false;
  await api.getApiKey();
  const [_, res] = await api.changeApiKey({ action });
  if (!_ && res) {
    apikey.value = res.result.api_key;
  }

}

const revokeApi = async() => {
  let action = 'revoke'
  await api.changeApiKey({action});
  revoke.value = true;
  apikey.value = false;
  hidden.value = false;
}

const handleDialogClose = () => {
  apikey.value = false;
  hidden.value = true;
  apikeyVisible.value = false;
}

const handleKnowledgeDialogClose = () => {
  KnowledgeVisible.value = false;
}

const copy = () => {
  navigator.clipboard.writeText(apikey.value);
  successMsg('复制成功');
}


const lang = computed(() => (language.value === 'EN' ? 'English' : '简体中文'));

const handleConfirmCreateModel = async (formData: any | undefined) => {
      const [_, res] = await api.updateKnowledgeList({
        kb_id: ruleForm.kb_id || "",
      })
      if(!_&&res){
        localStorage.setItem('kb_id', ruleForm.kb_id || "")
        ElMessage.success("成功");
        KnowledgeVisible.value = false;
      }else {
        ruleForm.kb_id = "";
        ElMessage.error("失败");
        KnowledgeVisible.value = false;
      }
};

const changeLanguagefun = (lang: 'CN' | 'EN') => {
  changeLanguage(lang);
};

const handleFormValidate = (prop: any, isValid: boolean, message: string) => {
  formValidateStatus.value[prop] = isValid;
};

onMounted(() => {
  if (localStorage.getItem('theme')) {
    document.body.setAttribute('theme', localStorage.getItem('theme') || 'light');
  }
  api.getKnowledgeList().then((res) => {
    ruleForm.value = res;
  });
  if(localStorage.getItem('kb_id')){
    ruleForm.kb_id = localStorage.getItem('kb_id');
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
  { deep: true }
);

</script>

<template>
  <div class="dialogue" id="dialogId">
    <header class="dialogue-header" v-if="!qiankunWindow.__POWERED_BY_QIANKUN__">
      <span>
        <img src="@/assets/svgs/euler_copilot_logo.svg" />
        <h4>{{ $t('home.name') }}</h4>
      </span>
      <div class="header-right">
        <el-popover popper-class="popper-class">
          <template #reference>
            <span class="language">{{ lang }}</span>
          </template>
          <el-button class="exit-button" type="primary" @click="changeLanguagefun('EN')">English</el-button>
          <el-button class="exit-button" type="primary" @click="changeLanguagefun('CN')">简体中文</el-button>
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
          <el-button class="exit-button" type="primary" @click="logoutHandler">{{ $t('Login.logout') }}</el-button>
          <el-button class="exit-button" @click="apikeyVisible = true">API KEY</el-button>
          <el-button class="exit-button" @click="KnowledgeVisible = true">{{ i18n.global.t('witChainD.witChainD') }}</el-button>
        </el-popover>
      </div>
    </header>
    <Copilot />
    <el-dialog 
    class="apikey" 
    v-model="apikeyVisible" 
    title="API KEY"
    width="50%" 
    align-center
    :before-close='handleDialogClose'
    >
    <div class="apikey_view">
      <el-alert v-if='apikey' class='apikey_view_alert' type="info" :show-icon='true' :closable='false'>{{ i18n.global.t('apikey.save_apikey') }}</el-alert>
      <div class='apikey_view_main'>
        <div class='main'>
          <div class='main_view' v-if="!apikey&&hidden">
            <span>******************************</span>
          </div>
          <div class='main_view' v-else-if='!apikey'>
            <img v-if="themeStore.theme === 'dark'" src="src/assets/svgs/dark_null.svg" />
            <img v-else src="src/assets/svgs/light_null.svg" alt="">
            <span>{{ i18n.global.t('apikey.no_apikey') }}</span>
          </div>
          <div class='main_view' v-else>
            <div class='main_view_span'>
              <div>{{apikey}}</div>
            </div>
          </div>
          <div v-if='apikey'>
            <el-button type='primary' @click='copy' >{{ i18n.global.t('feedback.copy') }}</el-button>
            <el-button @click='revokeApi'>{{ i18n.global.t('feedback.revoke') }}</el-button>
          </div>
          <div v-else-if='!apikey&&!revoke'>
            <el-button type='primary' @click='updateApi'>{{ i18n.global.t('feedback.refresh') }}</el-button>
            <el-button @click='revokeApi'>{{ i18n.global.t('feedback.revoke') }}</el-button>
          </div>
          <div v-else>
            <el-button type='primary' @click='createApi'>{{ i18n.global.t('apikey.create_apikey') }}</el-button>
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
    :title="$t('witChainD.witChainD')"
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
        class="docName"
      >
        <el-input
          v-model="ruleForm.kb_id"
          :placeholder="$t('witChainD.describe_the_witChainD')"
        >
          <template #suffix>
            <el-icon
              class="warning-icon"
              v-if="!formValidateStatus.kb_id"
            >
              <WarningFilled />
            </el-icon>
          </template>
        </el-input>
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

.model-dialog {
  padding: 0 !important;
  .el-dialog__title {
    font-family: "HarmonyOS Sans SC Bold", sans-serif !important;
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
    width: 100%;
    border-radius: 0;
  }
}

.language {
  color: var(--o-text-color-primary);
}

#sun-icon {
  // background-color: pink;
  &:hover {
    filter: invert(51%) sepia(95%) saturate(146%) hue-rotate(168deg) brightness(94%) contrast(83%);
  }
  &:active {
    filter: invert(50%) sepia(31%) saturate(458%) hue-rotate(168deg) brightness(101%) contrast(87%);
  }
}

#moon-icon {
  &:hover {
    filter: invert(51%) sepia(95%) saturate(146%) hue-rotate(168deg) brightness(94%) contrast(83%);
  }
  &:active {
    filter: invert(50%) sepia(31%) saturate(458%) hue-rotate(168deg) brightness(101%) contrast(87%);
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
        cursor: pointer;
        margin-right: 18px;
        margin-left: 18px;
      }
    }
  }
}
</style>
