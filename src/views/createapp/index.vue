<script setup lang="ts">
import './style.scss';
import { ref, reactive } from 'vue';
import AppConfig from './components/appConfig.vue';
import WorkFlow from './components/workFlow.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const publishValidate = ref(true);
const createAppType = ref('appConfig');
const handleChangeAppType = type => {
  createAppType.value = type;
};
// 获取工作流组件中的节点连接状态校验
const validateConnect = valid => {
  publishValidate.value = !valid;
};
</script>
<template>
  <div class="createAppContainer">
    <div class="createAppContainerTop">
      <div class="createAppContainerMenu">
        <div class="createAppContainerMenuLeft">
          <span class="createAppContainerMenuCenter">应用中心</span>
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
      <AppConfig />
    </div>
    <div class="createWorkFlowContainerMain" v-show="createAppType !== 'appConfig'">
      <WorkFlow @validateConnect="validateConnect" />
    </div>
    <div class="createAppContainerFooter">
      <el-button>取消</el-button>
      <el-button>保存</el-button>
      <el-button>预览</el-button>
      <el-button type="primary" :disabled="publishValidate">发布</el-button>
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
  // display: none;
}

/* 滚动条的滑块 */
::-webkit-scrollbar-thumb {
  background-color: #c3cedf;
  border-radius: 3px;
  // display: none;
}
</style>
