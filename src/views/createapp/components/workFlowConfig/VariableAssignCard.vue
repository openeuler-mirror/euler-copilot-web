<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox, ElButton, ElSelect, ElOption, ElInput } from 'element-plus';
import { Plus, Delete, Refresh } from '@element-plus/icons-vue';
import VariableChooser from '@/components/VariableChooser.vue';

// 类型定义
interface VariableOperation {
  id: string;
  variable_name: string;
  operation: string;
  value: any;
  variable_type: string; // 变量类型
  is_value_reference: boolean; // 值是否为变量引用
}

interface Props {
  operation: VariableOperation;
  operationIndex: number;
  flowId: string;
  conversationId: string;
  currentStepId: string;
  showOperationDelete: boolean;
  selfVariables: any[];
  selfScopeLabel: string;
}

const props = withDefaults(defineProps<Props>(), {
  showOperationDelete: true,
  selfVariables: () => [],
  selfScopeLabel: '',
});

const emit = defineEmits(['removeOperation', 'updateOperation']);

// 变量类型选项
const variableTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数值', value: 'number' },
  { label: '数组', value: 'array' },
];

// 操作选项映射
const operationOptions = {
  string: [
    { label: '覆盖', value: 'overwrite' },
    { label: '清空', value: 'clear' },
  ],
  number: [
    { label: '覆盖', value: 'overwrite' },
    { label: '加法', value: 'add' },
    { label: '减法', value: 'subtract' },
    { label: '乘法', value: 'multiply' },
    { label: '除法', value: 'divide' },
    { label: '求余', value: 'modulo' },
    { label: '乘幂', value: 'power' },
    { label: '开方', value: 'sqrt' },
    { label: '清空', value: 'clear' },
  ],
  array: [
    { label: '覆盖', value: 'overwrite' },
    { label: '清空', value: 'clear' },
    { label: '追加', value: 'append' },
    { label: '扩展', value: 'extend' },
    { label: '移除首项', value: 'pop_first' },
    { label: '移除尾项', value: 'pop_last' },
  ],
};

// 不需要值输入的操作
const operationsWithoutValue = ['clear', 'sqrt', 'pop_first', 'pop_last'];

// 获取当前变量类型的操作选项
const getOperationOptions = (variableType: string) => {
  return operationOptions[variableType] || operationOptions.string;
};

// 判断当前操作是否需要值输入
const needsValueInput = computed(() => {
  return !operationsWithoutValue.includes(props.operation.operation);
});

// 删除操作
const removeOperation = () => {
  if (!props.showOperationDelete) {
    ElMessage.warning('操作不可删除');
    return;
  }
  
  emit('removeOperation', props.operationIndex);
};

// 处理变量类型变化
const handleVariableTypeChange = (variableType: string) => {
  const updatedOperation = { ...props.operation };
  updatedOperation.variable_type = variableType;
  
  // 重置操作为该类型的第一个
  const operations = getOperationOptions(variableType);
  if (operations.length > 0) {
    updatedOperation.operation = operations[0].value;
  }
  
  // 重置值
  updatedOperation.value = '';
  updatedOperation.is_value_reference = false;
  
  emit('updateOperation', props.operationIndex, updatedOperation);
};

// 处理操作变化
const handleOperationChange = (operation: string) => {
  const updatedOperation = { ...props.operation };
  updatedOperation.operation = operation;
  
  // 如果是不需要值的操作，清空值
  if (operationsWithoutValue.includes(operation)) {
    updatedOperation.value = '';
    updatedOperation.is_value_reference = false;
  }
  
  emit('updateOperation', props.operationIndex, updatedOperation);
};

// 处理变量选择
const handleVariableSelected = (variable: any, reference: string) => {
  const updatedOperation = { ...props.operation };
  updatedOperation.variable_name = reference;
  
  // 根据选中的变量自动设置变量类型
  if (variable.var_type) {
    const varType = variable.var_type;
    if (varType === 'string') {
      updatedOperation.variable_type = 'string';
    } else if (varType === 'number') {
      updatedOperation.variable_type = 'number';
    } else if (varType.includes('array')) {
      updatedOperation.variable_type = 'array';
    } else {
      updatedOperation.variable_type = 'string'; // 默认
    }
    
    // 更新操作为新类型的第一个
    const operations = getOperationOptions(updatedOperation.variable_type);
    if (operations.length > 0) {
      updatedOperation.operation = operations[0].value;
    }
  }
  
  emit('updateOperation', props.operationIndex, updatedOperation);
};

