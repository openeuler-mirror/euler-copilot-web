<script setup lang="ts">
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import DialogueView from 'src/views/dialogue/dialogueView.vue';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

// 监听路由变化，控制iframe内容的活动状态
watch(
  () => router.currentRoute.value.path,
  (newPath) => {
    const iframe = document.getElementById('my-iframe');
    const isWitchaindRoute = newPath === '/witchainD';
    if (!iframe) {
      console.warn('未找到iframe元素');
      return;
    }
    if (!iframe.contentWindow) {
      console.warn('iframe.contentWindow不可用');
      return;
    }
    const message = { StopActive: !isWitchaindRoute };
    // 向iframe发送消息，控制其活动状态 StopActive为false表示激活，为true表示停止
    let target = `${window.location.origin}/witchaind`;
    iframe.contentWindow.postMessage(message, target);
  },
  { immediate: true } // 初始化时也执行
);
</script>

<template>
  <div class="eulercopilot-main" :style="{ height: qiankunWindow.__POWERED_BY_QIANKUN__ ? '100%' : '100vh' }">
    <DialogueView />
  </div>
</template>
