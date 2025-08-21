<template>
  <div class="variable-chooser">
    <div class="variable-row">
      <div class="variable-name-section" v-if="showVariableName">
        <label class="field-label">{{ $t('variableChooser.variable_name_label') }}</label>
        <el-input
          v-model="localVariableName"
          :placeholder="placeholder || $t('variableChooser.enter_variable_name')"
          size="small"
          @input="handleNameChange"
        />
      </div>
      
      <div class="variable-selector-section" :class="selectorClasses">
        <label class="field-label" v-if="showLabel">{{ $t('variableChooser.select_variable_label') }}</label>
        
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
                {{ modelValue || getVariableDisplayName(selectedVariable) }}
              </span>
              <!-- 显示变量实际类型 -->
              <span class="type-suffix">{{ getVariableTypeDisplay(selectedVariable.var_type) }}</span>
              <button 
                class="clear-btn"
                @click="clearVariable"
                type="button"
                :title="$t('variableChooser.clear_variable_selection')"
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
            :placeholder="computedPlaceholder"
            :supported-scopes="supportedScopes"
            :flow-id="flowId"
            :conversation-id="conversationId"
            :current-step-id="currentStepId"
            :self-variables="selfVariables"
            :self-scope-label="selfScopeLabel"
            :show-variable-reference="showVariableReference"
            :type-filter="typeFilter"
            :suffix-tags="computedSuffixTags"
            @variable-selected="handleVariableSelected"
          />
        </div>
      </div>
      
      <div class="actions-section" v-if="showActions">
        <button 
          type="button"
          @click="handleRemove"
          class="remove-btn"
          :title="$t('variableChooser.remove_variable')"
        >
          <el-icon><Delete /></el-icon>
        </button>
      </div>
    </div>
    
    <!-- 选中变量的详细信息 -->
    <div class="variable-info" v-if="selectedVariable && showVariableInfo">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">{{ $t('variableChooser.source_variable_label') }}</span>
          <code class="info-value">{{ selectedVariable.name }}</code>
        </div>
        <div class="info-item">
          <span class="info-label">{{ $t('variableChooser.type_label') }}</span>
          <el-tag size="small" type="primary">
            {{ getVariableTypeDisplay(selectedVariable.var_type) }}
          </el-tag>
        </div>
        <div class="info-item">
          <span class="info-label">{{ $t('variableChooser.scope_label') }}</span>
          <el-tag size="small" :type="getScopeTagType(selectedVariable.scope)">
            {{ getScopeDisplay(selectedVariable.scope) }}
          </el-tag>
        </div>
        <div class="info-item" v-if="selectedVariable.description">
          <span class="info-label">{{ $t('variableChooser.description_label') }}</span>
          <span class="info-value">{{ selectedVariable.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

/**
 * VariableChooser 组件
 * 
 * 统一的变量选择器组件，支持灵活的显示和输出格式控制
 * 
 * @since 2.0.0
 * @author Assistant
 */
<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElInput, ElTag, ElIcon } from 'element-plus'
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
  // 核心数据属性
  modelValue?: string               // 当前选中的变量引用值
  selectedVariable?: Variable       // 选中的变量对象
  variableName?: string            // 自定义变量名（仅在需要输入变量名时使用）
  
  // 配置属性
  supportedScopes?: string[]       // 支持的作用域
  flowId?: string                 // 流程ID
  conversationId?: string         // 对话ID
  currentStepId?: string          // 当前步骤ID
  selfVariables?: any[]           // 当前节点定义的变量列表
  selfScopeLabel?: string         // 当前节点变量分组的标签
  typeFilter?: string[]           // 变量类型过滤器
  
  // 显示控制
  showVariableName?: boolean      // 是否显示变量名输入
  showLabel?: boolean            // 是否显示标签
  showActions?: boolean          // 是否显示操作按钮
  showVariableInfo?: boolean     // 是否显示变量详细信息
  showVariableReference?: boolean // 是否显示变量引用语法
  
  // 格式控制
  outputFormat?: 'raw' | 'wrapped'  // 输出格式：raw = "scope.name", wrapped = "{{scope.name}}"
  
  // 样式控制
  hideBorder?: boolean           // 是否隐藏边框
  noBorderRadius?: boolean       // 是否取消圆角
  transparentBackground?: boolean // 是否使用透明背景
  customClass?: string           // 自定义CSS类名
  
  // 占位符和标签
  placeholder?: string           // 变量名输入框占位符
  selectorPlaceholder?: string   // 变量选择器占位符
  prefixIcon?: string            // 前缀图标
  suffixLabel?: string          // 后缀标签
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  selectedVariable: undefined,
  variableName: '',
  supportedScopes: () => ['conversation', 'system', 'env'],
  flowId: '',
  conversationId: '',
  currentStepId: '',
  selfVariables: () => [],
  selfScopeLabel: '',
  typeFilter: () => [],
  showVariableName: false,
  showLabel: true,
  showActions: true,
  showVariableInfo: true,
  showVariableReference: true,
  outputFormat: 'raw',
  hideBorder: false,
  noBorderRadius: false,
  transparentBackground: false,
  customClass: '',
  placeholder: '',
  selectorPlaceholder: '',
  prefixIcon: '',
  suffixLabel: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:selectedVariable': [value: Variable | undefined]
  'update:variableName': [value: string]
  'variable-selected': [variable: Variable, reference: string]
  'variable-cleared': []
  'name-changed': [name: string]
  'remove': []
}>()

