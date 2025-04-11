<template>
  <div class="linux-titlebar-container" :class="{ 'dark-theme': isDarkTheme }">
    <div class="window-controls">
      <button
        class="control-button minimize"
        @mousedown.stop.prevent="handleMinimize"
        @click.stop.prevent="handleMinimize"
        title="最小化"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect width="10" height="1" x="1" y="5.5" fill="currentColor" />
        </svg>
      </button>
      <button
        class="control-button maximize"
        @mousedown.stop.prevent="handleMaximize"
        @click.stop.prevent="handleMaximize"
        :title="isMaximized ? '还原' : '最大化'"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" v-if="isMaximized">
          <path
            fill="none"
            stroke="currentColor"
            d="M3.5,3.5v5h5v-5H3.5z M2.5,2.5h7v7h-7V2.5z"
          />
        </svg>
        <svg width="12" height="12" viewBox="0 0 12 12" v-else>
          <rect
            width="9"
            height="9"
            x="1.5"
            y="1.5"
            fill="none"
            stroke="currentColor"
          />
        </svg>
      </button>
      <button
        class="control-button close"
        @mousedown.stop.prevent="handleClose"
        @click.stop.prevent="handleClose"
        title="关闭"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path
            d="M2.5,2.5 L9.5,9.5 M2.5,9.5 L9.5,2.5"
            stroke="currentColor"
            stroke-width="1.5"
            fill="none"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useChangeThemeStore } from '@/store/conversation';

const isMaximized = ref(false);
const themeStore = useChangeThemeStore();

// 动态监听主题变化
const isDarkTheme = computed(() => themeStore.theme === 'dark');

// 窗口控制操作 - 修复通道名称和事件处理
const handleMinimize = (e) => {
  e.stopPropagation();
  e.preventDefault();
  console.log('Minimize window');
  sendWindowControlCommand('minimize');
};

const handleMaximize = (e) => {
  e.stopPropagation();
  e.preventDefault();
  console.log('Maximize/restore window');
  sendWindowControlCommand('maximize');
};

const handleClose = (e) => {
  e.stopPropagation();
  e.preventDefault();
  console.log('Close window');
  sendWindowControlCommand('close');
};

// 封装发送窗口控制命令 - 使用正确的IPC通道名
const sendWindowControlCommand = (command) => {
  if (window.eulercopilot && window.eulercopilot.ipcRenderer) {
    window.eulercopilot.ipcRenderer.invoke('copilot:window-control', command);
  } else {
    // 打印错误信息，无法发送窗口控制命令
    console.error('No IPC method available for window control');
  }
};

// 监听主题变化
watch(
  () => themeStore.theme,
  (newTheme) => {
    console.log('Theme changed to:', newTheme);
  },
  { immediate: true },
);

// 组件挂载时在Document上直接添加一个覆盖层用于捕获事件
onMounted(() => {
  console.log('LinuxTitleBar mounted');

  // 创建一个DOM覆盖层，直接添加到body上
  setTimeout(() => {
    // 延迟添加以确保Vue已完成渲染
    const overlay = document.createElement('div');
    overlay.className = 'linux-titlebar-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      padding: 12px;
      width: 120px;
      height: 48px;
      z-index: 999999;
      pointer-events: auto;
      -webkit-app-region: no-drag;
    `;
    document.body.appendChild(overlay);

    // 将控制按钮复制到这个覆盖层
    const controls = document.querySelector('.window-controls');
    if (controls) {
      const clonedControls = controls.cloneNode(true);
      overlay.appendChild(clonedControls);

      // 添加事件监听器到克隆的按钮
      const buttons = overlay.querySelectorAll('button');
      buttons[0].addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        sendWindowControlCommand('minimize');
      });
      buttons[1].addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        sendWindowControlCommand('maximize');
      });
      buttons[2].addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        sendWindowControlCommand('close');
      });
    }
  }, 1000);
});
</script>

<style lang="scss" scoped>
.linux-titlebar-container {
  -webkit-app-region: no-drag;
  position: fixed;
  top: 0;
  right: 0;
  padding: 12px;
  z-index: 100000;
  pointer-events: auto;
  visibility: hidden; /* 隐藏原始控件，使用DOM覆盖层代替 */
}

.window-controls {
  position: relative;
  display: flex;
}

.control-button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  cursor: pointer !important;
  border-radius: 12px;
  margin-left: 8px;
  pointer-events: auto;
  position: relative;

  background-color: rgba($color: grey, $alpha: 0.1);
  color: var(--o-text-color-secondary);

  &:hover {
    background-color: rgba($color: grey, $alpha: 0.2);
    color: var(--o-text-color-primary);
  }

  &.close:hover {
    background-color: #e81123;
    color: white;
  }
}
</style>

<style>
/* 全局样式，确保覆盖层按钮有正确的样式 */
.linux-titlebar-overlay .control-button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  cursor: pointer !important;
  border-radius: 12px;
  margin-left: 8px;
  background-color: rgba(128, 128, 128, 0.1);
  color: inherit;
}

.linux-titlebar-overlay .control-button:hover {
  background-color: rgba(128, 128, 128, 0.2);
}

.linux-titlebar-overlay .control-button.close:hover {
  background-color: #e81123;
  color: white;
}
</style>
