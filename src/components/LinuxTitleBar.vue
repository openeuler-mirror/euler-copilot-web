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
const overlayRef = ref<HTMLElement | null>(null);

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

// 更新窗口最大化状态并设置CSS类
const updateMaximizedState = (maximized: boolean) => {
  isMaximized.value = maximized;

  // 设置或移除窗口最大化的CSS类
  if (maximized) {
    document.documentElement.classList.add('window-maximized');
  } else {
    document.documentElement.classList.remove('window-maximized');
  }

  console.log('Window maximized state:', maximized);
};

// 创建固定的窗口控制按钮
const createWindowControls = () => {
  // 移除可能已存在的控制按钮
  const existingOverlay = document.getElementById('linux-titlebar-overlay');
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
  }

  // 创建新的覆盖层
  const overlay = document.createElement('div');
  overlay.id = 'linux-titlebar-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    padding: 12px;
    width: 120px;
    height: 48px;
    z-index: 9999999;
    pointer-events: auto;
    -webkit-app-region: no-drag;
    display: flex;
    justify-content: flex-end;
  `;

  // 创建最小化按钮
  const minimizeBtn = document.createElement('button');
  minimizeBtn.className = 'linux-control-button minimize';
  minimizeBtn.title = '最小化';
  minimizeBtn.style.cssText = buttonBaseStyle;
  minimizeBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <rect width="10" height="1" x="1" y="5.5" fill="currentColor" />
    </svg>
  `;
  minimizeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendWindowControlCommand('minimize');
  });

  // 创建最大化按钮
  const maximizeBtn = document.createElement('button');
  maximizeBtn.className = 'linux-control-button maximize';
  maximizeBtn.title = isMaximized.value ? '还原' : '最大化';
  maximizeBtn.style.cssText = buttonBaseStyle;
  maximizeBtn.innerHTML = isMaximized.value
    ? `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path fill="none" stroke="currentColor" d="M3.5,3.5v5h5v-5H3.5z M2.5,2.5h7v7h-7V2.5z" />
    </svg>
  `
    : `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" />
    </svg>
  `;
  maximizeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendWindowControlCommand('maximize');
  });

  // 创建关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.className = 'linux-control-button close';
  closeBtn.title = '关闭';
  closeBtn.style.cssText = buttonBaseStyle;
  closeBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path d="M2.5,2.5 L9.5,9.5 M2.5,9.5 L9.5,2.5" stroke="currentColor" stroke-width="1.5" fill="none" />
    </svg>
  `;
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendWindowControlCommand('close');
  });

  // 添加鼠标悬停效果
  const addHoverEffects = (button, isCloseButton = false) => {
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = isCloseButton
        ? '#e81123'
        : 'rgba(128, 128, 128, 0.2)';
      if (isCloseButton) button.style.color = 'white';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
      if (isCloseButton) button.style.color = 'inherit';
    });
  };

  addHoverEffects(minimizeBtn);
  addHoverEffects(maximizeBtn);
  addHoverEffects(closeBtn, true);

  // 添加按钮到覆盖层
  overlay.appendChild(minimizeBtn);
  overlay.appendChild(maximizeBtn);
  overlay.appendChild(closeBtn);

  // 添加覆盖层到文档
  document.body.appendChild(overlay);

  // 保存引用以便之后可以更新
  overlayRef.value = overlay;
};

// 更新最大化按钮的图标
const updateMaximizeButton = () => {
  if (!overlayRef.value) return;

  const maximizeBtn = overlayRef.value.querySelector(
    '.linux-control-button.maximize',
  ) as HTMLButtonElement;
  if (!maximizeBtn) return;

  maximizeBtn.title = isMaximized.value ? '还原' : '最大化';
  maximizeBtn.innerHTML = isMaximized.value
    ? `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path fill="none" stroke="currentColor" d="M3.5,3.5v5h5v-5H3.5z M2.5,2.5h7v7h-7V2.5z" />
    </svg>
  `
    : `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" />
    </svg>
  `;
};

// 按钮基础样式
const buttonBaseStyle = `
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  cursor: pointer;
  border-radius: 12px;
  margin-left: 8px;
  background-color: rgba(128, 128, 128, 0.1);
  color: inherit;
  padding: 0;
`;

// 监听主题变化
watch(
  () => themeStore.theme,
  (newTheme) => {
    console.log('Theme changed to:', newTheme);
  },
  { immediate: true },
);

// 监听窗口最大化状态变化
watch(
  () => isMaximized.value,
  () => {
    updateMaximizeButton();
  },
);

// 组件挂载时创建控制按钮
onMounted(() => {
  console.log('LinuxTitleBar mounted');

  // 监听窗口最大化状态变化事件
  if (window.eulercopilot && window.eulercopilot.ipcRenderer) {
    // 首先获取当前窗口是否已经最大化
    window.eulercopilot.ipcRenderer
      .invoke('copilot:window-is-maximized')
      .then((maximized) => {
        updateMaximizedState(maximized);

        // 创建控制按钮
        createWindowControls();
      })
      .catch((error) => {
        console.error('Failed to get window maximized state:', error);

        // 即使获取状态失败也创建控制按钮
        createWindowControls();
      });

    // 监听窗口最大化状态变化
    window.eulercopilot.ipcRenderer.on(
      'window-maximized-change',
      (maximized) => {
        console.log('Window maximized state changed:', maximized);
        updateMaximizedState(maximized);
      },
    );
  } else {
    // 如果没有IPC通道，仍然创建控制按钮
    createWindowControls();
  }
});

// 组件卸载时移除事件监听器和覆盖层
onBeforeUnmount(() => {
  if (window.eulercopilot && window.eulercopilot.ipcRenderer) {
    window.eulercopilot.ipcRenderer.removeAllListeners(
      'window-maximized-change',
    );
  }

  // 移除覆盖层
  const overlay = document.getElementById('linux-titlebar-overlay');
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
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
/* 全局样式，确保按钮在所有状态下都能显示 */
#linux-titlebar-overlay {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  z-index: 9999999 !important;
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
</style>
