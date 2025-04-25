<template>
  <KeepAlive>
    <div class="container" v-show="isActive">
      <iframe
        id="my-iframe"
        ref="iframeRef"
        frameborder="0"
        sandbox="allow-scripts allow-popups allow-same-origin allow-downloads"
        height="100%"
        width="100%"
        :src="iframeTarget"
        @load="handleIframeLoad"
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
const isActive = ref(false);
const isIframeLoaded = ref(false);

// 生产环境URL处理
const iframeTarget = (() => {
  const origin = window.location.origin;
  const isLocalhost = origin.includes('localhost');
  const target = isLocalhost ? 'http://localhost:3002' : `${origin}/witchaind`;
  return target;
})();

// 处理iframe加载完成事件
const handleIframeLoad = () => {
  isIframeLoaded.value = true;
  if (isActive.value) {
    sendMessageToIframe(false);
  }
};

// 处理iframe错误
const handleIframeError = (error: Event) => {
  console.error('iframe加载错误:', error);
  // 可以在这里添加重试逻辑
};

// 发送消息到iframe
const sendMessageToIframe = (stopActive: boolean) => {
  const iframe = iframeRef.value;
  if (!iframe?.contentWindow) {
    return;
  }
  
  try {
    const language = localStorage.getItem('localeLang');
    const message = { StopActive: stopActive };
    iframe.contentWindow.postMessage({...message,lang:language}, iframeTarget);
  } catch (error) {
    console.error('发送消息到iframe失败:', error);
  }
};

// 监听路由变化来控制iframe的活动状态
watch(
  () => router.currentRoute.value.path,
  async (newPath) => {
    const isWitchaindRoute = newPath === '/witchainD';
    isActive.value = isWitchaindRoute;
    
    // 等待DOM更新完成
    await nextTick();
    
    if (isIframeLoaded.value) {
      sendMessageToIframe(!isWitchaindRoute);
    }
  },
  { immediate: true }
);

// 添加错误处理
onMounted(() => {
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