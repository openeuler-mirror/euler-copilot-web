/**
 * 验证修复后的变量API路径是否正确
 */

// 创建测试函数
const testCorrectVariableAPI = async () => {
  console.log('🧪 开始测试修复后的变量API路径...')
  
  const results = {
    success: [],
    failed: [],
    apis: [
      { name: '获取变量类型', url: '/api/variable/types', method: 'GET' },
      { name: '列出系统变量', url: '/api/variable/list?scope=system', method: 'GET' },
      { name: '列出用户变量', url: '/api/variable/list?scope=user', method: 'GET' },
      { name: '列出环境变量', url: '/api/variable/list?scope=env', method: 'GET' },
      { name: '列出对话变量', url: '/api/variable/list?scope=conversation&conversation_id=test', method: 'GET' }
    ]
  }
  
  console.log('📋 测试的API端点:')
  results.apis.forEach(api => {
    console.log(`  - ${api.method} ${api.url}`)
  })
  
  for (const api of results.apis) {
    try {
      console.log(`\n🔍 测试: ${api.name}`)
      console.log(`📡 ${api.method} ${api.url}`)
      
      const response = await fetch(api.url, {
        method: api.method,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const status = response.status
      const statusText = response.statusText
      
      console.log(`📊 响应状态: ${status} ${statusText}`)
      
      if (status === 200) {
        const data = await response.json()
        console.log(`✅ ${api.name} - 成功`)
        console.log(`📦 响应数据:`, data)
        results.success.push({ ...api, status, data })
      } else if (status === 404) {
        console.log(`❌ ${api.name} - 404 Not Found (路径错误)`)
        results.failed.push({ ...api, status, error: '路径不存在' })
      } else if (status === 401) {
        console.log(`🔑 ${api.name} - 401 Unauthorized (需要认证，但路径正确)`)
        results.success.push({ ...api, status, note: '路径正确，需要认证' })
      } else {
        console.log(`⚠️  ${api.name} - ${status} ${statusText}`)
        const text = await response.text()
        results.failed.push({ ...api, status, error: text })
      }
      
    } catch (error) {
      console.log(`❌ ${api.name} - 网络错误:`, error.message)
      results.failed.push({ ...api, error: error.message })
    }
  }
  
  console.log('\n📈 测试结果汇总:')
  console.log(`✅ 成功: ${results.success.length}/${results.apis.length}`)
  console.log(`❌ 失败: ${results.failed.length}/${results.apis.length}`)
  
  if (results.success.length > 0) {
    console.log('\n✅ 成功的API:')
    results.success.forEach(api => {
      console.log(`  - ${api.name}: ${api.status} ${api.note || ''}`)
    })
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ 失败的API:')
    results.failed.forEach(api => {
      console.log(`  - ${api.name}: ${api.status || 'Network Error'} - ${api.error}`)
    })
  }
  
  // 提供修复建议
  if (results.failed.some(api => api.status === 404)) {
    console.log('\n🔧 发现404错误，可能的原因：')
    console.log('  1. 后端服务未启动')
    console.log('  2. 后端variable router未正确注册')
    console.log('  3. API路径与后端不匹配')
    console.log('  4. 代理配置问题')
  }
  
  if (results.failed.some(api => api.status === 401)) {
    console.log('\n🔑 发现认证问题，这通常是正常的（路径正确但需要登录）')
  }
  
  return results
}

// 快速API路径验证
const quickAPIPathCheck = () => {
  console.log('🚀 快速检查变量API路径是否修复...')
  
  const correctPaths = [
    'POST /api/variable/create',
    'PUT  /api/variable/update', 
    'DELETE /api/variable/delete',
    'GET  /api/variable/get',
    'GET  /api/variable/list',
    'POST /api/variable/parse',
    'POST /api/variable/validate',
    'GET  /api/variable/types',
    'POST /api/variable/clear-conversation'
  ]
  
  console.log('✅ 后端支持的正确API路径：')
  correctPaths.forEach(path => console.log(`  ${path}`))
  
  console.log('\n❌ 错误的路径（不要使用）：')
  console.log('  /api/variables (复数形式)')
  console.log('  /api/variable (基础路径用于GET)')
  
  // 尝试测试一个简单的API
  fetch('/api/variable/types')
    .then(response => {
      if (response.status === 200) {
        console.log('🎉 API路径验证成功！')
        return response.json()
      } else if (response.status === 401) {
        console.log('🔑 API路径正确，需要用户认证')
      } else if (response.status === 404) {
        console.log('❌ API路径仍然错误，返回404')
      } else {
        console.log(`⚠️ API返回状态: ${response.status}`)
      }
    })
    .then(data => {
      if (data) {
        console.log('📦 API响应数据:', data)
      }
    })
    .catch(error => {
      console.log('❌ 网络错误:', error.message)
    })
}

// 导出测试函数
export { testCorrectVariableAPI, quickAPIPathCheck }

// 如果在控制台中直接运行
if (typeof window !== 'undefined') {
  window.testCorrectVariableAPI = testCorrectVariableAPI
  window.quickAPIPathCheck = quickAPIPathCheck
  
  console.log('🛠️ 变量API路径测试工具已加载！')
  console.log('使用方法：')
  console.log('  testCorrectVariableAPI()  - 完整测试')
  console.log('  quickAPIPathCheck()       - 快速检查')
} 