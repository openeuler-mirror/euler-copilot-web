<template>
  <div class="debug-variable-panel" :class="{ 'panel-collapsed': !visible }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <div class="variable-icon">⚙️</div>
        <span class="header-title">变量配置</span>
        <span class="variable-count" v-if="conversationVariables.length > 0">
          ({{ conversationVariables.length }})
        </span>
      </div>
      <div class="header-right">
        <el-button
          type="text"
          @click="$emit('toggleVisibility')"
          class="toggle-btn"
        >
          <el-icon>
            <IconCaretDown v-if="visible" />
            <IconCaretRight v-else />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 面板内容 -->
    <transition name="panel-slide">
      <div v-if="visible" class="panel-content">
                 <div class="variable-list" v-loading="variablesLoading || false">
          <!-- 对话变量展示 -->
          <div 
            v-for="variable in conversationVariables" 
            :key="`conv_${variable.name}`"
            class="variable-item"
          >
            <div class="variable-main">
              <div class="variable-name-section">
                <div class="variable-icon-small">{x}</div>
                <div class="variable-details">
                  <div class="variable-name">{{ variable.name }}</div>
                  <div class="variable-type">{{ getVariableTypeDisplay(variable.var_type) }}</div>
                </div>
              </div>
              <div class="variable-value-section">
                <!-- String 和 Number 类型：普通输入框 -->
                <el-input
                  v-if="variable.var_type === 'string' || variable.var_type === 'number'"
                  v-model="variable.displayValue"
                  :placeholder="getVariablePlaceholder(variable)"
                  :type="variable.var_type === 'number' ? 'number' : 'text'"
                  size="small"
                  @blur="updateVariableValue(variable)"
                  @keydown.enter="updateVariableValue(variable)"
                  class="variable-input"
                />
                
                <!-- Boolean 类型：开关 -->
                <el-switch
                  v-else-if="variable.var_type === 'boolean'"
                  v-model="variable.booleanValue"
                  active-text="true"
                  inactive-text="false"
                  size="small"
                  @change="updateBooleanVariable(variable)"
                  class="variable-switch"
                />
                
                <!-- Object 类型：文本域 -->
                <el-input
                  v-else-if="variable.var_type === 'object'"
                  v-model="variable.displayValue"
                  type="textarea"
                  :rows="3"
                  :placeholder="getVariablePlaceholder(variable)"
                  size="small"
                  @blur="updateVariableValue(variable)"
                  class="variable-textarea"
                />
                
                <!-- File 类型：文件上传 -->
                <div v-else-if="variable.var_type === 'file'" class="file-upload-section">
                  <el-upload
                    class="variable-file-upload"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="(file) => handleFileChange(variable, file)"
                    :accept="getFileAcceptTypes()"
                  >
                    <el-button size="small" type="primary">
                      <el-icon><IconUpload /></el-icon>
                      选择文件
                    </el-button>
                  </el-upload>
                  <div v-if="variable.fileName" class="selected-file">
                    <span class="file-name">{{ variable.fileName }}</span>
                    <el-button
                      size="small"
                      type="danger"
                      text
                      @click="clearFileVariable(variable)"
                    >
                      <el-icon><IconDelete /></el-icon>
                    </el-button>
                  </div>
                </div>
                
                <!-- Array[File] 类型：多文件上传 -->
                <div v-else-if="variable.var_type === 'array[file]'" class="file-array-upload-section">
                  <el-upload
                    class="variable-file-upload"
                    :auto-upload="false"
                    :show-file-list="false"
                    :multiple="true"
                    :on-change="(file, fileList) => handleFileArrayChange(variable, fileList)"
                    :accept="getFileAcceptTypes()"
                  >
                    <el-button size="small" type="primary">
                      <el-icon><IconUpload /></el-icon>
                      选择多个文件
                    </el-button>
                  </el-upload>
                  <div v-if="variable.fileList && variable.fileList.length > 0" class="selected-files">
                    <div v-for="(file, index) in variable.fileList" :key="index" class="file-item">
                      <span class="file-name">{{ file.name }}</span>
                      <el-button
                        size="small"
                        type="danger"
                        text
                        @click="removeFileFromArray(variable, index)"
                      >
                        <el-icon><IconDelete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
                
                <!-- Array[String] 类型：标签输入 -->
                <div v-else-if="variable.var_type === 'array[string]'" class="string-array-section">
                  <el-input
                    v-model="variable.stringArrayInput"
                    placeholder="输入后按回车添加，或用逗号分隔多个值"
                    size="small"
                    @keydown.enter="addStringToArray(variable)"
                    @blur="processStringArrayInput(variable)"
                    class="array-input"
                  />
                  <div v-if="variable.stringArray && variable.stringArray.length > 0" class="string-tags">
                    <el-tag
                      v-for="(item, index) in variable.stringArray"
                      :key="index"
                      closable
                      @close="removeStringFromArray(variable, index)"
                      size="small"
                    >
                      {{ item }}
                    </el-tag>
                  </div>
                </div>
                
                <!-- Secret 类型：密码输入 -->
                <el-input
                  v-else-if="variable.var_type === 'secret'"
                  v-model="variable.displayValue"
                  type="password"
                  :placeholder="getVariablePlaceholder(variable)"
                  size="small"
                  show-password
                  @blur="updateVariableValue(variable)"
                  @keydown.enter="updateVariableValue(variable)"
                  class="variable-input"
                />
                
                <!-- 其他类型：默认输入框 -->
                <el-input
                  v-else
                  v-model="variable.displayValue"
                  :placeholder="getVariablePlaceholder(variable)"
                  size="small"
                  @blur="updateVariableValue(variable)"
                  @keydown.enter="updateVariableValue(variable)"
                  class="variable-input"
                />
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="conversationVariables.length === 0 && !variablesLoading" class="empty-state">
            <div class="empty-icon">📝</div>
            <div class="empty-text">暂无用户变量</div>
            <div class="empty-hint">在开始节点中配置用户变量后，可在此设置变量值</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElTag, ElSwitch, ElUpload } from 'element-plus'
