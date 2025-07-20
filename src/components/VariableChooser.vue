<template>
  <div class="variable-chooser">
    <div class="variable-row">
      <div class="variable-name-section">
        <label class="field-label">变量名：</label>
        <el-input
          v-model="localVariableName"
          :placeholder="placeholder"
          size="small"
          @input="handleNameChange"
        />
      </div>
      
      <div class="variable-selector-section">
        <label class="field-label">选择变量：</label>
        <VariableSelector
          v-model="localVariableReference"
          placeholder="从VariablePool中选择变量"
          :supported-scopes="supportedScopes"
          :flow-id="flowId"
          :conversation-id="conversationId"
          :show-variable-reference="showVariableReference"
          @variable-selected="handleVariableSelected"
        />
      </div>
      
      <div class="actions-section" v-if="showActions">
        <el-button 
          type="danger" 
          size="small" 
          :icon="Delete"
          @click="handleRemove"
          class="remove-btn"
          circle
        />
      </div>
    </div>
    
    <!-- 选中变量的详细信息 -->
    <div class="variable-info" v-if="selectedVariable && showVariableInfo">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">源变量：</span>
          <code class="info-value">{{ selectedVariable.name }}</code>
        </div>
        <div class="info-item">
          <span class="info-label">类型：</span>
          <el-tag size="small" type="primary">
            {{ getVariableTypeDisplay(selectedVariable.var_type) }}
          </el-tag>
        </div>
        <div class="info-item">
          <span class="info-label">作用域：</span>
          <el-tag size="small" :type="getScopeTagType(selectedVariable.scope)">
            {{ getScopeDisplay(selectedVariable.scope) }}
          </el-tag>
        </div>
        <div class="info-item" v-if="selectedVariable.description">
          <span class="info-label">描述：</span>
          <span class="info-value">{{ selectedVariable.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { ElInput, ElButton, ElTag } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import VariableSelector from './VariableSelector.vue'

interface Variable {
  name: string
  var_type: string
  scope: string
  value: string
  description?: string
}

interface Props {
  variableName?: string              // 自定义变量名
  variableReference?: string         // 变量引用
  selectedVariable?: Variable        // 选中的变量对象
  supportedScopes?: string[]         // 支持的作用域
  flowId?: string                   // 流程ID
  conversationId?: string           // 对话ID
  showVariableReference?: boolean   // 是否显示变量引用语法
  showActions?: boolean             // 是否显示操作按钮
  showVariableInfo?: boolean        // 是否显示变量详细信息
  placeholder?: string              // 变量名输入框占位符
}

const props = withDefaults(defineProps<Props>(), {
  variableName: '',
  variableReference: '',
  selectedVariable: undefined,
  supportedScopes: () => ['conversation', 'system', 'env'],
  flowId: '',
  conversationId: '',
  showVariableReference: true,
  showActions: true,
  showVariableInfo: true,
  placeholder: '输入变量名称'
})

const emit = defineEmits<{
  'update:variableName': [value: string]
  'update:variableReference': [value: string]
  'update:selectedVariable': [value: Variable | undefined]
  'variable-selected': [variable: Variable]
  'name-changed': [name: string]
  'remove': []
}>()

const localVariableName = ref(props.variableName)
const localVariableReference = ref(props.variableReference)
const selectedVariable = ref<Variable | undefined>(props.selectedVariable)

// 监听props变化
watch(() => props.variableName, (newVal) => {
  localVariableName.value = newVal
}, { immediate: true })

watch(() => props.variableReference, (newVal) => {
  localVariableReference.value = newVal
}, { immediate: true })

watch(() => props.selectedVariable, (newVal) => {
  selectedVariable.value = newVal
}, { immediate: true })

// 处理变量名变化
const handleNameChange = (value: string) => {
  emit('update:variableName', value)
  emit('name-changed', value)
}

// 处理变量选择
const handleVariableSelected = (variable: Variable) => {
  selectedVariable.value = variable
  emit('update:selectedVariable', variable)
  emit('variable-selected', variable)
}

// 处理删除
const handleRemove = () => {
  emit('remove')
}

// 获取变量类型显示名称
const getVariableTypeDisplay = (type: string): string => {
  const typeMap: Record<string, string> = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    object: '对象',
    secret: '密钥',
    file: '文件',
    'array[any]': '数组',
    'array[string]': '字符串数组',
    'array[number]': '数字数组',
    'array[object]': '对象数组',
    'array[file]': '文件数组',
    'array[boolean]': '布尔数组',
    'array[secret]': '密钥数组'
  }
  return typeMap[type] || type
}

// 获取作用域显示名称
const getScopeDisplay = (scope: string): string => {
  const scopeMap: Record<string, string> = {
    system: '系统变量',
    user: '用户变量',
    env: '环境变量',
    conversation: '对话变量'
  }
  return scopeMap[scope] || scope
}

// 获取作用域标签类型
const getScopeTagType = (scope: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  const typeMap: Record<string, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    system: 'info',
    user: 'primary',
    env: 'warning',
    conversation: 'success'
  }
  return typeMap[scope] || 'primary'
}

