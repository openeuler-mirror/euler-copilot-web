<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton,
  ElCard, ElCollapse, ElCollapseItem, ElIcon, ElTooltip
} from 'element-plus'
import { QuestionFilled, Plus, Delete } from '@element-plus/icons-vue'
import VariableSelector from './VariableSelector.vue'

interface VariableConfig {
  [key: string]: string | any
}

interface Props {
  nodeType: string
  config: VariableConfig
  flowId?: string
  conversationId?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
})

const emit = defineEmits<{
  'update:config': [config: VariableConfig]
  'config-changed': [config: VariableConfig]
}>()

// 节点类型特定的配置模板
const { t } = useI18n()

const nodeTypeConfigs = computed(() => ({
  llm: {
    system_prompt: {
      label: t('nodeVariableConfig.llm.system_prompt_label'),
      type: 'textarea',
      placeholder: t('nodeVariableConfig.llm.system_prompt_placeholder'),
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: t('nodeVariableConfig.llm.system_prompt_tooltip')
    },
    user_prompt: {
      label: t('nodeVariableConfig.llm.user_prompt_label'),
      type: 'textarea', 
      placeholder: t('nodeVariableConfig.llm.user_prompt_placeholder'),
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: t('nodeVariableConfig.llm.user_prompt_tooltip')
    },
    api_key: {
      label: t('nodeVariableConfig.llm.api_key_label'),
      type: 'variable',
      placeholder: t('nodeVariableConfig.llm.api_key_placeholder'),
      supportedScopes: ['user', 'env'],
      tooltip: t('nodeVariableConfig.llm.api_key_tooltip')
    },
    temperature: {
      label: t('nodeVariableConfig.llm.temperature_label'),
      type: 'input',
      placeholder: t('nodeVariableConfig.llm.temperature_placeholder'),
      supportedScopes: ['env', 'conversation'],
      tooltip: t('nodeVariableConfig.llm.temperature_tooltip')
    },
    max_tokens: {
      label: t('nodeVariableConfig.llm.max_tokens_label'),
      type: 'input',
      placeholder: t('nodeVariableConfig.llm.max_tokens_placeholder'),
      supportedScopes: ['env', 'conversation'],
      tooltip: t('nodeVariableConfig.llm.max_tokens_tooltip')
    }
  },
  condition: {
    condition_expression: {
      label: t('nodeVariableConfig.condition.condition_expression_label'),
      type: 'textarea',
      placeholder: t('nodeVariableConfig.condition.condition_expression_placeholder'),
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: t('nodeVariableConfig.condition.condition_expression_tooltip')
    },
    true_branch: {
      label: t('nodeVariableConfig.condition.true_branch_label'),
      type: 'input',
      placeholder: t('nodeVariableConfig.condition.true_branch_placeholder'),
      supportedScopes: [],
      tooltip: t('nodeVariableConfig.condition.true_branch_tooltip')
    },
    false_branch: {
      label: t('nodeVariableConfig.condition.false_branch_label'),
      type: 'input',
      placeholder: t('nodeVariableConfig.condition.false_branch_placeholder'),
      supportedScopes: [],
      tooltip: t('nodeVariableConfig.condition.false_branch_tooltip')
    }
  },
  variable_assignment: {
    target_variable: {
      label: t('nodeVariableConfig.variable_assignment.target_variable_label'),
      type: 'input',
      placeholder: t('nodeVariableConfig.variable_assignment.target_variable_placeholder'),
      supportedScopes: ['conversation'],
      tooltip: t('nodeVariableConfig.variable_assignment.target_variable_tooltip')
    },
    source_expression: {
      label: t('nodeVariableConfig.variable_assignment.source_expression_label'),
      type: 'textarea',
      placeholder: t('nodeVariableConfig.variable_assignment.source_expression_placeholder'),
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: t('nodeVariableConfig.variable_assignment.source_expression_tooltip')
    },
    variable_type: {
      label: t('nodeVariableConfig.variable_assignment.variable_type_label'),
      type: 'select',
      options: [
        { label: t('nodeVariableConfig.variable_assignment.type_string'), value: 'string' },
        { label: t('nodeVariableConfig.variable_assignment.type_number'), value: 'number' },
        { label: t('nodeVariableConfig.variable_assignment.type_boolean'), value: 'boolean' },
        { label: t('nodeVariableConfig.variable_assignment.type_object'), value: 'object' }
      ],
      supportedScopes: [],
      tooltip: t('nodeVariableConfig.variable_assignment.variable_type_tooltip')
    }
  },
  http_request: {
    url: {
      label: t('nodeVariableConfig.http_request.url_label'),
      type: 'input',
      placeholder: t('nodeVariableConfig.http_request.url_placeholder'),
      supportedScopes: ['user', 'env', 'conversation'],
      tooltip: t('nodeVariableConfig.http_request.url_tooltip')
    },
    method: {
      label: t('nodeVariableConfig.http_request.method_label'),
      type: 'select',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' }
      ],
      supportedScopes: [],
      tooltip: t('nodeVariableConfig.http_request.method_tooltip')
    },
    headers: {
      label: t('nodeVariableConfig.http_request.headers_label'),
      type: 'object',
      placeholder: t('nodeVariableConfig.http_request.headers_placeholder'),
      supportedScopes: ['user', 'env', 'conversation'],
      tooltip: t('nodeVariableConfig.http_request.headers_tooltip')
    },
    body: {
      label: t('nodeVariableConfig.http_request.body_label'),
      type: 'textarea',
      placeholder: t('nodeVariableConfig.http_request.body_placeholder'),
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: t('nodeVariableConfig.http_request.body_tooltip')
    }
  }
}))

