<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  ElTabs, ElTabPane, ElTable, ElTableColumn, ElButton, ElDialog, 
  ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElMessage,
  ElTag, ElPopconfirm, ElIcon, ElCollapse, ElCollapseItem
} from 'element-plus'
import { Plus, Delete, InfoFilled } from '@element-plus/icons-vue'
import { listVariables, createVariable, deleteVariable, getVariableTypes } from '@/api/variable'

interface Variable {
  name: string
  var_type: string
  scope: string
  value: string
  description?: string
  created_at?: string
  updated_at?: string
}

interface Props {
  conversationId?: string
  flowId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'variables-updated': []
}>()

const { t } = useI18n()

// 响应式数据
const activeTab = ref('system')
const systemVariables = ref<Variable[]>([])
const conversationVariables = ref<Variable[]>([])
const loading = ref(false)
const variableTypes = ref<{types: string[], scopes: string[]}>({types: [], scopes: []})

// 新增变量对话框
const addVariableDialogVisible = ref(false)
const newVariable = ref({
  name: '',
  var_type: 'string',
  value: '',
  description: ''
})
const addVariableForm = ref()

// 系统变量说明 - 使用计算属性从i18n获取
const systemVariableDescriptions = computed(() => ({
  query: t('startNodeVariableManager.system_var_descriptions.query'),
  files: t('startNodeVariableManager.system_var_descriptions.files'),
  dialogue_count: t('startNodeVariableManager.system_var_descriptions.dialogue_count'),
  app_id: t('startNodeVariableManager.system_var_descriptions.app_id'),
  flow_id: t('startNodeVariableManager.system_var_descriptions.flow_id'),
  user_id: t('startNodeVariableManager.system_var_descriptions.user_id'),
  session_id: t('startNodeVariableManager.system_var_descriptions.session_id'),
  timestamp: t('startNodeVariableManager.system_var_descriptions.timestamp')
}))

// 计算属性 - 使用i18n获取变量类型标签
const typeLabels = computed(() => ({
  string: t('startNodeVariableManager.variable_types.string'),
  number: t('startNodeVariableManager.variable_types.number'),
  boolean: t('startNodeVariableManager.variable_types.boolean'),
  object: t('startNodeVariableManager.variable_types.object'),
  secret: t('startNodeVariableManager.variable_types.secret'),
  group: t('startNodeVariableManager.variable_types.group'),
  file: t('startNodeVariableManager.variable_types.file'),
  'array[any]': t('startNodeVariableManager.variable_types.array[any]'),
  'array[string]': t('startNodeVariableManager.variable_types.array[string]'),
  'array[number]': t('startNodeVariableManager.variable_types.array[number]'),
  'array[object]': t('startNodeVariableManager.variable_types.array[object]'),
  'array[file]': t('startNodeVariableManager.variable_types.array[file]'),
  'array[boolean]': t('startNodeVariableManager.variable_types.array[boolean]'),
  'array[secret]': t('startNodeVariableManager.variable_types.array[secret]')
}))

// 表单验证规则 - 使用计算属性从i18n获取
const addVariableRules = computed(() => ({
  name: [
    { required: true, message: t('startNodeVariableManager.validation.name_required'), trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: t('startNodeVariableManager.validation.name_pattern'), trigger: 'blur' }
  ],
  var_type: [
    { required: true, message: t('startNodeVariableManager.validation.type_required'), trigger: 'change' }
  ],
  value: [
    { required: true, message: t('startNodeVariableManager.validation.value_required'), trigger: 'blur' }
  ]
}))

// 方法
const loadSystemVariables = async () => {
  loading.value = true
  try {
    let params: any = { scope: 'system' }
    
    // 根据是否有conversation_id选择参数
    if (props.conversationId) {
      // 对话阶段：使用conversation_id查询实例
      params.conversation_id = props.conversationId
    } else if (props.flowId) {
      // 配置阶段：使用flow_id查询模板
      params.flow_id = props.flowId
    } else {
      console.warn('⚠️ 缺少conversationId和flowId，跳过系统变量加载')
      systemVariables.value = []
      return
    }
    
    const response = await listVariables(params)
    systemVariables.value = response?.result?.variables || []
  } catch (error) {
    console.error(t('startNodeVariableManager.messages.load_system_variables_failed'), error)
    ElMessage.error(t('startNodeVariableManager.messages.load_system_variables_failed'))
  } finally {
    loading.value = false
  }
}

const loadConversationVariables = async () => {
  if (!props.conversationId) return
  
  loading.value = true
  try {
    const response = await listVariables({ 
      scope: 'conversation',
      conversation_id: props.conversationId 
    })
    conversationVariables.value = response?.result?.variables || []
  } catch (error) {
    console.error(t('startNodeVariableManager.messages.load_conversation_variables_failed'), error)
    ElMessage.error(t('startNodeVariableManager.messages.load_conversation_variables_failed'))
  } finally {
    loading.value = false
  }
}