// 处理值引用切换
const handleValueReferenceToggle = (isReference: boolean) => {
  const updatedOperation = { ...props.operation };
  updatedOperation.is_value_reference = isReference;
  updatedOperation.value = '';
  
  emit('updateOperation', props.operationIndex, updatedOperation);
};

// 处理值变量选择
const handleValueVariableSelected = (variable: any, reference: string) => {
  const updatedOperation = { ...props.operation };
  updatedOperation.value = reference;
  
  emit('updateOperation', props.operationIndex, updatedOperation);
};

// 处理值输入变化
const handleValueChange = (value: any) => {
  const updatedOperation = { ...props.operation };
  updatedOperation.value = value;
  
  emit('updateOperation', props.operationIndex, updatedOperation);
};
</script>

<template>
  <div class="variable-assign-card">
    <div class="operation-container">
      <div class="operation-setting-col">
        <!-- 第一行：变量选择 + 变量类型 + 操作类型 -->
        <div class="operation-row variable-row">
          <div class="variable-section">
            <VariableChooser
              v-model="operation.variable_name"
              :flow-id="flowId"
              :conversation-id="conversationId"
              :current-step-id="currentStepId"
              :show-actions="false"
              :show-variable-info="false"
              :show-label="false"
              :hide-border="true"
              :no-border-radius="true"
              :transparent-background="true"
              :self-variables="selfVariables"
              :self-scope-label="selfScopeLabel"
              output-format="raw"
              selector-placeholder="选择要操作的变量"
              @variable-selected="handleVariableSelected"
            />
          </div>
          
          <!-- 变量类型选择 -->
          <el-select
            :model-value="operation.variable_type || 'string'"
            @update:model-value="handleVariableTypeChange"
            size="small"
            class="type-select"
            placeholder="类型"
          >
            <el-option
              v-for="option in variableTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          
          <!-- 操作选择 -->
          <el-select
            :model-value="operation.operation"
            @update:model-value="handleOperationChange"
            size="small"
            class="operation-select"
            placeholder="操作"
          >
            <el-option
              v-for="option in getOperationOptions(operation.variable_type || 'string')"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <!-- 第二行：值输入（仅在需要时显示） -->
        <div v-if="needsValueInput" class="operation-row value-row">
          <div class="value-section">
            <!-- 变量引用模式 -->
            <div v-if="operation.is_value_reference" class="reference-input">
              <VariableChooser
                v-model="operation.value"
                :flow-id="flowId"
                :conversation-id="conversationId"
                :current-step-id="currentStepId"
                :show-actions="false"
                :show-variable-info="false"
                :show-label="false"
                :hide-border="true"
                :no-border-radius="true"
                :transparent-background="true"
                :self-variables="selfVariables"
                :self-scope-label="selfScopeLabel"
                output-format="raw"
                selector-placeholder="选择值变量"
                @variable-selected="handleValueVariableSelected"
              />
            </div>
            
            <!-- 直接输入模式 -->
            <div v-else class="direct-input">
              <el-input
                :model-value="operation.value"
                @update:model-value="handleValueChange"
                size="small"
                :placeholder="`输入${variableTypeOptions.find(t => t.value === operation.variable_type)?.label || '值'}`"
                style="flex: 1;"
              />
            </div>
          </div>
          
          <div class="toggle-section">
            <el-button
              size="small"
              type="default"
              @click="handleValueReferenceToggle(!operation.is_value_reference)"
              :icon="Refresh"
            >
              {{ operation.is_value_reference ? '变量引用' : '输入值' }}
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 删除按钮列 -->
      <div v-if="showOperationDelete" class="operation-delete-col">
        <button
          class="danger-button"
          @click="removeOperation"
          type="button"
          title="删除操作"
        >
          <Delete />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.variable-assign-card {
  border-radius: 8px;
  margin-bottom: 16px;
  background: #ffffff;
  
  .operation-container {
    position: relative;
    padding: 16px 0;
    
    .operation-setting-col {
      flex: 1;
      min-width: 0;
      background: #f8f9fa;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      transition: background-color 0.2s ease;
      margin-right: 16px;
    }
    
    .operation-delete-col {
      flex-shrink: 0;
      display: flex;
      align-items: flex-start;
      padding-top: 8px;
      position: absolute;
      right: 0;
      top: 16px;
    }
    
    // 当包含的删除按钮hover时，改变operation-setting-col的背景色
    &:has(.danger-button:hover) .operation-setting-col {
      background-color: var(--el-color-danger-light-9);
    }
    
    .operation-row {
      margin: 0;
      display: flex;
      align-items: flex-end;
      gap: 0;
      padding: 6px 0;
      
      &:not(:last-child) {
        border-bottom: 1px solid #e4e7ed;
        margin-left: 2px;
        margin-right: 2px;
        padding-left: 0;
        padding-right: 0;
      }
      
      &.variable-row {
        gap: 12px;
        
        .variable-section {
          flex: 2;
          border-right: 1px solid #e4e7ed;
          padding-right: 12px;
        }
        
        .type-select {
          flex: 0 0 25%;
          border-right: 1px solid #e4e7ed;
          padding-right: 12px;
          
          :deep(.el-select__wrapper) {
            border: none;
            box-shadow: none;
            background: transparent;
            border-radius: 0;
          }
        }
        
        .operation-select {
          flex: 0 0 25%;
          
          :deep(.el-select__wrapper) {
            border: none;
            box-shadow: none;
            background: transparent;
            border-radius: 0;
          }
        }
      }
      
      &.value-row {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        
        .value-section {
          flex: 1;
          min-width: 0;
          border-right: 1px solid #e4e7ed;
          padding-right: 12px;
          
          .reference-input,
          .direct-input {
            :deep(.el-select__wrapper),
            :deep(.el-input__wrapper) {
              border: none;
              box-shadow: none;
              background: transparent;
              border-radius: 0;
            }
          }
        }
        
        .toggle-section {
          flex-shrink: 0;
          
          .el-button {
            border: none;
            background: transparent;
            color: #409eff;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 0;
            margin-right: 8px;
            
            &:hover {
              background: rgba(64, 158, 255, 0.1);
            }
            
            &:focus {
              box-shadow: none;
            }
          }
        }
      }
    }
  }
}