import { IconCaretRight, IconCaretDown, IconUpload, IconDelete } from '@computing/opendesign-icons'
import { updateVariable } from '@/api/variable'

interface Variable {
  name: string
  var_type: string
  scope: string
  value?: any
  description?: string
  displayValue?: string
  booleanValue?: boolean
  fileName?: string
  fileList?: Array<{ name: string; file: File }>
  stringArray?: string[]
  stringArrayInput?: string
}

interface Props {
  visible: boolean
  conversationVariables: Variable[]
  variablesLoading?: boolean
  flowId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['toggleVisibility', 'variableUpdated'])

// 处理变量显示值
const processedVariables = computed(() => {
  return props.conversationVariables.map(variable => ({
    ...variable,
    displayValue: variable.displayValue || getVariableDisplayValue(variable.value)
  }))
})

// 获取变量显示值
const getVariableDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// 获取变量类型显示
const getVariableTypeDisplay = (type: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Number', 
    'boolean': 'Boolean',
    'object': 'Object',
    'array': 'Array'
  }
  return typeMap[type] || type
}

// 获取变量占位符
const getVariablePlaceholder = (variable: Variable): string => {
  switch (variable.var_type) {
    case 'string':
      return '请输入文本值'
    case 'number':
      return '请输入数字'
    case 'boolean':
      return 'true 或 false'
    case 'object':
      return '请输入JSON格式'
    case 'secret':
      return '请输入密钥'
    case 'array[string]':
      return '输入字符串值'
    default:
      return '请输入变量值'
  }
}

// 获取文件接受类型
const getFileAcceptTypes = (): string => {
  return '.pdf,.docx,.doc,.txt,.md,.xlsx'
}

// 更新布尔变量
const updateBooleanVariable = async (variable: Variable) => {
  if (!props.flowId) {
    ElMessage.error('缺少工作流ID，无法保存变量')
    return
  }

  try {
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        flow_id: props.flowId
      },
      { 
        value: variable.booleanValue,
        var_type: variable.var_type,
        description: variable.description
      }
    )

    ElMessage.success('变量值已更新')
    emit('variableUpdated')
  } catch (error) {
    console.error('更新变量失败:', error)
    ElMessage.error('更新变量失败')
  }
}

// 处理文件选择
const handleFileChange = async (variable: Variable, file: any) => {
  if (!file) return
  
  variable.fileName = file.name
  // 这里可以添加文件上传逻辑
  try {
    // 模拟文件处理，实际需要根据API调整
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        flow_id: props.flowId
      },
      { 
        value: { name: file.name, size: file.size },
        var_type: variable.var_type,
        description: variable.description
      }
    )
    
    ElMessage.success('文件已选择')
    emit('variableUpdated')
  } catch (error) {
    console.error('处理文件失败:', error)
    ElMessage.error('处理文件失败')
  }
}

