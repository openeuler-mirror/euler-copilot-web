<template>
  <div class="node-list-panel">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="searchKeyword"
        type="text" 
        :placeholder="searchPlaceholder"
        class="search-input"
        @input="handleSearch"
      />
      <div 
        v-if="searchKeyword.trim()"
        class="clear-icon"
        @click="resetSearch"
        title="清空搜索"
      >
        ✕
      </div>
      <div class="search-icon">🔍</div>
    </div>
    
    <!-- 节点列表 -->
    <div class="nodes-list">
      <div
        v-for="(group, groupName) in groupedNodes"
        :key="groupName"
        class="node-group"
      >
        <!-- Default类型不显示组标题 -->
        <div v-if="groupName !== 'default'" class="group-title">
          {{ getTypeDisplayName(groupName) }}
        </div>
        <div
          v-for="node in group"
          :key="node.nodeId"
          class="node-item"
          :draggable="enableDrag"
          @click="handleNodeClick(node)"
          @dragstart="handleDragStart($event, node)"
        >
          <div v-if="node.callId === 'continue' || node.callId === 'break'" class="special-icon-wrapper">
            <img class="node-icon special-icon" :src="getSrcIcon(node)" />
          </div>
          <img v-else class="node-icon" :src="getSrcIcon(node)" />
          <div class="node-info">
            <div class="node-name">{{ node.name }}</div>
            <div class="node-desc">{{ node.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getSrcIcon } from '../types';

// Props
interface Props {
  apiServiceList: any[];
  searchPlaceholder?: string;
  enableDrag?: boolean;
  onDragStart?: (event: DragEvent, node: any) => void;
  excludeNodeTypes?: string[]; // 新增：需要排除的节点类型列表
  extraNodeTypes?: any[]; // 新增：额外的节点类型列表
}

const props = withDefaults(defineProps<Props>(), {
  apiServiceList: () => [],
  searchPlaceholder: '搜索节点...',
  enableDrag: false,
  onDragStart: undefined,
  excludeNodeTypes: () => [], // 默认不排除任何节点类型
  extraNodeTypes: () => [] // 默认没有额外节点类型
});

// Emits
interface Emits {
  (e: 'nodeClick', node: any): void;
  (e: 'dragStart', event: DragEvent, node: any): void;
}

const emit = defineEmits<Emits>();

// 响应式数据
const searchKeyword = ref('');

// Node type名称映射字典
const nodeTypeNameMap: Record<string, string> = {
  'tool': '工具',
  'transform': '转换',
  'logic': '逻辑',
  'default': 'default'
};

// 计算属性：获取service类型的节点数据
const serviceNodes = computed(() => {
  const nodes: any[] = [];
  props.apiServiceList.forEach(service => {
    if (service.type === 'system' || !service.type) { // 兼容没有type字段的情况
      if (service.nodeMetaDatas && Array.isArray(service.nodeMetaDatas)) {
        // 为每个节点添加serviceId信息
        const nodesWithServiceId = service.nodeMetaDatas.map(node => ({
          ...node,
          serviceId: service.serviceId
        }));
        nodes.push(...nodesWithServiceId);
      }
    }
  });
  return nodes;
});

// 计算属性：搜索过滤后的节点
const filteredNodes = computed(() => {
  let nodes = [...serviceNodes.value];
  
  // 添加额外的节点类型，但需要去重（根据callId判断）
  if (props.extraNodeTypes && props.extraNodeTypes.length > 0) {
    // 获取现有节点的callId集合
    const existingCallIds = new Set(nodes.map(node => node.callId));
    
    // 只添加不重复的额外节点类型
    const uniqueExtraNodes = props.extraNodeTypes.filter(extraNode => 
      !existingCallIds.has(extraNode.callId)
    );
    
    nodes = [...nodes, ...uniqueExtraNodes];
  }
  
  // 首先过滤掉排除的节点类型
  if (props.excludeNodeTypes && props.excludeNodeTypes.length > 0) {
    nodes = nodes.filter(node => {
      // 检查 callId 是否在排除列表中
      return !props.excludeNodeTypes.includes(node.callId);
    });
  }
  
  // 然后应用搜索过滤
  if (!searchKeyword.value.trim()) {
    return nodes;
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim();
  return nodes.filter(node => 
    node.name?.toLowerCase().includes(keyword) ||
    node.description?.toLowerCase().includes(keyword)
  );
});

// 计算属性：按type分组的节点
const groupedNodes = computed(() => {
  const groups: Record<string, any[]> = {};
  
  filteredNodes.value.forEach(node => {
    const type = node.type || 'default';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(node);
  });
  
  // 重新排序：default类型在最前面，其他按字母顺序排列
  const sortedGroups: Record<string, any[]> = {};
  
  // 首先添加default组（如果存在）
  if (groups.default) {
    sortedGroups.default = groups.default;
  }
  
  // 然后按字母顺序添加其他组
  const otherTypes = Object.keys(groups)
    .filter(type => type !== 'default')
    .sort();
    
  otherTypes.forEach(type => {
    sortedGroups[type] = groups[type];
  });
  
  return sortedGroups;
});

// 方法
const handleNodeClick = (node: any) => {
  emit('nodeClick', node);
};

const handleDragStart = (event: DragEvent, node: any) => {
  if (props.enableDrag) {
    if (props.onDragStart) {
      props.onDragStart(event, node);
    }
    emit('dragStart', event, node);
  }
};

const handleSearch = () => {
  // 搜索逻辑已经在computed中处理
};

// 获取type的显示名称
const getTypeDisplayName = (type: string): string => {
  return nodeTypeNameMap[type] || type;
};

// 重置搜索关键词的方法
const resetSearch = () => {
  searchKeyword.value = '';
};

// 暴露方法给父组件
defineExpose({
  resetSearch
});
</script>

<style lang="scss" scoped>
.node-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .search-bar {
    display: flex;
    align-items: center;
    background: #f8f9fa;
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    margin: 16px 20px 12px;
    flex-shrink: 0;
    
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 12px 16px;
      font-size: 14px;
      color: #24292e;
      
      &::placeholder {
        color: #586069;
      }
    }
    
    .clear-icon {
      font-size: 16px;
      color: #586069;
      margin-right: 12px;
      cursor: pointer;
      transition: color 0.2s ease;
      
      &:hover {
        color: #24292e;
      }
    }
    
    .search-icon {
      font-size: 16px;
      color: #586069;
      margin-right: 12px;
    }
  }
  
  .nodes-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    
    .node-group {
      .group-title {
        padding: 8px 20px 4px;
        font-size: 12px;
        font-weight: 600;
        color: #586069;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #f1f3f4;
        margin-bottom: 4px;
      }
      
      .node-item {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
        
        &:hover {
          background: #f6f8fa;
          border-left-color: #6395fd;
          
          .node-name {
            color: #6395fd;
          }
        }
        
        .node-icon {
          width: 32px;
          height: 32px;
          margin-right: 12px;
          border-radius: 6px;
          object-fit: contain;
          background: #f8f9fa;
          padding: 4px;
        }

        .special-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          margin-right: 12px;
          background-color: #f59e0b;
          border-radius: 50%;
          
          .special-icon {
            width: 20px;
            height: 20px;
            margin: 0;
            padding: 0;
            background: transparent;
            border-radius: 0;
            filter: brightness(0) invert(1); /* 将图标变为白色 */
          }
        }
        
        .node-info {
          flex: 1;
          
          .node-name {
            font-size: 14px;
            font-weight: 500;
            color: #24292e;
            margin-bottom: 2px;
            transition: color 0.2s ease;
          }
          
          .node-desc {
            font-size: 12px;
            color: #586069;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 280px;
          }
        }
      }
    }
  }
}

// 深色主题支持
.dark .node-list-panel {
  .search-bar {
    background: #4a5568;
    border-color: #6b7280;
    
    .search-input {
      color: #e2e8f0;
      
      &::placeholder {
        color: #a0aec0;
      }
    }
    
    .clear-icon {
      color: #a0aec0;
      
      &:hover {
        color: #e2e8f0;
      }
    }
    
    .search-icon {
      color: #a0aec0;
    }
  }
  
  .nodes-list {
    .node-group {
      .group-title {
        color: #a0aec0;
        border-bottom-color: #4a5568;
      }
      
      .node-item {
        &:hover {
          background: #374151;
          
          .node-name {
            color: #6395fd;
          }
        }
        
        .node-icon {
          background: #374151;
        }

        .special-icon-wrapper {
          background-color: #f59e0b; /* 保持橙色，在深色主题下也是橙色 */
        }

        .system-icon-wrapper {
          background-color: #6366f1; /* 保持蓝色，在深色主题下也是蓝色 */
        }
        
        .node-info {
          .node-name {
            color: #e2e8f0;
          }
          
          .node-desc {
            color: #a0aec0;
          }
        }
      }
    }
  }
}
</style> 