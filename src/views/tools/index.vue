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
        :src="iframeTarget"
        @error="handleIframeError"
      ></iframe>
    </div>
  </KeepAlive>
</template>

<script setup lang="ts">
import { watch, onMounted, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const iframeRef = ref<HTMLIFrameElement | null>(null);

// 生产环境URL处理
const iframeTarget = (() => {
  const origin = window.location.origin;
  const target = origin.includes('localhost') ? 'http://localhost:3002/witchaind/' : `${origin}/witchaind/`;
  console.log('iframe target URL:', target);
  return target;
})();

// 处理iframe错误
const handleIframeError = (error: Event) => {
  console.error('iframe加载错误:', error);
};

// 发送消息到iframe
const sendMessageToIframe = (stopActive: boolean) => {
  const iframe = iframeRef.value;
  if (!iframe?.contentWindow) {
    console.warn('iframe或contentWindow不可用，当前状态:', {
      iframeExists: !!iframe,
      hasContentWindow: !!iframe?.contentWindow
    });
    return;
  }
  console.log('iframe?.contentWindow----',iframe?.contentWindow)
  
  try {
    const message = { StopActive: stopActive };
    console.log('发送消息到iframe:', message);
    iframe.contentWindow.postMessage(message, iframeTarget);
  } catch (error) {
    console.error('发送消息到iframe失败:', error);
  }
};

// 监听路由变化来控制iframe的活动状态
watch(
  () => router.currentRoute.value.path,
  async (newPath) => {
    console.log('路由变化:', newPath);
    const isWitchaindRoute = newPath === '/witchainD';
    
    // 等待DOM更新完成
    await nextTick();

    setTimeout(() => {
      sendMessageToIframe(!isWitchaindRoute);
    },300)
    
  },
  { immediate: true }
);

// 添加错误处理
onMounted(() => {
  console.log('组件挂载完成');
  const iframe = iframeRef.value;
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