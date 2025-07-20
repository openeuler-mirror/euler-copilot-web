# 变量管理API接口文档

## 修复说明

### ✅ 正确的API端点路径

根据后端 `apps/routers/variable.py` 的定义，变量管理API的正确端点如下：

```javascript
// 变量管理
POST /api/variable/create     - 创建变量
PUT  /api/variable/update     - 更新变量值
DELETE /api/variable/delete   - 删除变量
GET  /api/variable/get        - 获取单个变量
GET  /api/variable/list       - 列出变量

// 模板解析
POST /api/variable/parse      - 解析模板中的变量引用
POST /api/variable/validate   - 验证模板中的变量引用

// 系统信息
GET  /api/variable/types      - 获取支持的变量类型
POST /api/variable/clear-conversation - 清空对话变量
```

### ❌ 之前的错误路径

```javascript
// 错误1: 使用复数路径
/api/variables

// 错误2: 使用基础路径而非具体端点
/api/variable (用于GET请求)
```

### ✅ 修复后的实现

```javascript
// src/api/variable.js

// 创建变量
export async function createVariable(data) {
  const [error, response] = await post(`${BASE_URL}/create`, data)
  return response
}

// 更新变量
export async function updateVariable(params, data) {
  const [error, response] = await put(`${BASE_URL}/update`, data, params)
  return response
}

// 删除变量
export async function deleteVariable(params) {
  const [error, response] = await del(`${BASE_URL}/delete`, {}, params)
  return response
}

// 获取单个变量
export async function getVariable(params) {
  const [error, response] = await get(`${BASE_URL}/get`, params)
  return response
}

// 列出变量
export async function listVariables(params = {}) {
  const [error, response] = await get(`${BASE_URL}/list`, params)
  return response
}
```

## API调用示例

### 列出系统变量
```javascript
import { listVariables } from '@/api/variable'

const response = await listVariables({ scope: 'system' })
// 实际请求: GET /api/variable/list?scope=system
```

### 创建对话变量
```javascript
import { createVariable } from '@/api/variable'

await createVariable({
  name: 'user_input',
  var_type: 'string',
  scope: 'conversation',
  value: 'Hello World',
  conversation_id: 'conv_123'
})
// 实际请求: POST /api/variable/create
```

### 更新变量
```javascript
import { updateVariable } from '@/api/variable'

await updateVariable(
  { 
    name: 'user_input', 
    scope: 'conversation',
    conversation_id: 'conv_123'
  },
  { 
    value: 'Updated value' 
  }
)
// 实际请求: PUT /api/variable/update?name=user_input&scope=conversation&conversation_id=conv_123
```

### 删除变量
```javascript
import { deleteVariable } from '@/api/variable'

await deleteVariable({
  name: 'user_input',
  scope: 'conversation', 
  conversation_id: 'conv_123'
})
// 实际请求: DELETE /api/variable/delete?name=user_input&scope=conversation&conversation_id=conv_123
```

## 验证方法

### 网络面板检查
现在您应该看到正确的API调用：
```bash
✅ GET  /api/variable/list?scope=system
✅ GET  /api/variable/list?scope=conversation&conversation_id=xxx
✅ POST /api/variable/create
✅ PUT  /api/variable/update?name=xxx&scope=xxx
✅ DELETE /api/variable/delete?name=xxx&scope=xxx
```

### 控制台测试
```javascript
// 测试列出变量API
import('@/api/variable').then(({ listVariables }) => {
  listVariables({ scope: 'system' }).then(console.log)
})

// 测试创建变量API  
import('@/api/variable').then(({ createVariable }) => {
  createVariable({
    name: 'test_var',
    var_type: 'string', 
    scope: 'conversation',
    value: 'test',
    conversation_id: 'test_conv'
  }).then(console.log)
})
```

## 错误排查

### 如果仍然看到404错误
1. 检查后端服务是否正常运行
2. 检查后端variable router是否已注册
3. 检查VariablePool是否已正确初始化

### 如果看到其他HTTP错误
- 401: 检查用户认证状态
- 403: 检查变量权限设置
- 400: 检查请求参数格式
- 500: 检查后端日志

变量API路径现在已完全修复！🎉 