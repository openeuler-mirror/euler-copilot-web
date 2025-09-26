<template>
  <div 
    class="plugin-node"
    :class="[
      `plugin-node--${data.pluginType}`,
      debugStatus,
      { 
        'plugin-node--selected': selected,
        'plugin-node--disabled': disabled,
        'plugin-node--error': hasError
      }
    ]"
    @click="handleNodeClick"
  >
    <!-- 节点主体 -->
    <div class="plugin-node__main">
      <!-- 顶部状态栏 -->
      <div class="plugin-node__status-bar">
        <div class="status-indicator" :class="statusClass">
          <div class="status-dot"></div>
        </div>
        <div class="plugin-type-badge" :class="`badge--${data.pluginType}`">
          {{ data.pluginType === 'semantic_interface' ? 'API' : 'MCP' }}
        </div>
      </div>
      
      <!-- 节点内容 -->
      <div class="plugin-node__content">
        <!-- 图标和标题 -->
        <div class="plugin-node__header">
          <div class="plugin-icon">
            <img 
              :src="data.icon || defaultIcon" 
              :alt="data.name"
              @error="handleImageError"
            />
          </div>
          <div class="plugin-info">
            <div class="plugin-name">{{ data.name }}</div>
            <div class="plugin-author">@{{ data.author }}</div>
          </div>
        </div>
        
        <!-- 描述 -->
        <div class="plugin-description">
          {{ data.description }}
        </div>
        
        <!-- 底部服务ID显示 -->
        <div class="plugin-node__footer">
          <div class="service-id">{{ data.serviceId }}</div>
        </div>
      </div>
    </div>
    
    <!-- 右上角删除按钮 -->
    <div class="deleteCardWrapper" v-if="!disabled">
      <div class="deleteCard">
        <button
          class="deleteButton"
          @click.stop="handleDelete"
          title="删除节点"
          @mouseenter="showDeleteText = true"
          @mouseleave="showDeleteText = false"
        >
          <el-icon class="delete-icon">
            <Delete />
          </el-icon>
          <span class="delete-text" v-show="showDeleteText">删除</span>
        </button>
      </div>
    </div>
    
    <!-- Vue Flow Handles -->
    <Handle
      type="target"
      :position="Position.Left"
    />
    <Handle
      type="source"
      :position="Position.Right"
    />
    
    <!-- Handle插入节点按钮 -->
    <div 
      v-if="!disabled"
      class="handle-plus-button source-plus"
      @mouseenter="handleSourceHandleEnter"
      @mouseleave="handleSourceHandleLeave"
      @click="handleSourceInsertNode"
    >
      <el-icon v-if="sourceHandleHovered" class="plus-icon">
        <Plus />
      </el-icon>
    </div>
    
    <!-- 调试信息显示（与其他节点一致） -->
    <NodeMirrorText
      v-if="debugStatus !== 'default'"
      :status="debugStatus"
      :costTime="costTime"
      :inputAndOutput="inputAndOutput"
      style="display: block"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Position, Handle } from '@vue-flow/core';
import { Delete, WarnTriangleFilled, Plus } from '@element-plus/icons-vue';
import { IconSuccess } from '@computing/opendesign-icons';
import DefaultIcon from '@/assets/svgs/defaultIcon.webp';
import NodeMirrorText from '../codeMirror/nodeMirrorText.vue';

// Props
interface PluginNodeData {
  serviceId: string;
  name: string;
  description: string;
  icon?: string;
  author: string;
  pluginType: 'semantic_interface' | 'mcp';
  type: string;
  isActive?: boolean;
  status?: 'init' | 'installing' | 'cancelled' | 'ready' | 'failed';
  published?: boolean;
  parameters?: any;
}

interface Props {
  id: string;
  data: PluginNodeData;
  position?: { x: number; y: number };
  selected?: boolean;
  disabled?: boolean;
  debugInfo?: {
    success: boolean;
    costTime: number;
    output?: string;
    error?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  position: () => ({ x: 0, y: 0 }),
  selected: false,
  disabled: false,
  debugInfo: undefined
});

// Emits
interface Emits {
  (e: 'viewDetails'): void;
  (e: 'deleteNode'): void;
  (e: 'insertNodeFromHandle', data: any): void;
}

const emit = defineEmits<Emits>();

const defaultIcon = DefaultIcon;

// 计算状态类 - 只反映插件本身状态，不受debugInfo影响
const statusClass = computed(() => {
  if (props.data.pluginType === 'mcp') {
    if (props.data.status === 'ready' && props.data.isActive) {
      return 'status--active';
    } else if (props.data.status === 'installing') {
      return 'status--loading';
    } else {
      return 'status--inactive';
    }
  } else {
    // semantic_interface
    return props.data.published ? 'status--published' : 'status--draft';
  }
});