// 清除文件变量
const clearFileVariable = async (variable: Variable) => {
  variable.fileName = undefined
  
  try {
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        flow_id: props.flowId
      },
      { 
        value: null,
        var_type: variable.var_type,
        description: variable.description
      }
    )
    
    ElMessage.success('文件已清除')
    emit('variableUpdated')
  } catch (error) {
    console.error('清除文件失败:', error)
    ElMessage.error('清除文件失败')
  }
}

// 处理文件数组选择
const handleFileArrayChange = async (variable: Variable, fileList: any[]) => {
  if (!variable.fileList) {
    variable.fileList = []
  }
  
  variable.fileList = fileList.map(file => ({
    name: file.name,
    file: file.raw || file
  }))
  
  try {
    const fileData = variable.fileList.map(f => ({ name: f.name, size: f.file.size }))
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        flow_id: props.flowId
      },
      { 
        value: fileData,
        var_type: variable.var_type,
        description: variable.description
      }
    )
    
    ElMessage.success('文件列表已更新')
    emit('variableUpdated')
  } catch (error) {
    console.error('更新文件列表失败:', error)
    ElMessage.error('更新文件列表失败')
  }
}

// 从文件数组中移除文件
const removeFileFromArray = async (variable: Variable, index: number) => {
  if (!variable.fileList) return
  
  variable.fileList.splice(index, 1)
  
  try {
    const fileData = variable.fileList.map(f => ({ name: f.name, size: f.file.size }))
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        flow_id: props.flowId
      },
      { 
        value: fileData,
        var_type: variable.var_type,
        description: variable.description
      }
    )
    
    ElMessage.success('文件已移除')
    emit('variableUpdated')
  } catch (error) {
    console.error('移除文件失败:', error)
    ElMessage.error('移除文件失败')
  }
}

// 添加字符串到数组
const addStringToArray = (variable: Variable) => {
  if (!variable.stringArrayInput || !variable.stringArrayInput.trim()) return
  
  if (!variable.stringArray) {
    variable.stringArray = []
  }
  
  const value = variable.stringArrayInput.trim()
  if (!variable.stringArray.includes(value)) {
    variable.stringArray.push(value)
    variable.stringArrayInput = ''
    updateStringArrayVariable(variable)
  }
}

// 处理字符串数组输入（支持逗号分隔）
const processStringArrayInput = (variable: Variable) => {
  if (!variable.stringArrayInput || !variable.stringArrayInput.trim()) return
  
  if (!variable.stringArray) {
    variable.stringArray = []
  }
  
  const values = variable.stringArrayInput.split(',')
    .map(v => v.trim())
    .filter(v => v && !variable.stringArray!.includes(v))
  
  if (values.length > 0) {
    variable.stringArray.push(...values)
    variable.stringArrayInput = ''
    updateStringArrayVariable(variable)
  }
}

// 从字符串数组中移除项
const removeStringFromArray = (variable: Variable, index: number) => {
  if (!variable.stringArray) return
  
  variable.stringArray.splice(index, 1)
  updateStringArrayVariable(variable)
}

// 更新字符串数组变量
const updateStringArrayVariable = async (variable: Variable) => {
  if (!props.flowId) {
    ElMessage.error('缺少工作流ID，无法保存变量')
    return
  }

  try {
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        flow_id: props.flowId
      },
      { 
        value: variable.stringArray || [],
        var_type: variable.var_type,
        description: variable.description
      }
    )

    ElMessage.success('字符串数组已更新')
    emit('variableUpdated')
  } catch (error) {
    console.error('更新字符串数组失败:', error)
    ElMessage.error('更新字符串数组失败')
  }
}

// 更新变量值
const updateVariableValue = async (variable: Variable) => {
  if (!props.flowId) {
    ElMessage.error('缺少工作流ID，无法保存变量')
    return
  }

  try {
    const displayValue = variable.displayValue || ''
    let value: any = displayValue

    // 根据变量类型转换值
    if (variable.var_type === 'number') {
      const numValue = Number(displayValue)
      if (isNaN(numValue)) {
        ElMessage.error('请输入有效的数字')
        return
      }
      value = numValue
    } else if (variable.var_type === 'boolean') {
      if (displayValue === 'true' || displayValue === '1') {
        value = true
      } else if (displayValue === 'false' || displayValue === '0') {
        value = false
      } else {
        ElMessage.error('布尔值请输入 true 或 false')
        return
      }
    } else if (variable.var_type === 'object') {
      try {
        value = JSON.parse(displayValue)
      } catch (error) {
        ElMessage.error('JSON格式不正确')
        return
      }
    }

    // 调用API更新变量
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        flow_id: props.flowId
      },
      { 
        value,
        var_type: variable.var_type,
        description: variable.description
      }
    )

    ElMessage.success('变量值已更新')
    emit('variableUpdated')
  } catch (error) {
    console.error('更新变量失败:', error)
    ElMessage.error('更新变量失败')
  }
}

