# 变量选择组件修复验证指南

## 问题描述
代码执行Drawer中的变量选择组件没有触发`/api/variable`相关接口的查询

## 修复内容
1. **修复了flowId传递问题**: 将`CodeNodeDrawer`组件的`flowId` prop从`choiceFlowId`（函数）改为`flowObj?.flowId`（实际的flowId值）
2. **添加了详细的调试日志**: 在`VariableSelector`组件中添加了调试信息
3. **创建了调试工具**: 提供了浏览器控制台调试函数

## 验证步骤

### 第一步：检查基本功能
1. 打开代码执行Drawer页面
2. 点击"添加变量"按钮
3. 在"选择变量"下拉框中点击
4. 检查浏览器控制台是否有以下日志：
   ```
   🚀 VariableSelector 组件已挂载，开始加载变量...
   🔄 VariableSelector: 开始加载变量...
   📡 正在调用API - 作用域: system, 参数: {...}
   ```

### 第二步：检查网络请求
1. 按F12打开开发者工具
2. 切换到"Network"标签页
3. 刷新页面或重新打开变量选择器
4. 查看是否有以下API请求：
   - `GET /api/variable/list?scope=system`
   - `GET /api/variable/list?scope=env&flow_id=xxx`
   - `GET /api/variable/list?scope=conversation&flow_id=xxx`

### 第三步：使用调试工具
在控制台运行以下命令进行详细诊断：
```javascript
// 完整诊断
debugVariableSelector()

// 手动测试变量加载
manualLoadVariables()
```

## 预期结果

### ✅ 修复成功的标志：
1. 控制台显示变量加载日志
2. Network面板显示变量API请求
3. 变量下拉框显示可用变量列表
4. 能够正常选择和使用变量

### ❌ 如果仍有问题：
1. 检查flowId是否正确传递（应该不是undefined）
2. 检查后端API是否正常工作
3. 检查是否有JavaScript错误

## 常见问题解决

### 问题1：控制台显示"flowId: undefined"
**解决方案**: 确保父组件正确传递了flowId参数

### 问题2：API返回404错误
**解决方案**: 检查后端服务是否启动，API路径是否正确

### 问题3：变量列表为空
**解决方案**: 检查数据库中是否有相应的变量数据

## 测试用例

### 测试用例1：系统变量加载
- **操作**: 打开变量选择器
- **预期**: 能看到系统内置变量（如system.query, system.files等）

### 测试用例2：对话变量加载
- **前提**: 当前工作流有对话变量
- **操作**: 打开变量选择器
- **预期**: 能看到对话变量列表

### 测试用例3：变量选择
- **操作**: 点击某个变量进行选择
- **预期**: 输入框显示变量引用格式（如{{system.query}}）

## 调试命令参考

```javascript
// 检查flowId
console.log('当前flowId:', window.flowId || '未设置')

// 手动触发API调用
fetch('/api/variable/list?scope=system')
  .then(r => r.json())
  .then(data => console.log('API响应:', data))

// 检查组件状态
document.querySelectorAll('[class*="variable-selector"]').length
```

如果按照以上步骤验证后问题仍然存在，请提供详细的错误日志和网络请求信息。 