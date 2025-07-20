import { ref, computed } from 'vue'
import { listVariables } from '@/api/variable'

export interface Variable {
  name: string
  var_type: string
  scope: string
  value: string
  description?: string
}

export interface VariableGroup {
  scope: string
  variables: Variable[]
  hasVariables: boolean
}

export const useVariables = (
  supportedScopes: string[] = ['conversation', 'system', 'env', 'user'],
  flowId?: string,
  conversationId?: string
) => {
  // 响应式数据
  const loading = ref(false)
  const searchText = ref('')
  const variables = ref<Variable[]>([])
  const systemVariables = ref<Variable[]>([])
  const userVariables = ref<Variable[]>([])
  const envVariables = ref<Variable[]>([])
  const conversationVariables = ref<Variable[]>([])

  // 作用域标签映射
  const scopeLabels: Record<string, string> = {
    system: '系统变量',
    user: '用户变量',
    env: '环境变量',
    conversation: '对话变量'
  }

  // 类型标签映射
  const typeLabels: Record<string, string> = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    object: '对象',
    secret: '密钥',
    file: '文件',
    array: '数组',
    'array[any]': '数组',
    'array[string]': '字符串数组',
    'array[number]': '数字数组',
    'array[object]': '对象数组',
    'array[file]': '文件数组',
    'array[boolean]': '布尔数组',
    'array[secret]': '密钥数组'
  }

  // 工具函数
  const getVariableDisplayName = (variable: Variable): string => {
    if (variable.scope === 'system') {
      const nameMap: Record<string, string> = {
        'query': 'system.query',
        'files': 'system.files',
        'dialogue_count': 'system.dialogue_count',
        'app_id': 'system.app_id',
        'flow_id': 'system.flow_id',
        'user_id': 'system.user_id',
        'session_id': 'system.session_id',
        'timestamp': 'system.timestamp'
      }
      return nameMap[variable.name] || `system.${variable.name}`
    }
    return `${variable.scope}.${variable.name}`
  }

  const formatVariableReference = (variable: Variable): string => {
    const scopeMap = {
      system: 'system',
      user: 'user',
      env: 'env',
      conversation: 'conversation'
    }
    return `{{${scopeMap[variable.scope]}.${variable.name}}}`
  }

  const getVariableTypeDisplay = (type: string): string => {
    return typeLabels[type] || type
  }

  const getScopeLabel = (scope: string): string => {
    return scopeLabels[scope] || scope
  }

  // 计算属性
  const filteredVariables = computed(() => {
    if (!searchText.value) return variables.value
    return variables.value.filter(variable =>
      variable.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      variable.description?.toLowerCase().includes(searchText.value.toLowerCase())
    )
  })

  const groupedVariables = computed((): VariableGroup[] => {
    const groups = {
      conversation: conversationVariables.value,
      system: systemVariables.value,
      env: envVariables.value,
      user: userVariables.value,
    }

    return supportedScopes.map(scope => {
      const variables = groups[scope] || []
      const filteredVariables = variables.filter(variable =>
        !searchText.value ||
        variable.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
        variable.description?.toLowerCase().includes(searchText.value.toLowerCase())
      )
      return {
        scope,
        variables: filteredVariables,
        hasVariables: filteredVariables.length > 0
      }
    }).filter(group => group.hasVariables)
  })

  // 变量加载方法
  const loadVariables = async () => {
    loading.value = true
    try {
      const promises = supportedScopes.map(scope => {
        const params = {
          scope,
          flow_id: flowId,
          conversation_id: conversationId
        }

        return listVariables(params).then(response => {
          const responseAny = response as any
          let variables: Variable[] = []

          if (responseAny?.result?.variables) {
            variables = responseAny.result.variables
          } else if (responseAny?.variables) {
            variables = responseAny.variables
          } else if (Array.isArray(responseAny)) {
            variables = responseAny
          }

          return { scope, variables: Array.isArray(variables) ? variables : [] }
        }).catch(error => {
          console.error(`加载${scope}变量失败:`, error)
          return { scope, variables: [] }
        })
      })

      const results = await Promise.all(promises)

      // 清空现有变量
      systemVariables.value = []
      userVariables.value = []
      envVariables.value = []
      conversationVariables.value = []

      // 分组存储变量
      results.forEach(({ scope, variables: vars }) => {
        switch (scope) {
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

    } catch (error) {
      console.error('❌ 变量加载失败:', error)
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
    
    // 工具函数
    getVariableDisplayName,
    formatVariableReference,
    getVariableTypeDisplay,
    getScopeLabel,
    
    // 常量
    scopeLabels,
    typeLabels,
    
    // 方法
    loadVariables
  }
} 