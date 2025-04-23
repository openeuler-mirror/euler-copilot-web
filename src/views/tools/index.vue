<template>
  <KeepAlive>
    <div class="container">
      <iframe
        id="my-iframe"
        ref="iframeRef"
        frameborder="0"
        sandbox="allow-scripts allow-popups allow-same-origin allow-downloads"
        height="100%"
        width="100%"
      ></iframe>
    </div>
  </KeepAlive>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const iframeTarget = window.location.origin.includes('localhost')
  ? 'http://localhost:3002'  // 移除了/witchaind，与dialogueView.vue保持一致
  : `${window.location.origin}/witchaind`;

// 监听路由变化来控制iframe的活动状态
watch(
  () => router.currentRoute.value.path,
  (newPath) => {
    const iframe = document.getElementById('my-iframe');
    const isWitchaindRoute = newPath === '/witchainD';
    
    if (!iframe?.contentWindow) {
      console.warn('iframe或contentWindow不可用');
      return;
    }

    // 如果是切换回WitchainD路由，确保iframe已经加载
    if (isWitchaindRoute) {
      // 如果iframe的src为空，重新设置src
      if (!iframe.src) {
        iframe.src = iframeTarget;
      }
      // 使用setTimeout确保iframe已经准备好接收消息
      setTimeout(() => {
        const message = { StopActive: false };
        iframe.contentWindow?.postMessage(message, iframeTarget);
      }, 100);
    } else {
      const message = { StopActive: true };
      iframe.contentWindow?.postMessage(message, iframeTarget);
    }
  },
  { immediate: true }
);

// 添加错误处理
onMounted(() => {
  const iframe = document.getElementById('my-iframe');
  if (iframe) {
    iframe.onerror = (error) => {
      console.error('iframe加载失败:', error);
    };
  }
});
</script>

<style scoped>
.container {
  width: 100%;
  height: calc(100vh - 48px);
  margin: 0;
  padding: 0;
}
</style>