<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, QuestionFilled } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { v4 as uuidv4 } from 'uuid';
import ChoiceBranchCard from './ChoiceBranchCard.vue';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  nodeData: {
    type: Object,
    default: () => ({}),
  },
  nodeId: {
    type: String,
    default: '',
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
});

const emit = defineEmits(['update:visible', 'saveNode']);

// 类型定义
interface Condition {
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

interface ChoiceBranch {
  branch_id: string;
  name: string;
  logic: string;
  conditions: Condition[];
  is_default: boolean;
}

interface FormData {
  name: string;
  description: string;
  choices: ChoiceBranch[];
  defaultBranch: ChoiceBranch | null;
}

// 表单数据
const formData = ref<FormData>({
  name: '',
  description: '',
  choices: [],
  defaultBranch: null
});

// 操作符选项
const operatorOptions = computed(() => ({
  string: [
    { label: t('choiceBranch.operators.eq'), value: 'eq' },
    { label: t('choiceBranch.operators.ne'), value: 'ne' },
    { label: t('choiceBranch.operators.contains'), value: 'contains' },
    { label: t('choiceBranch.operators.not_contains'), value: 'not_contains' },
    { label: t('choiceBranch.operators.starts_with'), value: 'starts_with' },
    { label: t('choiceBranch.operators.ends_with'), value: 'ends_with' },
    { label: t('choiceBranch.operators.is_empty'), value: 'is_empty' },
    { label: t('choiceBranch.operators.is_not_empty'), value: 'is_not_empty' },
  ],
  number: [
    { label: t('choiceBranch.operators.eq'), value: 'eq' },
    { label: t('choiceBranch.operators.ne'), value: 'ne' },
    { label: t('choiceBranch.operators.gt'), value: 'gt' },
    { label: t('choiceBranch.operators.gte'), value: 'gte' },
    { label: t('choiceBranch.operators.lt'), value: 'lt' },
    { label: t('choiceBranch.operators.lte'), value: 'lte' },
  ],
  bool: [
    { label: t('choiceBranch.operators.eq'), value: 'eq' },
    { label: t('choiceBranch.operators.ne'), value: 'ne' },
  ],
  list: [
    { label: t('choiceBranch.operators.contains'), value: 'contains' },
    { label: t('choiceBranch.operators.not_contains'), value: 'not_contains' },
    { label: t('choiceBranch.operators.is_empty'), value: 'is_empty' },
    { label: t('choiceBranch.operators.is_not_empty'), value: 'is_not_empty' },
    { label: t('choiceBranch.operators.length_eq'), value: 'length_eq' },
    { label: t('choiceBranch.operators.length_gt'), value: 'length_gt' },
    { label: t('choiceBranch.operators.length_lt'), value: 'length_lt' },
  ],
  dict: [
    { label: t('choiceBranch.operators.has_key'), value: 'has_key' },
    { label: t('choiceBranch.operators.not_has_key'), value: 'not_has_key' },
    { label: t('choiceBranch.operators.is_empty'), value: 'is_empty' },
    { label: t('choiceBranch.operators.is_not_empty'), value: 'is_not_empty' },
  ],
}));

// 值类型选项
const valueTypeOptions = computed(() => [
  { label: t('choiceBranch.data_types.string'), value: 'string' },
  { label: t('choiceBranch.data_types.number'), value: 'number' },
  { label: t('choiceBranch.data_types.bool'), value: 'bool' },
  { label: t('choiceBranch.data_types.list'), value: 'list' },
  { label: t('choiceBranch.data_types.dict'), value: 'dict' },
  { label: t('choiceBranch.data_types.reference'), value: 'reference' },
]);

// 逻辑运算符选项
const logicOptions = computed(() => [
  { label: t('choiceBranch.logic_operators.and'), value: 'and' },
  { label: t('choiceBranch.logic_operators.or'), value: 'or' },
]);

// 初始化表单数据
const initFormData = () => {
  if (props.nodeData) {
    const allChoices = JSON.parse(JSON.stringify(props.nodeData.parameters?.input_parameters?.choices || []));
    
    console.log('[ChoiceBranchDrawer]', t('choiceBranch.console.init_form_data'), {
      allChoices,
      choicesCount: allChoices.length,
      nodeData: props.nodeData
    });
    
    // 分离默认分支和非默认分支
    let defaultBranches = allChoices.filter(choice => choice.is_default);
    let nonDefaultChoices = allChoices.filter(choice => !choice.is_default);
    
    console.log('[ChoiceBranchDrawer]', t('choiceBranch.console.branch_separation_result'), {
      defaultBranches,
      nonDefaultChoices,
      defaultCount: defaultBranches.length,
      nonDefaultCount: nonDefaultChoices.length
    });
    
    // 详细打印每个非默认分支的条件信息
    nonDefaultChoices.forEach((choice, index) => {
      console.log(`[ChoiceBranchDrawer] ${t('choiceBranch.console.non_default_branch')} ${index}:`, {
        branch_id: choice.branch_id,
        name: choice.name,
        is_default: choice.is_default,
        conditions: choice.conditions,
        conditionCount: choice.conditions?.length || 0
      });
    });
    
    // 验证默认分支数量
    if (defaultBranches.length > 1) {
      console.warn('[ChoiceBranchDrawer]', t('choiceBranch.console.found_multiple_default'), defaultBranches);
      ElMessage.error(t('choiceBranch.validation.data_error_multiple_default'));
      defaultBranches = [defaultBranches[0]]; // 只保留第一个默认分支
    }
    
    formData.value = {
      name: props.nodeData.name || t('choiceBranch.titles.condition_branch'),
      description: props.nodeData.description || '',
      choices: nonDefaultChoices,
      defaultBranch: defaultBranches.length > 0 ? defaultBranches[0] : null,
    };

    // 过滤和清理非默认分支，移除包含空条件的分支
    formData.value.choices = formData.value.choices
      .filter(choice => {
        // 对于非默认分支，不过滤掉空条件的分支，保留所有非默认分支供用户编辑
        // 这样后端传来的is_default=false且条件为空的分支也能正确显示
        return true;
      })
      .map((choice, index) => ({
        branch_id: choice.branch_id || uuidv4(),
        name: choice.name || `${t('choiceBranch.status.branch_prefix')} ${index + 1}`,
        logic: choice.logic || 'and',
        conditions: (() => {
          // 处理条件数组
          let conditions = (choice.conditions || [])
            .map(condition => ({
              id: condition.id || uuidv4(),
              left: {
                type: condition.left?.type || 'reference',
                value: condition.left?.value || '',
              },
              right: {
                type: condition.right?.type || 'string',
                value: condition.right?.value || '',
              },
              operate: condition.operate || 'string_equal',
              dataType: condition.dataType || 'string',
              isRightReference: condition.isRightReference !== undefined ? condition.isRightReference : false,
            }));
          
          // 确保每个非默认分支至少有一个条件（即使是空的），这样用户就能看到并编辑
          if (conditions.length === 0) {
            conditions = [createEmptyCondition()];
          }
          
          return conditions;
        })(),
        is_default: false, // 确保非默认分支的is_default为false
      }));
    
    // 如果没有条件分支，创建一个默认的
    if (formData.value.choices.length === 0) {
      formData.value.choices = [createEmptyChoice()];
    }
    
    // 处理默认分支
    if (formData.value.defaultBranch) {
      formData.value.defaultBranch = {
        branch_id: 'else_' + uuidv4(),
        name: 'ELSE',
        logic: 'and',
        conditions: [createEmptyCondition()],
        is_default: true,
      };
    } else {
      formData.value.defaultBranch = {
        branch_id: 'else_' + uuidv4(),
        name: 'ELSE',
        logic: 'and',
        conditions: [createEmptyCondition()],
        is_default: true,
      };
    }
    
    // 更新非默认分支名称为 IF/ELIF（如果有有效分支）
    if (formData.value.choices.length > 0) {
      console.log('[ChoiceBranchDrawer]', t('choiceBranch.console.has_non_default_branch'));
      updateBranchNames();
    } else {
      console.log('[ChoiceBranchDrawer]', t('choiceBranch.console.no_non_default_branch'));
      // 如果没有非默认分支，创建一个空的IF分支，这样用户就不需要手动点击+ELIF按钮
      formData.value.choices = [
        {
          branch_id: uuidv4(),
          name: 'IF',
          logic: 'and',
          conditions: [createEmptyCondition()],
          is_default: false,
        }
      ];
    }
    
    // 如果没有默认分支，创建一个
    if (!formData.value.defaultBranch) {
      console.log('[ChoiceBranchDrawer]', t('choiceBranch.console.no_default_branch'));
      formData.value.defaultBranch = {
        branch_id: 'else_' + uuidv4(),
        name: 'ELSE',
        logic: 'and',
        conditions: [createEmptyCondition()],
        is_default: true,
      };
    } else {
      console.log('[ChoiceBranchDrawer]', t('choiceBranch.console.has_default_branch'), formData.value.defaultBranch);
    }
    
    console.log('[ChoiceBranchDrawer]', t('choiceBranch.console.final_form_data'), {
      choices: formData.value.choices,
      defaultBranch: formData.value.defaultBranch,
      choicesCount: formData.value.choices.length
    });
  } else {
    // 如果没有nodeData，创建空的表单数据，不自动创建IF分支
    formData.value = {
      name: t('choiceBranch.titles.condition_branch'),
      description: '',
      choices: [], // 不自动创建IF分支
      defaultBranch: {
        branch_id: 'else_' + uuidv4(),
        name: 'ELSE',
        logic: 'and',
        conditions: [createEmptyCondition()],
        is_default: true,
      },
    };
  }
};



// 更新非默认分支名称
const updateBranchNames = () => {
  formData.value.choices.forEach((choice, index) => {
    if (index === 0) {
      choice.name = 'IF';
    } else {
      choice.name = 'ELIF';
    }
  });
};

// 创建空条件
const createEmptyCondition = () => ({
  id: uuidv4(),
  left: {
    type: 'reference',
    value: '',
  },
  right: {
    type: 'string',
    value: '',
  },
  operate: 'string_equal',
  dataType: 'string',
  isRightReference: false,
});

// 创建空分支
const createEmptyChoice = () => ({
  branch_id: uuidv4(),
  name: 'IF',
  logic: 'and',
  conditions: [createEmptyCondition()],
  is_default: false,
});

// 创建默认分支
const createDefaultChoice = () => ({
  branch_id: 'else_' + uuidv4(),
  name: 'ELSE',
  logic: 'and',
  conditions: [createEmptyCondition()],
  is_default: true,
});

// 初始化默认分支（只初始化一个IF分支）
const initDefaultBranches = () => {
  formData.value.choices = [
    {
      branch_id: uuidv4(),
      name: 'IF',
      logic: 'and',
      conditions: [createEmptyCondition()],
      is_default: false,
    }
  ];
};

// 添加新分支
const addBranch = () => {
  // 添加新的 ELIF 分支到非默认分支列表末尾
  const newBranch = {
    branch_id: uuidv4(),
    name: 'ELIF',
    logic: 'and',
    conditions: [createEmptyCondition()],
    is_default: false,
  };
  
  formData.value.choices.push(newBranch);
  
  // 更新分支名称
  updateBranchNames();
};

// 删除分支
const removeBranch = (index) => {
  formData.value.choices.splice(index, 1);
  // 删除后更新分支名称
  updateBranchNames();
};

// 添加条件
const addCondition = (choiceIndex) => {
  formData.value.choices[choiceIndex].conditions.push(createEmptyCondition());
};

// 删除条件
const removeCondition = (choiceIndex, conditionIndex) => {
  const choice = formData.value.choices[choiceIndex];
  choice.conditions.splice(conditionIndex, 1);
};

// 切换逻辑运算符
const toggleLogic = (choiceIndex) => {
  const choice = formData.value.choices[choiceIndex];
  choice.logic = choice.logic === 'and' ? 'or' : 'and';
};

// 更新条件
const updateCondition = (choiceIndex, conditionIndex, condition) => {
  formData.value.choices[choiceIndex].conditions[conditionIndex] = condition;
};



// 表单验证
const validateForm = () => {
  // 验证基本信息
  if (!formData.value.name || formData.value.name.trim() === '') {
    ElMessage.error(t('choiceBranch.validation.enter_node_name'));
    return false;
  }
  
  // 验证是否至少有一个分支（默认分支）
  if (!formData.value.defaultBranch && formData.value.choices.length === 0) {
    ElMessage.error(t('choiceBranch.validation.need_at_least_one_branch'));
    return false;
  }
  
  // 验证所有非默认条件分支
  for (const choice of formData.value.choices) {
    // 过滤有效条件
    const validConditions = choice.conditions.filter(condition => {
      return condition.left?.value && condition.left.value !== '' && 
             condition.left.value !== null && condition.left.value !== undefined;
    });
    
    // 如果分支没有有效条件，跳过（在保存时会被过滤掉）
    if (validConditions.length === 0) {
      continue;
    }
    
    // 对于有条件的分支，验证条件完整性
    for (const condition of validConditions) {
      if (!condition.left.value || condition.left.value === '') {
        ElMessage.error(t('choiceBranch.validation.branch_missing_left_variable', { branchName: choice.name }));
        return false;
      }
      if (!condition.right.value || condition.right.value === '') {
        ElMessage.error(t('choiceBranch.validation.branch_missing_right_value', { branchName: choice.name }));
        return false;
      }
      if (!condition.operate) {
        ElMessage.error(t('choiceBranch.validation.branch_missing_operator', { branchName: choice.name }));
        return false;
      }
    }
  }
  
  return true;
};

// 保存节点
const saveNode = () => {
  if (!validateForm()) {
    return;
  }
  
  // 过滤掉包含空条件的分支，只保留有效的非默认分支
  const validChoices = formData.value.choices.filter(choice => {
    // 过滤有效条件
    const validConditions = choice.conditions.filter(condition => {
      return condition.left?.value && condition.left.value !== '' && 
             condition.left.value !== null && condition.left.value !== undefined &&
             condition.right?.value && condition.right.value !== '' && 
             condition.right.value !== null && condition.right.value !== undefined;
    });
    // 只保留有有效条件的分支
    return validConditions.length > 0;
  });
  
  // 合并有效的非默认分支和默认分支
  const allChoices = [...validChoices];
  if (formData.value.defaultBranch) {
    allChoices.push(formData.value.defaultBranch);
  }
  
  // 如果没有任何有效的非默认分支，确保至少有默认分支
  if (allChoices.length === 0) {
    ElMessage.error(t('choiceBranch.validation.need_valid_branch'));
    return;
  }
  
  // 对所有条件值进行类型转换，再次过滤确保数据有效性
  const processedChoices = allChoices.map(choice => ({
    ...choice,
    conditions: choice.conditions
      .filter(condition => {
        // 再次过滤，确保条件有效
        if (choice.is_default) {
          return true; // 默认分支可以没有条件
        }
        return condition.left?.value && condition.left.value !== '' && 
               condition.left.value !== null && condition.left.value !== undefined;
      })
      .map(condition => ({
        ...condition,
        left: {
          ...condition.left,
          value: condition.left.type === 'reference' ? condition.left.value : parseValue(condition.left.value, condition.left.type)
        },
        right: {
          ...condition.right,
          value: condition.right.type === 'reference' ? condition.right.value : parseValue(condition.right.value, condition.right.type)
        },
        // 转换operate为operator，保持与后端一致
        operator: condition.operate,
        // 移除operate字段
        operate: undefined
      }))
  }));
  
  const nodeData = {
    name: formData.value.name,
    description: formData.value.description,
    callId: 'Choice',
    parameters: {
      input_parameters: {
        choices: processedChoices,
      },
      output_parameters: {
        branch_id: {
          type: 'string',
          description: t('choiceBranch.titles.selected_branch_id')
        }
      },
    },
  };
  
  console.log('[ChoiceBranchDrawer]', t('choiceBranch.console.save_final_data'), {
    processedChoices,
    validChoicesCount: validChoices.length,
    totalChoicesCount: allChoices.length
  });
  
  emit('saveNode', nodeData, props.nodeId);
  handleClose();
};

// 关闭抽屉
const handleClose = () => {
  emit('update:visible', false);
};

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        initFormData();
      });
    }
  },
  { immediate: true }
);