// 计算调试状态 - 用于边框样式（与其他节点一致）
const debugStatus = computed(() => {
  if (!props.debugInfo) {
    return 'default';
  }
  return props.debugInfo.success ? 'success' : 'failed';
});

// 计算是否有错误 - 用于错误样式类
const hasError = computed(() => {
  return props.debugInfo && !props.debugInfo.success;
});

// 添加状态变量
const showDeleteText = ref(false);
// Handle位置插入按钮的悬停状态
const sourceHandleHovered = ref(false);

// 计算调试相关数据（与CustomNode保持一致）
const costTime = computed(() => {
  return props.debugInfo?.costTime?.toString() || '';
});

const inputAndOutput = computed(() => {
  if (!props.debugInfo) {
    return {
      input_parameters: {},
      output_parameters: {}
    };
  }
  
  return {
    input_parameters: props.debugInfo.input || {},
    output_parameters: props.debugInfo.output || {}
  };
});

// 方法
const handleNodeClick = () => {
  if (!props.disabled) {
    // 点击节点直接展开详情
    emit('viewDetails');
  }
};

const handleDelete = () => {
  if (!props.disabled) {
    emit('deleteNode');
  }
};

const handleImageError = (e: Event) => {
  const imgElement = e.target as HTMLImageElement;
  imgElement.src = defaultIcon;
};

// Handle+按钮事件处理
const handleSourceInsertNode = (event: Event) => {
  event.stopPropagation();
  if (props.disabled) {
    return;
  }
  
  
  // 发射插入节点事件，传递节点信息和handle类型（与CustomNode一致）
  emit('insertNodeFromHandle', {
    nodeId: props.id,
    handleType: 'source',
    nodePosition: props.position
  });
};

// Handle悬停事件处理
const handleSourceHandleEnter = () => {
  if (!props.disabled) {
    sourceHandleHovered.value = true;
  }
};

const handleSourceHandleLeave = () => {
  sourceHandleHovered.value = false;
};
</script>

<style lang="scss" scoped>
.plugin-node {
  min-width: 280px;
  max-width: 320px;
  background: white;
  border: 2px solid #e1e4e8;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    border-color: #6395fd;
    box-shadow: 0 6px 20px rgba(99, 149, 253, 0.2);
    transform: translateY(-2px);
  }
  
  &--selected {
    border-color: #6395fd;
    box-shadow: 0 0 0 2px rgba(99, 149, 253, 0.3);
  }
  
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
  
  &--error {
    border-color: #ff4d4f;
    
    &:hover {
      border-color: #ff4d4f;
      box-shadow: 0 6px 20px rgba(255, 77, 79, 0.2);
    }
  }
  
  // 调试状态样式（与其他节点一致）
  &.success {
    border-color: #52c41a !important;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2) !important;
  }
  
  &.failed {
    border-color: #ff4d4f !important;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
  }
  
  &.loading {
    border-color: #1890ff !important;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
    animation: loading-pulse 2s infinite;
  }
  
  // 统一的插件类型badge样式
  &--semantic_interface,
  &--mcp {
    .plugin-type-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }
}

.plugin-node__main {
  padding: 0;
  position: relative;
}

.plugin-node__status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
  
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    &.status--active,
    &.status--published,
    &.status--success {
      .status-dot {
        background: #52c41a;
        box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
      }
    }
    
    &.status--loading {
      .status-dot {
        background: #1890ff;
        animation: pulse 1.5s infinite;
      }
    }
    
    &.status--inactive,
    &.status--draft {
      .status-dot {
        background: #faad14;
      }
    }
    
    &.status--error {
      .status-dot {
        background: #ff4d4f;
        animation: pulse 1.5s infinite;
      }
    }
  }
  
  .plugin-type-badge {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.plugin-node__content {
  padding:16px 16px 16px;
}

.plugin-node__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  
  .plugin-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      object-fit: cover;
      background: #f8f9fa;
    }
  }
  
  .plugin-info {
    flex: 1;
    min-width: 0;
    
    .plugin-name {
      font-size: 16px;
      font-weight: 600;
      color: #24292e;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .plugin-author {
      font-size: 12px;
      color: #586069;
      font-weight: 500;
    }
  }
}

