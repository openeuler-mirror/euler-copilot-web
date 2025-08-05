<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object, // 目前定义的对象中只有label，description属性是有的，后续可能会有展开的情形
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
  // 外部传入的对话变量数据
  conversationVariables: {
    type: Array,
    default: () => [],
  },
});
const emits = defineEmits(['updateConnectHandle', 'editYamlDrawer', 'editStartNodeDrawer', 'insertNodeFromHandle']);

const statusList = ref(['running', 'success', 'error']);

const curStatus = ref('');

// 当前handle是否连接中[分别是target和source]
const handleTargetConnecting = ref(false);
const handleSourceConnecting = ref(false);

// Handle位置插入按钮的悬停状态
const sourceHandleHovered = ref(false);

// 设置当前正在连接
const setConnectStatus = (type) => {
  if (type === 'source') {
    handleSourceConnecting.value = true;
  } else {
    handleTargetConnecting.value = true;
  }
  // 更新当前节点handle连接状态
  emits('updateConnectHandle', props.id);
};

// 处理开始节点点击编辑
const handleStartNodeClick = () => {
  const isStartNode = props.data.name === '开始' || props.data.name === 'start';
  if (isStartNode) {
    // 使用nextTick确保DOM更新完成
    nextTick(() => {
      // 开始节点使用表单编辑器
      const startNodeParams = {
        input_parameters: props.data.parameters?.input_parameters || {},
        output_parameters: props.data.parameters?.output_parameters || {}
      };
      // 传递实际的节点描述，如果没有则传递空字符串
      const nodeDesc = props.data.description || '';
      emits('editStartNodeDrawer', props.data.name, nodeDesc, startNodeParams, props.id);
    });
  }
};

// 获取input params的键名数组，用于显示
const getInputParamKeys = () => {
  const inputParams = props.data.parameters?.input_parameters || {};
  return Object.keys(inputParams);
};

// 使用computed缓存对话级变量数据，优先使用外部传入的数据
const conversationVariables = computed(() => {
  // 优先使用外部传入的conversationVariables props
  if (props.conversationVariables && props.conversationVariables.length > 0) {
    return props.conversationVariables.map((variable: any) => ({
      name: variable.name,
      type: getVariableTypeDisplay(variable.var_type || variable.type || 'string'),
      value: variable.value
    }));
  }
  
  const variables = props.data.variables || props.data.parameters?.conversation_variables || {};
  
  if (!variables || Object.keys(variables).length === 0) {
    return [];
  }
  
  const result = Object.entries(variables).map(([key, value]: [string, any]) => ({
    name: key,
    type: getVariableTypeDisplay(value?.type || value?.var_type || (typeof value === 'object' && value !== null ? 'object' : typeof value)),
    value: value?.value !== undefined ? value.value : value
  }));
  
  return result;
});

// 判断是否为开始节点
const isStartNode = computed(() => {
  return props.data.name === '开始' || props.data.name === 'start';
});

// 判断是否为结束节点 
const isEndNode = computed(() => {
  return props.data.name === '结束' || props.data.name === 'end';
});

// 获取变量类型的显示名称
const getVariableTypeDisplay = (type: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Number', 
    'boolean': 'Boolean',
    'object': 'Object',
    'array_file': 'Array[File]',
    'array[file]': 'Array[File]',
    'array': 'Array',
    'secret': 'Secret'
  }
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

// 处理source handle插入节点事件
const handleSourceInsertNode = (event) => {
  event.stopPropagation();
  
  // 发射插入节点事件，传递节点信息和handle类型
  emits('insertNodeFromHandle', {
    nodeId: props.id,
    handleType: 'source',
    nodePosition: props.position
  });
};

// Handle悬停事件处理
const handleSourceHandleEnter = () => {
  sourceHandleHovered.value = true;
};