// 深色主题支持
.dark {
  .variable-assign-card {
    background: #374151;
    
    .operation-container {
      .operation-setting-col {
        background: #4b5563;
        border-color: #6b7280;
        
        .operation-row {
          &:not(:last-child) {
            border-bottom-color: #6b7280;
          }
          
          &.variable-row {
            .variable-section {
              border-right-color: #6b7280;
            }
            
            .type-select {
              border-right-color: #6b7280;
            }
          }
          
          &.value-row {
            .value-section {
              border-right-color: #6b7280;
            }
            
            .toggle-section .el-button {
              color: #3b82f6;
              
              &:hover {
                background: rgba(59, 130, 246, 0.2);
              }
            }
          }
        }
      }
    }
  }
}

// 危险按钮样式
.danger-button {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--el-color-danger);
  
  &:hover {
    color: var(--el-color-danger-light-3);
    background-color: var(--el-color-danger-light-8);
  }
  
  &:active {
    color: var(--el-color-danger-dark-2);
    background-color: var(--el-color-danger-light-7);
  }
  
  &:focus {
    outline: 2px solid var(--el-color-danger-light-6);
    outline-offset: 1px;
    background-color: var(--el-color-danger-light-8);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
}

// 确保VariableChooser组件样式适配
:deep(.variable-chooser) {
  .variable-row {
    margin-bottom: 0;
    
    .variable-name-section {
      display: none;
    }
    
    .variable-selector-section {
      flex: 1;
      min-width: 0 !important;
      
      .field-label {
        display: none;
      }
    }
    
    .actions-section {
      display: none;
    }
  }
  
  .variable-info {
    display: none;
  }
}
</style> 