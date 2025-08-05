<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, computed, watch } from 'vue';
import NodeMirrorText from '../codeMirror/nodeMirrorText.vue';
import { CopyDocument, Delete, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { IconSuccess } from '@computing/opendesign-icons';
import { useI18n } from 'vue-i18n';
import { getSrcIcon } from '../types';

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
  position: {
    type: Object,
    required: false,
  },
  disabled: {
    type: Boolean,
    required: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['delNode', 'editYamlDrawer', 'updateConnectHandle', 'insertNodeFromHandle']);

const { t } = useI18n();

const statusList = ref(['running', 'success', 'error']);
const curStatus = ref('');
const costTime = ref('');

// 控制删除按钮文字显示
const showDeleteText = ref(false);

// 当前handle是否连接中[分别是target和source]
const handleTargetConnecting = ref(false);
const handleSourceConnecting = ref(false);

// Handle位置插入按钮的悬停状态
const sourceHandleHovered = ref(false);

// 定义传给mirror展示输入输出的存储量
const inputAndOutput = ref({
  input_parameters: {},
  output_parameters: {},
});

// 计算分支列表
const branches = computed(() => {
  const choices = props.data?.parameters?.input_parameters?.choices || [];
  return choices.map((choice, index) => {
    return {
      id: choice.branch_id || `branch_${index}`,
      name: choice.name || `分支 ${index + 1}`,
      isDefault: choice.is_default || false,
      conditions: choice.conditions || [],
      logic: choice.logic || 'and'
    };
  });
});

// 计算条件分支（非默认分支），保留所有非默认分支
const conditionalBranches = computed(() => {
  return branches.value.filter(branch => {
    // 保留非默认分支，不过滤空条件
    // 这样后端传来的is_default=false且条件为空的分支也能正确显示
    return !branch.isDefault;
  });
});

// 计算默认分支
const defaultBranch = computed(() => {
  return branches.value.find(branch => branch.isDefault);
});

// 处理节点点击事件
const handleNodeClick = (event) => {
  if (!props.disabled) {
    editYaml(props.data.name, props.data.description, props.data.parameters);
  }
};

// 监听数据变化
watch(
  () => props.data,
  () => {
    const isInclude = statusList.value.includes(props.data?.status);
    // 设置节点的状态
    if (!isInclude) {
      curStatus.value = 'default';
    } else {
      curStatus.value = props.data?.status;
    }
    
    // 节点调试消耗时间
    costTime.value = props.data?.constTime || '';
    
    // 默认的输入赋值
    inputAndOutput.value.input_parameters =
      props.data?.parameters?.input_parameters || {};
      
    // 判断是否有调试的输入输出
    if (props.data.content?.type === 'input') {
      inputAndOutput.value.input_parameters = props.data.content.params;
    } else if (props.data.content?.type === 'output') {
      inputAndOutput.value.output_parameters = props.data.content.params;
    } else {
      inputAndOutput.value.input_parameters =
        props.data?.parameters?.input_parameters || {};
      inputAndOutput.value.output_parameters =
        props.data?.parameters?.output_parameters || {};
    }
    
    // 重置Handle连接状态
    handleTargetConnecting.value = false;
    handleSourceConnecting.value = false;
  },
  { deep: true, immediate: true },
);

const delNode = (id) => {
  emits('delNode', id);
};

// 编辑条件分支
const editYaml = (nodeName, nodeDesc, yamlCode) => {
  emits('editYamlDrawer', nodeName, nodeDesc, yamlCode, props.id);
};

const handleCopyTextToclipboard = (text) => {
  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  ElMessage({
    showClose: true,
    message: t('feedback.copied_successfully'),
    icon: IconSuccess,
    customClass: 'o-message--success',
    duration: 2000,
  });
  document.body.removeChild(input);
};

// 设置当前正在连接[这里是使连接过程中，handle节点高亮]
const setConnectStatus = (type) => {
  if (type === 'source') {
    handleSourceConnecting.value = true;
  } else {
    handleTargetConnecting.value = true;
  }
  // 更新当前节点handle连接状态
  emits('updateConnectHandle', props.id);
};

// 操作符中文映射
const operatorLabels = {
  'string_equal': '等于',
  'string_not_equal': '不等于',
  'string_contains': '包含',
  'string_not_contains': '不包含',
  'string_starts_with': '开始于',
  'string_ends_with': '结束于',
  'string_length_equal': '长度等于',
  'string_length_greater_than': '长度大于',
  'string_length_greater_than_or_equal': '长度大于等于',
  'string_length_less_than': '长度小于',
  'string_length_less_than_or_equal': '长度小于等于',
  'string_regex_match': '正则匹配',
  'number_equal': '等于',
  'number_not_equal': '不等于',
  'number_greater_than': '大于',
  'number_less_than': '小于',
  'number_greater_than_or_equal': '大于等于',
  'number_less_than_or_equal': '小于等于',
  'list_equal': '等于',
  'list_not_equal': '不等于',
  'list_contains': '包含',
  'list_not_contains': '不包含',
  'list_length_equal': '长度等于',
  'list_length_greater_than': '长度大于',
  'list_length_greater_than_or_equal': '长度大于等于',
  'list_length_less_than': '长度小于',
  'list_length_less_than_or_equal': '长度小于等于',
  'bool_equal': '等于',
  'bool_not_equal': '不等于',
  'dict_equal': '等于',
  'dict_not_equal': '不等于',
  'dict_contains_key': '包含键',
  'dict_not_contains_key': '不包含键',
};

// 解析变量引用，提取变量名
const parseVariableReference = (variableRef) => {
  if (!variableRef || typeof variableRef !== 'string') {
    return '?';
  }
  
  // 先清理可能的 {{ }} 包装
  let cleanRef = variableRef.replace(/^\{\{(.*)\}\}$/, '$1').trim();
  
  // 格式: conversation.step_id.variable_name 或 scope.variable_name
  const parts = cleanRef.split('.');
  if (parts.length >= 2) {
    // 返回最后一部分作为变量名，并清理可能残留的 }}
    let variableName = parts[parts.length - 1];
    return variableName.replace(/\}\}$/, '');
  }
  
  return cleanRef.replace(/\}\}$/, '');
};

