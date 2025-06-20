<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LinuxTitleBar from '@/components/LinuxTitleBar.vue';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

// 平台检测
const isLinuxPlatform = ref(false);

onMounted(() => {
  // 检测平台
  if (window.electronProcess?.platform === 'linux') {
    isLinuxPlatform.value = true;
  }
});
</script>

<template>
  <div
    class="eulercopilot-main"
    :style="{ height: '100vh' }"
  >
    <!-- Linux平台特定的标题栏，使用绝对定位 -->
    <LinuxTitleBar v-if="isLinuxPlatform" />

    <router-view />
  </div>
</template>

<style lang="scss" scoped>
.eulercopilot-main {
  background-color: var(--o-main-bg-color);
  width: 100% !important;
  height: 100% !important;
  position: relative;
}

.linux-with-titlebar {
  display: flex;
  flex-direction: column;

  :deep(router-view) {
    flex: 1;
  }
}
</style>
