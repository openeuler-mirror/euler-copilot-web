import { listVariables, createVariable, updateVariable, deleteVariable } from '@/api/variable'
import { ElMessage } from 'element-plus'

export const variableMixin = {
  data() {
    return {
      // 变量相关数据
      variableLoading: false,
      systemVariables: [],
      userVariables: [],
      envVariables: [],
      conversationVariables: [],
      allVariables: []
    }
  },

  computed: {
    // 根据作用域分组的变量
    groupedVariables() {
      return {
        system: this.systemVariables,
        user: this.userVariables,
        env: this.envVariables,
        conversation: this.conversationVariables
      }
    },

    // 可用的变量引用
    availableVariableReferences() {
      const references = []
      
      this.systemVariables.forEach(variable => {
        references.push({
          label: `系统变量: ${variable.name}`,
          value: `{{system.${variable.name}}}`,
          type: variable.var_type,
          scope: 'system',
          description: variable.description
        })
      })
      
      this.userVariables.forEach(variable => {
        references.push({
          label: `用户变量: ${variable.name}`,
          value: `{{user.${variable.name}}}`,
          type: variable.var_type,
          scope: 'user',
          description: variable.description
        })
      })
      
      this.envVariables.forEach(variable => {
        references.push({
          label: `环境变量: ${variable.name}`,
          value: `{{env.${variable.name}}}`,
          type: variable.var_type,
          scope: 'env',
          description: variable.description
        })
      })
      
      this.conversationVariables.forEach(variable => {
        references.push({
          label: `对话变量: ${variable.name}`,
          value: `{{conversation.${variable.name}}}`,
          type: variable.var_type,
          scope: 'conversation',
          description: variable.description
        })
      })
      
      return references
    }
  },

  methods: {
    // 加载所有变量
    async loadAllVariables(flowId, conversationId) {
      this.variableLoading = true
      try {
        const promises = [
          this.loadVariablesByScope('system'),
          this.loadVariablesByScope('user'),
          this.loadVariablesByScope('env', flowId),
          this.loadVariablesByScope('conversation', flowId, conversationId)
        ]
        
        const [systemResult, userResult, envResult, conversationResult] = await Promise.all(promises)
        
        this.systemVariables = systemResult
        this.userVariables = userResult
        this.envVariables = envResult
        this.conversationVariables = conversationResult
        
        this.allVariables = [
          ...this.systemVariables,
          ...this.userVariables,
          ...this.envVariables,
          ...this.conversationVariables
        ]
        
        return this.allVariables
      } catch (error) {
        console.error('加载变量失败:', error)
        ElMessage.error('加载变量失败')
        return []
      } finally {
        this.variableLoading = false
      }
    },

    // 根据作用域加载变量
    async loadVariablesByScope(scope, flowId = null, conversationId = null) {
      try {
        const params = { scope }
        if (flowId) params.flow_id = flowId
        if (conversationId) params.conversation_id = conversationId
        
        const response = await listVariables(params)
        return response.result?.variables || []
      } catch (error) {
        console.error(`加载${scope}变量失败:`, error)
        return []
      }
    },

    // 创建对话变量
    async createConversationVariable(variableData, conversationId) {
      try {
        await createVariable({
          ...variableData,
          scope: 'conversation',
          conversation_id: conversationId
        })
        
        ElMessage.success('对话变量创建成功')
        return true
      } catch (error) {
        console.error('创建对话变量失败:', error)
        ElMessage.error('创建对话变量失败')
        return false
      }
    },

    // 更新变量
    async updateVariableData(name, scope, newData, flowId = null, conversationId = null) {
      try {
        const params = { name, scope }
        if (flowId) params.flow_id = flowId
        if (conversationId) params.conversation_id = conversationId
        
        await updateVariable(params, newData)
        ElMessage.success('变量更新成功')
        return true
      } catch (error) {
        console.error('更新变量失败:', error)
        ElMessage.error('更新变量失败')
        return false
      }
    },

    // 删除变量
    async deleteVariableData(name, scope, flowId = null, conversationId = null) {
      try {
        const params = { name, scope }
        if (flowId) params.flow_id = flowId
        if (conversationId) params.conversation_id = conversationId
        
        await deleteVariable(params)
        ElMessage.success('变量删除成功')
        return true
      } catch (error) {
        console.error('删除变量失败:', error)
        ElMessage.error('删除变量失败')
        return false
      }
    },

    // 解析变量引用
    parseVariableReferences(text) {
      if (!text || typeof text !== 'string') return []
      
      const regex = /\{\{([^}]+)\}\}/g
      const matches = []
      let match
      
      while ((match = regex.exec(text)) !== null) {
        const reference = match[1].trim()
        const parts = reference.split('.')
        
        if (parts.length >= 2) {
          const scope = parts[0]
          const variableName = parts.slice(1).join('.')
          
          matches.push({
            fullMatch: match[0],
            scope,
            variableName,
            reference,
            position: match.index
          })
        }
      }
      
      return matches
    },

    // 验证变量引用
    validateVariableReferences(text) {
      const references = this.parseVariableReferences(text)
      const errors = []
      
      references.forEach(ref => {
        const variable = this.findVariableByReference(ref.scope, ref.variableName)
        if (!variable) {
          errors.push({
            reference: ref.fullMatch,
            message: `未找到变量: ${ref.scope}.${ref.variableName}`,
            position: ref.position
          })
        }
      })
      
      return errors
    },

    // 根据引用查找变量
    findVariableByReference(scope, variableName) {
      const scopeMap = {
        system: this.systemVariables,
        system: this.systemVariables,
        user: this.userVariables,
        env: this.envVariables,
        conversation: this.conversationVariables
      }
      
      const variables = scopeMap[scope] || []
      return variables.find(variable => variable.name === variableName)
    },

    // 格式化变量引用
    formatVariableReference(scope, variableName) {
      const scopeMap = {
        system: 'system',
        user: 'user',
        env: 'env',
        conversation: 'conversation'
      }
      
      const mappedScope = scopeMap[scope] || scope
      return `{{${mappedScope}.${variableName}}}`
    },

    // 获取变量类型的中文标签
    getVariableTypeLabel(type) {
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
      
      return typeLabels[type] || type
    },

    // 获取作用域的中文标签
    getScopeLabel(scope) {
      const scopeLabels = {
        system: '系统变量',
        user: '用户变量',
        env: '环境变量',
        conversation: '对话变量'
      }
      
      return scopeLabels[scope] || scope
    }
  }
} 