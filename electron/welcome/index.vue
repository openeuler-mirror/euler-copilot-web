<template>
  <div
    class="welcome-container"
    :style="{ backgroundImage: `url(${welcomeBgImage})` }"
  >
    <div class="welcome-title">
      欢迎使用
      <img :src="logoImage" alt="" />
    </div>
    <div class="welcome-content">
      <div class="welcome-content-item" @click="handleLocalDeploy">
        <img :src="localDeployIcon" alt="" />
        后端本地部署
      </div>
      <div class="welcome-content-item" @click="handleOnlineService">
        <img :src="onlineServiceIcon" alt="" />
        后端在线服务
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import logoImage from './assets/images/logo-euler-copilot.png';
import welcomeBgImage from './assets/images/welcome_bg.webp';
import localDeployIcon from './assets/svgs/local_deploy.svg';
import onlineServiceIcon from './assets/svgs/online_service.svg';

// 处理本地部署选择
const handleLocalDeploy = async () => {
  console.log('选择本地部署');
  try {
    await window.eulercopilotWelcome?.welcome.complete();
  } catch (error) {
    console.error('完成欢迎流程失败:', error);
  }
};

// 处理在线服务选择
const handleOnlineService = async () => {
  console.log('选择在线服务');
  try {
    await window.eulercopilotWelcome?.welcome.complete();
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
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 24px;
  color: #333;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  flex-direction: column;

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

  .welcome-content {
    display: flex;
    justify-content: center;
    gap: 24px;

    .welcome-content-item {
      padding: 48px 75px 32px;
      border-radius: 16px;
      background-color: rgba(255, 255, 255, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.9);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      img {
        margin-bottom: 32px;
        width: 72px;
      }
    }
  }
}
</style>