const { t } = useI18n()

const localVariableName = ref(props.variableName)
const selectedVariable = ref<Variable | undefined>(props.selectedVariable)

// 解析变量引用字符串
const parseVariableReference = (reference: string) => {
  if (!reference) return null
  
  // 移除可能的 {{ }} 包装
  const cleanRef = reference.replace(/^\{\{(.*)\}\}$/, '$1').trim()
  
  // 解析格式：conversation.step_id.variable_name、scope.variable_name 或 self.variable_name
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
    // 如果是当前节点变量，直接从 props.selfVariables 中查找
    if (parsedRef.scope === 'self') {
      const selfVar = props.selfVariables?.find(v => v.name === parsedRef.name)
      if (selfVar) {
        return {
          name: selfVar.name,
          var_type: selfVar.type || 'string',
          scope: 'self',
          value: `{{self.${selfVar.name}}}`,
          description: t('variableChooser.current_node_variable', { name: selfVar.name })
        }
      }
      return undefined
    }
    
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
    console.error(t('variableChooser.find_variable_failed'), error)
    return undefined
  }
}

// 生成变量引用字符串
const generateVariableReference = (variable: Variable, format: 'raw' | 'wrapped' = 'raw'): string => {
  let reference = ''
  
  // 当前节点变量已经包含完整的引用格式
  if (variable.scope === 'self') {
    if (format === 'raw') {
      // 从 {{self.name}} 中提取 self.name
      return variable.value.replace(/^\{\{(.*)\}\}$/, '$1')
    } else {
      // 直接返回 {{self.name}}
      return variable.value
    }
  }
  
  if (variable.scope === 'conversation' && variable.step_id) {
    reference = `conversation.${variable.step_id}.${variable.name}`
  } else {
    reference = `${variable.scope}.${variable.name}`
  }
  
  return format === 'wrapped' ? `{{${reference}}}` : reference
}