// 监听props变化，同步显示值
watch(
  () => props.conversationVariables,
  (newVariables) => {
    newVariables.forEach(variable => {
      if (!variable.displayValue) {
        variable.displayValue = getVariableDisplayValue(variable.value)
      }
      
      // 初始化不同类型的特殊属性
      if (variable.var_type === 'boolean') {
        if (variable.booleanValue === undefined) {
          variable.booleanValue = variable.value === true || variable.value === 'true'
        }
      } else if (variable.var_type === 'file') {
        if (variable.value && typeof variable.value === 'object' && variable.value.name) {
          variable.fileName = variable.value.name
        }
      } else if (variable.var_type === 'array[file]') {
        if (Array.isArray(variable.value)) {
          variable.fileList = variable.value.map(v => ({ name: v.name || v, file: v }))
        }
      } else if (variable.var_type === 'array[string]') {
        if (Array.isArray(variable.value)) {
          variable.stringArray = [...variable.value]
        } else if (!variable.stringArray) {
          variable.stringArray = []
        }
        if (!variable.stringArrayInput) {
          variable.stringArrayInput = ''
        }
      }
    })
  },
  { deep: true, immediate: true }
)
</script>

<style lang="scss" scoped>
.debug-variable-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &.panel-collapsed {
    .panel-header {
      border-bottom: none;
    }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--el-fill-color-extra-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color-light);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .variable-icon {
        font-size: 16px;
      }

      .header-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .variable-count {
        font-size: 12px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 500;
      }
    }

    .header-right {
      .toggle-btn {
        padding: 4px;
        color: var(--el-text-color-regular);
        border: none;
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .panel-content {
    padding: 16px;

    .variable-list {
      .variable-item {
        margin-bottom: 12px;
        padding: 12px;
        background: var(--el-fill-color-extra-light);
        border-radius: 6px;
        border: 1px solid var(--el-border-color-lighter);
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--el-color-primary-light-7);
          background: var(--el-color-primary-light-9);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .variable-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;

          .variable-name-section {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 0 0 140px;

            .variable-icon-small {
              color: var(--el-color-primary);
              font-family: 'Monaco', 'Consolas', monospace;
              font-weight: bold;
              font-size: 12px;
              width: 16px;
              text-align: center;
            }

            .variable-details {
              .variable-name {
                font-size: 13px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                line-height: 1.2;
              }

              .variable-type {
                font-size: 11px;
                color: var(--el-text-color-secondary);
                line-height: 1.2;
              }
            }
          }

          .variable-value-section {
            flex: 1;
            min-width: 0;

            .variable-input,
            .variable-textarea {
              width: 100%;
              
              :deep(.el-input__inner),
              :deep(.el-textarea__inner) {
                font-size: 13px;
                border-color: var(--el-border-color-lighter);
                
                &:focus {
                  border-color: var(--el-color-primary);
                }
              }
            }

            .variable-switch {
              display: flex;
              align-items: center;
            }

            .file-upload-section,
            .file-array-upload-section {
              .variable-file-upload {
                width: 100%;
                
                :deep(.el-upload) {
                  width: 100%;
                }
              }

              .selected-file,
              .selected-files {
                margin-top: 8px;
                
                .file-item {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 4px 8px;
                  background: var(--el-fill-color-extra-light);
                  border-radius: 4px;
                  margin-bottom: 4px;
                  
                  .file-name {
                    font-size: 12px;
                    color: var(--el-text-color-regular);
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                }
              }
            }

            .string-array-section {
              .array-input {
                width: 100%;
                margin-bottom: 8px;
              }

              .string-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                
                .el-tag {
                  font-size: 12px;
                }
              }
            }
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 24px 16px;
        color: var(--el-text-color-secondary);

        .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .empty-text {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          color: var(--el-text-color-regular);
        }

        .empty-hint {
          font-size: 12px;
          color: var(--el-text-color-placeholder);
          line-height: 1.4;
        }
      }
    }
  }
}

// 面板展开/收起动画
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 