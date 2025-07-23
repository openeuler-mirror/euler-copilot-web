import { ref, computed, watch } from 'vue'
import { listVariables } from '@/api/variable'

export interface Variable {
  name: string
  var_type: string
  scope: string
  value: string
  description?: string
  step?: string  // 节点名称（前置节点变量专用）
  step_id?: string  // 节点ID（前置节点变量专用）
}

export const useVariables = (
  supportedScopes: string[],
  flowId?: string,
  conversationId?: string,
  currentStepId?: string
) => {
  // 响应式数据
  const loading = ref(false)
  const searchText = ref('')
  const variables = ref<Variable[]>([])
  const systemVariables = ref<Variable[]>([])
  const userVariables = ref<Variable[]>([])
  const envVariables = ref<Variable[]>([])
  const conversationVariables = ref<Variable[]>([])

  // 作用域和类型标签映射
  const scopeLabels: Record<string, string> = {
    system: '系统变量',
    user: '用户变量', 
    env: '环境变量',
    conversation: '对话变量'
  }

  const typeLabels: Record<string, string> = {
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

  // 计算属性
  const filteredVariables = computed(() => {
    if (!searchText.value) return variables.value
    return variables.value.filter(variable => 
      variable.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      variable.description?.toLowerCase().includes(searchText.value.toLowerCase())
    )
  })

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
    
    // 按照supportedScopes的顺序返回分组，确保渲染顺序正确
    for (const scope of supportedScopes) {
      const variables = groups[scope] || []
      
      if (scope === 'conversation') {
        // 对话变量需要特殊处理，按节点分组
        const nodeGroups = groupConversationVariablesByNode(variables)
        
        for (const nodeGroup of nodeGroups) {
          const filteredVariables = nodeGroup.variables.filter(variable => 
            !searchText.value || 
            variable.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
            variable.description?.toLowerCase().includes(searchText.value.toLowerCase())
          )
          
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
        const filteredVariables = variables.filter(variable => 
          !searchText.value || 
          variable.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
          variable.description?.toLowerCase().includes(searchText.value.toLowerCase())
        )
        
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

  const getScopeLabel = (scope: string, nodeId?: string | null, nodeName?: string | null): string => {
    if (scope.startsWith('conversation_node_') && nodeName) {
      return `节点 ${nodeName} 输出`
    }
    return scopeLabels[scope] || scope
  }

  const getVariableDisplayName = (variable: Variable): string => {
    return variable.name
  }

  const getVariableTypeDisplay = (varType: string): string => {
    return typeLabels[varType] || varType
  }

  const formatVariableReference = (variable: Variable): string => {
    const scopeMap = {
      system: 'system',
      user: 'user', 
      env: 'env',
      conversation: 'conversation'
    }
    
    // 前置节点变量需要使用step_id.name的格式
    if (variable.step_id && variable.scope === 'conversation') {
      return `{{${scopeMap[variable.scope]}.${variable.step_id}.${variable.name}}}`
    }
    
    // 普通变量使用原有格式
    return `{{${scopeMap[variable.scope]}.${variable.name}}}`
  }

  const loadVariables = async () => {
    loading.value = true
    try {
      console.log('🔄 useVariables开始加载变量，当前参数:', {
        supportedScopes,
        flowId,
        conversationId,
        currentStepId
      })
      
      // 并行加载所有支持的作用域的变量
      const promises = supportedScopes.map(scope => {
        const params: any = {
          scope,
          flow_id: flowId,
          conversation_id: conversationId
        }
        
        // 只有对话变量需要传current_step_id以获取前置节点变量
        if (scope === 'conversation' && currentStepId) {
          params.current_step_id = currentStepId
          console.log('🎯 对话变量查询带有current_step_id:', currentStepId)
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
      
      console.log('✅ useVariables变量加载完成:', {
        总数: variables.value.length,
        系统变量: systemVariables.value.length,
        用户变量: userVariables.value.length,
        环境变量: envVariables.value.length,
        对话变量: conversationVariables.value.length,
        前置节点变量: conversationVariables.value.filter(v => v.name.includes('.') && !v.name.startsWith('system.')).length
      })
    } catch (error) {
      console.error('❌ useVariables变量加载失败:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    // 响应式数据
    loading,
    searchText,
    variables,
    systemVariables,
    userVariables,
    envVariables,
    conversationVariables,
    
    // 计算属性
    filteredVariables,
    groupedVariables,
    
    // 方法
    loadVariables,
    getScopeLabel,
    getVariableDisplayName,
    getVariableTypeDisplay,
    formatVariableReference
  }
} 