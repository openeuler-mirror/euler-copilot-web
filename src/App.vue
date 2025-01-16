<script setup lang="ts">
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import DialogueView from 'src/views/dialogue/dialogueView.vue';
</script>

<template>
  <div class="eulercopilot-main" :style="{ height: qiankunWindow.__POWERED_BY_QIANKUN__ ? '100%' : '100vh' }">
    <DialogueView />
  </div>
</template>

<style></style>
