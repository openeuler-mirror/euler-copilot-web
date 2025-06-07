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
        <span v-if="activity.type === 'running'">安装中</span>
      </el-card>
    </el-timeline-item>
  </el-timeline>
  <div class="submit-btn">
    <el-button v-if="allSuccess" type="primary" @click="handleFinish">
      完成
    </el-button>
    <el-button v-else-if="hasFailed" type="primary" @click="handleRetry">
      重试
    </el-button>
    <el-button v-else type="primary" @click="handleStop">停止安装</el-button>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import successIcon from './assets/svgs/success.svg';
import failedIcon from './assets/svgs/error.svg';
import loadingIcon from './assets/svgs/upload-loading.svg';

const activities: any[] = [
  {
    content: '数据库服务',
    type: 'running',
  },
  {
    content: 'AuthHub 服务',
    // type: 'success',
  },
  {
    content: 'Intelligence 服务',
    // type: 'failed',
  },
  {
    content: '配置文件初始化 & 服务启动',
    // type: 'success',
  },
];

// 计算属性：检查是否所有活动都成功
const allSuccess = computed(() => {
  return activities.every((activity) => activity.status === 'success');
});

// 计算属性：检查是否存在失败的活动
const hasFailed = computed(() => {
  return activities.some((activity) => activity.status === 'failed');
});

const handleStop = () => {};
const handleRetry = () => {};
const handleFinish = () => {};
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

  /* 危险状态 - 红色连接线 */
  :deep(.timeline-status-failed .el-timeline-item__tail) {
    border-left-color: #f56c6c !important;
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
