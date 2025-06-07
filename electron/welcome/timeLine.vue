<template>
  <el-timeline style="max-width: 600px; max-height: 500px">
    <el-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      center
    >
      <template #dot>
        <img v-if="activity.type === 'running'" :src="loadingIcon" alt="" class="running-img" />
        <img
          v-else-if="activity.type === 'success'"
          :src="successIcon"
          alt=""
        />
        <img v-else-if="activity.type === 'failed'" :src="failedIcon" alt="" />
        <div v-else class="dot"></div>
      </template>
      <el-card :class="{
        'running-card':activity.type === 'running',
        'success-card':activity.type === 'success',
        'failed-card':activity.type === 'failed',
      }" >
        {{ activity.content }}
        <span v-if="activity.type === 'running'">安装中</span>
      </el-card>
    </el-timeline-item>
  </el-timeline>
</template>
<script lang="ts" setup>
import successIcon from './assets/svgs/success.svg';
import failedIcon from './assets/svgs/error.svg';
import loadingIcon from './assets/svgs/upload-loading.svg';

const activities: any[] = [
  {
    content: '数据服务',
    type: 'running',
  },
  {
    content: 'authhub 服务',
    type: 'success',
  },
  {
    content: 'intelligence 服务',
    type: 'failed',
  },
  {
    content: '配置文件初始化&服务器启动成功',
  },
];
</script>

<style lang="scss">
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
        background-color: rgb(99,149,253);
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
      .running-card{
        background-color: rgba(99,149,253,0.1);
        color: rgb(99,149,253);
      }
      .success-card{
        background-color: rgba(42,169,86,0.1);
        color: rgb(36,171,54);
      }
      .failed-card{
        background-color: rgba(277,32,32,0.1);
        color: rgb(277,32,32);
      }
      .el-card.is-always-shadow {
        box-shadow: none;
      }
      .el-timeline-item__timestamp.is-bottom {
        margin-top: 0;
      }
    }
  }
}
</style>
