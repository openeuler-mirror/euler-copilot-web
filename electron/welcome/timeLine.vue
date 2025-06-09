<template>
  <el-timeline style="max-width: 600px; max-height: 500px">
    <el-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      center
      :class="`timeline-status-${activity.type}`"
    >
      <template #dot>
        <img
          v-if="activity.type === 'running'"
          :src="loadingIcon"
          alt=""
          class="running-img"
        />
        <img
          v-else-if="activity.type === 'success'"
          :src="successIcon"
          alt=""
        />
        <img v-else-if="activity.type === 'failed'" :src="failedIcon" alt="" />
        <div v-else class="dot"></div>
      </template>
      <el-card
        :class="{
          'running-card': activity.type === 'running',
          'success-card': activity.type === 'success',
          'failed-card': activity.type === 'failed',
        }"
      >
        {{ activity.content }}
        <span v-if="activity.type === 'running'">
          {{ $t('localDeploy.installation') }}
        </span>
      </el-card>
    </el-timeline-item>
  </el-timeline>
  <div class="submit-btn">
    <el-button v-if="allSuccess" type="primary" @click="handleFinish">
      {{ $t('localDeploy.complete') }}
    </el-button>
    <el-button v-else-if="hasFailed" type="primary" @click="handleRetry">
      {{ $t('localDeploy.retry') }}
    </el-button>
    <el-button v-else type="primary" @click="handleStop">
      {{ $t('localDeploy.stopInstall') }}
    </el-button>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import successIcon from './assets/svgs/success.svg';
import failedIcon from './assets/svgs/error.svg';
import loadingIcon from './assets/svgs/upload-loading.svg';
import i18n from './lang/index';

// 活动列表（与部署服务的步骤对应）
const activities = ref([
  {
    content: '准备安装环境',
    type: 'default', // default, running, success, failed
    step: 'preparing-environment',
  },
  {
    content: i18n.global.t('localDeploy.dataBase'),
    type: 'default',
    step: 'install-databases',
  },
  {
    content: i18n.global.t('localDeploy.authHub'),
    type: 'default',
    step: 'install-authhub',
  },
  {
    content: i18n.global.t('localDeploy.intelligence'),
    type: 'default',
    step: 'install-intelligence',
  },
]);

// 部署状态
const deploymentStatus = ref<any>({
  status: 'idle',
  message: '',
  progress: 0,
  currentStep: '',
});

// 计算属性：检查是否所有活动都成功
const allSuccess = computed(() => {
  return activities.value.every((activity) => activity.type === 'success');
});

// 计算属性：检查是否存在失败的活动
const hasFailed = computed(() => {
  return activities.value.some((activity) => activity.type === 'failed');
});

// 更新活动状态
const updateActivitiesStatus = (status: any) => {
  // 防止 status 为 undefined 或 null
  if (!status) {
    return; // 如果状态无效，直接返回
  }

  // 开发模式下输出详细的状态更新信息
  if (import.meta.env.DEV) {
    console.group('🔧 updateActivitiesStatus 调用');
    console.log('状态详情:', {
      状态: status.status,
      当前步骤: status.currentStep,
      消息: status.message,
    });
    console.groupEnd();
  }

  // 安全地获取 currentStep，避免解构错误
  const currentStep = status.currentStep || '';

  if (status.status === 'error') {
    // 错误状态：所有未完成的步骤标记为失败
    if (import.meta.env.DEV) {
      console.log('🚨 处理错误状态：将所有未完成步骤标记为失败');
    }
    activities.value.forEach((activity) => {
      if (activity.type !== 'success') {
        activity.type = 'failed';
      }
    });
    return;
  }

  if (status.status === 'success') {
    // 成功状态：所有步骤标记为成功
    if (import.meta.env.DEV) {
      console.log('✅ 处理成功状态：将所有步骤标记为成功');
    }
    activities.value.forEach((activity) => {
      activity.type = 'success';
    });
    return;
  }

  // 根据当前步骤更新状态
  activities.value.forEach((activity, activityIndex) => {
    if (
      currentStep === 'preparing-environment' ||
      currentStep === 'installing-tools'
    ) {
      // 准备环境阶段
      if (import.meta.env.DEV) {
        console.log('📋 处理准备环境阶段');
      }
      if (activityIndex === 0) {
        activity.type = 'running';
      } else {
        activity.type = 'default';
      }
    } else if (currentStep === 'environment-ready') {
      // 环境准备完成
      if (import.meta.env.DEV) {
        console.log('✅ 处理环境准备完成');
      }
      if (activityIndex === 0) {
        activity.type = 'success';
      } else {
        activity.type = 'default';
      }
    } else if (currentStep === 'install-databases') {
      // 数据库服务安装中
      if (import.meta.env.DEV) {
        console.log('🗄️ 处理数据库服务安装');
      }
      if (activityIndex === 0) {
        activity.type = 'success';
      } else if (activityIndex === 1) {
        activity.type = 'running';
      } else {
        activity.type = 'default';
      }
    } else if (currentStep === 'install-authhub') {
      // AuthHub 服务安装中
      if (import.meta.env.DEV) {
        console.log('🔐 处理 AuthHub 服务安装');
      }
      if (activityIndex <= 1) {
        activity.type = 'success';
      } else if (activityIndex === 2) {
        activity.type = 'running';
      } else {
        activity.type = 'default';
      }
    } else if (currentStep === 'install-intelligence') {
      // Intelligence 服务安装中
      if (import.meta.env.DEV) {
        console.log('🧠 处理 Intelligence 服务安装');
      }
      if (activityIndex <= 2) {
        activity.type = 'success';
      } else if (activityIndex === 3) {
        activity.type = 'running';
      }
    } else if (currentStep === 'completed') {
      // 全部完成
      if (import.meta.env.DEV) {
        console.log('🎉 处理全部完成状态');
      }
      activities.value.forEach((act) => {
        act.type = 'success';
      });
    } else if (currentStep === 'failed' || currentStep === 'stopped') {
      // 失败或停止状态
      if (import.meta.env.DEV) {
        console.log('🛑 处理失败或停止状态');
      }
      activities.value.forEach((act) => {
        if (act.type !== 'success') {
          act.type = 'failed';
        }
      });
    } else {
      // 未知步骤
      if (import.meta.env.DEV) {
        console.warn(`❓ 未知的步骤: ${currentStep}`);
      }
    }
  });
};

