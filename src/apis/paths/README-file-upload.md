# 文件上传API使用指南

## 概述

该项目提供了两种方式来处理文件类型变量的上传：

1. **查询参数方式**（推荐）- 符合当前后端接口设计
2. **Form字段方式**（备用方案）- 适用于后端修改为使用Form()注解的情况

## API接口说明

### 1. 查询参数方式（当前使用）

```typescript
export const uploadFilesForVariable = (
  formData: FormData,
  sessionId: string,
  varName: string,
  varType: string,
  scope: string = 'conversation'
)
```

**特点：**
- `scope`、`var_name`、`var_type` 作为URL查询参数传递
- 文件通过FormData传递
- 符合当前后端接口设计：`scope: str = "system"`

**请求示例：**
```
POST /api/document/{conversation_id}?scope=conversation&var_name=myFile&var_type=file
Content-Type: multipart/form-data

[FormData with files]
```

### 2. Form字段方式（备用方案）

```typescript
export const uploadFilesForVariableWithFormFields = (
  files: File | File[],
  sessionId: string,
  varName: string,
  varType: string,
  scope: string = 'conversation'
)
```

**特点：**
- 所有参数都作为FormData字段传递
- 适用于后端使用`Form()`注解的情况

**请求示例：**
```
POST /api/document/{conversation_id}
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="documents"; filename="file.pdf"
Content-Type: application/pdf

[文件内容]
------WebKitFormBoundary
Content-Disposition: form-data; name="scope"

conversation
------WebKitFormBoundary
Content-Disposition: form-data; name="var_name"

myFile
------WebKitFormBoundary
Content-Disposition: form-data; name="var_type"

file
------WebKitFormBoundary--
```

## 使用配置

在组件中通过 `USE_FORM_FIELDS` 常量来控制使用哪种方式：

```typescript
// 配置：选择使用查询参数还是Form字段方式
const USE_FORM_FIELDS = false // true: 使用Form字段, false: 使用查询参数（推荐）
```

## 后端兼容性

### 当前后端设计

```python
async def document_upload(
    conversation_id: str,
    documents: Annotated[list[UploadFile], File(...)],
    scope: str = "system",          # 默认参数 = 查询参数
    var_name: Optional[str] = None, # 默认参数 = 查询参数  
    var_type: Optional[str] = None, # 默认参数 = 查询参数
)
```

### 如果后端改为Form字段

```python
async def document_upload(
    conversation_id: str,
    documents: Annotated[list[UploadFile], File(...)],
    scope: Annotated[str, Form()] = "system",          # Form字段
    var_name: Annotated[Optional[str], Form()] = None, # Form字段
    var_type: Annotated[Optional[str], Form()] = None, # Form字段
)
```

## FastAPI Form处理最佳实践

### 1. 混合文件和表单数据

当需要同时处理文件和表单数据时：

```python
from fastapi import FastAPI, Form, File, UploadFile

@app.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    scope: str = Form(...),      # 必须使用Form()
    var_name: str = Form(...),   # 必须使用Form()
    var_type: str = Form(...)    # 必须使用Form()
):
    return {"filename": file.filename, "scope": scope}
```

### 2. 前端FormData构造

```javascript
const formData = new FormData();

// 添加文件
formData.append('documents', file);

// 添加表单字段
formData.append('scope', 'conversation');
formData.append('var_name', 'myFile');
formData.append('var_type', 'file');

// 发送请求
fetch('/api/document/123', {
  method: 'POST',
  body: formData,
  // 不要手动设置Content-Type，让浏览器自动设置
});
```

### 3. 注意事项

1. **Content-Type**: 不要手动设置`Content-Type: multipart/form-data`，让浏览器自动设置边界
2. **参数类型**: Form字段只能是简单类型（string, number, boolean）
3. **文件数组**: 多个文件使用相同的字段名`documents`
4. **后端兼容**: 确保前端发送方式与后端接收方式匹配

## 切换指南

如果需要从查询参数方式切换到Form字段方式：

1. 修改后端接口，添加`Form()`注解
2. 修改前端配置：`USE_FORM_FIELDS = true`
3. 测试文件上传功能

## 调试建议

1. 使用浏览器开发者工具查看Network请求
2. 检查Content-Type和请求体格式
3. 对比后端接口期望的参数格式
4. 查看后端日志确认参数接收情况 