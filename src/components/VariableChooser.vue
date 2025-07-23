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
      
      <div class="variable-selector-section" :class="selectorClasses">
        <label class="field-label">选择变量：</label>
        
        <!-- 已选变量标签显示 -->
        <div v-if="selectedVariable" class="selected-variable-display" :class="selectorClasses">
          <el-tooltip 
            :content="getFullVariableReference(selectedVariable)"
            placement="top"
            effect="dark"
          >
            <div class="variable-tag">
              <span class="variable-name">
                <el-icon v-if="selectedVariable.scope === 'env'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 18a1 1 0 0 1-1 1h-4a3 3 0 0 0-3 3a3 3 0 0 0-3-3H5a1 1 0 0 1-1-1H2a3 3 0 0 0 3 3h4a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2h4a3 3 0 0 0 3-3Zm0-12a1 1 0 0 0-1-1h-4a3 3 0 0 1-3-3a3 3 0 0 1-3 3H5a1 1 0 0 0-1 1H2a3 3 0 0 1 3-3h4a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2h4a3 3 0 0 1 3 3Zm-8 6L9 8H7v8h2v-4l3 4h2V8h-2zm9-4l-2 5.27L17 8h-2l3 8h2l3-8zM1 8v8h5v-2H3v-1h2v-2H3v-1h3V8z" />
                  </svg>
                </el-icon>
                {{ getVariableDisplayName(selectedVariable) }}
              </span>
              <button 
                class="clear-btn"
                @click="clearVariable"
                type="button"
                title="清空变量选择"
              >
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </el-tooltip>
        </div>
        
        <!-- 变量选择器 -->
        <div v-else class="variable-selector">
          <VariableSelector
            model-value=""
            :placeholder="selectorPlaceholder"
            :supported-scopes="supportedScopes"
            :flow-id="flowId"
            :conversation-id="conversationId"
            :current-step-id="currentStepId"
            :show-variable-reference="showVariableReference"
            @variable-selected="handleVariableSelected"
          />
        </div>
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

/**
 * VariableChooser 组件
 * 
 * 提供变量选择功能，支持显示变量详细信息和操作按钮
 * 现在新增了样式控制属性，可以让外部组件灵活控制显示样式
 * 
 * @since 1.0.0
 * @author Assistant
 */
<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElInput, ElButton, ElTag, ElIcon } from 'element-plus'
import { Delete, Close } from '@element-plus/icons-vue'
import VariableSelector from './VariableSelector.vue'
import { listVariables } from '@/api/variable'

interface Variable {
  name: string
  var_type: string
  scope: string
  value: string
  description?: string
  step?: string        // 节点名称（前置节点变量专用）
  step_id?: string     // 节点ID（前置节点变量专用）
}

interface Props {
  variableName?: string              // 自定义变量名
  variableReference?: string         // 变量引用
  selectedVariable?: Variable        // 选中的变量对象
  supportedScopes?: string[]         // 支持的作用域
  flowId?: string                   // 流程ID
  conversationId?: string           // 对话ID
  currentStepId?: string            // 当前步骤ID
  showVariableReference?: boolean   // 是否显示变量引用语法
  showActions?: boolean             // 是否显示操作按钮
  showVariableInfo?: boolean        // 是否显示变量详细信息
  placeholder?: string              // 变量名输入框占位符
  selectorPlaceholder?: string      // 变量选择器占位符
  hideBorder?: boolean              // 是否隐藏边框，用于无边框样式
  noBorderRadius?: boolean          // 是否取消圆角，用于连接其他组件时
  transparentBackground?: boolean   // 是否使用透明背景，用于融入父容器
  customClass?: string              // 自定义CSS类名，用于特殊样式定制
}

