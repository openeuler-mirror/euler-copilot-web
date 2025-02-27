<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ARGEEMENT_VERSION } from 'src/conf/version';
import DialogueAside from './components/DialogueAside.vue';
import DialogueSession from './components/DialogueSession.vue';
import EulerDialog from 'src/components/EulerDialog.vue';
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore, useAccountStore } from 'src/store';

import { api } from 'src/apis';

const router = useRouter();
const route = useRoute();
const { updateAgreement } = useAccountStore();
const { app } = storeToRefs(useSessionStore());
const dialogVisible = ref(false);
const agreeDialogVisiable = ref(false);

// 协议内容
const agreement = ref<string>('');
const tip = ref<string>('');
// 协议版本
const agreementVersion = ref<string>(ARGEEMENT_VERSION);
const createAppForm = ref({
  icon: '',
  name: '',
  description: '',
  links: [],
  recommendedQuestions: [],
  dialogRounds: 3,
  permission: {
    visibility: 'private',
    authorizedUsers: [],
  },
});
/**
 * 读取协议
 */
const readAgreement = async () => {
  const response = await import('src/conf/agreement.md?raw');
  agreement.value = marked.parse(response.default) as string;
};

watch(
  () => router,
  () => {
  const currRoute = router.currentRoute;
  if (currRoute.value.query.appId) {
    // 判断是否编辑--是否需要查询回显数据
    api
      .querySingleAppData({
        id: route.query?.appId as string,
      })
      .then(res => {
        const appInfo = res?.[1]?.result;
        if (appInfo) {
          createAppForm.value = {
            icon: appInfo?.icon,
            name: appInfo?.name,
            description: appInfo?.description,
            links: appInfo?.links?.map(item => item.url),
            recommendedQuestions: appInfo?.recommendedQuestions,
            dialogRounds: appInfo?.dialogRounds,
            permission: {
              visibility: appInfo?.permission?.visibility,
              authorizedUsers: appInfo?.permission?.authorizedUsers,
            },
          };
        }
      });
    }
  },
  { deep: true, immediate: true },
);

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

onMounted(async() => {
  window.scrollTo({
    top: 0,
    left: 0,
  });
});


</script>
<template>
  <div class="copilot-container" :class="qiankunWindow.__POWERED_BY_QIANKUN__ ? 'micro-copilot-container' : ''">
    <div class="copilot-container-main">
      <DialogueAside />
      <DialogueSession :createAppForm="createAppForm"/>
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
