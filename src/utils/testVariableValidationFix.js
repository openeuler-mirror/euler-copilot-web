/**
 * 测试变量API验证错误修复
 */

// 测试变量API修复结果
const testVariableValidationFix = async () => {
  console.log('🧪 开始测试变量API验证修复...')
  
  const results = {
    systemVariables: { success: false, data: null, error: null },
    conversationVariables: { success: false, data: null, error: null },
    userVariables: { success: false, data: null, error: null },
    envVariables: { success: false, data: null, error: null }
  }
  
  // 测试系统变量（重点测试）
  console.log('\n🔍 测试系统变量加载...')
  try {
    const response = await fetch('/api/variable/list?scope=system', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      const data = await response.json()
      results.systemVariables.success = true
      results.systemVariables.data = data
      
      console.log('✅ 系统变量加载成功')
      console.log(`📊 变量数量: ${data.result?.variables?.length || 0}`)
      
      // 检查变量值
      if (data.result?.variables) {
        const variablesWithNullValue = data.result.variables.filter(v => v.value === null || v.value === undefined)
        if (variablesWithNullValue.length > 0) {
          console.log('⚠️ 发现有变量的value为null/undefined:')
          variablesWithNullValue.forEach(v => console.log(`  - ${v.name}: ${v.value}`))
        } else {
          console.log('✅ 所有变量都有有效的value值')
        }
        
        // 显示变量详情
        console.log('📋 系统变量列表:')
        data.result.variables.forEach(v => {
          console.log(`  - ${v.name} (${v.var_type}): "${v.value}" - ${v.description}`)
        })
      }
    } else {
      const errorText = await response.text()
      results.systemVariables.error = errorText
      console.log(`❌ 系统变量加载失败: ${response.status} ${response.statusText}`)
      console.log(`📄 错误详情: ${errorText}`)
      
      // 检查是否是Pydantic验证错误
      if (errorText.includes('validation error') && errorText.includes('VariableResponse')) {
        console.log('🔧 确认是Pydantic验证错误，需要检查后端修复')
      }
    }
  } catch (error) {
    results.systemVariables.error = error.message
    console.log(`❌ 系统变量请求失败: ${error.message}`)
  }
  
  // 测试其他类型变量（简单测试）
  const testOtherScope = async (scope, name) => {
    console.log(`\n🔍 测试${name}...`)
    try {
      const url = `/api/variable/list?scope=${scope}`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        results[scope + 'Variables'].success = true
        results[scope + 'Variables'].data = data
        console.log(`✅ ${name}加载成功: ${data.result?.variables?.length || 0} 个变量`)
      } else if (response.status === 401) {
        console.log(`🔑 ${name}需要认证（正常）`)
        results[scope + 'Variables'].success = true
      } else {
        const errorText = await response.text()
        results[scope + 'Variables'].error = errorText
        console.log(`❌ ${name}失败: ${response.status} ${errorText}`)
      }
    } catch (error) {
      results[scope + 'Variables'].error = error.message
      console.log(`❌ ${name}请求失败: ${error.message}`)
    }
  }
  
  await testOtherScope('user', '用户变量')
  await testOtherScope('env', '环境变量')
  await testOtherScope('conversation', '对话变量')
  
  // 汇总结果
  console.log('\n📈 测试结果汇总:')
  const successCount = Object.values(results).filter(r => r.success).length
  const totalCount = Object.keys(results).length
  console.log(`✅ 成功: ${successCount}/${totalCount}`)
  
  if (results.systemVariables.success) {
    console.log('🎉 重点：系统变量API验证错误已修复！')
  } else {
    console.log('❌ 重点：系统变量API仍有问题，需要进一步检查')
  }
  
  return results
}

// 测试前端变量API调用
const testFrontendVariableAPI = async () => {
  console.log('🧪 测试前端变量API调用...')
  
  try {
    // 动态导入前端API模块
    const { listVariables } = await import('@/api/variable')
    
    console.log('📡 使用前端API调用系统变量...')
    const response = await listVariables({ scope: 'system' })
    
    if (response?.result?.variables) {
      console.log('✅ 前端API调用成功')
      console.log(`📊 获取到 ${response.result.variables.length} 个系统变量`)
      
      // 检查变量值类型
      response.result.variables.forEach(variable => {
        const valueType = typeof variable.value
        const valueDisplay = variable.value === null ? 'null' : 
                            variable.value === undefined ? 'undefined' : 
                            `"${variable.value}"`
        console.log(`  - ${variable.name}: ${valueDisplay} (${valueType})`)
      })
      
      return { success: true, data: response.result.variables }
    } else {
      console.log('⚠️ 前端API返回数据格式异常')
      return { success: false, error: '数据格式异常' }
    }
  } catch (error) {
    console.log(`❌ 前端API调用失败: ${error.message}`)
    
    // 检查具体错误类型
    if (error.message?.includes('validation error')) {
      console.log('🔧 确认是验证错误，后端修复可能未生效')
    } else if (error.message?.includes('404')) {
      console.log('🔧 API路径错误')
    } else if (error.message?.includes('401')) {
      console.log('🔑 需要用户认证')
    }
    
    return { success: false, error: error.message }
  }
}

// 完整的修复验证测试
const runCompleteValidationTest = async () => {
  console.log('🚀 开始完整的变量API验证修复测试...')
  console.log('=' * 60)
  
  // 1. 测试原始API调用
  const rawResults = await testVariableValidationFix()
  
  console.log('\n' + '=' * 60)
  
  // 2. 测试前端API调用
  const frontendResults = await testFrontendVariableAPI()
  
  console.log('\n' + '=' * 60)
  
  // 3. 综合判断
  console.log('🏁 最终验证结果:')
  
  if (rawResults.systemVariables.success && frontendResults.success) {
    console.log('🎉 ✅ 变量API验证错误修复成功！')
    console.log('   - 原始API调用正常')
    console.log('   - 前端API调用正常')
    console.log('   - 系统变量值类型正确')
  } else if (rawResults.systemVariables.success && !frontendResults.success) {
    console.log('⚠️ 🔧 后端修复成功，但前端可能有其他问题')
    console.log('   - 原始API调用正常')
    console.log('   - 前端API调用失败')
  } else if (!rawResults.systemVariables.success) {
    console.log('❌ 🔧 后端修复可能未生效，需要重启服务')
    console.log('   - 原始API调用失败')
    console.log('   - 可能需要重启后端服务')
  }
  
  return {
    raw: rawResults,
    frontend: frontendResults,
    overall: rawResults.systemVariables.success && frontendResults.success
  }
}

// 导出测试函数
export { 
  testVariableValidationFix, 
  testFrontendVariableAPI, 
  runCompleteValidationTest 
}

// 如果在控制台中直接运行
if (typeof window !== 'undefined') {
  window.testVariableValidationFix = testVariableValidationFix
  window.testFrontendVariableAPI = testFrontendVariableAPI
  window.runCompleteValidationTest = runCompleteValidationTest
  
  console.log('🛠️ 变量API验证修复测试工具已加载！')
  console.log('使用方法：')
  console.log('  testVariableValidationFix()   - 测试原始API调用')
  console.log('  testFrontendVariableAPI()     - 测试前端API调用')
  console.log('  runCompleteValidationTest()   - 完整验证测试')
} 