<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox, ElButton, ElSelect, ElOption, ElInput, ElSwitch } from 'element-plus';
import { Plus, Delete, Refresh } from '@element-plus/icons-vue';
import { v4 as uuidv4 } from 'uuid';
import VariableChooser from '@/components/VariableChooser.vue';

// 类型定义
interface Condition {
  id: string;
  left: {
    type: string; // 第一行固定为 'reference'
    value: any;
  };
  right: {
    type: string; // 'reference' 或具体数据类型
    value: any;
  };
  operate: string;
  dataType: string; // 新增字段：选择的数据类型
  isRightReference: boolean; // 新增字段：右值是否为变量引用
}

interface ChoiceBranch {
  branch_id: string;
  name: string;
  logic: string;
  conditions: Condition[];
  is_default: boolean;
}

interface ValueTypeOption {
  label: string;
  value: string;
}

interface OperatorOption {
  label: string;
  value: string;
}

const props = defineProps({
  choice: {
    type: Object as () => ChoiceBranch,
    required: true,
  },
  choiceIndex: {
    type: Number,
    required: true,
  },
  valueTypeOptions: {
    type: Array as () => ValueTypeOption[],
    required: true,
  },
  operatorOptions: {
    type: Object as () => Record<string, OperatorOption[]>,
    required: true,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
  flowId: {
    type: String,
    default: '',
  },
  conversationId: {
    type: String,
    default: '',
  },
  currentStepId: {
    type: String,
    default: '',
  },
  showConditionDelete: {
    type: Boolean,
    default: true,
  },
  showCaseTitle: {
    type: Boolean,
    default: true,
  },
  showBranchDelete: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['removeBranch', 'addCondition', 'removeCondition', 'toggleLogic', 'updateCondition']);

// 数据类型选项（基于后端schemas）
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数值', value: 'number' },
  { label: '数组', value: 'list' },
  { label: '布尔值', value: 'bool' },
  { label: '对象', value: 'dict' },
];

// 基于后端schemas的操作符配置
const operatorOptionsByType = {
  string: [
    { label: '等于', value: 'string_equal' },
    { label: '不等于', value: 'string_not_equal' },
    { label: '包含', value: 'string_contains' },
    { label: '不包含', value: 'string_not_contains' },
    { label: '开始于', value: 'string_starts_with' },
    { label: '结束于', value: 'string_ends_with' },
    { label: '长度等于', value: 'string_length_equal' },
    { label: '长度大于', value: 'string_length_greater_than' },
    { label: '长度大于等于', value: 'string_length_greater_than_or_equal' },
    { label: '长度小于', value: 'string_length_less_than' },
    { label: '长度小于等于', value: 'string_length_less_than_or_equal' },
    { label: '正则匹配', value: 'string_regex_match' },
  ],
  number: [
    { label: '等于', value: 'number_equal' },
    { label: '不等于', value: 'number_not_equal' },
    { label: '大于', value: 'number_greater_than' },
    { label: '小于', value: 'number_less_than' },
    { label: '大于等于', value: 'number_greater_than_or_equal' },
    { label: '小于等于', value: 'number_less_than_or_equal' },
  ],
  list: [
    { label: '等于', value: 'list_equal' },
    { label: '不等于', value: 'list_not_equal' },
    { label: '包含', value: 'list_contains' },
    { label: '不包含', value: 'list_not_contains' },
    { label: '长度等于', value: 'list_length_equal' },
    { label: '长度大于', value: 'list_length_greater_than' },
    { label: '长度大于等于', value: 'list_length_greater_than_or_equal' },
    { label: '长度小于', value: 'list_length_less_than' },
    { label: '长度小于等于', value: 'list_length_less_than_or_equal' },
  ],
  bool: [
    { label: '等于', value: 'bool_equal' },
    { label: '不等于', value: 'bool_not_equal' },
  ],
  dict: [
    { label: '等于', value: 'dict_equal' },
    { label: '不等于', value: 'dict_not_equal' },
    { label: '包含键', value: 'dict_contains_key' },
    { label: '不包含键', value: 'dict_not_contains_key' },
  ],
};

// 获取分支标题
const getBranchTitle = computed(() => {
  if (props.choice.is_default) {
    return 'ELSE';
  }
  return props.choiceIndex === 0 ? 'IF' : 'ELIF';
});

// 获取 Case 编号
const getCaseNumber = (index: number) => {
  return `CASE ${index + 1}`;
};

// 计算 conditions-bracket 的高度
const getBracketHeight = computed(() => {
  const conditionCount = props.choice.conditions.length;
  
  // 更精确的高度计算：
  // 每个条件项包含：
  // - 上下 padding: 16px * 2 = 32px
  // - 两行内容（变量行 + 值行）：约 32px * 2 = 64px  
  // - 行间距：12px
  // 总计约 108px 每个条件项
  const conditionItemHeight = 107;
  
  // 总高度 = 条件项高度 * 数量 + 按钮区域高度
  return conditionCount * conditionItemHeight;
});

// 计算连接线的高度
const getConnectingLineHeight = computed(() => {
  const conditionCount = props.choice.conditions.length;
  
  if (conditionCount <= 1) {
    return 0; // 只有一个条件项时不需要连接线
  }
  
  const conditionItemHeight = 107;
  
  // 连接线从第一个条件项中心到最后一个条件项中心
  // 高度 = (条件项数量 - 1) * 条件项高度
  return (conditionCount - 1) * conditionItemHeight;
});

// 获取操作符选项
const getOperatorOptions = (dataType: string) => {
  return operatorOptionsByType[dataType] || operatorOptionsByType.string;
};

// 添加条件
const addCondition = () => {
  emit('addCondition', props.choiceIndex);
};

// 删除条件
const removeCondition = (conditionIndex: number) => {
  if (props.choice.conditions.length <= 1) {
    // 只有一个条件时，检查是否允许删除条件
    if (!props.showConditionDelete) {
      ElMessage.warning('条件不可删除');
      return;
    }
    // 如果can-delete为false且showConditionDelete为true，仍然不允许删除最后一个条件
    if (!props.canDelete) {
      ElMessage.warning('每个分支至少需要一个条件');
      return;
    }
  }
  emit('removeCondition', props.choiceIndex, conditionIndex);
};

// 切换逻辑运算符
const toggleLogic = () => {
  emit('toggleLogic', props.choiceIndex);
};

// 删除分支
const removeBranch = async () => {
  if (!props.canDelete) {
    ElMessage.warning('至少需要保留一个条件分支');
    return;
  }
  
  try {
    await ElMessageBox.confirm('确定要删除这个分支吗？', '确认删除', {
      type: 'warning',
    });
    
    emit('removeBranch', props.choiceIndex);
  } catch {
    // 用户取消删除
  }
};

// 处理数据类型变化
const handleDataTypeChange = (conditionIndex: number, dataType: string) => {
  const condition = props.choice.conditions[conditionIndex];
  condition.dataType = dataType;
  
  // 重置操作符为该类型的第一个
  const operators = getOperatorOptions(dataType);
  if (operators.length > 0) {
    condition.operate = operators[0].value;
  }
  
  // 如果右值不是变量引用，更新右值类型
  if (!condition.isRightReference) {
    condition.right.type = dataType;
    condition.right.value = '';
  }
  
  emit('updateCondition', props.choiceIndex, conditionIndex, condition);
};

// 处理操作符变化
const handleOperatorChange = (conditionIndex: number, operator: string) => {
  const condition = props.choice.conditions[conditionIndex];
  condition.operate = operator;
  emit('updateCondition', props.choiceIndex, conditionIndex, condition);
};

// 处理右值引用切换
const handleRightReferenceToggle = (conditionIndex: number, isReference: boolean) => {
  const condition = props.choice.conditions[conditionIndex];
  condition.isRightReference = isReference;
  
  if (isReference) {
    condition.right.type = 'reference';
    condition.right.value = '';
  } else {
    condition.right.type = condition.dataType;
    condition.right.value = '';
  }
  
  emit('updateCondition', props.choiceIndex, conditionIndex, condition);
};

// 处理左值变量选择
const handleLeftVariableSelected = (conditionIndex: number, variable: any, reference: string) => {
  const condition = props.choice.conditions[conditionIndex];
  // 手动设置带大括号的引用格式，确保正确的格式
  condition.left.value = reference; // reference 已经是 {{scope.name}} 格式
  emit('updateCondition', props.choiceIndex, conditionIndex, condition);
};

// 处理右值变量选择
const handleRightVariableSelected = (conditionIndex: number, variable: any, reference: string) => {
  const condition = props.choice.conditions[conditionIndex];
  // 手动设置带大括号的引用格式，确保正确的格式
  condition.right.value = reference; // reference 已经是 {{scope.name}} 格式
  emit('updateCondition', props.choiceIndex, conditionIndex, condition);
};

// 处理右值输入变化
const handleRightValueChange = (conditionIndex: number, value: any) => {
  const condition = props.choice.conditions[conditionIndex];
  condition.right.value = value;
  emit('updateCondition', props.choiceIndex, conditionIndex, condition);
};
</script>

<template>
  <div class="branch-card">
    <!-- 条件配置 -->
    <div class="conditions-section">
      <!-- 分支标题 -->
      <div v-if="showCaseTitle" class="conditions-header">
        <div class="conditions-title">{{ getBranchTitle }}</div>
        <div class="conditions-subtitle">{{ getCaseNumber(choiceIndex) }}</div>
      </div>

      <div class="conditions-container" :class="{ 'single-condition': choice.conditions.length <= 1, 'no-title': !showCaseTitle }">
        <!-- 条件组连接线 -->
        <div 
          v-if="choice.conditions.length > 1" 
          class="conditions-bracket"
          :style="{ height: getBracketHeight + 'px' }"
        >
          <el-button
            class="logic-switch-btn"
            size="small"
            :icon="Refresh"
            @click="toggleLogic"
            type="default"
          >
            {{ choice.logic === 'and' ? 'AND' : 'OR' }}
          </el-button>
          <div 
            class="connecting-line"
            :style="{ height: getConnectingLineHeight + 'px' }"
          ></div>
        </div>

        <!-- 条件列表 -->
        <div class="conditions-list">
                      <div
              v-for="(condition, conditionIndex) in choice.conditions"
              :key="condition.id"
              class="condition-item"
              :class="{ 'no-delete-button': !showConditionDelete }"
            >
            <!-- 第一列 -->
            <div class="condition-setting-col">
              <!-- 第一行：变量选择 + 数据类型 + 操作符 -->
              <div class="condition-row variable-row">
                <div class="variable-section">
                  <VariableChooser
                    v-model="condition.left.value"
                    :flow-id="flowId"
                    :conversation-id="conversationId"
                    :current-step-id="currentStepId"
                    :show-actions="false"
                    :show-variable-info="false"
                    :show-label="false"
                    :hide-border="true"
                    :no-border-radius="true"
                    :transparent-background="true"
                    output-format="raw"
                    selector-placeholder="选择左值变量"
                    @variable-selected="(variable, reference) => handleLeftVariableSelected(conditionIndex, variable, reference)"
                  />
                </div>
                <!-- 数据类型选择 -->
                <el-select
                  :model-value="condition.dataType || 'string'"
                  @update:model-value="handleDataTypeChange(conditionIndex, $event)"
                  size="small"
                  class="data-type-select"
                  placeholder="类型"
                >
                  <el-option
                    v-for="option in dataTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                
                <!-- 操作符选择 -->
                <el-select
                  :model-value="condition.operate"
                  @update:model-value="handleOperatorChange(conditionIndex, $event)"
                  size="small"
                  class="operator-select"
                  placeholder="操作符"
                >
                  <el-option
                    v-for="option in getOperatorOptions(condition.dataType || 'string')"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </div>

              <!-- 第二行：右值输入 + 切换按钮 -->
              <div class="condition-row value-row">
                <div class="value-section">
                  <!-- 变量引用模式 -->
                  <div v-if="condition.isRightReference" class="reference-input">
                    <VariableChooser
                      v-model="condition.right.value"
                      :flow-id="flowId"
                      :conversation-id="conversationId"
                      :current-step-id="currentStepId"
                      :show-actions="false"
                      :show-variable-info="false"
                      :show-label="false"
                      :hide-border="true"
                      :no-border-radius="true"
                      :transparent-background="true"
                      output-format="wrapped"
                      selector-placeholder="选择右值变量"
                      @variable-selected="(variable, reference) => handleRightVariableSelected(conditionIndex, variable, reference)"
                    />
                  </div>
                  
                  <!-- 直接输入模式 -->
                  <div v-else class="direct-input">
                    <!-- 布尔值特殊处理 -->
                    <el-select
                      v-if="condition.dataType === 'bool'"
                      :model-value="condition.right.value"
                      @update:model-value="handleRightValueChange(conditionIndex, $event)"
                      size="small"
                      style="flex: 1;"
                      placeholder="选择布尔值"
                    >
                      <el-option label="true" value="true" />
                      <el-option label="false" value="false" />
                    </el-select>
                    
                    <!-- 其他类型 -->
                    <el-input
                      v-else
                      :model-value="condition.right.value"
                      @update:model-value="handleRightValueChange(conditionIndex, $event)"
                      size="small"
                      :placeholder="`输入${dataTypeOptions.find(t => t.value === condition.dataType)?.label || '值'}`"
                      style="flex: 1;"
                    />
                  </div>
                </div>
                
                <div class="toggle-section">
                  <el-button
                    size="small"
                    type="default"
                    @click="handleRightReferenceToggle(conditionIndex, !condition.isRightReference)"
                    :icon="Refresh"
                  >
                    {{ condition.isRightReference ? '变量引用' : '输入值' }}
                  </el-button>
                </div>
              </div>
            </div>
            <!-- 第二列 条件删除按钮列 -->
            <div v-if="showConditionDelete" class="condition-delete-col">
              <button
                class="danger-button"
                @click="removeCondition(conditionIndex)"
                type="button"
                title="删除条件"
              >
                <Delete />
              </button>
            </div>
          </div>
          <!-- 添加条件按钮/删除分支按钮 -->
          <div class="action-buttons">
              <el-button
                size="small"
                type="primary"
                plain
                :icon="Plus"
                @click="addCondition"
              >
                  添加条件
              </el-button>
              <button
                v-if="showBranchDelete"
                type="button"
                class="danger-button delete-branch"
                @click="removeBranch"
              >
                <Delete />
                移除
              </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.branch-card {
  border-radius: 8px;
  margin-bottom: 16px;
  background: #ffffff;
  
  &.default-branch {
    border-color: #f56c6c;
    background: #fef0f0;
  }
  
  .branch-header {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .branch-title-section {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .main-title {
        font-size: 18px;
        font-weight: 700;
        color: #409eff;
        padding: 6px 12px;
        background: #ecf5ff;
        border-radius: 6px;
        border: 1px solid #d9ecff;
        min-width: 60px;
        text-align: center;
      }
      
      .sub-title {
        font-size: 14px;
        font-weight: 600;
        color: #606266;
      }
    }
    
    .branch-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .conditions-section {
    position: relative;
    border-radius: 8px;

    .conditions-header {
      position: absolute;
      padding: 16px;
      
      .conditions-title {
        font-weight: 600;
        color: black;
        font-size: 16px;
      }

      .conditions-subtitle {
        font-weight: 500;
        color: #676f83;
        font-size: 12px;
      }
    }

    .conditions-container {
      position: relative;
      padding: 16px 0 16px 80px;
      
      .conditions-bracket {
        position: absolute;
        left: 0;
        top: 16px;
        width: 80px;
        padding: 16px 0 16px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        
        .logic-switch-btn {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 50px;
          font-weight: 600;
          font-size: 10px;
          padding: 4px 8px;
          background-color: white;
          z-index: 1;
          
          // 调整图标大小
          :deep(.el-icon) {
            font-size: 10px;
            width: 10px;
            height: 10px;
          }
        }
        
        .connecting-line {
          position: absolute;
          right: 0;
          top: 46px;
          width: 2rem;
          border-color: #10182824;
          border-style: solid;
          border-top-left-radius: 16px;
          border-bottom-left-radius: 16px;
          border-right-width: 0 !important;
          border-width: 1px;
          z-index: 0;
        }
      }
      
      .conditions-list {
        width: 100%;
        
        .condition-item {
          border-radius: 8px;
          padding: 16px;
          background: transparent;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: background-color 0.2s ease;
            
          // 当包含的删除按钮hover时，改变condition-setting-col的背景色
          &:has(.danger-button:hover) .condition-setting-col {
            background-color: var(--el-color-danger-light-9);
          }
          
          .condition-setting-col {
            flex: 1;
            min-width: 0;
            background: #f8f9fa;
            border: 1px solid #e4e7ed;
            border-radius: 8px;
            overflow: hidden;
            transition: background-color 0.2s ease;
          }
          
          .condition-delete-col {
            flex-shrink: 0;
            display: flex;
            align-items: flex-start;
            padding-top: 8px;
          }
          
          // 当没有删除按钮时，移除右边的gap
          &.no-delete-button {
            gap: 0;
            
            .condition-setting-col {
              width: 100%;
            }
          }
          
          .condition-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            
            .condition-number {
              font-size: 12px;
              font-weight: 600;
              color: #909399;
            }
          }
          
          .condition-row {
            margin: 0;
            display: flex;
            align-items: flex-end;
            gap: 0;
            padding: 6px 0 6px 0;
            
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
                flex: 3; // VariableChooser 占3份空间
                border-right: 1px solid #e4e7ed;
                padding-right: 12px;
              }
              
              .data-type-select {
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
              
              .operator-select {
                flex: 0 0 25%;
                
                :deep(.el-select__wrapper) {
                  border: none;
                  box-shadow: none;
                  background: transparent;
                  border-radius: 0;
                  // 操作符选择器作为最后一个元素，不需要右边框
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
    }

    // 当包含的删除按钮hover时，改变背景色
    &:has(.action-buttons .danger-button:hover) {
      background-color: var(--el-color-danger-light-9);
      
      .condition-setting-col {
        background-color: #eee8e9;
        transition: none;
      }
    }
  }
}

// 深色主题支持
.dark {
  .branch-card {
    background: #374151;
    border-color: #4b5563;
    
    &.default-branch {
      border-color: #f87171;
      background: #450a0a;
    }
    
    .branch-header {
      background: #4b5563;
      border-color: #6b7280;
      
      .branch-title-section {
        .main-title {
          color: #3b82f6;
          background: #1e3a8a;
          border-color: #1e40af;
        }
        
        .sub-title {
          color: #e5e7eb;
        }
      }
    }
    
    .conditions-container { 
      .conditions-bracket {
        .bracket-line {
          background: #3b82f6;
        }
      }
      
      .conditions-list {
        .condition-item {
          background: #4b5563;
          border-color: #6b7280;
          
          .condition-setting-col {
            background: #4b5563;
            border-color: #6b7280;
            
            .condition-row {
              &:not(:last-child) {
                border-bottom-color: #6b7280;
              }
              
              &.variable-row {
                .variable-section {
                  border-right-color: #6b7280;
                }
                
                .data-type-select {
                  border-right-color: #6b7280;
                }
                
                .operator-select :deep(.el-select__wrapper) {
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
    

  }
}

// 确保VariableChooser组件样式适配
:deep(.variable-chooser) {
  .variable-row {
    margin-bottom: 0;
    
    .variable-name-section {
      display: none; // 隐藏变量名输入，只保留选择器
    }
    
    .variable-selector-section {
      flex: 1;
      min-width: 0 !important; // 使用 !important 强制覆盖原始的 min-width
      
      .field-label {
        display: none; // 隐藏标签
      }
    }
    
    .actions-section {
      display: none; // 隐藏操作按钮
    }
  }
  
  .variable-info {
    display: none; // 隐藏变量信息
  }
}

// 按钮组flex布局样式
.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 0 16px 0 16px;
  margin: 8px 0 8px 0;
}

// 条件删除按钮样式
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

// Delete分支按钮的特殊样式
.delete-branch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  // 确保图标和文本垂直对齐
  span, svg {
    vertical-align: middle;
  }
}
</style> 