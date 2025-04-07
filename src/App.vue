<script setup lang="ts">
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
</script>

<template>
  <div
    class="eulercopilot-main"
    :style="{ height: qiankunWindow.__POWERED_BY_QIANKUN__ ? '100%' : '100vh' }"
  >
    <router-view />
  </div>
</template>

<style lang="scss" scoped>
.eulercopilot-main {
  width: 100vw;
  height: 100vh;
}
</style>
