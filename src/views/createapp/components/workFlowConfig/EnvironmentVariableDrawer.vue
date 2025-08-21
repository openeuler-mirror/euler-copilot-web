<template>
  <div class="environmentVariableConfig">
    <el-drawer
      v-model="visible"
      :show-close="false"
      :modal="true"
      modal-class="transparent-modal"
      class="flowDrawer environmentVariableDrawer"
      @close="closeDrawer"
      size="600px"
    >
      <template #header>
        <div class="drawerHeader">
          <div class="headerIcon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M20 18a1 1 0 0 1-1 1h-4a3 3 0 0 0-3 3a3 3 0 0 0-3-3H5a1 1 0 0 1-1-1H2a3 3 0 0 0 3 3h4a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2h4a3 3 0 0 0 3-3Zm0-12a1 1 0 0 0-1-1h-4a3 3 0 0 1-3-3a3 3 0 0 1-3 3H5a1 1 0 0 0-1 1H2a3 3 0 0 1 3-3h4a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2h4a3 3 0 0 1 3 3Zm-8 6L9 8H7v8h2v-4l3 4h2V8h-2zm9-4l-2 5.27L17 8h-2l3 8h2l3-8zM1 8v8h5v-2H3v-1h2v-2H3v-1h3V8z" />
            </svg>
          </div>
          <div class="headerText">{{ $t('flow.env_config') }}</div>
        </div>
      </template>
      
      <template #default>
        <div class="drawerBody">
          <!-- 说明文本 -->
          <div class="envDescription">
            <el-alert
              :title="$t('flow.env_description_title')"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                {{ $t('flow.env_description_content') }}
              </template>
            </el-alert>
          </div>

          <!-- 变量列表 -->
          <div class="variableSection">
            <div class="sectionHeader">
              <h3>{{ $t('flow.env_list') }}</h3>
              <el-button
                type="primary"
                :icon="Plus"
                size="small"
                @click="addEnvironmentVariable"
              >
                {{ $t('flow.add_variable') }}
              </el-button>
            </div>

            <div class="variableList" v-loading="variablesLoading">
              <div 
                v-for="variable in environmentVariables" 
                :key="variable.name"
                class="variableItem"
                @click="editEnvironmentVariable(variable)"
              >
                <div class="variableIcon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 18a1 1 0 0 1-1 1h-4a3 3 0 0 0-3 3a3 3 0 0 0-3-3H5a1 1 0 0 1-1-1H2a3 3 0 0 0 3 3h4a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2h4a3 3 0 0 0 3-3Zm0-12a1 1 0 0 0-1-1h-4a3 3 0 0 1-3-3a3 3 0 0 1-3 3H5a1 1 0 0 0-1 1H2a3 3 0 0 1 3-3h4a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2h4a3 3 0 0 1 3 3Zm-8 6L9 8H7v8h2v-4l3 4h2V8h-2zm9-4l-2 5.27L17 8h-2l3 8h2l3-8zM1 8v8h5v-2H3v-1h2v-2H3v-1h3V8z" />
                  </svg>
                </div>
                <div class="variableInfo">
                  <div class="variableHeader">
                    <div class="variableName">{{ variable.name }}</div>
                    <div class="variableType">{{ getVariableTypeDisplay(variable.var_type) }}</div>
                  </div>
                  <div class="variableValue">
                    <span class="valueContent" :class="getValueClass(variable.var_type)">
                      {{ formatVariableValue(variable) }}
                    </span>
                  </div>
                  <div v-if="variable.description" class="variableDescription">
                    {{ variable.description }}
                  </div>
                </div>
              </div>
              
              <!-- 空状态提示 -->
              <div v-if="environmentVariables.length === 0 && !variablesLoading" class="emptyState">
                <div class="emptyText">{{ $t('flow.no_env_variables') }}</div>
                <div class="emptySubText">{{ $t('flow.create_first_env_variable') }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <template #footer>
        <div class="drawerFooter">
          <el-button @click="closeDrawer">{{ $t('common.close') }}</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 变量编辑弹窗 -->
    <el-dialog
      v-model="showVariableDialog"
      :title="isEditingVariable ? $t('flow.edit_env_variable') : $t('flow.add_env_variable')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="editingVariable"
        label-width="80px"
        :rules="variableRules"
        ref="variableFormRef"
      >
        <el-form-item :label="$t('flow.variable_name')" prop="name">
          <el-input 
            v-model="editingVariable.name" 
            :placeholder="$t('flow.variable_name_placeholder')"
            :disabled="isEditingVariable"
          />
        </el-form-item>
        
        <el-form-item :label="$t('flow.variable_type')" prop="var_type">
          <el-select v-model="editingVariable.var_type" :placeholder="$t('flow.select_variable_type')">
            <el-option :label="$t('flow.type_string_desc')" value="string" />
            <el-option :label="$t('flow.type_number_desc')" value="number" />
            <el-option :label="$t('flow.type_boolean_desc')" value="boolean" />
            <el-option :label="$t('flow.type_object_desc')" value="object" />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="$t('flow.variable_value')" prop="value">
          <el-input 
            v-if="editingVariable.var_type === 'string'"
            v-model="editingVariable.value" 
            :placeholder="$t('flow.input_string_placeholder')" 
          />
          <el-input 
            v-else-if="editingVariable.var_type === 'number'"
            v-model.number="editingVariable.value" 
            type="number"
            :placeholder="$t('flow.input_number_placeholder')" 
          />
          <el-select 
            v-else-if="editingVariable.var_type === 'boolean'"
            v-model="editingVariable.value"
            :placeholder="$t('flow.select_boolean_placeholder')"
          >
            <el-option label="true" :value="true" />
            <el-option label="false" :value="false" />
          </el-select>
          <el-input 
            v-else-if="editingVariable.var_type === 'object'"
            v-model="editingVariable.valueJson"
            type="textarea"
            :rows="4"
            :placeholder="$t('flow.input_json_placeholder')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('flow.description')">
          <el-input 
            v-model="editingVariable.description" 
            :placeholder="$t('flow.variable_description_placeholder')" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleVariableDialogClose">{{ $t('common.cancel') }}</el-button>
          <el-button 
            v-if="isEditingVariable"
            type="danger" 
            @click="deleteEnvironmentVariable(editingVariable)"
          >
            {{ $t('common.delete') }}
          </el-button>
          <el-button 
            type="primary" 
            @click="saveEnvironmentVariable"
          >
            {{ $t('common.save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  ElDrawer, ElButton, ElDialog, ElForm, ElFormItem, 
  ElSelect, ElOption, ElMessage, ElAlert, ElInput, ElMessageBox
} from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { 
  listEnvironmentVariables, 
  createVariable, 
  updateVariable, 
  deleteVariable 
} from '@/api/variable'

interface Variable {
  name: string
  var_type: string
  scope: string
  value?: any
  description?: string
  valueJson?: string
}

interface Props {
  flowId: string
}

const props = defineProps<Props>()

const { t } = useI18n()
const visible = ref(true)

// 变量相关状态
const environmentVariables = ref<Variable[]>([])
const variablesLoading = ref(false)

// 变量编辑状态
const showVariableDialog = ref(false)
const editingVariable = ref<Variable>({
  name: '',
  var_type: 'string',
  scope: 'env',
  value: '',
  description: '',
  valueJson: ''
})
const isEditingVariable = ref(false)
const variableFormRef = ref()

// 表单验证规则
const variableRules = {
  name: [
    { required: true, message: t('flow.variable_name_required'), trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: t('flow.variable_name_pattern'), trigger: 'blur' }
  ],
  var_type: [
    { required: true, message: t('flow.variable_type_required'), trigger: 'change' }
  ],
  value: [
    { required: true, message: t('flow.variable_value_required'), trigger: 'blur' }
  ]
}

const emits = defineEmits(['closeDrawer'])

// 获取变量类型显示名称
const getVariableTypeDisplay = (type: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Number', 
    'boolean': 'Boolean',
    'object': 'Object',
    'array_file': 'Array[File]',
    'array[file]': 'Array[File]',  // 支持后端返回的格式
    'array': 'Array',
    'secret': 'Secret'
  }
  return typeMap[type] || type
}

// 格式化变量值显示
const formatVariableValue = (variable: Variable): string => {
  if (variable.value === null || variable.value === undefined) {
    return t('flow.not_set')
  }
  
  switch (variable.var_type) {
    case 'string':
      const stringValue = String(variable.value)
      return stringValue.length > 50 ? `${stringValue.substring(0, 50)}...` : stringValue
    case 'number':
      return String(variable.value)
    case 'boolean':
      return variable.value ? 'true' : 'false'
    case 'object':
      try {
        const objectStr = typeof variable.value === 'string' ? variable.value : JSON.stringify(variable.value)
        return objectStr.length > 60 ? `${objectStr.substring(0, 60)}...` : objectStr
      } catch {
        return '{ ... }'
      }
    case 'secret':
      return '****** (' + t('flow.hidden') + ')'
    default:
      const defaultValue = String(variable.value)
      return defaultValue.length > 50 ? `${defaultValue.substring(0, 50)}...` : defaultValue
  }
}

// 获取值的样式类名
const getValueClass = (type: string): string => {
  const classMap: Record<string, string> = {
    'string': 'value-string',
    'number': 'value-number',
    'boolean': 'value-boolean',
    'object': 'value-object',
    'secret': 'value-secret'
  }
  return classMap[type] || 'value-default'
}

// 加载环境变量列表
const loadEnvironmentVariables = async () => {
  if (!props.flowId) {
    console.warn('No flowId, skipping environment variable loading')
    return
  }
  
  variablesLoading.value = true
  
  try {    
    const response = await listEnvironmentVariables(props.flowId)
    
    // 处理API响应结构
    let variables: Variable[] = []
    if (response?.result?.variables) {
      variables = response.result.variables
    } else if (response?.variables) {
      variables = response.variables
    } else if (Array.isArray(response)) {
      variables = response
    }
    
    environmentVariables.value = variables || []
    
  } catch (error) {
    console.error('❌ Loading environment variables failed:', error)
    ElMessage.error(t('flow.load_env_variables_failed'))
    environmentVariables.value = []
  } finally {
    variablesLoading.value = false
  }
}

// 添加环境变量
const addEnvironmentVariable = () => {
  editingVariable.value = {
    name: '',
    var_type: 'string',
    scope: 'env',
    value: '',
    description: '',
    valueJson: ''
  }
  isEditingVariable.value = false
  showVariableDialog.value = true
}

// 编辑环境变量
const editEnvironmentVariable = (variable: Variable) => {
  editingVariable.value = {
    ...variable,
    valueJson: variable.var_type === 'object' ? JSON.stringify(variable.value, null, 2) : ''
  }
  isEditingVariable.value = true
  showVariableDialog.value = true
}

// 保存环境变量
const saveEnvironmentVariable = async () => {
  try {
    await variableFormRef.value?.validate()
    
    const variableData = { ...editingVariable.value }
    
    // 处理不同类型的值
    if (variableData.var_type === 'object') {
      try {
        variableData.value = JSON.parse(variableData.valueJson || '{}')
      } catch (error) {
        ElMessage.error(t('flow.json_format_error'))
        return
      }
    } else if (variableData.var_type === 'boolean') {
      variableData.value = Boolean(variableData.value)
    } else if (variableData.var_type === 'number') {
      variableData.value = Number(variableData.value)
    }
    
    // 删除辅助字段
    delete variableData.valueJson
    
    if (isEditingVariable.value) {
      // 更新变量
      await updateVariable(
        { 
          name: variableData.name, 
          scope: 'env', 
          flow_id: props.flowId 
        },
        variableData
      )
      ElMessage.success(t('flow.env_variable_update_success'))
    } else {
      // 创建变量
      await createVariable({
        ...variableData,
        flow_id: props.flowId
      })
      ElMessage.success(t('flow.env_variable_create_success'))
    }
    
    showVariableDialog.value = false
    await loadEnvironmentVariables()
    
  } catch (error) {
    console.error('Save environment variable failed:', error)
    ElMessage.error(isEditingVariable.value ? t('flow.env_variable_update_failed') : t('flow.env_variable_create_failed'))
  }
}

// 删除环境变量
const deleteEnvironmentVariable = async (variable: Variable) => {
  try {
    await ElMessageBox.confirm(
      t('flow.confirm_delete_env_variable', { name: variable.name }),
      t('flow.confirm_delete_title'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )
    
    await deleteVariable({ 
      name: variable.name, 
      scope: 'env', 
      flow_id: props.flowId 
    })
    
    ElMessage.success(t('flow.env_variable_delete_success'))
    showVariableDialog.value = false
    await loadEnvironmentVariables()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete environment variable failed:', error)
      ElMessage.error(t('flow.env_variable_delete_failed'))
    }
  }
}

// 关闭变量编辑弹窗
const handleVariableDialogClose = () => {
  showVariableDialog.value = false
  editingVariable.value = {
    name: '',
    var_type: 'string',
    scope: 'env',
    value: '',
    description: '',
    valueJson: ''
  }
}

// 关闭抽屉
const closeDrawer = () => {
  visible.value = false
  emits('closeDrawer')
}

onMounted(() => {
  console.log('🚀 EnvironmentVariableDrawer mounted')
  nextTick(() => {
    loadEnvironmentVariables()
  })
})
</script>

<style lang="scss" scoped>
.environmentVariableConfig {
  :deep(.flowDrawer) {
    .el-drawer__header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--o-border-color-light);
      margin-bottom: 0;
    }
    
    .el-drawer__body {
      padding: 0;
    }
  }

  .drawerHeader {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .headerText {
      font-size: 16px;
      font-weight: 600;
      color: var(--o-text-color-primary);
    }
  }

  .drawerBody {
    padding: 0;
    
    .envDescription {
      margin: 20px 24px 24px;
      
      :deep(.el-alert__content) {
        line-height: 1.5;
      }
    }
    
    .variableSection {
      padding: 0 24px 24px;
      
      .sectionHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--o-text-color-primary);
        }
      }
      
      .variableList {
        min-height: 200px;
        
        .variableItem {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 12px;
          border: 1px solid var(--el-border-color-light);
          background: var(--el-fill-color-extra-light);
          transition: all 0.2s;
          cursor: pointer;
          
          &:hover {
            background: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary-light-7);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .variableIcon {
            color: var(--el-color-primary);
            margin-right: 16px;
            margin-top: 2px;
            flex-shrink: 0;
          }
          
          .variableInfo {
            flex: 1;
            min-width: 0;
            
            .variableHeader {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;
              
              .variableName {
                font-size: 14px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                font-family: 'Monaco', 'Consolas', monospace;
                flex-shrink: 0;
              }
              
              .variableType {
                font-size: 11px;
                color: var(--el-text-color-secondary);
                background: var(--el-fill-color);
                padding: 2px 8px;
                border-radius: 6px;
                border: 1px solid var(--el-border-color-lighter);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
            }
            
            .variableValue {
              display: flex;
              align-items: flex-start;
              margin-bottom: 6px;
              gap: 8px;
              
              .valueLabel {
                font-size: 12px;
                color: var(--el-text-color-regular);
                flex-shrink: 0;
                margin-top: 1px;
              }
              
              .valueContent {
                font-size: 12px;
                font-family: 'Monaco', 'Consolas', monospace;
                line-height: 1.4;
                word-break: break-all;
                flex: 1;
                padding: 4px 8px;
                border-radius: 4px;
                background: var(--el-fill-color-blank);
                border: 1px solid var(--el-border-color-lighter);
                
                &.value-string {
                  color: #16a085;
                  background: rgba(22, 160, 133, 0.05);
                  border-color: rgba(22, 160, 133, 0.2);
                }
                
                &.value-number {
                  color: #e67e22;
                  background: rgba(230, 126, 34, 0.05);
                  border-color: rgba(230, 126, 34, 0.2);
                }
                
                &.value-boolean {
                  color: #8e44ad;
                  background: rgba(142, 68, 173, 0.05);
                  border-color: rgba(142, 68, 173, 0.2);
                }
                
                &.value-object {
                  color: #2980b9;
                  background: rgba(41, 128, 185, 0.05);
                  border-color: rgba(41, 128, 185, 0.2);
                }
                
                &.value-secret {
                  color: #e74c3c;
                  background: rgba(231, 76, 60, 0.05);
                  border-color: rgba(231, 76, 60, 0.2);
                }
                
                &.value-default {
                  color: var(--el-text-color-regular);
                }
              }
            }
            
            .variableDescription {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              line-height: 1.3;
              font-style: italic;
              opacity: 0.8;
            }
          }
        }
        
        .emptyState {
          text-align: center;
          padding: 60px 20px;
          
          .emptyIcon {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
            border-radius: 50%;
            position: relative;
            
            &::before {
              content: 'ENV';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: white;
              font-size: 12px;
              font-weight: bold;
            }
          }
          
          .emptyText {
            font-size: 16px;
            color: var(--o-text-color-secondary);
            margin-bottom: 8px;
          }
          
          .emptySubText {
            font-size: 14px;
            color: var(--o-text-color-placeholder);
          }
        }
      }
    }
  }

  .drawerFooter {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid var(--o-border-color-light);
  }
}

// 透明遮罩样式
:deep(.transparent-modal) {
  background-color: transparent !important;
}
</style> 