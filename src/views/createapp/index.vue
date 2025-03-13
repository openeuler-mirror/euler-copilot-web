<script setup lang="ts">
import '../styles/createApp.scss';
import { onMounted, onUnmounted, ref } from 'vue';
import AppConfig from './components/appConfig.vue';
import WorkFlow from './components/workFlow.vue';
import CustomLoading from '../customLoading/index.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { useRouter, useRoute } from 'vue-router';
import { api } from 'src/apis';
import { ElMessage } from 'element-plus';
import { IconSuccess,  IconRemind} from '@computing/opendesign-icons';
const router = useRouter();
const route = useRoute();
const publishStatus = ref('未发布');
const publishValidate = ref(false);
const appFormValidate = ref(false);
const createAppType = ref('appConfig');
const appConfigRef = ref();
const workFlowRef = ref();
const flowList = ref([]);
const loading = ref(false);
const handleChangeAppType = type => {
  createAppType.value = type;
  // 切换createAppType【tab值】时，将其保存在sessionStorage，刷新时保证不变
  sessionStorage.setItem('createAppType', type);
};

// 初始化
onMounted(() => {
  // 判断是否有sessionStorage存储当前的tab页面
  const currentAppType = sessionStorage.getItem('createAppType');
  // 如果sessionStorage保存了新建应用中心的createAppType【tab值】，则回显
  if (currentAppType) {
    createAppType.value = currentAppType;
  }
})

onUnmounted(() => {
  // 组件销毁时，清空保存新建应用中心的createAppType【tab值】
  sessionStorage.setItem('createAppType', '');
})

// 需要界面配置校验与工作流校验同时通过
const handlePulishApp = () => {
  loading.value = true;
  // 发布接口
  api
    .releaseSingleAppData({
      id: route.query?.appId as string,
    })
    .then(res => {
      if (res[1]?.result) {
        ElMessage.success('发布成功');
        router.push(`/app`);
        loading.value = false;
      }
    });
};

const handleValidateContent = valid => {
  appFormValidate.value = valid;
};

// 获取当前的应用中的各flowsDebug的情况
const updateFlowsDebug = (status?) => {
  // 如果status为false,直接置为False不再调接口
  if (status === false) {
    publishValidate.value = false;
    return;
  }
  api.querySingleAppData({
        id: route.query?.appId as string,
      })
      .then(res => {
        if (res?.[1]?.result) {
          const flowDataList = res?.[1]?.result?.workflows || [];
          judgeAppFlowsDebug(flowDataList);
        }
      })
}

// 获取工作流列表
const getFlowList = flowDataList => {
  flowList.value = flowDataList;
  judgeAppFlowsDebug(flowDataList)
};

const judgeAppFlowsDebug = (flowDataList) => {
  // 判断应用下的所有工作流当前是否debug通过
  const flowsDebug = flowDataList.every(item => item?.debug);
  // 初始化时，获取发布的校验结果---必须有工作流且所有工作流必须debug通过
  publishValidate.value = flowDataList?.length > 0 && flowsDebug;
}

// 保存按钮
const saveConfigOrFlow = () => {
  if (createAppType.value === 'appConfig') {
    loading.value = true;
    let appFormValue = appConfigRef.value.createAppForm;
    if (appFormValue) {
      api
        .createOrUpdateApp({
          appId: route.query?.appId as string,
          icon: appFormValue.icon,
          name: appFormValue.name,
          description: appFormValue.description,
          links: appFormValue.links.map(item => {
            return { url: item, title: '' };
          }),
          recommendedQuestions: appFormValue.recommendedQuestions,
          dialogRounds: appFormValue.dialogRounds,
          permission: appFormValue.permission,
        })
        .then(res => {
          if (res[1]) {
            ElMessage({
              showClose: true,
              message: '更新成功',
              icon: IconSuccess,
              customClass: 'o-message--success',
              duration: 2000,
            });
          }
          loading.value = false;
        });
    }
  } else {
    // 工作流页面保存当前的工作流
    workFlowRef.value.saveFlow();
  }
};

const getPublishStatus = (status) => {
  if (status) {
    publishStatus.value = '已发布'
  }
}

const handleJumperAppCenter = () => {
  router.push('/app');
};
</script>
<template>
  <div class="createAppContainer">
    <CustomLoading :loading="loading"></CustomLoading>
    <div class="createAppContainerTop">
      <div class="createAppContainerMenu">
        <div class="createAppContainerMenuLeft">
          <span class="createAppContainerMenuCenter" @click="handleJumperAppCenter">应用中心</span>
          <span>/</span>
          <span class="createAppContainerMenuText">创建应用</span>
        </div>
        <div class="createAppContainerStatus" :class="{ debugSuccess: publishStatus === '已发布' }">
          {{ publishStatus }}
        </div>
      </div>
      <div class="createAppContainerType">
        <div
          class="createAppBtn"
          :class="{ createAppBtnActive: createAppType === 'appConfig' }"
          @click="handleChangeAppType('appConfig')"
        >
          <div>界面配置</div>

          <el-icon v-if="appFormValidate">
            <IconSuccess />
          </el-icon>
          <el-icon v-else class="warningRemind">
            <IconRemind />
          </el-icon>
        </div>
        <div
          class="createAppBtn"
          :class="{ createAppBtnActive: createAppType !== 'appConfig' }"
          @click="handleChangeAppType('workFlow')"
        >
          <div>工作流编排</div>
          <el-icon v-if="publishValidate">
            <IconSuccess />
          </el-icon>
          <el-icon v-else class="warningRemind">
            <IconRemind />
          </el-icon>
        </div>
      </div>
    </div>
    <div class="createAppContainerMain" v-show="createAppType === 'appConfig'">
      <AppConfig
        :handleValidateContent="handleValidateContent"
        @getFlowList="getFlowList"
        @getPublishStatus="getPublishStatus"
        ref="appConfigRef"
      />
    </div>
    <div class="createWorkFlowContainerMain" v-show="createAppType !== 'appConfig'">
      <WorkFlow
        @updateFlowsDebug="updateFlowsDebug"
        :flowList="flowList"
        ref="workFlowRef"
      />
    </div>
    <div class="createAppContainerFooter">
      <el-button @click="handleJumperAppCenter">取消</el-button>
      <el-button @click="saveConfigOrFlow" :disabled="createAppType === 'appConfig' ? !appFormValidate : false"
        >保存</el-button
      >
      <el-button :disabled="true">预览</el-button>
      <el-tooltip :disabled="publishValidate" content="需要当前应用中所有工作流调试成功才能发布应用" placement="top">
        <!-- 需要多一层，不然影响当前el-tooltip显示content -->
        <div>
          <el-button type="primary" :disabled="!publishValidate" @click="handlePulishApp()">发布</el-button>
        </div>
      </el-tooltip>
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
