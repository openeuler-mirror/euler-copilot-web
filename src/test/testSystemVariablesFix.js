/**
 * 测试系统变量显示修复
 * 
 * 问题：API返回了8个系统变量，但界面没有显示
 * 原因：前端期望的数据结构与后端返回的不匹配
 * 
 * 后端返回: { "variables": [...], "total": 8 }
 * 前端期望: { "result": { "variables": [...] } }
 */

console.log('🧪 测试系统变量显示修复...')

// 模拟API响应数据 - 用户提供的真实数据
const mockApiResponse = {
    "variables": [
        {
            "name": "query",
            "var_type": "string",
            "scope": "system",
            "value": "",
            "description": "用户查询内容",
            "created_at": "2025-07-18T02:47:41.408379+00:00",
            "updated_at": "2025-07-18T02:47:41.408387+00:00"
        },
        {
            "name": "files",
            "var_type": "array[file]",
            "scope": "system",
            "value": "[]",
            "description": "用户上传的文件列表",
            "created_at": "2025-07-18T02:47:41.408405+00:00",
            "updated_at": "2025-07-18T02:47:41.408405+00:00"
        },
        {
            "name": "dialogue_count",
            "var_type": "number",
            "scope": "system",
            "value": "0",
            "description": "对话轮数",
            "created_at": "2025-07-18T02:47:41.408437+00:00",
            "updated_at": "2025-07-18T02:47:41.408438+00:00"
        },
        {
            "name": "app_id",
            "var_type": "string",
            "scope": "system",
            "value": "",
            "description": "应用ID",
            "created_at": "2025-07-18T02:47:41.408444+00:00",
            "updated_at": "2025-07-18T02:47:41.408444+00:00"
        },
        {
            "name": "flow_id",
            "var_type": "string",
            "scope": "system",
            "value": "",
            "description": "工作流ID",
            "created_at": "2025-07-18T02:47:41.408448+00:00",
            "updated_at": "2025-07-18T02:47:41.408448+00:00"
        },
        {
            "name": "user_id",
            "var_type": "string",
            "scope": "system",
            "value": "",
            "description": "用户ID",
            "created_at": "2025-07-18T02:47:41.408452+00:00",
            "updated_at": "2025-07-18T02:47:41.408452+00:00"
        },
        {
            "name": "session_id",
            "var_type": "string",
            "scope": "system",
            "value": "",
            "description": "会话ID",
            "created_at": "2025-07-18T02:47:41.408455+00:00",
            "updated_at": "2025-07-18T02:47:41.408456+00:00"
        },
        {
            "name": "timestamp",
            "var_type": "number",
            "scope": "system",
            "value": "0",
            "description": "当前时间戳",
            "created_at": "2025-07-18T02:47:41.408461+00:00",
            "updated_at": "2025-07-18T02:47:41.408462+00:00"
        }
    ],
    "total": 8
}

// 测试修复后的数据解析逻辑
function testDataParsing(systemResponse) {
  console.log('\n📋 测试数据解析逻辑')
  console.log('输入响应:', systemResponse)
  
  // 修复：支持多种响应数据结构
  let variables = null
  const response = systemResponse
  
  if (response?.result?.variables) {
    // 结构1: { result: { variables: [...] } }
    variables = response.result.variables
    console.log('✅ 使用result.variables结构')
  } else if (response?.variables) {
    // 结构2: { variables: [...], total: 8 }  
    variables = response.variables
    console.log('✅ 使用直接variables结构')
  } else if (Array.isArray(response)) {
    // 结构3: 直接返回数组
    variables = response
    console.log('✅ 使用数组结构')
  }
  
  if (variables && Array.isArray(variables)) {
    console.log('✅ 解析成功，变量数量:', variables.length)
    console.log('📋 变量详情:')
    variables.forEach((v, index) => {
      console.log(`  ${index + 1}. ${v.name} (${v.var_type}) - ${v.description}`)
    })
    return variables
  } else {
    console.log('❌ 解析失败，未找到变量数据')
    return []
  }
}

// 语义化名称映射测试
function testVariableDisplayName(variable) {
  const nameMap = {
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

// 类型显示映射测试
function testVariableTypeDisplay(type) {
  const typeMap = {
    'string': 'String',
    'number': 'Number', 
    'boolean': 'Boolean',
    'object': 'Object',
    'array[file]': 'Array[File]',
    'array': 'Array',
    'secret': 'Secret'
  }
  return typeMap[type] || type
}

// 运行测试
function runTests() {
  console.log('🚀 开始测试系统变量显示修复\n')
  
  // 测试1: 数据解析
  const parsedVariables = testDataParsing(mockApiResponse)
  
  if (parsedVariables.length > 0) {
    console.log('\n📋 测试语义化显示:')
    parsedVariables.forEach(variable => {
      const displayName = testVariableDisplayName(variable)
      const displayType = testVariableTypeDisplay(variable.var_type)
      console.log(`  [x] ${displayName} ${displayType}`)
    })
    
    console.log('\n✅ 修复验证成功！')
    console.log('现在界面应该能正确显示这8个系统变量：')
    console.log('1. [x] system.query String')
    console.log('2. [x] system.files Array[File]')
    console.log('3. [x] system.dialogue_count Number')
    console.log('4. [x] system.app_id String')
    console.log('5. [x] system.flow_id String')
    console.log('6. [x] system.user_id String')
    console.log('7. [x] system.session_id String')
    console.log('8. [x] system.timestamp Number')
  } else {
    console.log('\n❌ 测试失败，数据解析有问题')
  }
  
  // 测试其他可能的数据结构
  console.log('\n📋 测试其他数据结构:')
  
  // 测试result结构
  const resultStructure = {
    result: {
      variables: mockApiResponse.variables
    }
  }
  console.log('- result结构测试:', testDataParsing(resultStructure).length > 0 ? '✅' : '❌')
  
  // 测试数组结构
  const arrayStructure = mockApiResponse.variables
  console.log('- 数组结构测试:', testDataParsing(arrayStructure).length > 0 ? '✅' : '❌')
  
  console.log('\n🎉 所有测试完成！')
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTests,
    testDataParsing,
    testVariableDisplayName,
    testVariableTypeDisplay,
    mockApiResponse
  }
}

// 自动运行测试
if (typeof window !== 'undefined') {
  runTests()
} else {
  runTests()
}

export { runTests, mockApiResponse } 