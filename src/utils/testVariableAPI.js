/**
 * 变量API测试脚本
 * 用于快速验证修复后的变量API是否正常工作
 */

// 测试变量API的快速函数
export const quickTestVariableAPI = async () => {
  console.log('🧪 开始快速测试变量API...')
  
  try {
    // 动态导入变量API
    console.log('📦 正在导入变量API...')
    const { listVariables, createVariable, getVariableTypes } = await import('@/api/variable')
    console.log('✅ 变量API导入成功')
    
    // 测试1: 获取系统变量
    console.log('📡 测试1: 获取系统变量...')
    try {
      const systemVars = await listVariables({ scope: 'system' })
      console.log('✅ 系统变量API正常:', systemVars)
    } catch (error) {
      console.log('❌ 系统变量API失败:', error.message)
    }
    
    // 测试2: 获取用户变量
    console.log('📡 测试2: 获取用户变量...')
    try {
      const userVars = await listVariables({ scope: 'user' })
      console.log('✅ 用户变量API正常:', userVars)
    } catch (error) {
      console.log('❌ 用户变量API失败:', error.message)
    }
    
    // 测试3: 获取变量类型
    console.log('📡 测试3: 获取变量类型...')
    try {
      const types = await getVariableTypes()
      console.log('✅ 变量类型API正常:', types)
    } catch (error) {
      console.log('❌ 变量类型API失败:', error.message)
    }
    
    console.log('🎉 变量API快速测试完成！')
    return true
    
  } catch (error) {
    console.error('❌ 变量API导入或测试失败:', error)
    return false
  }
}

// 如果在浏览器环境中，添加到window对象
if (typeof window !== 'undefined') {
  window.quickTestVariableAPI = quickTestVariableAPI
  console.log('🔧 快速测试工具已加载，使用: quickTestVariableAPI()')
} 