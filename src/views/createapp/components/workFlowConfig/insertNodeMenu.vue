<template>
  <!-- 插入节点选择菜单 -->
  <div
    v-if="visible"
    class="insert-node-menu-overlay"
    @click="handleClose"
  >
    <div
      class="insert-node-menu"
      :class="`menu-${menuDirection}`"
      :style="menuStyle"
      @click.stop
    >
      <div class="menu-header">
        <span>{{ $t('common.search') }}{{ $t('flow.nodes') }}</span>
        <div class="close-btn" @click="handleClose">×</div>
      </div>
      
      <!-- 使用公共的节点选择器组件 -->
      <div class="menu-content">
        <NodeSelector
          :api-service-list="apiServiceList"
          :exclude-node-types="excludeNodeTypes"
          :extra-node-types="extraNodeTypes"
          :search-placeholder="$t('common.search') + $t('flow.nodes') + '...'"
          :enable-drag="false"
          :reset-tab-on-show="visible"
          @node-click="handleSelectNode"
          @plugin-click="handleSelectPlugin"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import NodeSelector from './NodeSelector.vue';

// Props
interface Props {
  visible: boolean;
  position: { x: number; y: number };
  menuDirection: 'left' | 'right';
  apiServiceList: any[];
  excludeNodeTypes?: string[]; // 新增：排除的节点类型列表
  extraNodeTypes?: any[]; // 新增：额外的节点类型列表
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  position: () => ({ x: 0, y: 0 }),
  menuDirection: 'right',
  apiServiceList: () => [],
  excludeNodeTypes: () => [], // 默认不排除任何节点类型
  extraNodeTypes: () => [] // 默认没有额外节点类型
});

// Emits
interface Emits {
  (e: 'close'): void;
  (e: 'selectNode', node: any): void;
  (e: 'selectPlugin', plugin: any): void;
}

const emit = defineEmits<Emits>();

// 响应式数据已移动到NodeSelector组件中

// 计算菜单样式，包含边界检测
const menuStyle = computed(() => {
  const { x, y } = props.position;
  
  // 获取Vue Flow容器的位置信息，将相对坐标转换为绝对坐标
  const vueFlowElement = document.querySelector('.vue-flow__viewport');
  const containerRect = vueFlowElement?.getBoundingClientRect();
  
  let absoluteX = x;
  let absoluteY = y;
  
  // 如果找到了Vue Flow容器，将相对坐标转换为绝对坐标
  if (containerRect) {
    absoluteX = x + containerRect.left;
    absoluteY = y + containerRect.top;
  }
  
  const menuWidth = 400; // 菜单最大宽度
  const menuHeight = 600; // 菜单预估最大高度
  const padding = 20; // 距离边界的安全距离
  
  // 获取视口尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = absoluteX;
  let top = absoluteY;
  let transformX = '0';
  let transformY = '-50%';
  
  // 水平位置调整
  if (props.menuDirection === 'right') {
    // 检查右侧是否有足够空间
    if (absoluteX + menuWidth + padding > viewportWidth) {
      // 右侧空间不足，菜单显示在点击位置左侧
      transformX = '-100%';
      left = absoluteX;
    } else {
      // 右侧有足够空间，菜单显示在点击位置右侧
      transformX = '0';
      left = absoluteX;
    }
  } else {
    // menu-left 方向
    // 检查左侧是否有足够空间
    if (absoluteX - menuWidth < padding) {
      // 左侧空间不足，菜单显示在点击位置右侧
      transformX = '0';
      left = absoluteX;
    } else {
      // 左侧有足够空间，菜单显示在点击位置左侧
      transformX = '-100%';
      left = absoluteX;
    }
  }
  
  // 垂直位置调整（重点处理顶部防护）
  const halfMenuHeight = menuHeight / 2;
  
  // 检查顶部边界
  if (absoluteY - halfMenuHeight < padding) {
    // 菜单顶部会超出视口，调整到安全位置
    top = padding + halfMenuHeight;
    transformY = '-50%';
  }
  // 检查底部边界
  else if (absoluteY + halfMenuHeight + padding > viewportHeight) {
    // 菜单底部会超出视口，调整到安全位置
    top = viewportHeight - padding - halfMenuHeight;
    transformY = '-50%';
  } else {
    // 垂直居中于点击位置
    top = absoluteY;
    transformY = '-50%';
  }
  
  const finalStyle = {
    left: `${left}px`,
    top: `${top}px`,
    transform: `translate(${transformX}, ${transformY})`,
    transformOrigin: 'center center'
  };
  
  return finalStyle;
});

// 方法
const handleClose = () => {
  emit('close');
};

const handleSelectNode = (node: any) => {
  emit('selectNode', node);
};

const handleSelectPlugin = (plugin: any) => {
  // 插件选择时，统一通过selectNode事件处理，这样可以复用现有的节点插入逻辑
  emit('selectNode', plugin);
};
</script>

<style lang="scss" scoped>
.insert-node-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000; /* 确保低于ElMessage等全局组件的z-index */
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
}

.insert-node-menu {
  position: absolute;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e4e8;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  animation: menuSlideIn 0.2s ease-out;
  z-index: 2001; /* 确保菜单在overlay之上，但低于全局组件 */
  display: flex;
  flex-direction: column;
  
  &.menu-left,
  &.menu-right {
    animation: menuSlideIn 0.2s ease-out;
  }
  
  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e4e8;
    font-weight: 600;
    font-size: 14px;
    color: #24292e;
    
    .close-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e1e4e8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      color: #586069;
      transition: all 0.2s ease;
      
      &:hover {
        background: #d1d5da;
        color: #24292e;
      }
    }
  }
  
  .menu-content {
    flex: 1;
    min-height: 0;
    overflow: visible;
    display: flex;
    flex-direction: column;
  }
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    scale: 0.9;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

// 深色主题支持
.dark .insert-node-menu {
  background: #2d3748;
  border-color: #4a5568;
  
  .menu-header {
    background: #1a202c;
    border-bottom-color: #4a5568;
    color: #e2e8f0;
    
    .close-btn {
      background: #4a5568;
      color: #a0aec0;
      
      &:hover {
        background: #718096;
        color: #e2e8f0;
      }
    }
  }
  
}
</style>

<style>
/* 确保 ElMessage 不受模糊效果影响 */
.el-message {
  z-index: 9999 !important;
}

/* 确保其他全局组件也不受影响 */
.el-notification {
  z-index: 9999 !important;
}

.el-loading-mask {
  z-index: 9999 !important;
}

.el-dialog__wrapper {
  z-index: 9999 !important;
}
</style> 