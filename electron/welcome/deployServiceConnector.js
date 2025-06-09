/**
 * 本地部署服务连接器
 * 由于不能修改 localDeploy.vue，这个文件作为桥梁连接前端表单和部署服务
 * 注意：此文件已被 localDeploy.vue 中的直接调用取代，保留用于兼容性
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function () {
  console.log('部署服务连接器已加载（兼容性版本）');

  // 检查是否在 Electron 环境中
  if (
    typeof window.eulercopilotWelcome === 'undefined' ||
    typeof window.eulercopilotWelcome.deployment === 'undefined'
  ) {
    console.warn('部署服务不可用，请在 Electron 环境中运行');
    return;
  }

  console.log('部署服务 API 可用');
});

// 保留一些实用函数用于调试
window.deploymentUtils = {
  getFormData: function () {
    console.log('获取表单数据的实用函数（调试用）');
    return null;
  },

  getDeploymentStatus: async function () {
    if (window.eulercopilotWelcome && window.eulercopilotWelcome.deployment) {
      try {
        return await window.eulercopilotWelcome.deployment.getStatus();
      } catch (error) {
        console.error('获取部署状态失败:', error);
        return null;
      }
    }
    return null;
  },
};