// 根据数据类型格式化值
const formatValueByType = (value, dataType, isReference = false) => {
  if (isReference) {
    return parseVariableReference(value);
  }
  
  if (!value && value !== 0 && value !== false) {
    return '?';
  }
  
  switch (dataType) {
    case 'string':
      return `"${value}"`;
    case 'number':
      return String(value);
    case 'bool':
      return String(value);
    case 'list':
      return Array.isArray(value) ? `[${value.join(', ')}]` : `[${value}]`;
    case 'dict':
      return typeof value === 'object' ? JSON.stringify(value) : `{${value}}`;
    default:
      return String(value);
  }
};

// 格式化条件显示
const formatConditions = (conditions, logic) => {
  if (!conditions || conditions.length === 0) {
    return '条件未设置';
  }
  
  // 过滤掉无效条件（left.value为null的条件）
  const validConditions = conditions.filter(condition => {
    return condition.left?.value && 
           condition.left.value !== '' && 
           condition.left.value !== null && 
           condition.left.value !== undefined;
  });
  
  if (validConditions.length === 0) {
    return '条件未设置';
  }
  
  const conditionTexts = validConditions.map(condition => {
    // 解析左值（变量）
    const leftValue = parseVariableReference(condition.left?.value);
    
    // 获取操作符中文
    const operatorLabel = operatorLabels[condition.operate] || condition.operate || '==';
    
    // 解析右值
    const isRightReference = condition.right?.type === 'reference';
    const rightValue = formatValueByType(
      condition.right?.value, 
      condition.dataType || 'string',
      isRightReference
    );
    
    return `${leftValue} ${operatorLabel} ${rightValue}`;
  });
  
  const logicText = logic === 'and' ? ' 且 ' : ' 或 ';
  return conditionTexts.join(logicText);
};

