/**
 * 变量选择组件调试脚本
 * 在浏览器控制台中运行，用于诊断为什么变量选择组件没有触发API调用
 */

// 全局调试函数
window.debugVariableSelector = async function() {
  console.log('🔧 开始调试变量选择组件...')
  
  try {
    // 1. 检查API函数是否存在
    console.log('📦 检查API函数...')
    const { listVariables } = await import('@/api/variable')
    console.log('✅ listVariables API函数可用')
    
    // 2. 手动测试API调用
    console.log('📡 手动测试API调用...')
    
    // 测试系统变量
    try {
      const systemResponse = await listVariables({ scope: 'system' })
      console.log('✅ 系统变量API调用成功:', systemResponse)
    } catch (error) {
      console.error('❌ 系统变量API调用失败:', error)
    }
    
    // 测试对话变量（需要flowId）
    const flowId = getCurrentFlowId()
    if (flowId) {
      try {
        const conversationResponse = await listVariables({ 
          scope: 'conversation', 
          flow_id: flowId 
        })
        console.log('✅ 对话变量API调用成功:', conversationResponse)
      } catch (error) {
        console.error('❌ 对话变量API调用失败:', error)
      }
    } else {
      console.warn('⚠️ 未找到flowId，无法测试对话变量')
    }
    
    // 3. 检查组件状态
    console.log('🔍 检查组件状态...')
    checkVariableSelectorComponents()
    
    console.log('🎉 调试完成！请查看上述输出了解问题所在。')
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error)
  }
}

// 获取当前flowId的辅助函数
function getCurrentFlowId() {
  // 尝试从多个可能的位置获取flowId
  
  // 方法1: 从URL参数获取
  const urlParams = new URLSearchParams(window.location.search)
  const flowIdFromUrl = urlParams.get('flowId')
  if (flowIdFromUrl) {
    console.log('📋 从URL获取flowId:', flowIdFromUrl)
    return flowIdFromUrl
  }
  
  // 方法2: 从Vue组件实例获取
  const vueApp = document.querySelector('#app').__vue__
  if (vueApp && vueApp.$route && vueApp.$route.query && vueApp.$route.query.flowId) {
    const flowIdFromRoute = vueApp.$route.query.flowId
    console.log('📋 从路由获取flowId:', flowIdFromRoute)
    return flowIdFromRoute
  }
  
  // 方法3: 从localStorage获取
  const flowIdFromStorage = localStorage.getItem('currentFlowId')
  if (flowIdFromStorage) {
    console.log('📋 从localStorage获取flowId:', flowIdFromStorage)
    return flowIdFromStorage
  }
  
  console.warn('⚠️ 未找到flowId')
  return null
}

// 检查页面上的VariableSelector组件
function checkVariableSelectorComponents() {
  // 检查是否有VariableSelector组件在页面上
  const variableSelectors = document.querySelectorAll('[class*="variable-selector"]')
  console.log(`🔍 找到 ${variableSelectors.length} 个变量选择器组件`)
  
  if (variableSelectors.length === 0) {
    console.warn('⚠️ 页面上没有找到变量选择器组件，可能组件未渲染')
    return
  }
  
  variableSelectors.forEach((selector, index) => {
    console.log(`📋 组件 ${index + 1}:`, selector)
    
    // 尝试查找相关的Vue组件实例
    if (selector.__vue__) {
      const vueInstance = selector.__vue__
      console.log(`  - Vue实例:`, vueInstance)
      console.log(`  - Props:`, vueInstance.$props)
    }
  })
}

// 提供手动触发变量加载的函数
window.manualLoadVariables = async function(flowId = null) {
  console.log('🔄 手动触发变量加载...')
  
  const actualFlowId = flowId || getCurrentFlowId()
  
  try {
    const { listVariables } = await import('@/api/variable')
    
    const scopes = ['system', 'env', 'conversation']
    const results = []
    
    for (const scope of scopes) {
      try {
        const params = { scope }
        if (actualFlowId && scope === 'conversation') {
          params.flow_id = actualFlowId
        }
        
        console.log(`📡 加载 ${scope} 变量，参数:`, params)
        const response = await listVariables(params)
        console.log(`✅ ${scope} 变量加载成功:`, response)
        results.push({ scope, response })
      } catch (error) {
        console.error(`❌ ${scope} 变量加载失败:`, error)
        results.push({ scope, error })
      }
    }
    
    console.log('📊 变量加载结果汇总:', results)
    return results
    
  } catch (error) {
    console.error('❌ 手动变量加载失败:', error)
  }
}

// 使用说明
console.log(`
🔧 变量选择组件调试工具已加载！

使用方法：
1. 运行完整诊断: debugVariableSelector()
2. 手动加载变量: manualLoadVariables()
3. 指定flowId加载: manualLoadVariables('your-flow-id')

在代码执行Drawer页面中运行这些命令来诊断问题。
`)

export { } 