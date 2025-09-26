<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, computed, watch } from 'vue';
import { Plus, Delete } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getSrcIcon, getNodeClass } from '../types';

const { t } = useI18n();

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    required: false,
  },
  deletable: {
    type: Boolean,
    required: false,
  },
  position: {
    type: Object,
    required: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits([
  'delNode',
  'editYamlDrawer', 
  'updateConnectHandle',
  'insertNodeFromHandle'
]);

const statusList = ref(['running', 'success', 'error']);
const curStatus = ref('default');

// Handle连接状态
const handleTargetConnecting = ref(false);
const handleSourceConnecting = ref(false);

// Handle悬停状态
const sourceHandleHovered = ref(false);

// 控制删除按钮文字显示
const showDeleteText = ref(false);

// 设置连接状态
const setConnectStatus = (type) => {
  if (type === 'source') {
    handleSourceConnecting.value = true;
  } else {
    handleTargetConnecting.value = true;
  }
  emits('updateConnectHandle', props.id);
};

// 编辑节点
const editNode = () => {
  if (props.disabled) return;
  
  const yamlCode = {
    input_parameters: props.data.parameters?.input_parameters || {},
    output_parameters: props.data.parameters?.output_parameters || {}
  };
  
  emits('editYamlDrawer', props.data.name, props.data.description, yamlCode, props.id);
};

// 删除节点
const deleteNode = () => {
  if (props.disabled) return;
  emits('delNode', props.id);
};

// Handle插入节点事件
const handleSourceInsertNode = (event) => {
  if (props.disabled) return;
  event.stopPropagation();
  
  emits('insertNodeFromHandle', {
    nodeId: props.id,
    handleType: 'source',
    nodePosition: props.position
  });
};



// Handle悬停事件
const handleSourceHandleEnter = () => {
  if (!props.disabled) sourceHandleHovered.value = true;
};

const handleSourceHandleLeave = () => {
  sourceHandleHovered.value = false;
};



// 获取变量操作列表
const variableOperations = computed(() => {
  const operations = props.data.parameters?.input_parameters?.operations || [];
  return operations.filter(op => op.variable_name && op.operation);
});

// 获取操作类型的显示名称
const getOperationDisplayName = (operation: string): string => {
  const operationMap: Record<string, string> = {
    'overwrite': t('flow.node_config.operation_overwrite'),
    'clear': t('flow.node_config.operation_clear'),
    'add': t('flow.node_config.operation_add'),
    'subtract': t('flow.node_config.operation_subtract'),
    'multiply': t('flow.node_config.operation_multiply'),
    'divide': t('flow.node_config.operation_divide'),
    'modulo': t('flow.node_config.operation_modulo'),
    'power': t('flow.node_config.operation_power'),
    'sqrt': t('flow.node_config.operation_sqrt'),
    'append': t('flow.node_config.operation_append'),
    'extend': t('flow.node_config.operation_extend'),
    'pop_first': t('flow.node_config.operation_pop_first'),
    'pop_last': t('flow.node_config.operation_pop_last')
  };
  return operationMap[operation] || operation;
};

// 提取变量名的最后一部分（后缀）
const getVariableDisplayName = (variableName: string): string => {
  if (!variableName || typeof variableName !== 'string') {
    return '?';
  }
  
  // 按点分割变量名，返回最后一部分
  const parts = variableName.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  
  return variableName;
};

// 监听data变化更新状态
watch(
  () => props.data,
  () => {
    const isInclude = statusList.value.includes(props.data?.status);
    if (!isInclude) {
      curStatus.value = 'default';
    } else {
      curStatus.value = props.data?.status;
    }
    handleTargetConnecting.value = false;
    handleSourceConnecting.value = false;
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div class="customNodeStyle" :class="[curStatus, { 'node-selected': selected }]">
    <!-- Target Handle -->
    <Handle
      :class="{ isConnecting: handleTargetConnecting }"
      type="target"
      @mousedown="setConnectStatus('target')"
      :position="Position.Left"
    />
    
    <div class="nodeContainer">
      <div class="nodeBox" :class="getNodeClass(props.data)" @click="editNode">
        <div class="title">
          <div class="iconLabel">
            <img
              class="iconStyle"
              :src="getSrcIcon(props.data)"
            />
            <div class="label">{{ data.name || t('flow.node_names.variable_assign') }}</div>
          </div>
        </div>
        
        <!-- 变量操作列表 -->
        <div v-if="variableOperations.length > 0" class="operations-list">
          <div 
            v-for="(operation, index) in variableOperations" 
            :key="index" 
            class="operation-item"
          >
            <div class="operation-content">
              <span class="variable-name">{x} {{ getVariableDisplayName(operation.variable_name) }}</span>
              <span class="operation-type">{{ getOperationDisplayName(operation.operation) }}</span>
            </div>
          </div>
        </div>

        <!-- 无操作时的提示 -->
        <div v-else class="no-operations">
          <span class="placeholder-text">{{ t('flow.node_config.click_to_configure_operations') }}</span>
        </div>
      </div>
      
      <!-- 将ID移到footer位置，设为次要样式 -->
      <div class="nodeFooter" v-if="props.id">
        <div class="nodeIdText">
          <span>{{ props.id }}</span>
        </div>
      </div>
    </div>
    
    <!-- 右上角删除按钮小卡片 -->
    <div class="deleteCardWrapper" v-if="!disabled">
      <div class="deleteCard">
        <button
          class="deleteButton"
          @click="deleteNode"
          :title="t('semantic.interface_delete')"
          @mouseenter="showDeleteText = true"
          @mouseleave="showDeleteText = false"
        >
          <el-icon class="delete-icon">
            <Delete />
          </el-icon>
          <span class="delete-text" v-show="showDeleteText">{{ t('semantic.interface_delete') }}</span>
        </button>
      </div>
    </div>
    
    <!-- Source Handle -->
    <Handle
      :class="{ isConnecting: handleSourceConnecting }"
      type="source"
      @mousedown="setConnectStatus('source')"
      :position="Position.Right"
    />
    
    <!-- Source +按钮 -->
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
  </div>
</template>

<style lang="scss" scoped>
// 使用与CustomNode相同的样式基础类
.customNodeStyle {
  position: relative;
  
  .nodeContainer {
    background: white;
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    min-width: 200px;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  &.node-selected .nodeContainer {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    
    &:hover {
      // 选中状态下的hover，不改变边框颜色，避免重复
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3), 0 4px 12px rgba(64, 158, 255, 0.15);
    }
  }
  
  .nodeBox {
    padding: 12px;
    
    .title {
      margin-bottom: 12px;
      
      .iconLabel {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .iconStyle {
          width: 20px;
          height: 20px;
        }
        
        .label {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          flex: 1;
        }
      }
    }
    
    .operations-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      .operation-item {
        background: rgba(64, 158, 255, 0.1);
        border: 1px solid rgba(64, 158, 255, 0.2);
        border-radius: 4px;
        padding: 6px 8px;
        
        .operation-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          
          .variable-name {
            font-size: 11px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            color: #409eff;
            font-weight: 500;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .operation-type {
            font-size: 10px;
            color: #606266;
            background: rgba(255, 255, 255, 0.8);
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 500;
            flex-shrink: 0;
          }
        }
      }
    }
    
    .no-operations {
      text-align: center;
      padding: 20px 0;
      
      .placeholder-text {
        font-size: 12px;
        color: #909399;
        font-style: italic;
      }
    }
  }
  
  .nodeFooter {
    padding: 8px 12px;
    border-top: 1px solid #f0f0f0;
    background: #f8f9fa;
    border-radius: 0 0 8px 8px;
    
    .nodeIdText {
      font-size: 10px;
      color: #909399;
      font-family: monospace;
    }
  }
}

// 删除按钮样式（与CustomNode完全相同）
.deleteCardWrapper {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
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
  
  /* 动画效果 - 分离不同属性的动画时间 */
  transition: 
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease;
  
  /* 初始变形状态 */
  transform: scaleX(1) translateY(0);
  transform-origin: center;
  
  /* 移除默认按钮样式 */
  outline: none;
  text-decoration: none;
  box-sizing: border-box;
}

.deleteButton:hover {
  background-color: #f56c6c;
  color: #ffffff;
  
  /* 展开为圆角矩形 */
  width: 88px;
  height: 32px;
  border-radius: 16px;
  padding: 0 12px;
  
  /* 左右拉伸变形效果 */
  transform: scaleX(1.05) translateY(-1px);
  
  /* 增强悬浮效果 */
  box-shadow: 0 6px 20px rgba(245, 108, 108, 0.5);
}

.deleteButton:active {
  background-color: #e6a23c;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.6);
  transform: scaleX(1) translateY(0);
}

.deleteButton:focus {
  outline: 2px solid #f56c6c40;
  outline-offset: 2px;
}

.delete-icon {
  font-size: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.deleteButton:hover .delete-icon {
  transform: scale(0.9);
}

.delete-text {
  font-size: 12px;
  margin-left: 6px;
  opacity: 0;
  transform: translateX(-8px) scale(0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.deleteButton:hover .delete-text {
  opacity: 1;
  transform: translateX(0) scale(1);
}

/* 只在hover整个节点时显示删除卡片 */
.customNodeStyle .deleteCardWrapper {
  opacity: 0;
  transition: opacity 0.2s;
}

.customNodeStyle:hover .deleteCardWrapper {
  opacity: 1;
}

// Handle样式（与CustomNode相同）
.vue-flow__handle {
  width: 10px;
  height: 10px;
  border: 2px solid #6395fd;
  background: #ffffff;
  
  &.isConnecting {
    border-color: #67c23a;
    background: #67c23a;
  }
}

// +按钮样式（与CustomNode相同）
.handle-plus-button {
  position: absolute;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 15;
  pointer-events: auto;
  transition: all 0.2s ease;
  
  &.source-plus {
    right: -25px;
    top: 50%;
    transform: translate(50%, -50%);
  }
  
  .plus-icon {
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
    opacity: 0.9;
    
    &:hover {
      background: #6395fd;
      color: #ffffff;
      transform: scale(1.15);
      box-shadow: 0 5px 15px rgba(99, 149, 253, 0.6);
      opacity: 1;
    }
  }
}

// 仅在节点悬停时显示+按钮
.customNodeStyle .handle-plus-button {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0.5s;
}

.customNodeStyle:hover .handle-plus-button,
.customNodeStyle .handle-plus-button:hover {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0s;
}



// 深色主题支持 - 使用与其他Node一致的样式规范
.dark {
  .customNodeStyle {
    .nodeContainer {
      background: #353f58 !important;
      border: 2px solid rgba(255, 255, 255, 0.08) !important;
      
      &:hover {
        border-color: #3182ce;
      }
    }
    
    &.node-selected .nodeContainer {
      border-color: #3182ce;
      box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2);
    }
    
    .label {
      color: #ffffff !important;
    }
    
    .operations-list {
      .operation-item {
        background: rgba(99, 179, 237, 0.2);
        border-color: rgba(99, 179, 237, 0.3);
        
        .operation-content {
          .variable-name {
            color: #63b3ed;
          }
          
          .operation-type {
            color: #a0aec0;
            background: rgba(45, 55, 72, 0.8);
          }
        }
      }
    }
    
    .no-operations {
      .placeholder-text {
        color: #718096;
      }
    }
    
    .nodeFooter {
      background: rgba(45, 55, 72, 0.8);
      border-top-color: rgba(255, 255, 255, 0.1);
      
      .nodeIdText {
        color: #a0aec0;
      }
    }
  }
  
  .vue-flow__handle {
    border-color: #63b3ed;
    background: #2d3748;
    
    &.isConnecting {
      border-color: #68d391;
      background: #68d391;
    }
  }
  
  .handle-plus-button {
    .plus-icon {
      color: #63b3ed;
      background: #2d3748;
      border-color: #63b3ed;
      
      &:hover {
        background: #63b3ed;
        color: #2d3748;
      }
    }
  }
  
  .deleteButton {
    background-color: #e53e3e;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);
    
    &:hover {
      background-color: #e53e3e;
      box-shadow: 0 6px 20px rgba(229, 62, 62, 0.5);
    }
    
    &:active {
      background-color: #c53030;
    }
  }
}
</style>
