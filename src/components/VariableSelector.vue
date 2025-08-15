<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElSelect, ElOption, ElInput, ElTag, ElButton, ElPopover, ElIcon } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { listVariables, getVariableTypes } from '@/api/variable'

interface Variable {
  name: string
  var_type: string
  scope: string
  value: string
  description?: string
  step?: string  // 节点名称（前置节点变量专用）
  step_id?: string  // 节点ID（前置节点变量专用）
}

interface Props {
  modelValue?: string
  placeholder?: string
  allowMultiple?: boolean
  supportedScopes?: string[]
  flowId?: string
  conversationId?: string
  showVariableReference?: boolean
  currentStepId?: string
  selfVariables?: any[]
  selfScopeLabel?: string
  typeFilter?: string[]
  suffixTags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '选择变量',
  allowMultiple: false,
  supportedScopes: () => ['conversation', 'system', 'env', 'user'],
  showVariableReference: true,
  selfVariables: () => [],
  selfScopeLabel: '',
  typeFilter: () => [],
  suffixTags: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'variable-selected': [variable: Variable]
}>()

// 响应式数据
const searchText = ref('')
const variables = ref<Variable[]>([])
const systemVariables = ref<Variable[]>([])
const userVariables = ref<Variable[]>([])
const envVariables = ref<Variable[]>([])
const conversationVariables = ref<Variable[]>([])
const loading = ref(false)
const variableTypes = ref<{types: string[], scopes: string[]}>({types: [], scopes: []})

