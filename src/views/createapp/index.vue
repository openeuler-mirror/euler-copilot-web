<script setup lang="ts">
import './style.scss';
import { ref, reactive } from 'vue';
import AppConfig from './components/appConfig.vue';
import WorkFlow from './components/workFlow.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const createAppType = ref('appConfig');
const handleChangeAppType = (type) => {
  createAppType.value = type
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
    <div class="createAppContainerMain"  v-show="createAppType === 'appConfig'">
      <AppConfig />
    </div>
    <div class="createWorkFlowContainerMain" v-show="createAppType !== 'appConfig'">
      <WorkFlow  />
    </div>
    <div class="createAppContainerFooter">
      <el-button>取消</el-button>
      <el-button>保存</el-button>
      <el-button>预览</el-button>
      <el-button type="primary">发布</el-button>
    </div>
  </div>
</template>
