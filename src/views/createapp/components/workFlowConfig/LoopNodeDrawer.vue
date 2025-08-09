<template>
  <el-drawer
    v-model="visible"
    title="循环"
    :size="800"
    :close-on-click-modal="true"
    class="loop-node-drawer"
  >
    <div class="drawer-content">
      <el-collapse v-model="activeName" class="o-hpc-collapse">
        
        <!-- 基本信息 -->
        <el-collapse-item name="basic" class="basic-panel">
          <template #title>
            <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('basic') }">
              <IconCaretRight />
            </el-icon>
            <span>基本信息</span>
          </template>
          <div class="basic-content">
            <el-form :model="nodeConfig" label-position="left" label-width="120px">
              <el-form-item label="节点名称" required>
                <el-input
                  v-model="nodeConfig.name"
                  placeholder="请输入节点名称"
                  maxlength="50"
                  clearable
                />
              </el-form-item>
              <el-form-item label="节点描述">
                <el-input
                  v-model="nodeConfig.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入节点描述"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </div>
        </el-collapse-item>

        <!-- 循环设置 -->
        <el-collapse-item name="settings" class="settings-panel">
          <template #title>
            <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('settings') }">
              <IconCaretRight />
            </el-icon>
            <span>循环设置</span>
          </template>
          <div class="settings-content">
            <!-- 循环变量 -->
            <div class="section">
              <div class="variables-card">
                <!-- 变量配置 -->
                <div class="variables-section">
                  <!-- 变量标题 -->
                  <div class="variables-header">
                    <div class="variables-title">循环变量</div>
                    <el-button
                      v-if="variables.length > 0"
                      type="primary" 
                      size="small" 
                      :icon="Plus"
                      @click="handleAddVariable"
                      class="add-btn"
                    >
                      添加变量
                    </el-button>
                  </div>

                  <div class="variables-container">
                    <!-- 变量列表 -->
                    <div class="variables-list" v-if="variables.length > 0">
                      <div
                        v-for="(variable, index) in variables"
                        :key="index"
                        class="variable-item"
                      >
                        <!-- 第一列 -->
                        <div class="variable-setting-col">
                          <!-- 第一行：变量名 + 类型 -->
                          <div class="variable-row name-row">
                            <div class="name-section">
                              <el-input
                                v-model="variable.name"
                                placeholder="输入变量名"
                                size="small"
                                @change="updateVariables"
                              />
                            </div>
                            
                            <!-- 类型选择 -->
                            <el-select
                              v-model="variable.type"
                              placeholder="选择类型"
                              size="small"
                              class="type-select"
                              @change="handleTypeChange(variable, index)"
                            >
                              <el-option label="字符串" value="string" />
                              <el-option label="数字" value="number" />
                              <el-option label="布尔值" value="boolean" />
                              <el-option label="对象" value="object" />
                              <el-option label="引用变量" value="reference" />
                            </el-select>
                          </div>

                          <!-- 第二行：值输入 -->
                          <div class="variable-row value-row">
                            <div class="value-section">
                              <!-- 引用类型的变量选择 -->
                              <div v-if="variable.type === 'reference'" class="reference-input">
                                <VariableChooser
                                  v-model="variable.reference"
                                  :flow-id="flowId"
                                  :current-step-id="currentStepId"
                                  :supported-scopes="['conversation', 'system', 'env']"
                                  :self-variables="variables"
                                  self-scope-label="循环变量"
                                  :show-variable-name="false"
                                  :show-label="false"
                                  :show-actions="false"
                                  :show-variable-info="false"
                                  :hide-border="true"
                                  :no-border-radius="true"
                                  :transparent-background="true"
                                  output-format="raw"
                                  selector-placeholder="选择要引用的变量"
                                  @variable-selected="updateVariables"
                                />
                              </div>
                              
                              <!-- 非引用类型的值输入 -->
                              <div v-else class="direct-input">
                                <!-- 字符串类型 -->
                                <el-input
                                  v-if="variable.type === 'string'"
                                  v-model="variable.value"
                                  placeholder="输入字符串值"
                                  size="small"
                                  @change="updateVariables"
                                />
                                <!-- 数字类型 -->
                                <el-input-number
                                  v-else-if="variable.type === 'number'"
                                  v-model="variable.value"
                                  placeholder="输入数字值"
                                  size="small"
                                  @change="updateVariables"
                                  style="width: 100%;"
                                />
                                <!-- 布尔类型 -->
                                <el-select
                                  v-else-if="variable.type === 'boolean'"
                                  v-model="variable.value"
                                  placeholder="选择布尔值"
                                  size="small"
                                  @change="updateVariables"
                                >
                                  <el-option label="true" :value="true" />
                                  <el-option label="false" :value="false" />
                                </el-select>
                                <!-- 对象类型 -->
                                <el-input
                                  v-else-if="variable.type === 'object'"
                                  v-model="variable.value"
                                  type="textarea"
                                  :rows="3"
                                  placeholder="输入JSON格式的对象"
                                  size="small"
                                  @change="updateVariables"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <!-- 第二列 变量删除按钮列 -->
                        <div class="variable-delete-col">
                          <button
                            class="danger-button"
                            @click="removeVariable(index)"
                            type="button"
                            title="删除变量"
                          >
                            <Delete />
                          </button>
                        </div>
                      </div>
                      
                      
                    </div>
                    
                    <!-- 空状态 -->
                    <div v-else class="empty-state">
                      <button 
                        @click="handleAddVariable"
                        class="add-first-variable-btn"
                      >
                        <Plus class="btn-icon" />
                        添加变量
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 循环终止条件 -->
            <div class="section">
              <div class="section-header">
                <h3 class="section-title">循环终止条件</h3>
              </div>
              
              <div v-if="stopConditionBranch.conditions.length > 0">
                <ChoiceBranchCard
                  :choice="stopConditionBranch"
                  :choice-index="0"
                  :value-type-options="valueTypeOptions"
                  :operator-options="operatorOptions"
                  :can-delete="true"
                  :show-branch-delete="false"
                  :show-case-title="false"
                  :flow-id="flowId"
                  :conversation-id="''"
                  :current-step-id="currentStepId"
                  :self-variables="variables"
                  self-scope-label="循环变量"
                  @remove-branch="handleRemoveBranch"
                  @add-condition="handleAddConditionFromCard"
                  @remove-condition="handleRemoveCondition"
                  @toggle-logic="handleToggleLogic"
                  @update-condition="handleUpdateCondition"
                />
              </div>
              
              <div v-else class="empty-state">
                <button 
                  @click="handleAddCondition"
                  class="add-first-condition-btn"
                >
                  <Plus class="btn-icon" />
                  添加终止条件
                </button>
              </div>
            </div>
            
            <!-- 最大循环次数 -->
            <div class="section no-border">
              <div class="section-header">
                <h3 class="section-title">最大循环次数</h3>
              </div>
              
              <div class="max-iteration-form">
                <el-slider
                  v-model="maxIteration"
                  :min="1"
                  :max="10"
                  :step="1"
                  show-input
                  @change="updateMaxIteration"
                  style="width: 100%;"
                />
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
    
    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage, ElCollapse, ElCollapseItem, ElForm, ElFormItem } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { IconCaretRight } from '@computing/opendesign-icons';