// 计算属性
const filteredVariables = computed(() => {
  if (!searchText.value) return variables.value
  return variables.value.filter(variable => 
    variable.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    variable.description?.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 类型过滤函数
const filterByType = (variable: Variable): boolean => {
  if (!props.typeFilter || props.typeFilter.length === 0) return true
  return props.typeFilter.includes(variable.var_type)
}

// 搜索和类型过滤函数
const filterVariable = (variable: Variable): boolean => {
  const searchMatch = !searchText.value || 
    variable.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    (variable.description?.toLowerCase().includes(searchText.value.toLowerCase()) ?? false)
  
  const typeMatch = filterByType(variable)
  
  return searchMatch && typeMatch
}

const groupedVariables = computed(() => {
  const groups = {
    conversation: conversationVariables.value,
    system: systemVariables.value,
    env: envVariables.value,
    user: userVariables.value, 
  }
  
  const result: Array<{
    scope: string
    nodeId?: string | null
    nodeName?: string | null
    variables: Variable[]
    hasVariables: boolean
  }> = []
  
  // 首先添加当前节点变量分组（如果存在且有变量和标签）
  if (props.selfVariables && props.selfVariables.length > 0 && props.selfScopeLabel) {
    const selfVars = props.selfVariables
      .filter(v => v.name) // 只显示有名称的变量
      .map(v => ({
        name: v.name,
        var_type: v.type || 'string',
        scope: 'self',
        value: `{{self.${v.name}}}`,
        description: `${props.selfScopeLabel}: ${v.name}`
      }))
      .filter(filterVariable)
    
    if (selfVars.length > 0) {
      result.push({
        scope: 'self',
        variables: selfVars,
        hasVariables: true
      })
    }
  }
  
  // 按照supportedScopes的顺序返回分组，确保渲染顺序正确
  for (const scope of props.supportedScopes) {
    const variables = groups[scope] || []
    
    if (scope === 'conversation') {
      // 对话变量需要特殊处理，按节点分组
      const nodeGroups = groupConversationVariablesByNode(variables)
      
      for (const nodeGroup of nodeGroups) {
        const filteredVariables = nodeGroup.variables.filter(filterVariable)
        
        if (filteredVariables.length > 0) {
          result.push({
            scope: nodeGroup.scope,
            nodeId: nodeGroup.nodeId,
            nodeName: nodeGroup.nodeName,
            variables: filteredVariables,
            hasVariables: true
          })
        }
      }
    } else {
      // 其他作用域保持原有逻辑
    const filteredVariables = variables.filter(filterVariable)
      
      if (filteredVariables.length > 0) {
        result.push({
      scope,
      variables: filteredVariables,
          hasVariables: true
        })
      }
    }
  }
  
  return result
})

const scopeLabels: Record<string, string> = {
  self: '当前节点变量',
  system: '系统变量',
  user: '用户变量', 
  env: '环境变量',
  conversation: '对话变量'
}

const getScopeLabel = (scope: string, nodeId?: string | null, nodeName?: string | null): string => {
  if (scope === 'self' && props.selfScopeLabel) {
    return props.selfScopeLabel
  }
  if (scope.startsWith('conversation_node_') && nodeName) {
    return `节点 ${nodeName} 输出`
  }
  return scopeLabels[scope] || scope
}

const typeLabels = {
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

// 方法
const groupConversationVariablesByNode = (variables: Variable[]) => {
  const groups: Record<string, {scope: string, nodeId: string | null, nodeName: string | null, variables: Variable[]}> = {}
  
  for (const variable of variables) {
    if (variable.step_id && variable.scope === 'conversation') {
      // 前置节点变量（基于step_id字段）
      const groupKey = `conversation_${variable.step_id}`
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          scope: `conversation_node_${variable.step_id}`,
          nodeId: variable.step_id,
          nodeName: variable.step || variable.step_id, // 优先使用step名称，降级使用step_id
          variables: []
        }
      }
      groups[groupKey].variables.push(variable)
    } else {
      // 普通对话变量
      const groupKey = 'conversation_base'
      if (!groups[groupKey]) {
        groups[groupKey] = {
          scope: 'conversation',
          nodeId: null,
          nodeName: null,
          variables: []
        }
      }
      groups[groupKey].variables.push(variable)
    }
  }
  
  return Object.values(groups)
}

const loadVariables = async () => {
  loading.value = true
  try {
    console.log('🔄 VariableSelector开始加载变量，当前参数:', {
      supportedScopes: props.supportedScopes,
      flowId: props.flowId,
      conversationId: props.conversationId,
      currentStepId: props.currentStepId
    })
    
    // 并行加载所有支持的作用域的变量
    const promises = props.supportedScopes.map(scope => {
      const params: any = {
        scope,
        flow_id: props.flowId,
        conversation_id: props.conversationId
      }
      
      // 只有对话变量需要传current_step_id以获取前置节点变量
      if (scope === 'conversation' && props.currentStepId) {
        params.current_step_id = props.currentStepId
        console.log('🎯 对话变量查询带有current_step_id:', props.currentStepId)
      }
      
      return listVariables(params).then(response => {
        // 支持多种API响应结构的类型安全处理
        const responseAny = response as any
        let variables: Variable[] = []
        
        if (responseAny?.result?.variables) {
          // 结构1: { result: { variables: [...] } }
          variables = responseAny.result.variables
        } else if (responseAny?.variables) {
          // 结构2: { variables: [...], total: 8 }
          variables = responseAny.variables
        } else if (Array.isArray(responseAny)) {
          // 结构3: 直接返回数组
          variables = responseAny
        }
        
        console.log(`📋 ${scope}变量加载结果:`, variables.length, '个')
        return {scope, variables: Array.isArray(variables) ? variables : []}
      }).catch(error => {
        console.error(`❌ ${scope}变量加载失败:`, error)
        return {scope, variables: []}
      })
    })
    
    const results = await Promise.all(promises)
    
    // 清空现有变量
    systemVariables.value = []
    userVariables.value = []
    envVariables.value = []
    conversationVariables.value = []
    
    // 分组存储变量
    results.forEach(({scope, variables: vars}) => {
      switch(scope) {
        case 'system':
          systemVariables.value = vars
          break
        case 'user':
          userVariables.value = vars
          break
        case 'env':
          envVariables.value = vars
          break
        case 'conversation':
          conversationVariables.value = vars
          break
      }
    })
    
    // 合并所有变量
    variables.value = [
      ...systemVariables.value,
      ...userVariables.value, 
      ...envVariables.value,
      ...conversationVariables.value
    ]
    
    console.log('✅ VariableSelector变量加载完成:', {
      总数: variables.value.length,
      系统变量: systemVariables.value.length,
      用户变量: userVariables.value.length,
      环境变量: envVariables.value.length,
      对话变量: conversationVariables.value.length,
      前置节点变量: conversationVariables.value.filter(v => v.name.includes('.') && !v.name.startsWith('system.')).length
    })
  } catch (error) {
    console.error('❌ 变量加载失败:', error)
    // 显示更友好的错误提示
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('404')) {
      console.error('💡 建议检查: API路径是否正确，后端服务是否启动')
    } else if (errorMessage.includes('flowId')) {
      console.error('💡 建议检查: flowId参数是否正确传递')
    }
  } finally {
    loading.value = false
  }
}

const loadVariableTypes = async () => {
  try {
    const response = await getVariableTypes()
    variableTypes.value = response?.result || {types: [], scopes: []}
  } catch (error) {
    console.error('加载变量类型失败:', error)
  }
}

const formatVariableReference = (variable: Variable): string => {
  const scopeMap = {
    self: 'self',
    system: 'system',
    user: 'user', 
    env: 'env',
    conversation: 'conversation'
  }
  
  // 当前节点变量已经包含完整的引用格式
  if (variable.scope === 'self') {
    return variable.value // 已经是 {{self.name}} 格式
  }
  
  // 前置节点变量需要使用step_id.name的格式
  if (variable.step_id && variable.scope === 'conversation') {
    return `{{${scopeMap[variable.scope]}.${variable.step_id}.${variable.name}}}`
  }
  
  // 普通变量使用原有格式
  return `{{${scopeMap[variable.scope]}.${variable.name}}}`
}

const handleVariableSelect = (variable: Variable) => {
  const value = props.showVariableReference ? formatVariableReference(variable) : variable.name
  emit('update:modelValue', value)
  emit('variable-selected', variable)
}

const handleInputChange = (value: string) => {
  emit('update:modelValue', value)
}

// 生命周期
onMounted(() => {
  loadVariables()
  loadVariableTypes()
})

// 监听属性变化
watch([() => props.flowId, () => props.conversationId, () => props.currentStepId], (newValues, oldValues) => {
  loadVariables()
})
</script>

<template>
  <div class="variable-selector">
    <ElPopover
      placement="bottom-start"
      :width="400"
      trigger="click"
      popper-class="variable-selector-popover"
    >
      <template #reference>
        <ElInput
          :model-value="modelValue"
          :placeholder="placeholder"
          readonly
          clearable
        >
          <template #suffix>
            <div class="input-suffix">
              <div v-if="suffixTags.length > 0" class="suffix-tags">
                <ElTag
                  v-for="tag in suffixTags"
                  :key="tag"
                  size="small"
                  type="info"
                  class="suffix-tag"
                >
                  {{ tag }}
                </ElTag>
              </div>
              <ElIcon class="cursor-pointer search-icon"><Search /></ElIcon>
            </div>
          </template>
        </ElInput>
      </template>
      
      <div class="variable-list">
        <!-- 搜索框 -->
        <ElInput
          v-model="searchText"
          placeholder="搜索变量..."
          clearable
          class="mb-3"
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>
        
        <!-- 变量分组列表 -->
        <div v-loading="loading" class="variable-groups">
          <div 
            v-for="group in groupedVariables" 
            :key="group.scope"
            class="variable-group"
          >
            <div class="group-header">
              <span class="group-title">{{ getScopeLabel(group.scope, group.nodeId, group.nodeName) }}</span>
              <ElTag size="small" type="info">{{ group.variables.length }}</ElTag>
            </div>
            
            <div class="variable-items">
              <div
                v-for="variable in group.variables"
                :key="`${variable.scope}-${variable.name}`"
                class="variable-item"
                @click="handleVariableSelect(variable)"
              >
                <div class="variable-info">
                  <div class="variable-name">{{ variable.name }}</div>
                  <div class="variable-meta">
                    <ElTag size="small" :type="variable.var_type === 'secret' ? 'warning' : 'primary'">
                      {{ typeLabels[variable.var_type] || variable.var_type }}
                    </ElTag>
                    <span v-if="variable.description" class="variable-desc">
                      {{ variable.description }}
                    </span>
                  </div>
                </div>
                <div class="variable-reference">
                  {{ formatVariableReference(variable) }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="groupedVariables.length === 0" class="empty-state">
            <div class="empty-text">暂无可用变量</div>
            <div class="empty-hint">您可以在开始节点中定义对话变量</div>
          </div>
        </div>
      </div>
    </ElPopover>
  </div>
</template>

<style lang="scss" scoped>
.variable-selector {
  width: 100%;
  
  .input-suffix {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .suffix-tags {
      display: flex;
      gap: 4px;
      
      .suffix-tag {
        --el-tag-bg-color: var(--el-color-info-light-9);
        --el-tag-border-color: var(--el-color-info-light-7);
        --el-tag-text-color: var(--el-color-info);
        font-size: 10px;
        height: 18px;
        line-height: 16px;
        padding: 0 4px;
      }
    }
    
    .search-icon {
      color: var(--el-text-color-placeholder);
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

.variable-list {
  max-height: 400px;
  overflow-y: auto;
  
  .variable-groups {
    .variable-group {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--el-border-color-light);
        margin-bottom: 8px;
        
        .group-title {
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
      
      .variable-items {
        .variable-item {
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          
          &:hover {
            background-color: var(--el-fill-color-light);
            border-color: var(--el-color-primary);
          }
          
          .variable-info {
            margin-bottom: 4px;
            
            .variable-name {
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
            }
            
            .variable-meta {
              display: flex;
              align-items: center;
              gap: 8px;
              
              .variable-desc {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
          
          .variable-reference {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 12px;
            color: var(--el-color-primary);
            background-color: var(--el-fill-color-extra-light);
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid var(--el-border-color);
          }
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: var(--el-text-color-secondary);
      
      .empty-text {
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .empty-hint {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>

<style>
.variable-selector-popover {
  padding: 12px !important;
}
</style> 