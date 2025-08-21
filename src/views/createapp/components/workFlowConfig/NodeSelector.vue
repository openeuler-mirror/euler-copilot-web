<template>
  <div class="node-selector">
    <!-- Tab切换 -->
    <div class="selector-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'nodes' }"
        @click="activeTab = 'nodes'"
      >
        {{ $t('flow.nodes') }}
      </div>
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'plugins' }"
        @click="activeTab = 'plugins'"
      >
        {{ $t('flow.plugins') }}
      </div>
    </div>
    
    <div class="selector-content">
      <!-- 节点Tab Panel -->
      <div v-if="activeTab === 'nodes'" class="tab-panel">
        <NodeListPanel
          :api-service-list="apiServiceList"
          :exclude-node-types="excludeNodeTypes"
          :extra-node-types="extraNodeTypes"
          :search-placeholder="searchPlaceholder"
          :enable-drag="enableDrag"
          :on-drag-start="onDragStart"
          @node-click="handleNodeClick"
          @drag-start="handleDragStart"
        />
      </div>
      <!-- 插件Tab Panel  -->
      <div v-if="activeTab === 'plugins'" class="tab-panel">
        <PluginListPanel
          :search-placeholder="$t('common.search')"
          @plugin-click="handlePluginClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import NodeListPanel from './NodeListPanel.vue';
import PluginListPanel from './PluginListPanel.vue';

// Props
interface Props {
  apiServiceList: any[];
  excludeNodeTypes?: string[];
  extraNodeTypes?: any[];
  searchPlaceholder?: string;
  enableDrag?: boolean;
  onDragStart?: (event: DragEvent, node: any) => void;
  resetTabOnShow?: boolean; // 是否在显示时重置到节点标签页
}

const props = withDefaults(defineProps<Props>(), {
  apiServiceList: () => [],
  excludeNodeTypes: () => [],
  extraNodeTypes: () => [],
  searchPlaceholder: '搜索节点...',
  enableDrag: false,
  onDragStart: undefined,
  resetTabOnShow: false
});

// Emits
interface Emits {
  (e: 'nodeClick', node: any): void;
  (e: 'pluginClick', plugin: any): void;
  (e: 'dragStart', event: DragEvent, node: any): void;
}

const emit = defineEmits<Emits>();

// 响应式数据
const activeTab = ref('nodes');

// 监听resetTabOnShow变化，用于外部控制重置标签页
watch(() => props.resetTabOnShow, (shouldReset) => {
  if (shouldReset) {
    activeTab.value = 'nodes';
  }
});

// 方法
const handleNodeClick = (node: any) => {
  emit('nodeClick', node);
};

const handlePluginClick = (plugin: any) => {
  emit('pluginClick', plugin);
};

const handleDragStart = (event: DragEvent, node: any) => {
  emit('dragStart', event, node);
};

// 暴露方法给父组件
defineExpose({
  resetTab: () => {
    activeTab.value = 'nodes';
  },
  activeTab
});
</script>

<style lang="scss" scoped>
.node-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .selector-tabs {
    display: flex;
    padding: 12px 20px;
    border-bottom: 1px solid #e1e4e8;
    background: #f8f9fa;
    flex-shrink: 0;
    
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
      
      &:hover {
        color: #6395fd;
      }
    }
  }
  
  .selector-content {
    flex: 1;
    min-height: 0;
    overflow: visible;
    display: flex;
    flex-direction: column;
    
    .tab-panel {
      flex: 1;
      min-height: 0;
      overflow: visible;
      display: flex;
      flex-direction: column;
    }
  }
}

// 深色主题支持
.dark .node-selector {
  .selector-tabs {
    background: #374151;
    border-bottom-color: #4a5568;
    
    .tab-item {
      color: #a0aec0;
      
      &.active {
        color: #6395fd;
        border-bottom-color: #6395fd;
      }
      
      &:hover {
        color: #e2e8f0;
      }
    }
  }
}
</style>