const props = withDefaults(defineProps<Props>(), {
  variableName: '',
  variableReference: '',
  selectedVariable: undefined,
  supportedScopes: () => ['conversation', 'system', 'env'],
  flowId: '',
  conversationId: '',
  currentStepId: '',
  showVariableReference: true,
  showActions: true,
  showVariableInfo: true,
  placeholder: '输入变量名称',
  selectorPlaceholder: '选择变量',
  hideBorder: false,
  noBorderRadius: false,
  transparentBackground: false,
  customClass: ''
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

// 解析 variableReference 字符串
const parseVariableReference = (reference: string) => {
  if (!reference) return null
  
  // 移除可能的 {{ }} 包装
  const cleanRef = reference.replace(/^\{\{|\}\}$/g, '').trim()
  
  // 解析格式：conversation.step_id.variable_name 或 scope.variable_name
  const parts = cleanRef.split('.')
  
  if (parts.length === 3 && parts[0] === 'conversation') {
    return {
      scope: parts[0],
      step_id: parts[1],
      name: parts[2]
    }
  } else if (parts.length === 2) {
    return {
      scope: parts[0],
      name: parts[1]
    }
  }
  
  return null
}

// 根据解析的引用信息查找对应的变量
const findVariableByReference = async (parsedRef: { scope: string; step_id?: string; name: string }) => {
  try {
    const params: any = {
      scope: parsedRef.scope,
      flow_id: props.flowId,
      conversation_id: props.conversationId
    }
    
    // 对话变量需要传 current_step_id
    if (parsedRef.scope === 'conversation' && props.currentStepId) {
      params.current_step_id = props.currentStepId
    }
    
    const response = await listVariables(params)
    
    // 处理不同的API响应结构
    let variables: Variable[] = []
    const responseAny = response as any
    
    if (responseAny?.result?.variables) {
      variables = responseAny.result.variables
    } else if (responseAny?.variables) {
      variables = responseAny.variables
    } else if (Array.isArray(responseAny)) {
      variables = responseAny
    }
    
    // 查找匹配的变量
    return variables.find(variable => {
      if (parsedRef.scope === 'conversation' && parsedRef.step_id) {
        return variable.name === parsedRef.name && variable.step_id === parsedRef.step_id
      } else {
        return variable.name === parsedRef.name && variable.scope === parsedRef.scope
      }
    })
    
  } catch (error) {
    console.error('查找变量失败:', error)
    return undefined
  }
}

// 初始化选中的变量
const initializeSelectedVariable = async () => {
  if (props.variableReference && !selectedVariable.value) {
    const parsedRef = parseVariableReference(props.variableReference)
    if (parsedRef) {
      const foundVariable = await findVariableByReference(parsedRef)
      if (foundVariable) {
        selectedVariable.value = foundVariable
        emit('update:selectedVariable', foundVariable)
        emit('variable-selected', foundVariable)
      }
    }
  }
}

// 生命周期钩子
onMounted(async () => {
  await initializeSelectedVariable()
})

// 监听props变化
watch(() => props.variableName, (newVal) => {
  localVariableName.value = newVal
}, { immediate: true })

watch(() => props.variableReference, async (newVal) => {
  localVariableReference.value = newVal
  // 当 variableReference 变化时，重新初始化 selectedVariable
  if (newVal && !selectedVariable.value) {
    await initializeSelectedVariable()
  }
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
  
  // 构建完整的变量引用
  let variableReference = ''
  if (variable.scope === 'conversation' && variable.step_id) {
    variableReference = `conversation.${variable.step_id}.${variable.name}`
  } else {
    variableReference = `${variable.scope}.${variable.name}`
  }
  
  localVariableReference.value = variableReference
  emit('update:selectedVariable', variable)
  emit('update:variableReference', variableReference)
  emit('variable-selected', variable)
}

// 处理删除
const handleRemove = () => {
  emit('remove')
}

// 清空变量选择
const clearVariable = () => {
  selectedVariable.value = undefined
  localVariableReference.value = ''
  emit('update:selectedVariable', undefined)
  emit('update:variableReference', '')
}

// 获取变量显示名称（只显示后缀）
const getVariableDisplayName = (variable: Variable): string => {
  if (variable.scope === 'conversation' && variable.step) {
    return `${variable.step}.${variable.name}`
  } else if (variable.scope !== 'conversation' && variable.scope !== 'env'){
    return `${variable.scope}.${variable.name}`
  }
  return variable.name
}

// 获取完整的变量引用
const getFullVariableReference = (variable: Variable): string => {
  if (variable.scope === 'conversation' && variable.step_id) {
    return `{{conversation.${variable.step_id}.${variable.name}}}`
  }
  return `{{${variable.scope}.${variable.name}}}`
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

// 计算样式类
const selectorClasses = computed(() => {
  const classes: Record<string, boolean> = {
    'hide-border': props.hideBorder,
    'no-border-radius': props.noBorderRadius,
    'transparent-bg': props.transparentBackground
  }
  
  if (props.customClass) {
    classes[props.customClass] = true
  }
  
  return classes
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
      
      // 样式控制类
      &.hide-border {
        :deep(.variable-selector) {
          .el-input__wrapper {
            border: none !important;
            box-shadow: none !important;
          }
        }
      }
      
      &.no-border-radius {
        :deep(.variable-selector) {
          .el-input__wrapper {
            border-radius: 0 !important;
          }
        }
      }
      
      &.transparent-bg {
        :deep(.variable-selector) {
          .el-input__wrapper {
            background: transparent !important;
          }
        }
      }
    }
    
    // 已选变量标签显示区域
    .selected-variable-display {
      height: 24px; // 确保与输入框高度一致
      display: flex;
      align-items: center;
      
        .variable-tag {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          height: 22px;
          width: 140px;
          padding: 2px 6px 2px 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: default;
          user-select: none;
          vertical-align: middle;
          max-width: 100%;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          white-space: nowrap;
          
          .variable-name {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-right: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
            max-width: calc(100% - 24px); // 为按钮留出空间
            flex-shrink: 1;
          }
          
          .clear-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            margin: 0;
            width: 16px;
            height: 16px;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 2px;
            transition: all 0.2s ease;
            flex-shrink: 0;
            
            .el-icon {
              font-size: 12px;
              width: 12px;
              height: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            &:hover {
              background-color: rgba(255, 255, 255, 0.2);
              transform: scale(1.1);
            }
            
            &:active {
              background-color: rgba(255, 255, 255, 0.3);
              transform: scale(0.95);
            }
          }
        
        &:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
      }
      
      // 适配隐藏边框样式
      &.hide-border .variable-tag {
        border: none;
        box-shadow: none;
      }
      
      // 适配无边框圆角样式
      &.no-border-radius .variable-tag {
        border-radius: 0;
      }
      
      // 适配透明背景样式
      &.transparent-bg .variable-tag {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
        backdrop-filter: blur(8px);
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