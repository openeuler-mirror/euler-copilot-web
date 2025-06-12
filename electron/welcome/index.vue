<template>
  <div
    class="welcome-container"
    :style="{ backgroundImage: `url(${welcomeBgImage})` }"
  >
    <img class="close-btn" :src="closeIcon" alt="" @click="handleClose" />
    <div v-if="avtivePage === 'welcome'" class="welcome-page">
      <div class="welcome-title">
        {{ $t('welcome.welcomeText') }}
        <img :src="logoImage" alt="" />
      </div>
      <div class="welcome-detail-content">
        <div
          class="welcome-detail-content-item"
          :class="isLinux ? '' : 'item-disabled'"
          @click="handleLocalDeploy"
        >
          <img :src="localDeployIcon" alt="" />
          <span class="welcome-detail-content-item-text">
            {{ $t('welcome.localDeploy') }}
          </span>
        </div>
        <div class="welcome-detail-content-item" @click="handleOnlineService">
          <img :src="onlineServiceIcon" alt="" />
          <span class="welcome-detail-content-item-text">
            {{ $t('welcome.onlineService') }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="welcome-detail">
      <div v-if="avtivePage === 'localDeploy'" class="local-deploy">
        <localDeploy :back="handleBack" />
      </div>
      <div v-if="avtivePage === 'onlineService'" class="online-service">
        <OnlineService :back="handleBack" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Ref } from 'vue';
import 'element-plus/dist/index.css';
import logoImage from './assets/images/logo-euler-copilot.png';
import welcomeBgImage from './assets/images/welcome_bg.webp';
import localDeployIcon from './assets/svgs/local_deploy.svg';
import onlineServiceIcon from './assets/svgs/online_service.svg';
import closeIcon from './assets/svgs/close.svg';
import { ref, computed } from 'vue';
import OnlineService from './onlineService.vue';
import localDeploy from './localDeploy.vue';

type activePageType = 'localDeploy' | 'onlineService' | 'welcome';
const avtivePage: Ref<activePageType> = ref('welcome');

// 通过预加载脚本获取平台信息
const isLinux = computed(() => {
  return window.eulercopilotWelcome?.system?.platform === 'linux';
});

// 处理本地部署选择
const handleLocalDeploy = async () => {
  if (!isLinux.value) {
    return;
  }
  avtivePage.value = 'localDeploy';
};

// 处理在线服务选择
const handleOnlineService = async () => {
  avtivePage.value = 'onlineService';
};

const handleBack = () => {
  avtivePage.value = 'welcome';
};

const handleClose = async () => {
  try {
    await window.eulercopilotWelcome?.welcome.cancel();
  } catch (error) {
    console.error('完成欢迎流程失败:', error);
  }
};
</script>

<style lang="scss">
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
      justify-content: center;
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

      .item-disabled {
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
