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
        @load="handleIframeLoad"
        @error="handleIframeError"
      ></iframe>
    </div>
  </KeepAlive>
</template>

<script setup lang="ts">
import { watch, onMounted, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getBaseUrl } from 'src/utils/tools';

const router = useRouter();
const iframeRef = ref<HTMLIFrameElement | null>(null);
const isActive = ref(false);
const isIframeLoaded = ref(false);
const iframeTarget = ref<string>('');

// 生产环境URL处理
async function getIframeTarget() {
  const baseUrl = await getBaseUrl();
  const origin = window.location.origin;
  // Electron 环境的判断
  const isElectron = window.navigator.userAgent.includes('Electron');  
  let pathname = router.currentRoute.value.name?.toLowerCase();
  console.log(pathname)
  let target = '';
  if (pathname === 'witchaind') { 
      target = isElectron ? `${baseUrl}/witchaind` : `${origin}/witchaind`; 
  } else if (pathname === 'deepinsight') { 
      target = isElectron ? `${baseUrl}/deepinsight` : `${origin}/deepinsight`; 
  }
  console.log(target); 
  return target;
}

// 处理iframe加载完成事件
const handleIframeLoad = () => {
  isIframeLoaded.value = true;
  if (isActive.value) {
    sendMessageToIframe(false);
  }
  const token = localStorage.getItem('ECSESSION') ?? '';
  sendTokenToIframe(token);
};

// 处理iframe错误
const handleIframeError = (error: Event) => {
  console.error('iframe loading error:', error);
  // 可以在这里添加重试逻辑
};

// 发送消息到iframe
const sendMessageToIframe = async (stopActive: boolean) => {
  const iframe = iframeRef.value;
  if (!iframe?.contentWindow) {
    return;
  }

  try {
    const language = localStorage.getItem('localeLang');
    const message = { StopActive: stopActive, type: 'changeActive' };
    iframe.contentWindow.postMessage(
      { ...message, lang: language },
      iframeTarget.value,
    );
  } catch (error) {
    console.error('send Message to iframe error:', error);
  }
};

const sendTokenToIframe = async (token: string) => {
  const iframe = iframeRef.value;
  if (!iframe?.contentWindow) {
    return;
  }
  if (token) {
    const data = { parentToken: token, type: 'parentToken' };
    iframe.contentWindow.postMessage(data, iframeTarget.value);
  }
};

// 监听路由变化来控制iframe的活动状态
watch(
  () => router.currentRoute.value.path,
  async (newPath) => {
    const isWitchaindRoute = newPath === '/witchainD' || newPath === '/deepinsight';
    isActive.value = isWitchaindRoute;

    // 等待DOM更新完成
    await nextTick();
    if (isIframeLoaded.value && iframeTarget.value) {
      sendMessageToIframe(!isWitchaindRoute);
      const token = localStorage.getItem('ECSESSION') ?? '';
      sendTokenToIframe(token);
    }
  },
  { immediate: true },
);

// 添加错误处理
onMounted(async () => {
  iframeTarget.value = await getIframeTarget();
  const iframe = iframeRef.value;
  if (iframe) {
    iframe.onerror = (error) => {
      console.error('iframe loading error:', error);
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