// 解析值输入
const parseValue = (value, type) => {
  if (type === 'number') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  } else if (type === 'bool') {
    return value === 'true' || value === true;
  } else if (type === 'list') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  } else if (type === 'dict') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value;
};

// 格式化值显示
const formatValue = (value, type) => {
  if (type === 'list' || type === 'dict') {
    return JSON.stringify(value);
  }
  return String(value);
};
</script>

<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="$t('choiceBranch.titles.config_condition_branch')"
    direction="rtl"
    size="50%"
    :before-close="handleClose"
    class="choice-branch-drawer"
  >
    <div class="drawer-content">
      <!-- 基本信息 -->
      <div class="section">
        <h3 class="section-title">{{ $t('choiceBranch.basic_info') }}</h3>
        <el-form :model="formData" label-width="100px">
          <el-form-item :label="$t('choiceBranch.node_name')" required>
            <el-input v-model="formData.name" :placeholder="$t('choiceBranch.placeholders.enter_node_name')" />
          </el-form-item>
          <el-form-item :label="$t('choiceBranch.node_description')" label-width="100px">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="2"
              :placeholder="$t('choiceBranch.placeholders.enter_node_description')"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 分支配置 -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">{{ $t('choiceBranch.branch_config') }}</h3>
        </div>

        <div class="branches-container">
          <!-- 非默认分支 -->
          <ChoiceBranchCard
            v-for="(choice, choiceIndex) in formData.choices"
            :key="choice.branch_id"
            :choice="choice"
            :choice-index="choiceIndex"
            :value-type-options="valueTypeOptions"
            :operator-options="operatorOptions"
            :can-delete="formData.choices.length > 1"
            :flow-id="flowId"
            :conversation-id="conversationId"
            :current-step-id="currentStepId"
            @remove-branch="removeBranch"
            @add-condition="addCondition"
            @remove-condition="removeCondition"
            @toggle-logic="toggleLogic"
            @update-condition="updateCondition"
          />

          <!-- 添加分支按钮 -->
          <div class="add-branch-container">
            <button class="add-branch-btn" @click="addBranch">
              <Plus />
              {{ $t('choiceBranch.buttons.add_elif') }}
            </button>
          </div>

          <!-- 分割线 -->
          <div class="divider"></div>

          <!-- 默认分支 -->
          <div v-if="formData.defaultBranch" class="default-branch-section">
            <h3 class="else-title">ELSE</h3>
            <p class="else-description">{{ $t('choiceBranch.tips.else_description') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">{{ $t('choiceBranch.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="saveNode">{{ $t('choiceBranch.buttons.save') }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
.choice-branch-drawer {
  :deep(.el-drawer__body) {
    padding: 0;
  }
}

.drawer-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  background: var(--el-bg-color);
  
  body[theme='dark'] & {
    background: #1f2329;
  }
}

.section {
  margin-bottom: 24px;
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 16px 0;
    
    body[theme='dark'] & {
      color: #e4e8ee;
    }
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
}

.branches-container {
  .add-branch-container {
    margin-bottom: 16px;
    
    .add-branch-btn {
      width: calc(100% - 20px);
      padding: 12px 16px;
      background-color: var(--el-fill-color-extra-light);
      color: var(--el-text-color-primary);
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
      
      body[theme='dark'] & {
        background-color: #1f2329;
        color: #e4e8ee;
        border: 1px solid var(--el-border-color);
      }
      
      svg {
        width: 14px;
        height: 14px;
      }
      
      &:hover {
        background-color: var(--el-fill-color-light);
        
        body[theme='dark'] & {
          background-color: var(--flow-node-default-over-color, #25303e);
          border-color: var(--flow-node-boder-default-over, #314265);
        }
      }
      
      &:active {
        transform: translateY(1px);
      }
    }
  }

  .divider {
    height: 1px;
    background: var(--el-border-color-light);
    margin: 24px 0;
    
    body[theme='dark'] & {
      background: var(--el-border-color);
    }
  }

  .default-branch-section {    
    .else-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 8px 0;
      
      body[theme='dark'] & {
        color: #e4e8ee;
      }
    }
    
    .else-description {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0;
      line-height: 1.5;
      
      body[theme='dark'] & {
        color: #d3dce9;
      }
    }
  }


}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  
  body[theme='dark'] & {
    background: #1f2329;
    border-top-color: var(--el-border-color);
  }
}

// 深色主题适配已集成到主样式中
</style> 