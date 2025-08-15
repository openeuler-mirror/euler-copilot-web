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
        <span>选择要插入的节点</span>
        <div class="close-btn" @click="handleClose">×</div>
      </div>
      
      <!-- Tab切换 -->
      <div class="menu-tabs">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'nodes' }"
          @click="activeTab = 'nodes'"
        >
          节点
        </div>
        <div 
          class="tab-item disabled"
          :class="{ active: activeTab === 'apps' }"
        >
          应用
        </div>
      </div>
      
      <div class="menu-content">
        <!-- 节点Tab Panel -->
        <div v-if="activeTab === 'nodes'" class="tab-panel">
          <NodeListPanel
            :api-service-list="apiServiceList"
            :exclude-node-types="excludeNodeTypes"
            :extra-node-types="extraNodeTypes"
            search-placeholder="搜索节点..."
            :enable-drag="false"
            @node-click="handleSelectNode"
          />
        </div>
        
        <!-- 应用Tab Panel (暂时禁用) -->
        <div v-if="activeTab === 'apps'" class="tab-panel">
          <div class="disabled-panel">
            <div class="disabled-text">应用功能即将上线，敬请期待...</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import NodeListPanel from './NodeListPanel.vue';

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
}

const emit = defineEmits<Emits>();

// 响应式数据
const activeTab = ref('nodes');

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
</script>

<style lang="scss" scoped>
.insert-node-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
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
  overflow: visible;
  animation: menuSlideIn 0.2s ease-out;
  z-index: 10000;
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
  
  .menu-tabs {
    display: flex;
    padding: 12px 20px;
    border-bottom: 1px solid #e1e4e8;
    background: #f8f9fa;
    
    .tab-item {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #586069;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      
      &.active {
        color: #6395fd;
        border-bottom-color: #6395fd;
      }
      
      &.disabled {
        color: #c0c4cc;
        cursor: not-allowed;
      }
      
      &:hover:not(.disabled) {
        color: #6395fd;
      }
    }
  }
  
  .menu-content {
    padding: 0;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    .tab-panel {
      padding: 0;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    

    
    .disabled-panel {
      text-align: center;
      padding: 60px 20px;
      color: #c0c4cc;
      font-size: 14px;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
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
  
  .menu-tabs {
    background: #374151;
    border-bottom-color: #4a5568;
    
    .tab-item {
      color: #a0aec0;
      
      &.active {
        color: #6395fd;
        border-bottom-color: #6395fd;
      }
      
      &.disabled {
        color: #718096;
        cursor: not-allowed;
      }
      
      &:hover:not(.disabled) {
        color: #e2e8f0;
      }
    }
  }
  
  .menu-content {
    .disabled-panel {
      color: #718096;
    }
  }
}
</style> 