// 监听变量引用变化
watch(localVariableReference, (newVal) => {
  emit('update:variableReference', newVal)
})
</script>

<style lang="scss" scoped>
.variable-chooser {
  .variable-row {
    display: flex;
    gap: 16px;
    align-items: flex-end;
    margin-bottom: 16px;
    
    .variable-name-section {
      flex: 1;
      min-width: 200px;
      
      .field-label {
        display: block;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        font-weight: 500;
        margin-bottom: 4px;
        line-height: 16px;
        height: 16px;
      }
    }
    
    .variable-selector-section {
      flex: 2;
      min-width: 300px;
      
      .field-label {
        display: block;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        font-weight: 500;
        margin-bottom: 4px;
        line-height: 16px;
        height: 16px;
      }
      
      // 确保变量选择器与输入框高度一致
      :deep(.variable-selector) {
        .el-input__wrapper {
          height: 24px;
        }
        
        .el-input__inner {
          height: 24px;
          line-height: 24px;
        }
        
        .el-popover__reference {
          width: 100%;
        }
      }
    }
    
    .actions-section {
      flex-shrink: 0;
      display: flex;
      align-items: flex-end;
      padding-bottom: 0;
      padding-top: 20px;
      
              .remove-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--el-color-danger);
          background: var(--el-color-danger-light-9);
          color: var(--el-color-danger);
          transition: all 0.2s ease;
          
          &:hover {
            background: var(--el-color-danger);
            color: #fff;
            transform: scale(1.1);
          }
          
          &:active {
            transform: scale(0.95);
          }
          
          :deep(.el-icon) {
            font-size: 12px;
          }
        }
    }
  }
  
  .variable-info {
    margin-top: 8px;
    padding: 12px;
    background: var(--el-fill-color-extra-light);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-lighter);
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
      
      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .info-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
          min-width: 60px;
        }
        
        .info-value {
          font-size: 12px;
          color: var(--el-text-color-primary);
          
          &.code {
            background: var(--el-fill-color);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            color: var(--el-color-primary);
          }
        }
        
        code {
          background: var(--el-fill-color);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 12px;
          color: var(--el-color-primary);
        }
      }
    }
  }
}

// 全局样式调整，确保所有输入组件高度一致
:deep(.el-input--small) {
  .el-input__wrapper {
    height: 24px;
    min-height: 24px;
  }
  
  .el-input__inner {
    height: 24px;
    line-height: 24px;
  }
}

:deep(.el-select--small) {
  .el-select__wrapper {
    height: 24px;
    min-height: 24px;
  }
  
  .el-select__input {
    height: 24px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .variable-chooser {
    .variable-row {
      flex-direction: column;
      align-items: stretch;
      
      .variable-name-section,
      .variable-selector-section {
        flex: 1;
        min-width: unset;
      }
      
      .actions-section {
        align-self: flex-end;
        padding-bottom: 0;
        margin-top: 8px;
      }
    }
    
    .variable-info {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style> 