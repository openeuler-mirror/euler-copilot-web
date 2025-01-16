<script setup lang="ts">
import { RouterView } from 'vue-router';
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
</script>

<template>
  <div class="eulercopilot-main" :style="{ height: qiankunWindow.__POWERED_BY_QIANKUN__ ? '100%' : '100vh' }">
    <RouterView />
  </div>
</template>

<style></style>