// 响应式数据
const formData = ref<VariableConfig>({})
const customFields = ref<Array<{key: string, value: string}>>([])

// 计算属性
const currentNodeConfig = computed(() => {
  return nodeTypeConfigs.value[props.nodeType] || {}
})

const configKeys = computed(() => {
  return Object.keys(currentNodeConfig.value)
})

// 方法
const initFormData = () => {
  formData.value = { ...props.config }
  
  // 提取自定义字段
  customFields.value = []
  Object.keys(props.config).forEach(key => {
    if (!currentNodeConfig.value[key]) {
      customFields.value.push({ key, value: props.config[key] })
    }
  })
}

const handleConfigChange = () => {
  // 合并标准字段和自定义字段
  const mergedConfig = { ...formData.value }
  customFields.value.forEach(field => {
    if (field.key && field.value !== undefined) {
      mergedConfig[field.key] = field.value
    }
  })
  
  emit('update:config', mergedConfig)
  emit('config-changed', mergedConfig)
}

const addCustomField = () => {
  customFields.value.push({ key: '', value: '' })
}

const removeCustomField = (index: number) => {
  customFields.value.splice(index, 1)
  handleConfigChange()
}

const handleVariableSelected = (variable: any, fieldKey: string) => {
  console.log('Selected variable:', variable, 'for field:', fieldKey)
}

// 监听props变化
watch(() => props.config, () => {
  initFormData()
}, { deep: true, immediate: true })

watch(formData, () => {
  handleConfigChange()
}, { deep: true })

watch(customFields, () => {
  handleConfigChange()
}, { deep: true })
</script>

