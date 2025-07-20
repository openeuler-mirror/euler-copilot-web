import { listVariables, createVariable, updateVariable, deleteVariable } from '@/api/variable'
import { ElMessage } from 'element-plus'

export const workFlowVariableMixin = {
  data() {
    return {
      // 节点变量数据缓存
      nodeVariablesCache: new Map(),
      variablesLoading: false
    }
  },

  methods: {
    /**
     * 加载工作流的所有变量数据
     * @param {string} flowId - 工作流ID
     * @param {string} conversationId - 对话ID
     */
    async loadWorkFlowVariables(flowId, conversationId) {
      this.variablesLoading = true
      try {
        // 并行加载所有作用域的变量
        const [systemVars, userVars, envVars, conversationVars] = await Promise.all([
          this.loadVariablesByScope('system'),
          this.loadVariablesByScope('user'),
          this.loadVariablesByScope('env', flowId),
          this.loadVariablesByScope('conversation', flowId, conversationId)
        ])

        // 缓存变量数据
        this.nodeVariablesCache.set('system', systemVars)
        this.nodeVariablesCache.set('user', userVars)
        this.nodeVariablesCache.set('env', envVars)
        this.nodeVariablesCache.set('conversation', conversationVars)

        // 将对话变量关联到开始节点
        this.attachConversationVariablesToStartNode(conversationVars)
        
        return {
          system: systemVars,
          user: userVars,
          env: envVars,
          conversation: conversationVars
        }
      } catch (error) {
        console.error('加载工作流变量失败:', error)
        ElMessage.error('加载工作流变量失败')
        return null
      } finally {
        this.variablesLoading = false
      }
    },

    /**
     * 根据作用域加载变量
     */
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

    /**
     * 将对话变量附加到开始节点数据中
     * @param {Array} conversationVars - 对话变量数组
     */
    attachConversationVariablesToStartNode(conversationVars) {
      if (!this.nodes || typeof this.nodes !== 'object') return

      // 查找开始节点
      const startNode = this.findStartNode()
      if (!startNode) return

      // 将变量数据转换为对象格式
      const variablesObj = {}
      conversationVars.forEach(variable => {
        variablesObj[variable.name] = {
          value: variable.value,
          type: variable.var_type,
          description: variable.description
        }
      })

      // 更新开始节点的变量数据
      this.updateNodeVariables(startNode.id, variablesObj)
    },

    /**
     * 查找开始节点
     */
    findStartNode() {
      if (Array.isArray(this.nodes)) {
        return this.nodes.find(node => 
          node.data?.name === '开始' || 
          node.data?.name === 'start' ||
          node.type === 'start' ||
          node.data?.callId === 'start'
        )
      }
      return null
    },

    /**
     * 更新节点的变量数据
     * @param {string} nodeId - 节点ID
     * @param {Object} variables - 变量数据
     */
    updateNodeVariables(nodeId, variables) {
      if (this.updateNode && typeof this.updateNode === 'function') {
        // 如果有updateNode方法（VueFlow）
        this.updateNode(nodeId, (node) => ({
          ...node,
          data: {
            ...node.data,
            variables: variables
          }
        }))
      } else if (Array.isArray(this.nodes)) {
        // 如果是普通数组
        const nodeIndex = this.nodes.findIndex(node => node.id === nodeId)
        if (nodeIndex !== -1) {
          this.nodes[nodeIndex] = {
            ...this.nodes[nodeIndex],
            data: {
              ...this.nodes[nodeIndex].data,
              variables: variables
            }
          }
        }
      }
    },

    /**
     * 保存开始节点的对话变量
     * @param {Object} variables - 变量数据对象
     * @param {string} conversationId - 对话ID
     */
    async saveStartNodeVariables(variables, conversationId) {
      try {
        // 获取当前的对话变量
        const currentVars = this.nodeVariablesCache.get('conversation') || []
        const currentVarNames = new Set(currentVars.map(v => v.name))
        
        // 处理新增和更新的变量
        const promises = []
        Object.entries(variables).forEach(([name, data]) => {
          const variableData = {
            name,
            var_type: data.type || 'string',
            value: data.value,
            description: data.description || '',
            scope: 'conversation',
            conversation_id: conversationId
          }

          if (currentVarNames.has(name)) {
            // 更新现有变量
            promises.push(
              updateVariable(
                { name, scope: 'conversation', conversation_id: conversationId },
                variableData
              )
            )
          } else {
            // 创建新变量
            promises.push(createVariable(variableData))
          }
        })

        // 处理需要删除的变量
        const newVarNames = new Set(Object.keys(variables))
        currentVars.forEach(variable => {
          if (!newVarNames.has(variable.name)) {
            promises.push(
              deleteVariable({
                name: variable.name,
                scope: 'conversation',
                conversation_id: conversationId
              })
            )
          }
        })

        // 执行所有操作
        await Promise.all(promises)
        
        ElMessage.success('对话变量保存成功')
        return true
      } catch (error) {
        console.error('保存对话变量失败:', error)
        ElMessage.error('保存对话变量失败')
        return false
      }
    },

    /**
     * 初始化工作流变量系统
     * @param {string} flowId - 工作流ID  
     * @param {string} conversationId - 对话ID
     */
    async initWorkFlowVariables(flowId, conversationId) {
      if (!flowId) {
        console.warn('工作流ID不存在，跳过变量初始化')
        return
      }

      // 加载变量数据
      const variables = await this.loadWorkFlowVariables(flowId, conversationId)
      
      if (variables) {
        // 触发变量加载完成事件
        this.$emit && this.$emit('variables-loaded', variables)
        
        return variables
      }
    },

    /**
     * 获取节点的变量配置
     * @param {string} nodeId - 节点ID
     * @param {string} nodeType - 节点类型
     */
    getNodeVariableConfig(nodeId, nodeType) {
      const node = this.findNodeById(nodeId)
      if (!node) return {}

      // 从node.data.variableConfig或node.data.parameters.config获取
      return node.data?.variableConfig || node.data?.parameters?.config || {}
    },

    /**
     * 保存节点的变量配置
     * @param {string} nodeId - 节点ID
     * @param {Object} config - 配置数据
     */
    async saveNodeVariableConfig(nodeId, config) {
      try {
        // 更新节点的variableConfig字段
        this.updateNodeVariables(nodeId, null)
        
        if (this.updateNode && typeof this.updateNode === 'function') {
          this.updateNode(nodeId, (node) => ({
            ...node,
            data: {
              ...node.data,
              variableConfig: config
            }
          }))
        }

        // 这里可以添加保存到后端的逻辑
        // await saveNodeConfig(nodeId, config)
        
        ElMessage.success('节点配置保存成功')
        return true
      } catch (error) {
        console.error('保存节点配置失败:', error)
        ElMessage.error('保存节点配置失败')
        return false
      }
    },

    /**
     * 根据ID查找节点
     */
    findNodeById(nodeId) {
      if (Array.isArray(this.nodes)) {
        return this.nodes.find(node => node.id === nodeId)
      }
      return null
    },

    /**
     * 验证工作流中的变量引用
     */
    validateWorkFlowVariables() {
      const errors = []
      
      if (!Array.isArray(this.nodes)) return errors

      this.nodes.forEach(node => {
        const config = this.getNodeVariableConfig(node.id, node.type)
        
        Object.entries(config).forEach(([field, value]) => {
          if (typeof value === 'string') {
            const fieldErrors = this.validateVariableReferences(value)
            if (fieldErrors.length > 0) {
              errors.push({
                nodeId: node.id,
                nodeName: node.data?.name || node.id,
                field,
                errors: fieldErrors
              })
            }
          }
        })
      })

      return errors
    },

    /**
     * 解析变量引用（从variableMixin复用）
     */
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

    /**
     * 验证变量引用的有效性
     */
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

    /**
     * 根据引用查找变量
     */
    findVariableByReference(scope, variableName) {
      const scopeMap = {
        system: 'system',
        system: 'system',
        user: 'user',
        env: 'env',
        conversation: 'conversation'
      }
      
      const mappedScope = scopeMap[scope]
      const variables = this.nodeVariablesCache.get(mappedScope) || []
      return variables.find(variable => variable.name === variableName)
    }
  }
} 