import VariableChooser from '../../../../components/VariableChooser.vue';
import ChoiceBranchCard from './ChoiceBranchCard.vue';

interface LoopVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'reference';
  value?: any;
  reference?: string;
}

interface StopCondition {
  id: string;
  left: {
    type: string;
    value: any;
  };
  right: {
    type: string;
    value: any;
  };
  operate: string;
  dataType: string;
  isRightReference: boolean;
}

interface StopConditionBranch {
  branch_id: string;
  name: string;
  logic: string;
  conditions: StopCondition[];
  is_default: boolean;
}

interface Props {
  visible: boolean;
  nodeData: any;
  nodeId: string;
  flowId: string;
  currentStepId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'save': [data: any];
}>();

// 折叠面板激活状态
const activeName = ref(['basic', 'settings']);

// 节点配置
const nodeConfig = ref({
  name: '',
  description: ''
});

// 其他数据
const activeTab = ref('settings');
const variables = ref<LoopVariable[]>([]);
const stopConditionBranch = ref<StopConditionBranch>({
  branch_id: 'stop_condition_branch',
  name: '循环终止条件',
  logic: 'and',
  conditions: [],
  is_default: false
});
const maxIteration = ref(10);

// 为ChoiceBranchCard提供的数据
const valueTypeOptions = ref([
  { label: '字符串', value: 'string' },
  { label: '数值', value: 'number' },
  { label: '数组', value: 'list' },
  { label: '布尔值', value: 'bool' },
  { label: '对象', value: 'dict' }
]);

