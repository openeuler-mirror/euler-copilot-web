/**
 * 本地部署服务连接器
 * 由于不能修改 localDeploy.vue，这个文件作为桥梁连接前端表单和部署服务
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function () {
  // 检查是否在 Electron 环境中
  if (
    typeof window.eulercopilotWelcome === 'undefined' ||
    typeof window.eulercopilotWelcome.deployment === 'undefined'
  ) {
    console.warn('部署服务不可用，请在 Electron 环境中运行');
    return;
  }

  // 监听部署状态变化
  window.eulercopilotWelcome.deployment.onStatusChange((status) => {
    console.log('部署状态更新:', status);

    // 可以在这里添加状态显示逻辑
    updateDeploymentStatus(status);
  });

  // 拦截并增强原有的 handleConfirm 方法
  enhanceHandleConfirm();
});

/**
 * 更新部署状态显示
 */
function updateDeploymentStatus(status) {
  // 创建或更新状态显示元素
  let statusElement = document.getElementById('deployment-status');
  if (!statusElement) {
    statusElement = document.createElement('div');
    statusElement.id = 'deployment-status';
    statusElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 9999;
      max-width: 300px;
    `;
    document.body.appendChild(statusElement);
  }

  // 根据状态更新显示内容
  const statusText = getStatusText(status);
  const progressBar =
    status.progress > 0
      ? `
    <div style="width: 100%; background: #f0f0f0; border-radius: 2px; margin-top: 8px;">
      <div style="width: ${status.progress}%; background: #1890ff; height: 6px; border-radius: 2px; transition: width 0.3s;"></div>
    </div>
  `
      : '';

  statusElement.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">部署状态</div>
    <div style="color: ${getStatusColor(status.status)};">${statusText}</div>
    <div style="font-size: 12px; color: #666; margin-top: 4px;">${status.message}</div>
    ${progressBar}
    <button onclick="closeDeploymentStatus()" style="
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 14px;
      cursor: pointer;
      color: #999;
    ">×</button>
  `;

  // 如果部署完成或出错，5秒后自动隐藏
  if (status.status === 'success' || status.status === 'error') {
    setTimeout(() => {
      if (statusElement && statusElement.parentNode) {
        statusElement.parentNode.removeChild(statusElement);
      }
    }, 5000);
  }
}

/**
 * 获取状态文本
 */
function getStatusText(status) {
  const statusMap = {
    idle: '待机',
    preparing: '准备中',
    cloning: '克隆仓库',
    configuring: '配置中',
    deploying: '部署中',
    success: '部署成功',
    error: '部署失败',
  };
  return statusMap[status.status] || status.status;
}

/**
 * 获取状态颜色
 */
function getStatusColor(status) {
  const colorMap = {
    idle: '#666',
    preparing: '#1890ff',
    cloning: '#1890ff',
    configuring: '#1890ff',
    deploying: '#1890ff',
    success: '#52c41a',
    error: '#ff4d4f',
  };
  return colorMap[status] || '#666';
}

/**
 * 关闭状态显示
 */
function closeDeploymentStatus() {
  const statusElement = document.getElementById('deployment-status');
  if (statusElement && statusElement.parentNode) {
    statusElement.parentNode.removeChild(statusElement);
  }
}

/**
 * 增强原有的 handleConfirm 方法
 */
function enhanceHandleConfirm() {
  // 这里需要等待 Vue 应用挂载完成
  setTimeout(() => {
    // 查找确定按钮并添加点击事件监听
    const confirmButton = document.querySelector(
      '.submit-btn .el-button[type="primary"]',
    );
    if (confirmButton) {
      confirmButton.addEventListener('click', async function (event) {
        // 阻止原有事件
        event.stopImmediatePropagation();

        // 获取表单数据
        const formData = getFormData();
        if (!formData) {
          console.error('无法获取表单数据');
          return;
        }

        try {
          // 验证表单
          if (!validateFormData(formData)) {
            return;
          }

          // 开始部署
          await window.eulercopilotWelcome.deployment.startDeploymentFromForm(
            formData,
          );

          console.log('部署已启动');
        } catch (error) {
          console.error('部署启动失败:', error);
          alert('部署启动失败: ' + error.message);
        }
      });
    }
  }, 1000);
}

/**
 * 获取表单数据
 */
function getFormData() {
  try {
    // 需要更精确的选择器，基于表单结构
    const mainModelUrl = document.querySelector(
      '.model-ruleForm:first-child input[placeholder="请输入"]',
    )?.value;
    const mainModelName = document.querySelector(
      '.model-ruleForm:first-child .el-form-item:nth-child(3) input',
    )?.value;
    const mainModelApiKey = document.querySelector(
      '.model-ruleForm:first-child .el-form-item:nth-child(4) input',
    )?.value;

    const embeddingUrl = document.querySelector(
      '.model-ruleForm:last-child input[placeholder="请输入"]',
    )?.value;
    const embeddingModelName = document.querySelector(
      '.model-ruleForm:last-child .el-form-item:nth-child(3) input',
    )?.value;
    const embeddingApiKey = document.querySelector(
      '.model-ruleForm:last-child .el-form-item:nth-child(4) input',
    )?.value;

    return {
      url: mainModelUrl,
      modelName: mainModelName,
      apiKey: mainModelApiKey,
      embeddingForm: {
        url: embeddingUrl,
        modelName: embeddingModelName,
        apiKey: embeddingApiKey,
      },
    };
  } catch (error) {
    console.error('获取表单数据失败:', error);
    return null;
  }
}

/**
 * 验证表单数据
 */
function validateFormData(formData) {
  if (!formData.url) {
    alert('请输入大模型 URL');
    return false;
  }
  if (!formData.modelName) {
    alert('请输入大模型名称');
    return false;
  }
  if (!formData.apiKey) {
    alert('请输入大模型 API Key');
    return false;
  }
  if (!formData.embeddingForm.url) {
    alert('请输入 Embedding 模型 URL');
    return false;
  }
  if (!formData.embeddingForm.modelName) {
    alert('请输入 Embedding 模型名称');
    return false;
  }
  if (!formData.embeddingForm.apiKey) {
    alert('请输入 Embedding 模型 API Key');
    return false;
  }
  return true;
}

// 暴露到全局以便调用
window.closeDeploymentStatus = closeDeploymentStatus;