// 状态监听器
const onDeploymentStatusChange = (status: any) => {
  // 防止状态为 undefined 时的错误
  if (status) {
    deploymentStatus.value = status;
    updateActivitiesStatus(status);
  }
};

// 处理停止安装
const handleStop = async () => {
  try {
    if (window.eulercopilotWelcome && window.eulercopilotWelcome.deployment) {
      await window.eulercopilotWelcome.deployment.stopDeployment();
    }
  } catch (error) {
    console.error('停止部署失败:', error);

    // 即使停止失败，也要更新界面显示错误状态
    const runningActivityIndex = activities.value.findIndex(
      (activity) => activity.type === 'running',
    );

    if (runningActivityIndex !== -1) {
      activities.value[runningActivityIndex].type = 'failed';
    }
  }
};

// 处理重试
const handleRetry = async () => {
  try {
    // 重置活动状态
    activities.value.forEach((activity) => {
      activity.type = 'default';
    });

    // 重新获取表单数据并重试（这里需要父组件传递表单数据）
    console.log('重试部署...');

    // 可以通过 emit 事件让父组件重新提交表单
    // emit('retry');
  } catch (error) {
    console.error('重试部署失败:', error);
  }
};

// 处理完成
const handleFinish = () => {
  // 可以通过 emit 事件通知父组件完成
  console.log('部署完成');
  // emit('finish');
};

// 组件挂载时设置监听器
onMounted(() => {
  if (window.eulercopilotWelcome && window.eulercopilotWelcome.deployment) {
    // 监听部署状态变化
    window.eulercopilotWelcome.deployment.onStatusChange(
      onDeploymentStatusChange,
    );

    // 获取当前状态
    window.eulercopilotWelcome.deployment
      .getStatus()
      .then((status) => {
        if (status) {
          onDeploymentStatusChange(status);
        }
      })
      .catch((error) => {
        console.error('获取部署状态失败:', error);
      });
  }
});

// 组件卸载时清理监听器
onUnmounted(() => {
  if (window.eulercopilotWelcome && window.eulercopilotWelcome.deployment) {
    window.eulercopilotWelcome.deployment.removeStatusListener();
  }
});
</script>

<style lang="scss" scoped>
.submit-btn {
  width: 100vw;
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 24px;
  button {
    padding: 8px 25px;
  }
}
.el-timeline {
  position: relative;
  top: 44px;
  left: 20px;

  .el-timeline-item {
    .el-timeline-item__node {
      z-index: 10;
    }
    .el-timeline-item__node,
    .el-timeline-item__node--normal {
      height: 24px !important;
      width: 24px !important;
      left: -7px !important;
      background-color: rgb(235, 239, 246);
    }
    .el-timeline-item__dot {
      z-index: 10;
      left: -6px;
      img {
        border-radius: 50%;
        width: 21px;
        height: 21px;
      }
      .running-img {
        width: 16px;
        height: 16px;
        padding: 2px;
        border-radius: 50%;
        background-color: rgb(99, 149, 253);
        animation: rotate 1s linear infinite;
      }
      .dot {
        width: 21px;
        height: 21px;
        border-radius: 50%;
        background-color: rgb(235, 239, 246);
      }
    }
    .el-timeline-item__wrapper {
      padding-left: 10px;
      .el-card {
        border: none;
        background-color: rgb(244, 246, 250);
        color: rgb(78, 88, 101);
        font-weight: 500;
        font-family: 'HarmonyOS Sans SC';
        font-size: 16px;
      }
      .running-card {
        background-color: rgba(99, 149, 253, 0.1);
        color: rgb(99, 149, 253);
      }
      .success-card {
        background-color: rgba(42, 169, 86, 0.1);
        color: rgb(36, 171, 54);
      }
      .failed-card {
        background-color: rgba(277, 32, 32, 0.1);
        color: rgb(277, 32, 32);
      }
      .el-card.is-always-shadow {
        box-shadow: none;
      }
      .el-timeline-item__timestamp.is-bottom {
        margin-top: 0;
      }
    }
  }

  /* 成功状态 - 绿色连接线 */
  :deep(.timeline-status-success .el-timeline-item__tail) {
    border-left-color: #67c23a !important;
  }

  /* 主要状态 - 蓝色连接线 */
  :deep(.timeline-status-running .el-timeline-item__tail) {
    border-left-color: #409eff !important;
  }

  /* 默认状态 - 灰色连接线 */
  :deep(.timeline-status-default .el-timeline-item__tail) {
    border-left-color: #e4e7ed !important;
  }

  /* 最后一个节点不需要连接线 */
  :deep(.el-timeline-item:last-child .el-timeline-item__tail) {
    display: none !important;
  }
  :deep(.el-timeline-item__tail) {
    left: 9px;
    transform: translateY(35px);
  }
  :deep(.el-timeline-item__center:first-child .el-timeline-item__tail) {
    height: 100% !important;
    top: 0 !important;
  }
}
</style>
