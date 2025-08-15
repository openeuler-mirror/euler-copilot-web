import { get, post, put, del } from '@/apis/server'

// 变量管理API
const BASE_URL = '/api/variable'

/**
 * 获取支持的变量类型和作用域
 */
export async function getVariableTypes() {
  const [error, response] = await get(`${BASE_URL}/types`)
  if (error) throw error
  return response
}

/**
 * 创建变量
 * @param {Object} data 变量数据
 */
export async function createVariable(data) {
  const [error, response] = await post(`${BASE_URL}/create`, data)
  if (error) throw error
  return response
}

/**
 * 更新变量
 * @param {Object} params 查询参数
 * @param {Object} data 变量数据
 */
export async function updateVariable(params, data) {
  const [error, response] = await put(`${BASE_URL}/update`, data, params)
  if (error) throw error
  return response
}

/**
 * 删除变量
 * @param {Object} params 查询参数
 */
export async function deleteVariable(params) {
  const [error, response] = await del(`${BASE_URL}/delete`, {}, params)
  if (error) throw error
  return response
}

/**
 * 获取单个变量
 * @param {Object} params 查询参数
 * @param {string} params.name 变量名称
 * @param {string} params.scope 变量作用域 (user|env|system|conversation)
 * @param {string} [params.flow_id] 流程ID（环境级和对话级变量必需）
 * @param {string} [params.conversation_id] 对话ID（系统级和对话级变量必需）
 */
export async function getVariable(params) {
  const [error, response] = await get(`${BASE_URL}/get`, params)
  if (error) throw error
  return response
}

/**
 * 列出变量
 * @param {Object} params 查询参数
 * @param {string} params.scope 变量作用域 (user|env|system|conversation)
 * @param {string} [params.flow_id] 流程ID（环境级和对话级变量必需）
 * @param {string} [params.conversation_id] 对话ID（系统级和对话级变量必需）
 * @param {string} [params.current_step_id] 当前步骤ID（用于获取前置节点变量，仅对话变量有效）
 * @param {string} [params.exclude_pattern] 排除模式（'step_id'排除包含.的变量名）
 */
export async function listVariables(params = {}) {
  const [error, response] = await get(`${BASE_URL}/list`, params)
  if (error) throw error
  return response
}

/**
 * 解析模板
 * @param {Object} data 模板数据
 */
export async function parseTemplate(data) {
  const [error, response] = await post(`${BASE_URL}/parse`, data)
  if (error) throw error
  return response
}

/**
 * 验证模板
 * @param {Object} data 模板数据
 */
export async function validateTemplate(data) {
  const [error, response] = await post(`${BASE_URL}/validate`, data)
  if (error) throw error
  return response
}

/**
 * 清空对话变量
 * @param {Object} params 查询参数
 */
export async function clearConversationVariables(params) {
  const [error, response] = await post(`${BASE_URL}/clear-conversation`, {}, params)
  if (error) throw error
  return response
}

// ========== 便利函数 ==========

/**
 * 列出用户变量
 * @returns {Promise} 用户变量列表
 */
export async function listUserVariables() {
  return await listVariables({ scope: 'user' })
}

/**
 * 列出环境变量
 * @param {string} flowId 流程ID
 * @returns {Promise} 环境变量列表
 */
export async function listEnvironmentVariables(flowId) {
  if (!flowId) {
    throw new Error('流程ID是必需的')
  }
  return await listVariables({ 
    scope: 'env', 
    flow_id: flowId 
  })
}

/**
 * 列出系统变量
 * @param {string} conversationId 对话ID
 * @returns {Promise} 系统变量列表
 */
export async function listSystemVariables(conversationId) {
  if (!conversationId) {
    throw new Error('对话ID是必需的')
  }
  return await listVariables({ 
    scope: 'system', 
    conversation_id: conversationId 
  })
}

/**
 * 列出对话变量
 * @param {string} conversationId 对话ID
 * @returns {Promise} 对话变量列表
 */
export async function listConversationVariables(conversationId) {
  if (!conversationId) {
    throw new Error('对话ID是必需的')
  }
  return await listVariables({ 
    scope: 'conversation', 
    conversation_id: conversationId 
  })
}

/**
 * 获取用户变量
 * @param {string} name 变量名称
 * @returns {Promise} 变量信息
 */
export async function getUserVariable(name) {
  return await getVariable({ 
    name, 
    scope: 'user' 
  })
}

/**
 * 获取环境变量
 * @param {string} name 变量名称
 * @param {string} flowId 流程ID
 * @returns {Promise} 变量信息
 */
export async function getEnvironmentVariable(name, flowId) {
  if (!flowId) {
    throw new Error('流程ID是必需的')
  }
  return await getVariable({ 
    name, 
    scope: 'env', 
    flow_id: flowId 
  })
}

/**
 * 获取系统变量
 * @param {string} name 变量名称
 * @param {string} conversationId 对话ID
 * @returns {Promise} 变量信息
 */
export async function getSystemVariable(name, conversationId) {
  if (!conversationId) {
    throw new Error('对话ID是必需的')
  }
  return await getVariable({ 
    name, 
    scope: 'system', 
    conversation_id: conversationId 
  })
}

/**
 * 获取对话变量
 * @param {string} name 变量名称
 * @param {string} conversationId 对话ID
 * @returns {Promise} 变量信息
 */
export async function getConversationVariable(name, conversationId) {
  if (!conversationId) {
    throw new Error('对话ID是必需的')
  }
  return await getVariable({ 
    name, 
    scope: 'conversation', 
    conversation_id: conversationId 
  })
}

/**
 * 创建用户变量
 * @param {Object} data 变量数据
 */
export async function createUserVariable(data) {
  return await createVariable({
    ...data,
    scope: 'user'
  })
}

/**
 * 创建环境变量
 * @param {Object} data 变量数据
 * @param {string} flowId 流程ID
 */
export async function createEnvironmentVariable(data, flowId) {
  if (!flowId) {
    throw new Error('流程ID是必需的')
  }
  return await createVariable({
    ...data,
    scope: 'env',
    flow_id: flowId
  })
}

/**
 * 创建对话变量模板（在流程级别定义）
 * @param {Object} data 变量数据
 * @param {string} flowId 流程ID
 */
export async function createConversationVariableTemplate(data, flowId) {
  if (!flowId) {
    throw new Error('流程ID是必需的')
  }
  return await createVariable({
    ...data,
    scope: 'conversation',
    flow_id: flowId
  })
} 