const operatorOptions = ref({
  string: [
    { label: '等于', value: 'string_equal' },
    { label: '不等于', value: 'string_not_equal' },
    { label: '包含', value: 'string_contains' },
    { label: '不包含', value: 'string_not_contains' }
  ],
  number: [
    { label: '等于', value: 'number_equal' },
    { label: '不等于', value: 'number_not_equal' },
    { label: '大于', value: 'number_greater_than' },
    { label: '小于', value: 'number_less_than' },
    { label: '大于等于', value: 'number_greater_than_or_equal' },
    { label: '小于等于', value: 'number_less_than_or_equal' }
  ],
  list: [
    { label: '等于', value: 'list_equal' },
    { label: '不等于', value: 'list_not_equal' },
    { label: '包含', value: 'list_contains' },
    { label: '不包含', value: 'list_not_contains' }
  ],
  bool: [
    { label: '等于', value: 'bool_equal' },
    { label: '不等于', value: 'bool_not_equal' }
  ],
  dict: [
    { label: '等于', value: 'dict_equal' },
    { label: '不等于', value: 'dict_not_equal' },
    { label: '包含键', value: 'dict_contains_key' },
    { label: '不包含键', value: 'dict_not_contains_key' }
  ]
});

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 初始化数据
const initializeData = () => {
  // 初始化基本信息
  nodeConfig.value.name = props.nodeData?.name || '';
  nodeConfig.value.description = props.nodeData?.description || '';
  
  if (props.nodeData?.parameters?.input_parameters) {
    const params = props.nodeData.parameters.input_parameters;
    
    // 初始化循环变量
    if (params.variables) {
      variables.value = Object.entries(params.variables).map(([key, value]: [string, any]) => {
        if (typeof value === 'object' && value.type === 'reference') {
          return {
            name: key,
            type: 'reference',
            reference: value.reference || ''
          };
        } else if (typeof value === 'object' && value.type) {
          // 新的复杂格式：{type: "number", value: 2, description: "..."}
          return {
            name: key,
            type: value.type,
            value: value.value
          };
        } else {
          // 兼容旧的简单格式
          return {
            name: key,
            type: getVariableType(value),
            value: value
          };
        }
      });
    }
    
    // 初始化终止条件
    if (params.stop_condition) {
      stopConditionBranch.value.logic = params.stop_condition.logic || 'and';
      // 转换旧格式到新格式
      if (params.stop_condition.conditions) {
        stopConditionBranch.value.conditions = params.stop_condition.conditions.map((condition: any, index: number) => {
          // 处理左值
          const leftValue = typeof condition.left === 'object' ? condition.left.value : condition.left || '';
          
          // 处理右值
          const rightValue = typeof condition.right === 'object' ? condition.right.value : condition.right;
          const rightType = typeof condition.right === 'object' ? condition.right.type : (typeof condition.right === 'number' ? 'number' : 'string');
          
          // 推断数据类型
          let dataType = condition.dataType;
          if (!dataType) {
            // 根据操作符推断数据类型
            const operator = condition.operator || condition.operate || 'string_equal';
            if (operator.startsWith('number_')) {
              dataType = 'number';
            } else if (operator.startsWith('bool_')) {
              dataType = 'bool';
            } else if (operator.startsWith('list_')) {
              dataType = 'list';
            } else if (operator.startsWith('dict_')) {
              dataType = 'dict';
            } else {
              dataType = 'string';
            }
          }
          
          return {
            id: condition.id || `condition_${index}`,
            left: {
              type: 'reference',
              value: leftValue
            },
            right: {
              type: rightType,
              value: rightValue
            },
            operate: condition.operator || condition.operate || 'string_equal',
            dataType: dataType,
            isRightReference: (typeof condition.right === 'object' && condition.right.type === 'reference') || false
          };
        });
      }
    }
    
    // 初始化最大循环次数
    maxIteration.value = params.max_iteration || 10;
  }
};

