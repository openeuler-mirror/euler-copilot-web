<script setup lang="ts">
import '../styles/createApp.scss';
import { onMounted, ref, watch } from 'vue';
import AppConfig from './components/appConfig.vue';
import WorkFlow from './components/workFlow.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { useRouter, useRoute } from 'vue-router';
import { api } from 'src/apis';
import { ElMessage } from 'element-plus';
import { IconSuccess } from '@computing/opendesign-icons';
const router = useRouter();
const route = useRoute();
const publishValidate = ref(true);
const appFormValidate = ref(true);
const createAppType = ref('appConfig');
const appConfigRef = ref();
const workFlowRef = ref();
const handleChangeAppType = type => {
  createAppType.value = type;
};

const handlePulishApp = () => {
  let appFormValue = appConfigRef.value.createAppForm;
  if (appFormValue) {
    api
      .createOrUpdateApp({
        appId: route.query?.appId as string,
        icon: appFormValue.icon,
        name: appFormValue.name,
        description: appFormValue.description,
        links: appFormValue.links.map(item => {
          return { url: item, title: item };
        }),
        recommendedQuestions: appFormValue.recommendedQuestions,
        dialogRounds: appFormValue.dialogRounds,
        permission: appFormValue.permission,
      })
      .then(res => {
        if (res[1]) {
          ElMessage({
            showClose: true,
            message: '修改成功',
            icon: IconSuccess,
            customClass: 'o-message--success',
            duration: 2000,
          });
          router.push('/app');
        }
      });
  }
};

const handleValidateContent = valid => {
  appFormValidate.value = valid;
};

// 获取工作流组件中的节点连接状态校验
const validateConnect = valid => {
  publishValidate.value = !valid;
};

watch(
  () => router,
  () => {
    if (!route.query?.appId) {
      router.push('/app');
    }
  },
  {
    deep: true,
    immediate: true,
  },
);

const handleJumperAppCenter = () => {
  router.push('/app');
};
</script>
<template>
  <div class="createAppContainer">
    <div class="createAppContainerTop">
      <div class="createAppContainerMenu">
        <div class="createAppContainerMenuLeft">
          <span class="createAppContainerMenuCenter" @click="handleJumperAppCenter">应用中心</span>
          <span>/</span>
          <span class="createAppContainerMenuText">创建应用</span>
        </div>
        <div class="createAppContainerStatus">未发布</div>
      </div>
      <div class="createAppContainerType">
        <div
          class="createAppBtn"
          :class="{ createAppBtnActive: createAppType === 'appConfig' }"
          @click="handleChangeAppType('appConfig')"
        >
          界面配置
        </div>
        <div
          class="createAppBtn"
          :class="{ createAppBtnActive: createAppType !== 'appConfig' }"
          @click="handleChangeAppType('workFlow')"
        >
          工作流编排
        </div>
      </div>
    </div>
    <div class="createAppContainerMain" v-show="createAppType === 'appConfig'">
      <AppConfig :handleValidateContent="handleValidateContent" ref="appConfigRef" />
    </div>
    <div class="createWorkFlowContainerMain" v-show="createAppType !== 'appConfig'">
      <WorkFlow @validateConnect="validateConnect" ref="workFlowRef" />
    </div>
    <div class="createAppContainerFooter">
      <el-button>取消</el-button>
      <el-button>保存</el-button>
      <el-button :disabled="true">预览</el-button>
      <el-button type="primary" :disabled="publishValidate" @click="handlePulishApp()">发布</el-button>
    </div>
  </div>
</template>
<style lang="scss">
/* 滚动条轨道样式 */
::-webkit-scrollbar-track {
  background-image: linear-gradient(180deg, #e7f0fd 1%, #daeafc 40%) !important;
  display: none;
}

::-webkit-scrollbar {
  width: 3px !important;
  height: 3px !important;
}

/* 滚动条的滑块 */
::-webkit-scrollbar-thumb {
  background-color: #c3cedf;
  border-radius: 3px;
}
</style>