const loadVariableTypes = async () => {
  try {
    const response = await getVariableTypes()
    variableTypes.value = response?.result || {types: [], scopes: []}
  } catch (error) {
    console.error(t('startNodeVariableManager.messages.load_variable_types_failed'), error)
  }
}

const handleAddVariable = () => {
  newVariable.value = {
    name: '',
    var_type: 'string',
    value: '',
    description: ''
  }
  addVariableDialogVisible.value = true
}

const handleSaveVariable = async () => {
  try {
    await addVariableForm.value.validate()
    
    // 根据变量类型转换值
    let processedValue: any = newVariable.value.value
    

    
    // 类型转换处理
    switch (newVariable.value.var_type) {
      case 'number':
        processedValue = processedValue === '' ? 0 : Number(processedValue)
        if (isNaN(processedValue)) {
          ElMessage.error(t('startNodeVariableManager.messages.invalid_number'))
                    return
        }
        break
      case 'boolean':
        processedValue = processedValue === 'true' || processedValue === true
        break
      case 'object':
        try {
          processedValue = JSON.parse(processedValue)
        } catch (error) {
          ElMessage.error(t('startNodeVariableManager.messages.invalid_json'))
          return
        }
        break
      case 'array[string]':
        if (typeof processedValue === 'string') {
          processedValue = processedValue.split(',').map(item => item.trim()).filter(item => item)
        }
        break
      case 'array[number]':
        if (typeof processedValue === 'string') {
          try {
            processedValue = JSON.parse(processedValue)
            if (!Array.isArray(processedValue) || !processedValue.every(item => typeof item === 'number')) {
              throw new Error('Invalid array')
            }
          } catch (error) {
            ElMessage.error(t('startNodeVariableManager.messages.invalid_number_array'))
            return
          }
        }
        break
      case 'array[boolean]':
        if (typeof processedValue === 'string') {
          try {
            processedValue = JSON.parse(processedValue)
            if (!Array.isArray(processedValue) || !processedValue.every(item => typeof item === 'boolean')) {
              throw new Error('Invalid array')
            }
          } catch (error) {
            ElMessage.error(t('startNodeVariableManager.messages.invalid_boolean_array'))
            return
          }
        }
        break
      case 'array[object]':
        if (typeof processedValue === 'string') {
          try {
            processedValue = JSON.parse(processedValue)
            if (!Array.isArray(processedValue)) {
              throw new Error('Invalid array')
            }
          } catch (error) {
            ElMessage.error(t('startNodeVariableManager.messages.invalid_object_array'))
            return
          }
        }
        break
      default:
        // 保持字符串类型
        processedValue = String(processedValue)
    }
    
    const requestData = {
      name: newVariable.value.name,
      var_type: newVariable.value.var_type,
      scope: 'conversation',
      value: processedValue,
      description: newVariable.value.description,
      flow_id: props.flowId,
      conversation_id: props.conversationId
    }
    

    
    await createVariable(requestData)
    
    ElMessage.success(t('startNodeVariableManager.messages.variable_created'))
    addVariableDialogVisible.value = false
    await loadConversationVariables()
    emit('variables-updated')
  } catch (error) {
    console.error(t('startNodeVariableManager.messages.create_variable_failed'), error)
    ElMessage.error(t('startNodeVariableManager.messages.create_variable_failed'))
  }
}

const handleDeleteVariable = async (variable: Variable) => {
  try {
    await deleteVariable({
      name: variable.name,
      scope: 'conversation',
      conversation_id: props.conversationId
    })
    
    ElMessage.success(t('startNodeVariableManager.messages.variable_deleted'))
    await loadConversationVariables()
    emit('variables-updated')
  } catch (error) {
    console.error(t('startNodeVariableManager.messages.delete_variable_failed'), error)
    ElMessage.error(t('startNodeVariableManager.messages.delete_variable_failed'))
  }
}

const formatVariableReference = (variable: Variable): string => {
  const scopeMap = {
    system: 'system',
    conversation: 'conversation'
  }
  return `{{${scopeMap[variable.scope]}.${variable.name}}}`
}

const getVariableValuePreview = (variable: Variable): string => {
  if (variable.var_type === 'secret') {
    return '••••••••'
  }
  if (typeof variable.value === 'object') {
    return JSON.stringify(variable.value)
  }
  const str = String(variable.value)
  return str.length > 50 ? str.substring(0, 50) + '...' : str
}