// 获取变量类型
const getVariableType = (value: any): 'string' | 'number' | 'boolean' | 'object' => {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'object') return 'object';
  return 'string';
};

// 处理添加变量
const handleAddVariable = () => {
  variables.value.push({
    name: '',
    type: 'string',
    value: ''
  });
};

// 处理移除变量
const removeVariable = (index: number) => {
  variables.value.splice(index, 1);
  updateVariables();
};

// 处理类型变化
const handleTypeChange = (variable: LoopVariable, index: number) => {
  if (variable.type === 'reference') {
    variable.reference = '';
    delete variable.value;
  } else {
    variable.value = getDefaultValue(variable.type);
    delete variable.reference;
  }
  updateVariables();
};

// 获取默认值
const getDefaultValue = (type: string) => {
  switch (type) {
    case 'string': return '';
    case 'number': return 0;
    case 'boolean': return false;
    case 'object': return '{}';
    default: return '';
  }
};

// 更新变量
const updateVariables = () => {
  // 触发数据更新
};

// 处理添加条件
const handleAddCondition = () => {
  const newCondition: StopCondition = {
    id: `condition_${Date.now()}`,
    left: {
      type: 'reference',
      value: ''
    },
    right: {
      type: 'string',
      value: ''
    },
    operate: 'string_equal',
    dataType: 'string',
    isRightReference: false
  };
  stopConditionBranch.value.conditions.push(newCondition);
};

// 处理ChoiceBranchCard的事件
const handleRemoveBranch = () => {
  // 循环终止条件不能删除分支，只能清空条件
  stopConditionBranch.value.conditions = [];
};

const handleAddConditionFromCard = () => {
  handleAddCondition();
};

const handleRemoveCondition = (branchIndex: number, conditionIndex: number) => {
  stopConditionBranch.value.conditions.splice(conditionIndex, 1);
};

const handleToggleLogic = () => {
  stopConditionBranch.value.logic = stopConditionBranch.value.logic === 'and' ? 'or' : 'and';
};

const handleUpdateCondition = (branchIndex: number, conditionIndex: number, condition: StopCondition) => {
  stopConditionBranch.value.conditions[conditionIndex] = condition;
};

// 更新终止条件
const updateStopCondition = () => {
  // 触发数据更新
};

// 更新最大循环次数
const updateMaxIteration = () => {
  // 触发数据更新
};

// 处理取消
const handleCancel = () => {
  visible.value = false;
};