const handleSourceHandleLeave = () => {
  sourceHandleHovered.value = false;
};

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
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="customStartAndEndNode">
    <div class="customNodeStyle nodeSaEBorder" :class="[curStatus, { 'node-selected': selected }]">
      <Handle
        :class="{ isConnecting: handleTargetConnecting }"
        :type="props.data.target"
        @mousedown="setConnectStatus('target')"
        :position="Position[props.data.nodePosition]"
        :connectable-end="true"
      ></Handle>
      
      <!-- +按钮 - 只为开始节点显示source +按钮 -->
      <div 
        v-if="isStartNode"
        class="handle-plus-button source-plus"
        @mouseenter="handleSourceHandleEnter"
        @mouseleave="handleSourceHandleLeave"
        @click="handleSourceInsertNode"
      >
        <el-icon v-if="sourceHandleHovered" class="plus-icon">
          <Plus />
        </el-icon>
      </div>
      <div class="nodeSaEBorderBox" @click="handleStartNodeClick">
        <div class="saEContent">
          <div class="saEHeader">
            <div
              v-if="props.data.name === '开始' || props.data.name === 'start'"
              class="saEIcon startIcon"
            ></div>
            <div
              v-else-if="props.data.name === '结束' || props.data.name === 'end'"
              class="saEIcon endIcon"
            ></div>
            <div class="saEText" v-if="props.data.name === '开始'|| props.data.name === 'start'">{{ $t('main.start') }}</div>
            <div class="saEText" v-else-if="props.data.name === '结束'|| props.data.name === 'end'">{{ $t('main.end') }}</div>
          </div>
          
          <!-- 开始节点显示对话级变量 -->
          <div v-if="(props.data.name === '开始' || props.data.name === 'start') && conversationVariables.length > 0" class="conversationVariables">
            <div class="variableSection">
              <!-- 垂直排列所有conversation变量，每个在独立框中 -->
                          <div class="variableItem" v-for="(variable, index) in conversationVariables" :key="variable.name || index">
              <div class="variableContent">
                <span class="variablePrefix">{x} {{ variable.name }}</span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 开始和结束节点不需要footer -->
    </div>
  </div>
</template>

<style lang="scss">
.nodeSaEBorder {
  width: 160px !important; // 增加开始节点宽度以容纳更多变量
  border: 2px solid transparent;
  min-height: 56px;
  max-height: none; // 允许高度自适应
  background: var(--flow-bg-color);
  border-radius: 8px;
  background-clip: padding-box;
  box-sizing: border-box;
  border-radius: 10px;
  cursor: pointer; // 添加鼠标指针
  transition: all 0.3s ease; // 添加过渡效果
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .vue-flow__handle {
    right: 0px;
  }
  
  .nodeSaEBorderBox {
    padding: 12px;
    background: white;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    
    .saEContent {
      .saEHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        
        .saEIcon {
          width: 24px;
          height: 24px;
          
          &.startIcon {
            background: url('@/assets/svgs/flowStartIcon.svg') 100% 100% no-repeat;
          }
          
          &.endIcon {
            background: url('@/assets/svgs/flowEndIcon.svg') 100% 100% no-repeat;
          }
        }
        
        .saEText {
          font-size: 14px;
          color: var(--o-text-color-primary);
          font-weight: 500;
        }
      }
      
      .inputParams {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 8px;
        
        &:first-child {
          margin-top: 0;
        }
        
        .paramSection {
          display: flex;
          flex-direction: column;
          gap: 4px;
          
          .paramLabel {
            font-size: 10px;
            color: var(--o-text-color-placeholder);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .paramItem {
            font-size: 12px;
            color: var(--o-text-color-secondary);
            background: var(--o-fill-color-light);
            padding: 2px 6px;
            border-radius: 4px;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .moreParams {
            font-size: 12px;
            color: var(--o-text-color-placeholder);
            text-align: center;
          }
        }
      }
      
      .conversationVariables {
        margin-top: 8px;
        
        &:first-child {
          margin-top: 0;
        }
        
        .variableSection {
          display: flex;
          flex-direction: column;
          gap: 4px;
          
          .variableItem {
            background: rgba(64, 158, 255, 0.1);
            border: 1px solid rgba(64, 158, 255, 0.2);
            border-radius: 4px;
            padding: 4px 6px;
            margin-bottom: 2px;
            
            .variableContent {
              display: flex;
              flex-direction: column;
              gap: 2px;
              
              .variablePrefix {
                font-size: 10px;
                font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                color: var(--o-color-primary);
                font-weight: 500;
                line-height: 1.2;
                word-break: break-all;
              }
              
              .variableType {
                font-size: 8px;
                color: var(--o-text-color-secondary);
                text-transform: uppercase;
                font-weight: 500;
                opacity: 0.8;
              }
            }
          }
        }
      }
    }
  }
}

.nodeSaEBorder.success {
  .vue-flow__handle {
    margin-top: 0px;
  }
}

/* +按钮容器 - 独立定位，远离Handle */
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
  /* 调试时可以启用这个边框来查看触发区域 */
  /* border: 1px dashed rgba(99, 149, 253, 0.3); */
}



/* Source handle的+按钮位置 - 在节点右侧，触发区域延伸到节点边缘 */
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
  opacity: 0.9;
}

.handle-plus-button .plus-icon:hover {
  background: #6395fd;
  color: #ffffff;
  transform: scale(1.15);
  box-shadow: 0 5px 15px rgba(99, 149, 253, 0.6);
  opacity: 1;
}

/* 仅在节点悬停时显示+按钮 */
.nodeSaEBorder .handle-plus-button {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0.5s; /* 延迟隐藏 */
}

.nodeSaEBorder:hover .handle-plus-button,
.nodeSaEBorder .handle-plus-button:hover {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0s; /* 立即显示 */
}
</style>