<template>
  <div class="node-variable-config">
    <ElCard>
      <template #header>
        <div class="card-header">
          <span>{{ title || $t('nodeVariableConfig.variable_config') }}</span>
          <ElTooltip :content="$t('nodeVariableConfig.variable_syntax_tooltip')">
            <ElIcon><QuestionFilled /></ElIcon>
          </ElTooltip>
        </div>
      </template>
      
      <ElForm :model="formData" label-width="120px">
        <!-- 标准配置字段 -->
        <div v-if="configKeys.length > 0" class="standard-fields">
          <div v-for="fieldKey in configKeys" :key="fieldKey" class="field-item">
            <ElFormItem 
              :label="currentNodeConfig[fieldKey].label"
              :prop="fieldKey"
            >
              <template #label>
                <div class="field-label">
                  <span>{{ currentNodeConfig[fieldKey].label }}</span>
                  <ElTooltip 
                    v-if="currentNodeConfig[fieldKey].tooltip"
                    :content="currentNodeConfig[fieldKey].tooltip"
                    placement="top"
                  >
                    <ElIcon class="help-icon"><QuestionFilled /></ElIcon>
                  </ElTooltip>
                </div>
              </template>
              
              <!-- 文本输入 -->
              <ElInput
                v-if="currentNodeConfig[fieldKey].type === 'input'"
                v-model="formData[fieldKey]"
                :placeholder="currentNodeConfig[fieldKey].placeholder"
              />
              
              <!-- 文本域 -->
              <VariableSelector
                v-else-if="currentNodeConfig[fieldKey].type === 'textarea'"
                v-model="formData[fieldKey]"
                :placeholder="currentNodeConfig[fieldKey].placeholder"
                :supported-scopes="currentNodeConfig[fieldKey].supportedScopes"
                :flow-id="flowId"
                :conversation-id="conversationId"
                @variable-selected="(variable) => handleVariableSelected(variable, fieldKey)"
              />
              
              <!-- 变量选择器 -->
              <VariableSelector
                v-else-if="currentNodeConfig[fieldKey].type === 'variable'"
                v-model="formData[fieldKey]"
                :placeholder="currentNodeConfig[fieldKey].placeholder"
                :supported-scopes="currentNodeConfig[fieldKey].supportedScopes"
                :flow-id="flowId"
                :conversation-id="conversationId"
                @variable-selected="(variable) => handleVariableSelected(variable, fieldKey)"
              />
              
              <!-- 下拉选择 -->
              <ElSelect
                v-else-if="currentNodeConfig[fieldKey].type === 'select'"
                v-model="formData[fieldKey]"
                :placeholder="currentNodeConfig[fieldKey].placeholder"
              >
                <ElOption
                  v-for="option in currentNodeConfig[fieldKey].options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
              
              <!-- 对象输入 -->
              <VariableSelector
                v-else-if="currentNodeConfig[fieldKey].type === 'object'"
                v-model="formData[fieldKey]"
                :placeholder="currentNodeConfig[fieldKey].placeholder"
                :supported-scopes="currentNodeConfig[fieldKey].supportedScopes"
                :flow-id="flowId"
                :conversation-id="conversationId"
                @variable-selected="(variable) => handleVariableSelected(variable, fieldKey)"
              />
            </ElFormItem>
          </div>
        </div>
        
        <!-- 自定义字段 -->
        <ElCollapse class="custom-fields-collapse">
          <ElCollapseItem :title="$t('nodeVariableConfig.custom_fields')" name="custom">
            <div class="custom-fields">
              <div 
                v-for="(field, index) in customFields" 
                :key="index"
                class="custom-field-item"
              >
                <ElFormItem>
                  <template #label>
                    <ElInput
                      v-model="field.key"
                      :placeholder="$t('nodeVariableConfig.field_name_placeholder')"
                      class="field-key-input"
                    />
                  </template>
                  <div class="custom-field-value">
                    <VariableSelector
                      v-model="field.value"
                      :placeholder="$t('nodeVariableConfig.field_value_placeholder')"
                      :flow-id="flowId"
                      :conversation-id="conversationId"
                    />
                    <ElButton 
                      type="danger" 
                      size="small" 
                      :icon="Delete"
                      @click="removeCustomField(index)"
                    />
                  </div>
                </ElFormItem>
              </div>
              
              <ElButton 
                type="primary" 
                size="small" 
                :icon="Plus"
                @click="addCustomField"
              >
                {{ $t('nodeVariableConfig.add_custom_field') }}
              </ElButton>
            </div>
          </ElCollapseItem>
        </ElCollapse>
      </ElForm>
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
.node-variable-config {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
  
  .standard-fields {
    .field-item {
      margin-bottom: 20px;
      
      .field-label {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .help-icon {
          font-size: 14px;
          color: var(--el-text-color-placeholder);
          cursor: help;
        }
      }
    }
  }
  
  .custom-fields-collapse {
    margin-top: 24px;
    
    .custom-fields {
      .custom-field-item {
        margin-bottom: 16px;
        
        .field-key-input {
          width: 120px;
        }
        
        .custom-field-value {
          display: flex;
          gap: 8px;
          align-items: center;
          width: 100%;
        }
      }
    }
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-collapse-item__header) {
  font-weight: 500;
}
</style> 