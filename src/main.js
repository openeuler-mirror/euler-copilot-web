// 在开发环境中加载调试工具
if (process.env.NODE_ENV === 'development') {
  import('@/utils/debugVariableSelector.js').then(() => {
    console.log('🔧 变量选择器调试工具已加载')
  }).catch(err => {
    console.log('调试工具加载失败:', err)
  })
} 