// 处理保存
const handleSave = () => {
  // 验证数据
  const variableNames = variables.value.map(v => v.name);
  const duplicates = variableNames.filter((name, index) => 
    name && variableNames.indexOf(name) !== index
  );
  
  if (duplicates.length > 0) {
    ElMessage.error('变量名不能重复');
    return;
  }
  
  // 构建变量对象
  const variablesObj: Record<string, any> = {};
  variables.value.forEach(variable => {
    if (variable.name) {
      if (variable.type === 'reference') {
        variablesObj[variable.name] = {
          type: 'reference',
          reference: variable.reference
        };
      } else {
        // 使用复杂格式，包含类型信息
        variablesObj[variable.name] = {
          type: variable.type,
          value: variable.value,
          description: `循环变量: ${variable.name}`
        };
      }
    }
  });
  
  // 构建保存数据
  const saveData = {
    name: nodeConfig.value.name,
    description: nodeConfig.value.description,
    parameters: {
      input_parameters: {
        variables: variablesObj,
        stop_condition: {
          logic: stopConditionBranch.value.logic,
          conditions: stopConditionBranch.value.conditions
            .filter(c => c.left.value && c.operate && c.right.value)
            .map(c => ({
              left: c.left,
              operator: c.operate,
              right: c.right
            }))
        },
        max_iteration: maxIteration.value,
        sub_flow_id: props.nodeData.parameters?.input_parameters?.sub_flow_id || ''
      },
      output_parameters: props.nodeData.parameters?.output_parameters || {
        iteration_count: {
          type: 'number',
          description: '实际执行的循环次数'
        },
        stop_reason: {
          type: 'string',
          description: '停止原因'
        },
        variables: {
          type: 'object',
          description: '循环后的变量状态'
        }
      }
    }
  };
  
  emit('save', saveData);
  visible.value = false;
  ElMessage.success('循环节点保存成功');
};

// 监听数据变化
watch(() => props.nodeData, initializeData, { deep: true, immediate: true });
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initializeData();
  }
});

onMounted(() => {
  initializeData();
});
</script>

<style scoped>
.loop-node-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 20px 0 20px;
}

.loop-node-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.drawer-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.loop-tabs :deep(.el-tabs__content) {
  padding: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
}

.section {
  /* border: 1px solid #e1e4e8; */
  /* border-radius: 8px; */
  padding: 20px;
  /* background: #fafbfc; */
}

