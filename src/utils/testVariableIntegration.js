/**
 * 变量系统集成测试脚本
 * 在浏览器控制台中运行此脚本来验证变量功能
 */

// 测试函数集合
window.testVariableIntegration = {
  
  // 1. 测试变量API连接
  async testVariableAPI() {
    console.log('🧪 开始测试变量API...')
    
    const scopes = ['system', 'user', 'env']
    const results = {}
    
    for (const scope of scopes) {
      try {
        console.log(`📡 测试 ${scope} 变量API...`)
        const response = await fetch(`/api/variable/list?scope=${scope}`)
        const data = await response.json()
        
        if (response.ok) {
          results[scope] = {
            success: true,
            count: data?.result?.variables?.length || 0,
            data: data
          }
          console.log(`✅ ${scope} 变量API正常 - 返回 ${results[scope].count} 个变量`)
        } else {
          results[scope] = {
            success: false,
            error: data
          }
          console.log(`❌ ${scope} 变量API失败:`, data)
        }
      } catch (error) {
        results[scope] = {
          success: false,
          error: error.message
        }
        console.log(`❌ ${scope} 变量API异常:`, error.message)
      }
    }
    
    console.log('📊 变量API测试结果:', results)
    return results
  },
  
  // 2. 测试组件是否正确加载
  testComponentImports() {
    console.log('🧪 开始测试组件导入...')
    
    const components = [
      'VariableEnabledStartNodeDrawer',
      'StartNodeVariableManager', 
      'VariableSelector',
      'SafeStartNodeEditor'
    ]
    
    const results = {}
    
    components.forEach(componentName => {
      try {
        // 尝试从window或Vue中获取组件
        const component = window[componentName] || 
                          (window.Vue && window.Vue[componentName]) ||
                          (window.$vm && window.$vm.$options.components[componentName])
        
        if (component) {
          results[componentName] = { success: true, found: true }
          console.log(`✅ ${componentName} 组件已找到`)
        } else {
          results[componentName] = { success: false, found: false }
          console.log(`⚠️ ${componentName} 组件未在全局作用域中找到`)
        }
      } catch (error) {
        results[componentName] = { success: false, error: error.message }
        console.log(`❌ ${componentName} 组件检查失败:`, error.message)
      }
    })
    
    console.log('📊 组件导入测试结果:', results)
    return results
  },
  
  // 3. 测试workflow页面状态
  testWorkflowPageState() {
    console.log('🧪 开始测试workflow页面状态...')
    
    const checks = {
      currentPage: window.location.pathname,
      hasVueFlow: !!document.querySelector('.vue-flow'),
      hasWorkflowContainer: !!document.querySelector('.workFlowContainer'),
      hasStartNode: !!document.querySelector('.vue-flow__node'),
      hasDrawer: !!document.querySelector('.el-drawer'),
    }
    
    console.log('📊 页面状态检查:', checks)
    
    // 检查Vue实例
    if (window.$vm || window.Vue) {
      console.log('✅ Vue实例可用')
    } else {
      console.log('❌ Vue实例不可用')
    }
    
    return checks
  },
  
  // 4. 手动触发变量加载
  async manualLoadVariables() {
    console.log('🧪 手动触发变量加载...')
    
    try {
      // 尝试调用loadWorkflowVariables函数
      if (window.loadWorkflowVariables) {
        await window.loadWorkflowVariables()
        console.log('✅ 手动变量加载成功')
        return { success: true }
      } else {
        console.log('⚠️ loadWorkflowVariables函数不可用，尝试直接API调用')
        return await this.testVariableAPI()
      }
    } catch (error) {
      console.log('❌ 手动变量加载失败:', error)
      return { success: false, error: error.message }
    }
  },
  
  // 5. 检查网络请求
  monitorNetworkRequests() {
    console.log('🧪 开始监控网络请求...')
    
    const originalFetch = window.fetch
    const requests = []
    
    window.fetch = async (...args) => {
      const url = args[0]
      if (typeof url === 'string' && url.includes('/api/variable')) {
        console.log('📡 检测到变量API请求:', url)
        requests.push({
          url,
          timestamp: new Date().toISOString(),
          type: 'variables'
        })
      }
      return originalFetch.apply(window, args)
    }
    
    // 5秒后恢复原始fetch并报告结果
    setTimeout(() => {
      window.fetch = originalFetch
      console.log('📊 变量API请求监控结果:', requests)
      
      if (requests.length > 0) {
        console.log('✅ 检测到变量API调用')
      } else {
        console.log('❌ 未检测到变量API调用')
      }
    }, 5000)
    
    console.log('⏱️ 网络监控已启动，将在5秒后停止...')
    return requests
  },
  
  // 6. 完整测试套件
  async runFullTest() {
    console.log('🚀 开始完整变量系统测试...')
    console.log('=' .repeat(50))
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    }
    
    // 测试1: API连接
    console.log('\n📡 测试1: 变量API连接')
    results.tests.api = await this.testVariableAPI()
    
    // 测试2: 组件导入
    console.log('\n🧩 测试2: 组件导入')
    results.tests.components = this.testComponentImports()
    
    // 测试3: 页面状态
    console.log('\n📄 测试3: 页面状态')
    results.tests.pageState = this.testWorkflowPageState()
    
    // 测试4: 手动变量加载
    console.log('\n🔄 测试4: 手动变量加载')
    results.tests.manualLoad = await this.manualLoadVariables()
    
    console.log('\n📊 完整测试结果:')
    console.log('=' .repeat(50))
    console.table(results.tests)
    
    // 生成报告
    const hasAPISuccess = Object.values(results.tests.api).some(r => r.success)
    const hasComponentSuccess = Object.values(results.tests.components).some(r => r.success)
    
    if (hasAPISuccess && hasComponentSuccess) {
      console.log('🎉 变量系统基本功能正常！')
    } else if (hasAPISuccess) {
      console.log('⚠️ 变量API正常，但组件可能有问题')
    } else {
      console.log('❌ 变量系统存在问题，请检查后端API')
    }
    
    return results
  }
}

// 自动执行快速检查
console.log('🔧 变量系统测试工具已加载')
console.log('💡 使用方法:')
console.log('  • testVariableIntegration.runFullTest() - 运行完整测试')
console.log('  • testVariableIntegration.testVariableAPI() - 仅测试API')
console.log('  • testVariableIntegration.monitorNetworkRequests() - 监控网络请求')

// 导出到全局作用域
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.testVariableIntegration
} 