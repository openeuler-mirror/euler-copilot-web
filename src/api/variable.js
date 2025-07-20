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
 */
export async function getVariable(params) {
  const [error, response] = await get(`${BASE_URL}/get`, params)
  if (error) throw error
  return response
}

/**
 * 列出变量
 * @param {Object} params 查询参数
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