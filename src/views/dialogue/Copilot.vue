<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { api } from 'src/apis';
import { useRouter, useRoute } from 'vue-router';
import { useHistorySessionStore, useAccountStore, useChangeThemeStore } from 'src/store';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { ARGEEMENT_VERSION } from 'src/conf/version';
import DialogueAside from './components/DialogueAside.vue';
import DialogueSession from './components/DialogueSession.vue';
import CommonFooter from 'src/components/commonFooter/CommonFooter.vue';
import EulerDialog from 'src/components/EulerDialog.vue';
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const { theme } = storeToRefs(useChangeThemeStore());
const { userinfo } = storeToRefs(useAccountStore());
const { getUserInfo, updateAgreement } = useAccountStore();
const { getHistorySession } = useHistorySessionStore();
const modeOptions = reactive([
  {
    label: t('main.Automatic'),
    value: 'auto',
    disabled: false,
  },
]);

const setPlugins = async () => {
  const [_, res] = await api.getRecognitionMode();
  if (!_ && res) {
    res.result.plugins.forEach(item => {
      const opt = {
        label: item.name,
        value: item.id,
        disabled: false,
      };
      modeOptions.push(opt);
    });
  }
};

const type = import.meta.env.VITE_USER_TYPE;
const initCopilot = async (): Promise<void> => {
  if (localStorage.getItem('theme')) {
    theme.value = localStorage.getItem('theme') || 'light';
  } else {
    localStorage.setItem('theme', 'light');
  }
  userinfo.value.organization = type;
  const currRoute = router.currentRoute;
  if ( ['/copilot','/'].includes(currRoute.value?.path)) {
    const isLogin = await getUserInfo();
    if (isLogin) {
      await api.getRecognitionMode()
      await api.stopGeneration();
      await getHistorySession();
      setPlugins();
  }
    return;
  } 
};

const dialogVisible = ref(false);
const agreeDialogVisiable = ref(false);


// 协议内容
const agreement = ref<string>('');
const tip = ref<string>('');
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
    agreeDialogVisiable.value = true;
    const response = await import('src/conf/agreement-tip.md?raw');
    tip.value = marked.parse(response.default) as string;
    return;
  }
  await readAgreement();
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  await updateAgreement(agreementVersion.value);
  dialogVisible.value = false;
};

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
  <div class="copilot-container" :class="qiankunWindow.__POWERED_BY_QIANKUN__ ? 'micro-copilot-container' : ''">
    <div class="copilot-container-main">
      <DialogueAside />
      <DialogueSession :modeOptions="modeOptions" />
    </div>
  </div>

  <EulerDialog
    :visible="dialogVisible"
    :content="agreement"
    agreement-name="《服务协议》"
    height="400px"
    @submit="handleSubmit"
  ></EulerDialog>
  <EulerDialog
    :visible="agreeDialogVisiable"
    :content="tip"
    :need-check="false"
    height="300px"
    agreement-name="内测声明"
    @submit="agreeDialogVisiable = false"
  ></EulerDialog>
</template>
<style lang="scss" scoped>
.copilot-container {
  padding: 16px 24px 16px 8px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  &-main {
    display: flex;
    flex: 1;
  }
  &-footer {
    margin-bottom: 12px;
  }
}
.copilot-aside {
  width: 64px;
  height: calc(100% - 8px);
  background-color: #1f2937;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
}

.micro-copilot-container {
  height: calc(100% - 25px);
}
.el-menu {
  width: 64px;
  margin-right: 8px;
}
</style>
