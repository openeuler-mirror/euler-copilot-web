<template>
  <!-- 简化后的容器，实际按钮通过JavaScript动态创建 -->
  <div class="linux-titlebar-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';

// 窗口控制按钮图标定义
const windowControlIcons = {
  minimize: `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <rect width="10" height="1" x="1" y="5.5" fill="currentColor" />
    </svg>
  `,
  maximize: `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" />
    </svg>
  `,
  restore: `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path fill="none" stroke="currentColor" d="M 1.5 10.5 L 8.5 10.5 L 8.5 3.5 L 1.5 3.5 Z"/>
      <path fill="none" stroke="currentColor" d="M 3.5 1 L 3.5 3.5"/>
      <path fill="none" stroke="currentColor" d="M 3 1.5 L 11 1.5"/>
      <path fill="none" stroke="currentColor" d="M 10.5 1 L 10.5 9"/>
      <path fill="none" stroke="currentColor" d="M 8.5 8.5 L 11 8.5"/>
    </svg>
  `,
  close: `
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path d="M2,2 L10,10 M2,10 L10,2" stroke="currentColor" stroke-width="1.75" fill="none" />
    </svg>
  `,
};

const isMaximized = ref(false);
const overlayRef = ref<HTMLElement | null>(null);

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
};

// 更新覆盖层位置
const updateOverlayPosition = (overlay) => {
  if (isMaximized.value) {
    overlay.style.top = '0';
    overlay.style.right = '0';
  } else {
    overlay.style.top = '16px';
    overlay.style.right = '16px';
  }
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
    pointer-events: auto;
    -webkit-app-region: no-drag;
    display: flex;
    justify-content: flex-end;
  `;

  // 根据当前窗口状态调整位置
  updateOverlayPosition(overlay);

  // 创建最小化按钮
  const minimizeBtn = document.createElement('button');
  minimizeBtn.className = 'linux-control-button minimize';
  minimizeBtn.title = '最小化';
  minimizeBtn.style.cssText = buttonBaseStyle;
  minimizeBtn.innerHTML = windowControlIcons.minimize;
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
    ? windowControlIcons.restore
    : windowControlIcons.maximize;
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
  closeBtn.innerHTML = windowControlIcons.close;
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
      button.style.color = isCloseButton
        ? 'white'
        : 'var(--o-text-color-primary)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
      button.style.color = 'var(--o-text-color-secondary)';
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
    ? windowControlIcons.restore
    : windowControlIcons.maximize;
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
  color: var(--o-text-color-secondary);
  padding: 0;
`;

// 监听窗口最大化状态变化
watch(
  () => isMaximized.value,
  () => {
    updateMaximizeButton();
    if (overlayRef.value) {
      updateOverlayPosition(overlayRef.value);
    }
  },
);

// 组件挂载时创建控制按钮
onMounted(() => {
  // 初始化窗口控制按钮，无论 IPC 是否可用
  const initWindowControls = async () => {
    try {
      // 如果 IPC 可用，先获取窗口状态
      if (window.eulercopilot && window.eulercopilot.ipcRenderer) {
        const maximized = await window.eulercopilot.ipcRenderer
          .invoke('copilot:window-is-maximized')
          .catch(() => false); // 获取失败时默认为非最大化状态

        // 更新窗口最大化状态
        updateMaximizedState(maximized);

        // 监听窗口最大化状态变化
        window.eulercopilot.ipcRenderer.on(
          'window-maximized-change',
          (maximized) => {
            updateMaximizedState(maximized);
          },
        );
      }
    } catch (error) {
      console.error('Failed to initialize window controls:', error);
    } finally {
      // 无论状态获取成功与否，都创建控制按钮
      createWindowControls();
    }
  };

  // 执行初始化
  initWindowControls();
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
  position: fixed;
  top: 0;
  right: 0;
  padding: 12px;
  visibility: hidden; /* 隐藏原始控件，使用DOM覆盖层代替 */
}
</style>

<style>
/* 全局样式，确保按钮在所有状态下都能显示 */
#linux-titlebar-overlay {
  position: fixed !important;
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  transition:
    right 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    top 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
</style>