const getInputType = (varType: string): string => {
  switch (varType) {
    case 'number':
      return 'number'
    case 'secret':
      return 'password'
    default:
      return 'text'
  }
}

// 生命周期
onMounted(() => {
  loadSystemVariables()
  loadConversationVariables()
  loadVariableTypes()
})
</script>

<template>
  <div class="start-node-variable-manager">
    <ElTabs v-model="activeTab" class="variable-tabs">
      <!-- 系统变量 -->
      <ElTabPane :label="t('startNodeVariableManager.system_variables')" name="system">
        <div class="tab-content">
          <div class="tab-header">
            <div class="tab-title">
              <ElIcon><InfoFilled /></ElIcon>
              <span>{{ t('startNodeVariableManager.system_readonly') }}</span>
            </div>
            <div class="tab-description">
              {{ t('startNodeVariableManager.system_description') }}
            </div>
          </div>
          
          <ElCollapse class="system-variables-collapse">
            <ElCollapseItem :title="t('startNodeVariableManager.available_system_variables')" name="system-vars">
              <ElTable :data="systemVariables" v-loading="loading">
                <ElTableColumn prop="name" :label="t('startNodeVariableManager.variable_name')" width="120">
                  <template #default="{ row }">
                    <code class="variable-name">{{ row.name }}</code>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="var_type" :label="t('startNodeVariableManager.type')" width="100">
                  <template #default="{ row }">
                    <ElTag size="small" type="primary">
                      {{ typeLabels[row.var_type] || row.var_type }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn :label="t('startNodeVariableManager.description')" min-width="200">
                  <template #default="{ row }">
                    {{ systemVariableDescriptions[row.name] || row.description || t('startNodeVariableManager.system_var_descriptions.default') }}
                  </template>
                </ElTableColumn>
                <ElTableColumn :label="t('startNodeVariableManager.reference_syntax')" width="150">
                  <template #default="{ row }">
                    <code class="variable-reference">{{ formatVariableReference(row) }}</code>
                  </template>
                </ElTableColumn>
              </ElTable>
            </ElCollapseItem>
          </ElCollapse>
        </div>
      </ElTabPane>
      
      <!-- 对话变量 -->
      <ElTabPane :label="t('startNodeVariableManager.conversation_variables')" name="conversation">
        <div class="tab-content">
          <div class="tab-header">
            <div class="tab-title">
              <ElIcon><Plus /></ElIcon>
              <span>{{ t('startNodeVariableManager.conversation_variables') }}</span>
            </div>
            <div class="tab-description">
              {{ t('startNodeVariableManager.conversation_description') }}
            </div>
            <ElButton type="primary" @click="handleAddVariable" :icon="Plus">
              {{ t('startNodeVariableManager.add_variable') }}
            </ElButton>
          </div>
          
          <ElTable :data="conversationVariables" v-loading="loading">
            <ElTableColumn prop="name" :label="t('startNodeVariableManager.variable_name')" width="120">
              <template #default="{ row }">
                <code class="variable-name">{{ row.name }}</code>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="var_type" :label="t('startNodeVariableManager.type')" width="100">
              <template #default="{ row }">
                <ElTag size="small" :type="row.var_type === 'secret' ? 'warning' : 'primary'">
                  {{ typeLabels[row.var_type] || row.var_type }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="t('startNodeVariableManager.value')" min-width="150">
              <template #default="{ row }">
                <span class="variable-value">{{ getVariableValuePreview(row) }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="description" :label="t('startNodeVariableManager.description')" min-width="150" />
            <ElTableColumn :label="t('startNodeVariableManager.reference_syntax')" width="180">
              <template #default="{ row }">
                <code class="variable-reference">{{ formatVariableReference(row) }}</code>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="t('startNodeVariableManager.operations')" width="80">
              <template #default="{ row }">
                <ElPopconfirm
                  :title="t('startNodeVariableManager.confirm_delete')"
                  @confirm="handleDeleteVariable(row)"
                >
                  <template #reference>
                    <ElButton type="danger" size="small" :icon="Delete" circle />
                  </template>
                </ElPopconfirm>
              </template>
            </ElTableColumn>
          </ElTable>
          
          <!-- 空状态 -->
          <div v-if="conversationVariables.length === 0 && !loading" class="empty-state">
            <div class="empty-text">{{ t('startNodeVariableManager.no_conversation_variables') }}</div>
            <div class="empty-hint">{{ t('startNodeVariableManager.empty_hint') }}</div>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>
    
    <!-- 新增变量对话框 -->
    <ElDialog
      v-model="addVariableDialogVisible"
      :title="t('startNodeVariableManager.add_conversation_variable')"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm
        ref="addVariableForm"
        :model="newVariable"
        :rules="addVariableRules"
        label-width="80px"
      >
        <ElFormItem :label="t('startNodeVariableManager.variable_name_label')" prop="name">
          <ElInput
            v-model="newVariable.name"
            :placeholder="t('startNodeVariableManager.placeholders.variable_name')"
          />
        </ElFormItem>
        
        <ElFormItem :label="t('startNodeVariableManager.variable_type_label')" prop="var_type">
          <ElSelect v-model="newVariable.var_type" :placeholder="t('startNodeVariableManager.placeholders.select_variable_type')"
>
            <ElOption
              v-for="type in variableTypes.types"
              :key="type"
              :label="typeLabels[type] || type"
              :value="type"
            />
          </ElSelect>
        </ElFormItem>
        
        <ElFormItem :label="t('startNodeVariableManager.variable_value_label')" prop="value">
          <!-- String, Number, Secret 类型 -->
          <ElInput
            v-if="['string', 'number', 'secret'].includes(newVariable.var_type)"
            v-model="newVariable.value"
            :type="getInputType(newVariable.var_type)"
            :placeholder="t('startNodeVariableManager.placeholders.variable_value')"
            :show-password="newVariable.var_type === 'secret'"
          />
          
          <!-- Boolean 类型 -->
          <ElSelect
            v-else-if="newVariable.var_type === 'boolean'"
            v-model="newVariable.value"
            :placeholder="t('startNodeVariableManager.placeholders.boolean_value')"
          >
            <ElOption label="true" value="true" />
            <ElOption label="false" value="false" />
          </ElSelect>
          
          <!-- Object 类型 -->
          <ElInput
            v-else-if="newVariable.var_type === 'object'"
            v-model="newVariable.value"
            type="textarea"
            :rows="4"
            :placeholder="t('startNodeVariableManager.placeholders.json_object')"
          />
          
          <!-- Array[String] 类型 -->
          <ElInput
            v-else-if="newVariable.var_type === 'array[string]'"
            v-model="newVariable.value"
            :placeholder="t('startNodeVariableManager.placeholders.string_array')"
          />
          
          <!-- File 和 Array[File] 类型提示 -->
          <div
            v-else-if="newVariable.var_type === 'file' || newVariable.var_type === 'array[file]'"
            class="file-type-tip"
          >
            <el-alert
              :title="t('startNodeVariableManager.file_type_tip')"
              type="info"
              :closable="false"
              show-icon
            />
            <ElInput
              v-model="newVariable.value"
              :placeholder="t('startNodeVariableManager.placeholders.file_default')"
            />
          </div>
          
          <!-- 其他数组类型 -->
          <ElInput
            v-else-if="newVariable.var_type.startsWith('array[')"
            v-model="newVariable.value"
            type="textarea"
            :rows="3"
            :placeholder="t('startNodeVariableManager.placeholders.json_array')"
          />
          
          <!-- 默认类型 -->
          <ElInput
            v-else
            v-model="newVariable.value"
            :placeholder="t('startNodeVariableManager.placeholders.variable_value')"
          />
        </ElFormItem>
        
        <ElFormItem :label="t('startNodeVariableManager.description_label')">
          <ElInput
            v-model="newVariable.description"
            :placeholder="t('startNodeVariableManager.placeholders.description')"
          />
        </ElFormItem>
      </ElForm>
      
      <template #footer>
        <ElButton @click="addVariableDialogVisible = false">{{ t('startNodeVariableManager.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSaveVariable">{{ t('startNodeVariableManager.save') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.start-node-variable-manager {
  .variable-tabs {
    .tab-content {
      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--el-border-color-light);
        
        .tab-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 16px;
          color: var(--el-text-color-primary);
        }
        
        .tab-description {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
          max-width: 60%;
        }
      }
      
      .system-variables-collapse {
        margin-bottom: 16px;
      }
      
      .variable-name {
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 13px;
        color: var(--el-color-primary);
        background-color: var(--el-fill-color-extra-light);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--el-border-color);
      }
      
      .variable-reference {
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 12px;
        color: var(--el-color-success);
        background-color: var(--el-color-success-light-9);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--el-color-success-light-7);
      }
      
      .variable-value {
        font-size: 13px;
        color: var(--el-text-color-regular);
        word-break: break-all;
      }
      
      .empty-state {
        text-align: center;
        padding: 64px 16px;
        color: var(--el-text-color-secondary);
        
        .empty-text {
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .empty-hint {
          font-size: 14px;
          color: var(--el-text-color-placeholder);
        }
      }
      
      .file-type-tip {
        .el-alert {
          margin-bottom: 8px;
        }
        
        .el-input {
          margin-top: 4px;
        }
      }
    }
  }
}
</style> 