.plugin-description {
  font-size: 14px;
  color: #586069;
  line-height: 1.4;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plugin-node__footer {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  
  .service-id {
    font-size: 11px;
    color: #8c8c8c;
    font-family: 'Monaco', 'Menlo', monospace;
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 删除按钮容器 */
.deleteCardWrapper {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.plugin-node:hover .deleteCardWrapper {
  opacity: 1;
  visibility: visible;
}

.deleteCard {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 自定义删除按钮样式 - 悬浮圆形到圆角矩形动画 */
.deleteButton {
  /* 基础样式 */
  border: none;
  background-color: #f56c6c;
  color: #ffffff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  
  /* 圆形按钮尺寸 */
  width: 32px;
  height: 32px;
  border-radius: 50%;
  
  /* 布局样式 */
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  
  /* 悬浮效果 */
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  
  /* 动画效果 */
  transition: 
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease;
  
  transform: scaleX(1) translateY(0);
  transform-origin: center;
  outline: none;
  text-decoration: none;
  box-sizing: border-box;
}

.deleteButton:hover {
  background-color: #f56c6c;
  width: 80px;
  border-radius: 16px;
  padding: 0 12px;
  transform: scaleX(1) translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 108, 108, 0.5);
}

.delete-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.delete-text {
  margin-left: 6px;
  font-size: 12px;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s;
}

.deleteButton:hover .delete-text {
  opacity: 1;
  transform: translateX(0);
}

// 使用Vue Flow的标准Handle样式
:deep(.vue-flow__handle) {
  width: 12px;
  height: 12px;
  border: 2px solid white;
  background: #6395fd;
  
  &:hover {
    background: #4f7cfd;
    // 移除transform，避免Handle位置变动
  }
}

:deep(.vue-flow__handle-left) {
  left: -6px;
}

:deep(.vue-flow__handle-right) {
  right: -6px;
}

/* Handle+按钮样式（与CustomNode一致） */
.handle-plus-button {
  position: absolute;
  width: 40px; /* 扩大触发区域 */
  height: 40px; /* 扩大触发区域 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 15;
  pointer-events: auto;
  transition: all 0.2s ease;
}

.source-plus {
  right: -25px; /* 稍微靠近节点，扩大的触发区域会延伸到节点 */
  top: 50%;
  transform: translate(50%, -50%); /* 居中对齐，让触发区域更合理 */
}

/* +图标样式 */
.handle-plus-button .plus-icon {
  font-size: 11px;
  color: #6395fd;
  background: #ffffff;
  border: 1px solid #6395fd;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(99, 149, 253, 0.4);
  transition: all 0.2s ease;
}

.handle-plus-button .plus-icon:hover {
  background: #6395fd;
  color: #ffffff;
  transform: scale(1.15);
  box-shadow: 0 5px 15px rgba(99, 149, 253, 0.6);
  opacity: 1;
}

/* 仅在节点悬停时显示+按钮 */
.plugin-node .handle-plus-button {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0.5s; /* 延迟隐藏 */
}

.plugin-node:hover .handle-plus-button,
.plugin-node .handle-plus-button:hover {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0s; /* 立即显示 */
}


@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

@keyframes loading-pulse {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.4);
  }
}

// 深色主题支持
.dark .plugin-node {
  background: #2d3748;
  border-color: #4a5568;
  
  &:hover {
    border-color: #6395fd;
    box-shadow: 0 6px 20px rgba(99, 149, 253, 0.3);
  }
  
  &--selected {
    border-color: #6395fd;
    box-shadow: 0 0 0 2px rgba(99, 149, 253, 0.4);
  }
  
  .plugin-node__content {
    .plugin-name {
      color: #e2e8f0;
    }
    
    .plugin-author {
      color: #a0aec0;
    }
  }
  
  .plugin-description {
    color: #a0aec0;
  }
  
  .service-id {
    background: #4a5568;
    color: #a0aec0;
  }
  
  .deleteButton {
    background-color: #e53e3e;
    
    &:hover {
      background-color: #e53e3e;
      box-shadow: 0 6px 20px rgba(229, 62, 62, 0.5);
    }
  }
  
  .handle-plus-button .plus-icon {
    background: #2d3748;
    border-color: #63b3ed;
    color: #63b3ed;
    box-shadow: 0 3px 8px rgba(99, 179, 237, 0.4);
    
    &:hover {
      background: #63b3ed;
      color: #2d3748;
      box-shadow: 0 5px 15px rgba(99, 179, 237, 0.6);
    }
  }
}

// 统一的插件节点header样式
.plugin-node--semantic_interface,
.plugin-node--mcp {
  .plugin-node__status-bar {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  }
}
</style>