// 格式化条件显示为HTML（带标签样式）
const formatConditionsHtml = (conditions, logic) => {
  if (!conditions || conditions.length === 0) {
    return '<span class="no-condition">条件未设置</span>';
  }
  
  // 过滤掉无效条件（left.value为null的条件）
  const validConditions = conditions.filter(condition => {
    return condition.left?.value && 
           condition.left.value !== '' && 
           condition.left.value !== null && 
           condition.left.value !== undefined;
  });
  
  if (validConditions.length === 0) {
    return '<span class="no-condition">条件未设置</span>';
  }
  
  const conditionTexts = validConditions.map(condition => {
    // 解析左值（变量）- 添加标签样式
    const leftValue = parseVariableReference(condition.left?.value);
    const leftHtml = `<span class="variable-tag">${leftValue}</span>`;
    
    // 获取操作符中文 - 添加操作符样式
    const operatorLabel = operatorLabels[condition.operate] || condition.operate || '==';
    const operatorHtml = `<span class="operator-text">${operatorLabel}</span>`;
    
    // 解析右值 - 根据类型添加不同样式
    const isRightReference = condition.right?.type === 'reference';
    const rightValue = formatValueByType(
      condition.right?.value, 
      condition.dataType || 'string',
      isRightReference
    );
    
    let rightHtml;
    if (isRightReference) {
      rightHtml = `<span class="variable-tag">${rightValue}</span>`;
    } else {
      rightHtml = `<span class="value-text ${condition.dataType || 'string'}-value">${rightValue}</span>`;
    }
    
    return `${leftHtml} ${operatorHtml} ${rightHtml}`;
  });
  
  const logicText = logic === 'and' ? ' <span class="logic-text">且</span> ' : ' <span class="logic-text">或</span> ';
  return conditionTexts.join(logicText);
};

