<template>
  <div
    class="welcome-container"
    :style="{ backgroundImage: `url(${welcomeBgImage})` }"
  >
    <img class="close-btn" :src="closeIcon" alt="" @click="handleClose" />
    <div v-if="avtivePage === 'welcome'" class="welcome-page">
      <div class="welcome-title">
        欢迎使用
        <img :src="logoImage" alt="" />
      </div>
      <div class="welcome-detail-content">
        <div class="welcome-detail-content-item" :class = "isLinux?'':'item-disabled'" @click="handleLocalDeploy">
          <img :src="localDeployIcon" alt="" />
          <span class="welcome-detail-content-item-text">后端本地部署</span>
        </div>
        <div class="welcome-detail-content-item" @click="handleOnlineService">
          <img :src="onlineServiceIcon" alt="" />
          <span class="welcome-detail-content-item-text">后端在线服务</span>
        </div>
      </div>
    </div>
    <div v-else class="welcome-detail">
      <div class="welcome-detail-title">
        <div @click="handleBack" class="back-btn">
          <img :src="leftArrowIcon" alt="" />
          <span class="back-btn-text">返回</span>
        </div>
        <span class="divider"></span>
        <div class="welcome-detail-title-text">
          {{ avtivePage === 'localDeploy' ? '后端本地部署' : '后端在线服务' }}
        </div>
      </div>
      <div v-if="avtivePage === 'localDeploy'" class="local-deploy">
        <localDeploy />
      </div>
      <div v-if="avtivePage === 'onlineService'" class="online-service">
        <OnlineService />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, Ref } from 'vue';
import 'element-plus/dist/index.css';
import logoImage from './assets/images/logo-euler-copilot.png';
import welcomeBgImage from './assets/images/welcome_bg.webp';
import localDeployIcon from './assets/svgs/local_deploy.svg';
import onlineServiceIcon from './assets/svgs/online_service.svg';
import closeIcon from './assets/svgs/close.svg';
import leftArrowIcon from './assets/svgs/left_arrow.svg';
import { ref } from 'vue';
import OnlineService from './onlineService.vue';
import localDeploy from './localDeploy.vue';

type activePageType = 'localDeploy' | 'onlineService' | 'welcome';
const avtivePage: Ref<activePageType> = ref('welcome');
  const platform = ref<'linux' | 'darwin' | 'windows' | 'unknown'>('unknown');

onMounted(() => {
  if (window.eulercopilotWelcome && window.eulercopilotWelcome.system) {
    platform.value = window.eulercopilotWelcome.system.platform as 'linux' | 'darwin'| 'unknown';
  } else {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Linux')) platform.value = 'linux';
    else if (userAgent.includes('Mac')) platform.value = 'darwin';
  }
  console.log('系统平台:', platform.value);
});

const isLinux = computed(() => ['linux', 'darwin'].includes(platform.value));
// 处理本地部署选择
const handleLocalDeploy = async () => {
  if(!isLinux.value){
    return;
  }
  console.log('选择本地部署');
  avtivePage.value = 'localDeploy';
};

// 处理在线服务选择
const handleOnlineService = async () => {
  console.log('选择在线服务');
  avtivePage.value = 'onlineService';
};

const handleBack = () => {
  console.log('返回到欢迎页面');
  avtivePage.value = 'welcome';
};

const handleClose = async () => {
  console.log('关闭欢迎页面');
  try {
    await window.eulercopilotWelcome?.welcome.cancel();
  } catch (error) {
    console.error('完成欢迎流程失败:', error);
  }
};

onMounted(() => {
  console.log('欢迎页面已加载');
});
</script>

<style lang="scss" scoped>
.welcome-container {
  height: 100vh;
  font-size: 24px;
  color: #333;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  .close-btn {
    position: absolute;
    right: 24px;
    top: 28px;
    cursor: pointer;
  }

  .welcome-page {
    .welcome-title {
      display: flex;
      text-align: center;
      font-size: 28px;
      font-weight: 700;
      line-height: 36px;
      font-family: 'HarmonyOS Sans SC';
      margin-bottom: 72px;

      img {
        width: 330px;
      }
    }

    .welcome-detail-content {
      display: flex;
      justify-content: center;
      gap: 24px;

      .welcome-detail-content-item {
        border-radius: 16px;
        background-color: rgba(255, 255, 255, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 270px;
        height: 214px;
        cursor: pointer;

        &:hover:not(.item-disabled) {
          border: 2px solid rgb(99, 149, 253);
          width: 266px;
          height: 210px;
        }

        img {
          margin-bottom: 32px;
          width: 72px;
        }

        .welcome-detail-content-item-text {
          font-weight: 700;
          font-family: 'HarmonyOS  Sans SC';
          font-size: 20px;
          line-height: 30px;
        }
      }

      .item-disabled{
        background-color: rgba(212, 212, 212, 0.7);
        cursor: not-allowed !important;
        
      }
    }
  }

  .welcome-detail {
    width: 100vw;
    height: 100vh;
    background-color: #ffffffee;

    .welcome-detail-title {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin: 24px 0 24px 24px;

      .back-btn {
        cursor: pointer;
        display: flex;
        align-items: center;
        img {
          width: 16px;
          height: 16px;
          margin-right: 5px;
        }
        .back-btn-text {
          color: rgb(78, 88, 101);
          font-size: 14px;
          font-family: 'HarmonyOS Sans SC';
          line-height: 24px;
        }
      }
      .divider {
        display: inline-block;
        width: 1px;
        height: 16px;
        background-color: rgb(233, 229, 239);
        margin: 0 8px;
      }
      .welcome-detail-title-text {
        font-size: 16px;
        line-height: 24px;
        font-weight: 500;
        font-family: 'HarmonyOS Sans SC';
      }
    }
  }
}
</style>
