/**
 * 测试scope参数修复结果
 */

// 测试所有scope值是否与后端对齐
const testScopeParameterFix = async () => {
  console.log('🧪 开始测试scope参数修复...')
  
  // 后端支持的正确scope值
  const validScopes = ['system', 'user', 'env', 'conversation']
  const invalidScopes = ['environment', 'environ', 'Environment']  // 容易错误的值
  
  const results = {
    validScopes: [],
    invalidScopes: [],
    summary: { success: 0, failed: 0 }
  }
  
  console.log('✅ 后端支持的正确scope值:', validScopes)
  console.log('❌ 应该避免的错误scope值:', invalidScopes)
  
  // 测试正确的scope值
  console.log('\n🔍 测试正确的scope值...')
  for (const scope of validScopes) {
    try {
      console.log(`📡 测试 scope="${scope}"...`)
      
      const response = await fetch(`/api/variable/list?scope=${scope}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ scope="${scope}" - 成功 (${data.result?.variables?.length || 0} 个变量)`)
        results.validScopes.push({ scope, success: true, status: response.status, data })
        results.summary.success++
      } else if (response.status === 401) {
        console.log(`🔑 scope="${scope}" - 需要认证 (正常)`)
        results.validScopes.push({ scope, success: true, status: response.status, note: '需要认证' })
        results.summary.success++
      } else {
        const errorText = await response.text()
        console.log(`❌ scope="${scope}" - 失败: ${response.status} ${errorText}`)
        results.validScopes.push({ scope, success: false, status: response.status, error: errorText })
        results.summary.failed++
      }
    } catch (error) {
      console.log(`❌ scope="${scope}" - 网络错误: ${error.message}`)
      results.validScopes.push({ scope, success: false, error: error.message })
      results.summary.failed++
    }
  }
  
  // 测试错误的scope值（应该返回400错误）
  console.log('\n🔍 测试错误的scope值（应该返回400错误）...')
  for (const scope of invalidScopes) {
    try {
      console.log(`📡 测试 scope="${scope}"...`)
      
      const response = await fetch(`/api/variable/list?scope=${scope}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.status === 422 || response.status === 400) {
        const errorData = await response.json()
        console.log(`✅ scope="${scope}" - 正确返回验证错误`)
        
        // 检查是否是预期的枚举错误
        if (errorData.detail && errorData.detail[0]?.type === 'enum') {
          console.log(`🎯 确认是enum验证错误，符合预期`)
          results.invalidScopes.push({ scope, success: true, status: response.status, note: '正确拒绝' })
        } else {
          console.log(`⚠️ 是其他类型的400错误，不是enum错误`)
          results.invalidScopes.push({ scope, success: false, status: response.status, error: errorData })
        }
      } else if (response.ok) {
        console.log(`❌ scope="${scope}" - 意外成功！应该返回400错误`)
        results.invalidScopes.push({ scope, success: false, status: response.status, error: '应该失败但成功了' })
      } else {
        const errorText = await response.text()
        console.log(`⚠️ scope="${scope}" - 其他错误: ${response.status} ${errorText}`)
        results.invalidScopes.push({ scope, success: false, status: response.status, error: errorText })
      }
    } catch (error) {
      console.log(`❌ scope="${scope}" - 网络错误: ${error.message}`)
      results.invalidScopes.push({ scope, success: false, error: error.message })
    }
  }
  
  // 汇总结果
  console.log('\n📈 测试结果汇总:')
  console.log(`✅ 有效scope测试成功: ${results.summary.success}/${validScopes.length}`)
  console.log(`❌ 有效scope测试失败: ${results.summary.failed}/${validScopes.length}`)
  
  const invalidScopeSuccesses = results.invalidScopes.filter(r => r.success).length
  console.log(`✅ 无效scope正确拒绝: ${invalidScopeSuccesses}/${invalidScopes.length}`)
  
  // 判断修复是否成功
  const allValidScopesWork = results.summary.failed === 0
  const allInvalidScopesRejected = invalidScopeSuccesses === invalidScopes.length
  
  if (allValidScopesWork && allInvalidScopesRejected) {
    console.log('\n🎉 ✅ scope参数修复完全成功！')
    console.log('   - 所有有效scope值都能正常工作')
    console.log('   - 所有无效scope值都被正确拒绝')
  } else if (allValidScopesWork) {
    console.log('\n⚠️ 🔧 scope参数基本修复成功，但有些细节需要注意')
    console.log('   - 有效scope值工作正常')
    console.log('   - 无效scope值处理可能有问题')
  } else {
    console.log('\n❌ 🔧 scope参数修复可能未完全生效')
    console.log('   - 有些有效scope值仍然无法工作')
  }
  
  return results
}

// 测试前端代码是否还有遗留的错误scope值
const testFrontendScopeUsage = async () => {
  console.log('🧪 测试前端代码是否已修复所有scope使用...')
  
  try {
    // 动态导入前端API模块进行测试
    const { listVariables } = await import('@/api/variable')
    
    console.log('📡 测试前端API调用 - scope="env"...')
    const envResponse = await listVariables({ scope: 'env' })
    
    if (envResponse?.result) {
      console.log('✅ 前端环境变量API调用成功')
      console.log(`📊 获取到 ${envResponse.result.variables?.length || 0} 个环境变量`)
      return { success: true, data: envResponse.result }
    } else {
      console.log('⚠️ 前端API返回格式异常')
      return { success: false, error: '返回格式异常' }
    }
  } catch (error) {
    console.log(`❌ 前端API调用失败: ${error.message}`)
    
    // 检查是否还是scope相关的错误
    if (error.message?.includes('enum') || error.message?.includes('environment')) {
      console.log('🔧 仍然存在scope相关错误，可能还有地方没有修复')
    }
    
    return { success: false, error: error.message }
  }
}

// 快速验证修复
const quickScopeValidation = () => {
  console.log('🚀 快速验证scope参数修复...')
  
  const expectedScopes = ['system', 'user', 'env', 'conversation']
  console.log('✅ 后端期望的scope值:', expectedScopes)
  
  // 检查常见的错误
  const commonMistakes = [
    { wrong: 'environment', correct: 'env' },
    { wrong: 'environ', correct: 'env' },
    { wrong: 'Environment', correct: 'env' },
    { wrong: 'ENV', correct: 'env' }
  ]
  
  console.log('❌ 常见的错误用法:')
  commonMistakes.forEach(mistake => {
    console.log(`  "${mistake.wrong}" → "${mistake.correct}"`)
  })
  
  // 测试一个简单的API调用
  console.log('\n📡 测试 scope="env" API调用...')
  fetch('/api/variable/list?scope=env')
    .then(response => {
      if (response.ok) {
        console.log('🎉 scope="env" 测试成功！修复已生效')
        return response.json()
      } else if (response.status === 401) {
        console.log('🔑 scope="env" 需要认证，但参数格式正确')
      } else if (response.status === 422) {
        console.log('❌ scope="env" 仍然报验证错误，修复可能未生效')
      } else {
        console.log(`⚠️ scope="env" 返回 ${response.status}，可能有其他问题`)
      }
    })
    .then(data => {
      if (data) {
        console.log('📦 返回数据:', data)
      }
    })
    .catch(error => {
      console.log('❌ 网络错误:', error.message)
    })
}

// 导出测试函数
export { 
  testScopeParameterFix, 
  testFrontendScopeUsage, 
  quickScopeValidation 
}

// 如果在控制台中直接运行
if (typeof window !== 'undefined') {
  window.testScopeParameterFix = testScopeParameterFix
  window.testFrontendScopeUsage = testFrontendScopeUsage
  window.quickScopeValidation = quickScopeValidation
  
  console.log('🛠️ scope参数修复测试工具已加载！')
  console.log('使用方法：')
  console.log('  testScopeParameterFix()   - 完整的scope参数测试')
  console.log('  testFrontendScopeUsage()  - 前端代码修复验证')
  console.log('  quickScopeValidation()    - 快速验证修复')
} 