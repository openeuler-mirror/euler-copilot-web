<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
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
  title: '变量配置'
})

const emit = defineEmits<{
  'update:config': [config: VariableConfig]
  'config-changed': [config: VariableConfig]
}>()

// 节点类型特定的配置模板
const nodeTypeConfigs = {
  llm: {
    system_prompt: {
      label: '系统提示词',
      type: 'textarea',
      placeholder: '请输入系统提示词，可使用变量如 {{system.query}}',
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: '定义AI助手的角色和行为，支持使用变量引用'
    },
    user_prompt: {
      label: '用户提示词',
      type: 'textarea', 
      placeholder: '请输入用户提示词模板',
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: '用户输入的模板，通常包含用户查询变量'
    },
    api_key: {
      label: 'API密钥',
      type: 'variable',
      placeholder: '选择API密钥变量',
      supportedScopes: ['user', 'env'],
      tooltip: '用于调用LLM服务的API密钥'
    },
    temperature: {
      label: '温度参数',
      type: 'input',
      placeholder: '0.7',
      supportedScopes: ['env', 'conversation'],
      tooltip: '控制生成文本的随机性，范围0-1'
    },
    max_tokens: {
      label: '最大Token数',
      type: 'input',
      placeholder: '2048',
      supportedScopes: ['env', 'conversation'],
      tooltip: '限制生成内容的最大长度'
    }
  },
  condition: {
    condition_expression: {
      label: '条件表达式',
      type: 'textarea',
      placeholder: '如: {{score}} > 0.8',
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: '支持JavaScript表达式，可使用变量进行条件判断'
    },
    true_branch: {
      label: '条件为真时',
      type: 'input',
      placeholder: '下一个节点ID',
      supportedScopes: [],
      tooltip: '条件为真时跳转的节点'
    },
    false_branch: {
      label: '条件为假时',
      type: 'input',
      placeholder: '下一个节点ID',
      supportedScopes: [],
      tooltip: '条件为假时跳转的节点'
    }
  },
  variable_assignment: {
    target_variable: {
      label: '目标变量',
      type: 'input',
      placeholder: '变量名',
      supportedScopes: ['conversation'],
      tooltip: '要赋值的变量名'
    },
    source_expression: {
      label: '赋值表达式',
      type: 'textarea',
      placeholder: '{{system.query}} + " processed"',
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: '支持变量引用和简单表达式'
    },
    variable_type: {
      label: '变量类型',
      type: 'select',
      options: [
        { label: '字符串', value: 'string' },
        { label: '数字', value: 'number' },
        { label: '布尔值', value: 'boolean' },
        { label: '对象', value: 'object' }
      ],
      supportedScopes: [],
      tooltip: '新变量的数据类型'
    }
  },
  http_request: {
    url: {
      label: '请求URL',
      type: 'input',
      placeholder: 'https://api.example.com/data',
      supportedScopes: ['user', 'env', 'conversation'],
      tooltip: 'HTTP请求的目标地址'
    },
    method: {
      label: '请求方法',
      type: 'select',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' }
      ],
      supportedScopes: [],
      tooltip: 'HTTP请求方法'
    },
    headers: {
      label: '请求头',
      type: 'object',
      placeholder: '{"Content-Type": "application/json"}',
      supportedScopes: ['user', 'env', 'conversation'],
      tooltip: 'HTTP请求头，支持变量引用'
    },
    body: {
      label: '请求体',
      type: 'textarea',
      placeholder: '{"query": "{{system.query}}"}',
      supportedScopes: ['conversation', 'system', 'user', 'env'],
      tooltip: '请求体内容，支持变量引用'
    }
  }
}

// 响应式数据
const formData = ref<VariableConfig>({})
const customFields = ref<Array<{key: string, value: string}>>([])

// 计算属性
const currentNodeConfig = computed(() => {
  return nodeTypeConfigs[props.nodeType] || {}
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
          <span>{{ title }}</span>
          <ElTooltip content="使用变量语法如 {{system.query}} 来引用变量">
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
          <ElCollapseItem title="自定义字段" name="custom">
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
                      placeholder="字段名"
                      class="field-key-input"
                    />
                  </template>
                  <div class="custom-field-value">
                    <VariableSelector
                      v-model="field.value"
                      placeholder="字段值（支持变量引用）"
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
                添加自定义字段
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