// 创建变量对象从解析的引用（无需API查询）
const createVariableFromReference = (parsedRef: { scope: string; step_id?: string; name: string }): Variable => {
  if (parsedRef.scope === 'conversation' && parsedRef.step_id) {
    return {
      name: parsedRef.name,
      var_type: 'string', // 默认类型，实际类型在运行时确定
      scope: parsedRef.scope,
      value: `{{${parsedRef.scope}.${parsedRef.step_id}.${parsedRef.name}}}`,
      description: t('variableChooser.conversation_variable', { name: parsedRef.name }),
      step_id: parsedRef.step_id,
      step: parsedRef.step_id // 使用step_id作为step的默认值
    }
  } else {
    return {
      name: parsedRef.name,
      var_type: 'string', // 默认类型
      scope: parsedRef.scope,
      value: `{{${parsedRef.scope}.${parsedRef.name}}}`,
      description: t('variableChooser.scope_variable', { scope: parsedRef.scope, name: parsedRef.name })
    }
  }
}

// 初始化选中的变量
const initializeSelectedVariable = async () => {
  if (props.modelValue && !selectedVariable.value) {
    const parsedRef = parseVariableReference(props.modelValue)
    if (parsedRef) {
      // 首先尝试快速创建变量对象（无需API查询）
      const quickVariable = createVariableFromReference(parsedRef)
      selectedVariable.value = quickVariable
      emit('update:selectedVariable', quickVariable)
      
      // 可选：在后台异步获取完整的变量信息（用于显示更准确的类型和描述）
      // 这样用户看不到延迟，但仍能获得准确信息
      try {
        const foundVariable = await findVariableByReference(parsedRef)
        if (foundVariable) {
          // 只有在找到更详细信息时才更新
          selectedVariable.value = foundVariable
          emit('update:selectedVariable', foundVariable)
        }
      } catch (error) {
        // 如果API查询失败，保持使用快速创建的变量对象
        console.debug(t('variableChooser.variable_detail_query_failed'), error)
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

watch(() => props.modelValue, async (newVal) => {
  // 当 modelValue 变化时，重新初始化 selectedVariable
  if (newVal && !selectedVariable.value) {
    const parsedRef = parseVariableReference(newVal)
    if (parsedRef) {
      // 快速创建并显示变量对象
      const quickVariable = createVariableFromReference(parsedRef)
      selectedVariable.value = quickVariable
      emit('update:selectedVariable', quickVariable)
      
      // 后台获取详细信息
      try {
        const foundVariable = await findVariableByReference(parsedRef)
        if (foundVariable) {
          selectedVariable.value = foundVariable
          emit('update:selectedVariable', foundVariable)
        }
      } catch (error) {
        console.debug(t('variableChooser.variable_detail_query_failed'), error)
      }
    }
  } else if (!newVal) {
    selectedVariable.value = undefined
  }
}, { immediate: true })

watch(() => props.selectedVariable, (newVal) => {
  selectedVariable.value = newVal
}, { immediate: true })

// 监听 selfVariables 变化，重新初始化选中的变量
watch(() => props.selfVariables, async () => {
  if (props.modelValue && !selectedVariable.value) {
    const parsedRef = parseVariableReference(props.modelValue)
    if (parsedRef) {
      // 快速创建并显示变量对象
      const quickVariable = createVariableFromReference(parsedRef)
      selectedVariable.value = quickVariable
      emit('update:selectedVariable', quickVariable)
      
      // 后台获取详细信息
      try {
        const foundVariable = await findVariableByReference(parsedRef)
        if (foundVariable) {
          selectedVariable.value = foundVariable
          emit('update:selectedVariable', foundVariable)
        }
      } catch (error) {
        console.debug(t('variableChooser.variable_detail_query_failed'), error)
      }
    }
  }
}, { deep: true })

// 处理变量名变化
const handleNameChange = (value: string) => {
  emit('update:variableName', value)
  emit('name-changed', value)
}

// 处理变量选择
const handleVariableSelected = (variable: Variable) => {
  selectedVariable.value = variable
  
  // 生成变量引用字符串
  const reference = generateVariableReference(variable, props.outputFormat)
  
  // 发出事件
  emit('update:selectedVariable', variable)
  emit('update:modelValue', reference)
  emit('variable-selected', variable, reference)
}

// 处理删除
const handleRemove = () => {
  emit('remove')
}

// 清空变量选择
const clearVariable = () => {
  selectedVariable.value = undefined
  emit('update:selectedVariable', undefined)
  emit('update:modelValue', '')
  emit('variable-cleared')
}

// 获取变量显示名称（只显示后缀）
const getVariableDisplayName = (variable: Variable): string => {
  if (variable.scope === 'conversation' && variable.step) {
    return `${variable.step}.${variable.name}`
  } else if (variable.scope === 'self') {
    // 对于当前节点变量，只显示变量名
    return variable.name
  } else if (variable.scope !== 'conversation' && variable.scope !== 'env'){
    return `${variable.scope}.${variable.name}`
  }
  return variable.name
}

// 获取完整的变量引用
const getFullVariableReference = (variable: Variable): string => {
  return generateVariableReference(variable, 'wrapped')
}

// 获取变量类型显示名称
const getVariableTypeDisplay = (type: string): string => {
  return t(`variableChooser.variable_types.${type}`, type)
}

// 获取作用域显示名称
const getScopeDisplay = (scope: string): string => {
  return t(`variableChooser.scopes.${scope}`, scope)
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

// 计算placeholder
const computedPlaceholder = computed(() => {
  let placeholder = props.selectorPlaceholder || t('variableChooser.select_variable')
  
  if (props.prefixIcon) {
    placeholder = `{${props.prefixIcon}} ${placeholder}`
  }
  
  return placeholder
})

// 计算后缀标签数组
const computedSuffixTags = computed(() => {
  if (props.suffixLabel) {
    return props.suffixLabel.split(' | ')
  }
  return []
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
        
        body[theme='dark'] & {
          color: #d3dce9;
        }
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
        
        body[theme='dark'] & {
          color: #d3dce9;
        }
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
          max-width: 200px;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          height: 22px;
          width: 100%;
          padding: 2px 6px 2px 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: default;
          user-select: none;
          vertical-align: middle;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          white-space: nowrap;
          
          .variable-name {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
            flex: 1;
            min-width: 0;
          }
          
          .type-suffix {
            font-size: 10px;
            font-weight: 400;
            white-space: nowrap;
            margin-left: auto;
            margin-right: 8px;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.9);
            padding: 2px 6px;
            border-radius: 3px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            font-size: 10px;
            height: 16px;
            line-height: 12px;
            display: flex;
            align-items: center;
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
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 2px;
            transition: all 0.2s ease;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
            
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
          cursor: pointer;
          outline: none;
          
          body[theme='dark'] & {
            background: var(--el-color-danger-dark-2);
            color: white;
          }
          
          &:hover {
            background: var(--el-color-danger);
            color: #fff;
            transform: scale(1.1);
            
            body[theme='dark'] & {
              background: var(--el-color-danger-light-3);
              color: #fff;
            }
          }
          
          &:active {
            transform: scale(0.95);
          }
          
          &:focus {
            outline: 2px solid var(--el-color-danger);
            outline-offset: 2px;
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
    
    body[theme='dark'] & {
      background: #1f2329;
      border-color: var(--el-border-color);
    };
    
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
          
          body[theme='dark'] & {
            color: #d3dce9;
          }
        }
        
        .info-value {
          font-size: 12px;
          color: var(--el-text-color-primary);
          
          body[theme='dark'] & {
            color: #e4e8ee;
          }
          
          &.code {
            background: var(--el-fill-color);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            color: var(--el-color-primary);
            
            body[theme='dark'] & {
              background: var(--o-bash-bg, #2a2f37);
            }
          }
        }
        
        code {
          background: var(--el-fill-color);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 12px;
          color: var(--el-color-primary);
          
          body[theme='dark'] & {
            background: var(--o-bash-bg, #2a2f37);
          }
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