.section.no-border {
  border: none;
  background: transparent;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.description-content {
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  font-size: 14px;
  line-height: 1.5;
  color: #495057;
}

.description-section {
  margin-bottom: 24px;
}

.o-hpc-collapse {
  border: none;
  
  .el-collapse-item {
    margin-bottom: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .el-collapse-item__header {
    height: 48px;
    line-height: 48px;
    padding: 0 16px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e4e7ed;
    
    .el-collapse-item__arrow {
      margin-right: 8px;
      transition: transform 0.3s;
      
      &.is-active {
        transform: rotate(90deg);
      }
    }
  }
  
  .el-collapse-item__wrap {
    border-bottom: none;
  }
  
  .el-collapse-item__content {
    padding: 16px;
    background-color: #ffffff;
  }
}

.basic-content {
  .el-form-item {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.add-btn {
  font-size: 12px;
}

.variables-list,
.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.variable-item,
.condition-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  /* background: white; */
  /* border: 1px solid #e1e4e8; */
  /* border-radius: 6px; */
}

.variable-form,
.condition-form {
  flex: 1;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-field {
  flex: 1;
  min-width: 0;
}

.form-field.full-width {
  flex: 2;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.variable-actions,
.condition-actions {
  display: flex;
  align-items: center;
  padding-top: 20px;
}

.condition-logic {
  margin-bottom: 16px;
}

.max-iteration-form {
  display: flex;
  align-items: center;
  gap: 12px;
}

.help-text {
  font-size: 12px;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
}

.empty-text {
  margin: 0;
  font-size: 14px;
}

.add-first-condition-btn {
  width: 100%;
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    border-color: #409eff;
    color: #409eff;
    background: #f0f8ff;
  }
  
  &:focus {
    outline: none;
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
  
  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

.last-run-content {
  padding: 40px 20px;
  text-align: center;
}

.placeholder-text {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #e1e4e8;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 变量卡片样式 - 参考ChoiceBranchCard设计 */
.variables-card {
  border-radius: 8px;
  margin-bottom: 16px;
  background: #ffffff;
}

.variables-card .variables-section {
  border-radius: 8px;
}

.variables-card .variables-header {
  /* padding: 16px 16px 0 16px; */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.variables-card .variables-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
  margin-bottom: 16px;
}

.variables-card .add-btn {
  font-size: 12px;
}

.variables-card .variables-list {
  width: 100%;
}

.variables-card .variable-item {
  border-radius: 8px;
  background: transparent;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: background-color 0.2s ease;
}

.variables-card .variable-item:has(.danger-button:hover) .variable-setting-col {
  background-color: var(--el-color-danger-light-9);
}

.variables-card .variable-setting-col {
  flex: 1;
  min-width: 0;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: background-color 0.2s ease;
}

.variables-card .variable-delete-col {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 8px;
}

.variables-card .variable-row {
  margin: 0;
  display: flex;
  align-items: flex-end;
  gap: 0;
  padding: 6px 0 6px 0;
}

.variables-card .variable-row:not(:last-child) {
  border-bottom: 1px solid #e4e7ed;
  margin-left: 2px;
  margin-right: 2px;
  padding-left: 0;
  padding-right: 0;
}

.variables-card .variable-row.name-row {
  gap: 12px;
}

.variables-card .name-section {
  flex: 3;
  border-right: 1px solid #e4e7ed;
  padding-right: 12px;
}

.variables-card .name-section :deep(.el-input__wrapper) {
  border: none;
  box-shadow: none;
  background: transparent;
  border-radius: 0;
}

.variables-card .type-select {
  flex: 0 0 30%;
}

.variables-card .type-select :deep(.el-select__wrapper) {
  border: none;
  box-shadow: none;
  background: transparent;
  border-radius: 0;
}

.variables-card .variable-row.value-row {
  display: flex;
  align-items: flex-end;
}

.variables-card .value-section {
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}

.variables-card .reference-input :deep(.el-select__wrapper),
.variables-card .reference-input :deep(.el-input__wrapper),
.variables-card .direct-input :deep(.el-select__wrapper),
.variables-card .direct-input :deep(.el-input__wrapper),
.variables-card .direct-input :deep(.el-input-number),
.variables-card .direct-input :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  background: transparent;
  border-radius: 0;
}

.variables-card .direct-input :deep(.el-input-number .el-input__wrapper) {
  border: none;
  box-shadow: none;
  background: transparent;
  border-radius: 0;
}

.variables-card .empty-state {
  text-align: center;
  color: #9ca3af;
}

.variables-card .add-first-variable-btn {
  width: 100%;
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.variables-card .add-first-variable-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f0f8ff;
}

.variables-card .add-first-variable-btn:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.variables-card .btn-icon {
  width: 16px;
  height: 16px;
}

.variables-card .variables-section:has(.action-buttons .danger-button:hover) {
  background-color: var(--el-color-danger-light-9);
}

.variables-card .variables-section:has(.action-buttons .danger-button:hover) .variable-setting-col {
  background-color: #eee8e9;
  transition: none;
}

/* 按钮组flex布局样式 */
.action-buttons {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  padding: 0 16px 0 16px;
  margin: 8px 0 8px 0;
}

/* 变量删除按钮样式 */
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
}

.danger-button:hover {
  color: var(--el-color-danger-light-3);
  background-color: var(--el-color-danger-light-8);
}

.danger-button:active {
  color: var(--el-color-danger-dark-2);
  background-color: var(--el-color-danger-light-7);
}

.danger-button:focus {
  outline: 2px solid var(--el-color-danger-light-6);
  outline-offset: 1px;
  background-color: var(--el-color-danger-light-8);
}

.danger-button svg {
  width: 16px;
  height: 16px;
}

/* 确保VariableChooser组件样式适配 */
:deep(.variable-chooser) .variable-row {
  margin-bottom: 0;
}

:deep(.variable-chooser) .variable-name-section {
  display: none;
}

:deep(.variable-chooser) .variable-selector-section {
  flex: 1;
  min-width: 0 !important;
}

:deep(.variable-chooser) .field-label {
  display: none;
}

:deep(.variable-chooser) .actions-section {
  display: none;
}

:deep(.variable-chooser) .variable-info {
  display: none;
}
</style> 