// 处理source handle插入节点事件
const handleSourceInsertNode = (event) => {
  event.stopPropagation();
  if (props.disabled) {
    return;
  }
  
  // 发射插入节点事件，传递节点信息和handle类型
  emits('insertNodeFromHandle', {
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

// 分支+按钮处理 - 悬停状态现在通过CSS控制

// 处理分支特定的插入节点事件
const handleBranchInsertNode = (event: Event, branchId: string) => {
  event.stopPropagation();
  if (props.disabled) {
    return;
  }
  
  // 发射插入节点事件，传递节点信息、handle类型和特定分支ID
  emits('insertNodeFromHandle', {
    nodeId: props.id,
    handleType: 'source',
    nodePosition: props.position,
    branchId: branchId // 传递特定的分支ID
  });
};
</script>

<template>
  <div class="choiceBranchNodeStyle" :class="[curStatus, { 'node-selected': selected }]">
    <!-- 左侧输入handle -->
    <Handle
      :class="{ isConnecting: handleTargetConnecting }"
      @mousedown="setConnectStatus('target')"
      type="target"
      :position="Position.Left"
    ></Handle>
    


    <div class="nodeContainer">
      <!-- 节点主体 -->
      <div class="nodeBox" @click="handleNodeClick($event)">
        <!-- 节点标题 -->
        <div class="title" v-if="props.data.name">
          <div class="iconLabel">
            <img
              class="iconStyle"
              v-if="props.data.nodeId"
              :src="getSrcIcon(props.data)"
            />
            <div class="iconStyle choiceIcon" v-else>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8z"/>
                <path fill="currentColor" d="M12 7a1 1 0 0 0-1 1v4H8a1 1 0 0 0 0 2h3v3a1 1 0 0 0 2 0v-3h3a1 1 0 0 0 0-2h-3V8a1 1 0 0 0-1-1z"/>
              </svg>
            </div>
            <div class="label">{{ props.data.name }}</div>
          </div>
        </div>

        <!-- 分支列表 -->
        <div class="branchList" v-if="branches.length > 0">
          <!-- 条件分支 -->
          <div 
            class="branchItem" 
            v-for="(branch, index) in conditionalBranches" 
            :key="branch.id"
          >
            <div class="branchHeader">
              <span class="caseLabel">CASE {{ index + 1 }}</span>
              <div class="branchTypeLabel if-label">{{ index === 0 ? 'IF' : 'ELIF' }}</div>
            </div>
            <div class="branchContent">
              <div class="branchCondition">
                <span v-html="formatConditionsHtml(branch.conditions, branch.logic)"></span>
              </div>
            </div>

            <!-- 右侧输出handle -->
            <Handle
              class="sourceHandle"
              :id="branch.id"
              type="source"
              :position="Position.Right"
              @mousedown="setConnectStatus('source')"
              :class="{ isConnecting: handleSourceConnecting }"
            ></Handle>

            <!-- 分支特定的+按钮 -->
            <div 
              v-if="!props.disabled"
              class="branch-plus-button"
              @click="handleBranchInsertNode($event, branch.id)"
            >
              <el-icon class="plus-icon">
                <Plus />
              </el-icon>
            </div>
          </div>
          
          <!-- 默认分支 ELSE -->
          <div 
            class="branchItem"
            v-if="defaultBranch"
            :key="defaultBranch.id"
          >
            <div class="branchHeader">
              <span class="caseLabel">ELSE</span>
              <div class="branchTypeLabel else-label">ELSE</div>
            </div>
            <div class="branchContent">
              <div class="branchCondition">
                <span class="defaultText">其他所有情况</span>
              </div>
            </div>

            <!-- 右侧输出handle -->
            <Handle
              class="sourceHandle"
              :id="defaultBranch.id"
              type="source"
              :position="Position.Right"
              @mousedown="setConnectStatus('source')"
              :class="{ isConnecting: handleSourceConnecting }"
            ></Handle>

            <!-- ELSE分支特定的+按钮 -->
            <div 
              v-if="!props.disabled"
              class="branch-plus-button"
              @click="handleBranchInsertNode($event, defaultBranch.id)"
            >
              <el-icon class="plus-icon">
                <Plus />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="emptyBranches" v-else>
          <div class="emptyText">点击编辑添加分支条件</div>
        </div>
      </div>
      
      <!-- 节点底部信息 -->
      <div class="nodeFooter" v-if="props.id">
        <div class="nodeIdText">
          <span>{{ props.id }}</span>
        </div>
        <el-icon
          class="copydocument"
          @click="handleCopyTextToclipboard(props.id)"
        >
          <CopyDocument />
        </el-icon>
      </div>

      <!-- 调试结果显示 -->
      <NodeMirrorText
        v-if="curStatus !== 'default'"
        :status="curStatus"
        :costTime="costTime"
        :inputAndOutput="inputAndOutput"
        style="display: block"
      ></NodeMirrorText>
    </div>
    
    <!-- 右上角删除按钮小卡片 -->
    <div class="deleteCardWrapper" v-if="!props.disabled">
      <div class="deleteCard">
        <button
          class="deleteButton"
          @click="delNode(props.id)"
          :title="$t('semantic.interface_delete')"
          @mouseenter="showDeleteText = true"
          @mouseleave="showDeleteText = false"
        >
          <el-icon class="delete-icon">
            <Delete />
          </el-icon>
          <span class="delete-text" v-show="showDeleteText">{{ $t('semantic.interface_delete') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.choiceBranchNodeStyle {
  position: relative;
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 320px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #6395fd;
    box-shadow: 0 4px 12px rgba(99, 149, 253, 0.2);
    
    .deleteCardWrapper {
      opacity: 1;
    }
  }

  &.node-selected {
    border-color: #6395fd;
    box-shadow: 0 0 0 2px rgba(99, 149, 253, 0.2);
  }

  // 状态样式
  &.running {
    border-color: #f39c12;
    .title .iconStyle {
      color: #f39c12;
    }
  }

  &.success {
    border-color: #27ae60;
    .title .iconStyle {
      color: #27ae60;
    }
  }

  &.error {
    border-color: #e74c3c;
    .title .iconStyle {
      color: #e74c3c;
    }
  }

  .nodeContainer {
    position: relative;
    z-index: 1;
  }

  .nodeBox {
    padding: 16px;
    cursor: pointer;
  }

  .title {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    
    .iconLabel {
      display: flex;
      align-items: center;
    }

    .iconStyle {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6395fd;
      
      &.choiceIcon {
        background: rgba(99, 149, 253, 0.1);
        border-radius: 4px;
      }
    }

    .label {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: #24292e;
    }
  }

  .branchList {
    .branchItem {
      position: relative;
      margin-bottom: 2px;
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 6px;
      transition: all 0.2s ease;
      overflow: visible;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        border-color: #6395fd;
        box-shadow: 0 1px 4px rgba(99, 149, 253, 0.1);

        // 重要：分支项悬停时显示+按钮
        .branch-plus-button {
          opacity: 1;
          visibility: visible;
          transition: opacity 0.2s ease 0s, visibility 0s ease 0s;
        }
      }

      .branchHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px 4px 12px;
        
        .caseLabel {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .branchTypeLabel {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          
          &.if-label {
            background: #3b82f6;
            color: #ffffff;
          }
          
          &.else-label {
            background: #f59e0b;
            color: #ffffff;
          }
        }
      }

      .branchContent {
        padding: 0 12px 8px 12px;
        margin-right: 20px;
      }

      .branchCondition {
        font-size: 12px;
        color: #374151;
        line-height: 1.4;
        word-break: break-word;
        
        // 变量标签样式
        :deep(.variable-tag) {
          display: inline-block;
          padding: 2px 6px;
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: #1565c0;
          margin: 0 2px;
        }
        
        // 操作符文本样式
        :deep(.operator-text) {
          display: inline-block;
          padding: 1px 4px;
          font-weight: 600;
          color: #5c6ac4;
          margin: 0 4px;
        }
        
        // 逻辑连接符样式
        :deep(.logic-text) {
          display: inline-block;
          padding: 1px 4px;
          font-weight: 600;
          color: #ed6c02;
          margin: 0 4px;
        }
        
        // 值文本样式
        :deep(.value-text) {
          display: inline-block;
          padding: 1px 4px;
          font-weight: 500;
          margin: 0 2px;
          
          &.string-value {
            color: #2e7d32;
            font-style: italic;
          }
          
          &.number-value {
            color: #d32f2f;
            font-weight: 600;
          }
          
          &.bool-value {
            color: #7b1fa2;
            font-weight: 600;
          }
          
          &.list-value,
          &.dict-value {
            color: #f57c00;
            font-family: monospace;
          }
        }
        
        // 无条件状态样式
        :deep(.no-condition) {
          color: #9e9e9e;
          font-style: italic;
        }
        
        // 默认分支文本样式
        .defaultText {
          color: #6b7280;
          font-style: italic;
        }
      }

      .sourceHandle {
        position: absolute;
        top: 50%;
        right: -6px;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        background: #c3cedf;
        border: 2px solid #ffffff;
        border-radius: 50%;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 10;
        
        &.isConnecting {
          background: #6395fd;
          width: 14px;
          height: 14px;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
        }
        
        &:hover {
          background: #6395fd;
          width: 14px;
          height: 14px;
          box-shadow: 0 2px 8px rgba(99, 149, 253, 0.3);
        }
      }

      /* 每个分支的+按钮 */
      .branch-plus-button {
        position: absolute;
        top: 50%;
        right: -25px;
        transform: translate(50%, -50%);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 15;
        pointer-events: auto;
        transition: all 0.2s ease;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease 0s, visibility 0s ease 0.5s;

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

        // +按钮自身悬停时也显示
        &:hover {
          opacity: 1;
          visibility: visible;
          transition: opacity 0.2s ease 0s, visibility 0s ease 0s;
        }
      }
    }
  }

  .emptyBranches {
    padding: 20px;
    text-align: center;
    color: #6b7280;
    background: #f9fafb;
    border: 2px dashed #d1d5db;
    border-radius: 6px;
    
    .emptyText {
      font-size: 13px;
      font-style: italic;
    }
  }

  .nodeFooter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 0 0 8px 8px;
    
    .nodeIdText {
      font-size: 11px;
      color: #6b7280;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    
    .copydocument {
      font-size: 12px;
      color: #6b7280;
      cursor: pointer;
      
      &:hover {
        color: #6395fd;
      }
    }
  }

  // Handle样式覆盖
  :deep(.vue-flow__handle-left) {
    background: #c3cedf;
    border: 2px solid #ffffff;
    width: 12px;
    height: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 10;
    transition: all 0.2s ease;
    
    &.isConnecting {
      background: #6395fd;
      width: 14px;
      height: 14px;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
    }
    
    &:hover {
      background: #6395fd;
      width: 14px;
      height: 14px;
      box-shadow: 0 2px 8px rgba(99, 149, 253, 0.3);
    }
  }

  // 删除按钮样式
  .deleteCardWrapper {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s;
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
    
    &:hover {
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
    
    &:active {
      background-color: #e6a23c;
      box-shadow: 0 2px 8px rgba(245, 108, 108, 0.6);
      transform: scaleX(1) translateY(0);
    }
    
    &:focus {
      outline: 2px solid #f56c6c40;
      outline-offset: 2px;
    }
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
}

// 深色主题支持
.dark {
  .choiceBranchNodeStyle {
    background: #1f2937;
    border-color: #374151;
    
    .title .label {
      color: #f3f4f6;
    }
    
    .branchItem {
      background: #374151;
      border-color: #4b5563;
      
      &:hover {
        border-color: #6395fd;
      }
      
      .branchHeader .caseLabel {
        color: #9ca3af;
      }
      
      .branchCondition {
        color: #d1d5db;
        
        // 深色主题下的变量标签样式
        :deep(.variable-tag) {
          background: #1e3a8a;
          border-color: #3b82f6;
          color: #93c5fd;
        }
        
        // 深色主题下的操作符文本样式
        :deep(.operator-text) {
          color: #a5b4fc;
        }
        
        // 深色主题下的逻辑连接符样式
        :deep(.logic-text) {
          color: #fb923c;
        }
        
        // 深色主题下的值文本样式
        :deep(.value-text) {
          &.string-value {
            color: #86efac;
          }
          
          &.number-value {
            color: #fca5a5;
          }
          
          &.bool-value {
            color: #d8b4fe;
          }
          
          &.list-value,
          &.dict-value {
            color: #fdba74;
          }
        }
        
        // 深色主题下的无条件状态样式
        :deep(.no-condition) {
          color: #6b7280;
        }
        
        // 深色主题下的默认分支文本样式
        .defaultText {
          color: #9ca3af;
          font-style: italic;
        }
      }
      
      .sourceHandle {
        background: #6395fd;
        border-color: #374151;
        
        &.isConnecting {
          background: #4f46e5;
          border-color: #374151;
        }
      }
    }
    
    .emptyBranches {
      background: #374151;
      border-color: #4b5563;
      color: #9ca3af;
    }
    
    .nodeFooter {
      background: #374151;
      border-color: #4b5563;
      
      .nodeIdText {
        color: #9ca3af;
      }
    }
    
    // 深色主题下的Handle样式
    :deep(.vue-flow__handle-left) {
      background: #6395fd;
      border-color: #374151;
      
      &.isConnecting {
        background: #4f46e5;
        border-color: #374151;
      }
    }
  }
}
</style> 