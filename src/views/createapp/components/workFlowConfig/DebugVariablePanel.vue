<template>
  <div class="debug-variable-panel" :class="{ 'panel-collapsed': !visible }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <div class="variable-icon">⚙️</div>
        <span class="header-title">变量配置</span>
        <span class="variable-count" v-if="internalVariables.length > 0">
          ({{ internalVariables.length }})
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
          <!-- 变量展示 -->
          <div 
            v-for="variable in internalVariables" 
            :key="`conv_${variable.name}`"
            class="variable-item"
          >
            <div class="variable-main">
              <div class="variable-name-section">
                <div class="variable-icon-small">{x}</div>
                <div class="variable-details">
                  <div class="variable-name">{{ variable.name }}</div>
                  <div class="variable-type">{{ VARIABLE_TYPE_MAP[variable.var_type] || variable.var_type }}</div>
                </div>
              </div>
              <div class="variable-value-section">
                <!-- String 和 Number 类型 -->
                <el-input
                  v-if="variable.var_type === 'string' || variable.var_type === 'number'"
                  v-model="variable.displayValue"
                  :placeholder="getVariablePlaceholder(variable)"
                  :type="variable.var_type === 'number' ? 'number' : 'text'"
                  size="small"
                  @input="handleVariableInput(variable)"
                  class="variable-input"
                />
                
                <!-- Boolean 类型 -->
                <el-switch
                  v-else-if="variable.var_type === 'boolean'"
                  v-model="variable.booleanValue"
                  active-text="true"
                  inactive-text="false"
                  size="small"
                  @change="handleVariableUpdate(variable)"
                  class="variable-switch"
                />
                
                <!-- Object 类型 -->
                <el-input
                  v-else-if="variable.var_type === 'object'"
                  v-model="variable.displayValue"
                  type="textarea"
                  :rows="3"
                  :placeholder="getVariablePlaceholder(variable)"
                  size="small"
                  @input="handleVariableInput(variable)"
                  class="variable-textarea"
                />
                
                <!-- File 类型 -->
                <div v-else-if="variable.var_type === 'file'" class="file-upload-section">
                  <el-upload
                    class="variable-file-upload"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="(file) => handleFileChange(variable, file)"
                    :accept="FILE_ACCEPT_TYPES"
                    drag
                  >
                    <template #trigger>
                      <div class="upload-trigger">
                        <el-icon class="upload-icon"><IconUpload /></el-icon>
                        <div class="upload-text">
                          <span>点击上传</span>
                          <span class="upload-hint">或将文件拖拽到此处</span>
                        </div>
                      </div>
                    </template>
                    <template #tip>
                      <div class="upload-tip">
                        {{ getFileUploadTip(variable) }}
                      </div>
                    </template>
                  </el-upload>
                  
                  <!-- 已选择的文件列表 -->
                  <div v-if="variable.fileName" class="file-list">
                    <div class="file-item">
                      <div class="file-info">
                        <el-icon class="file-icon"><Document /></el-icon>
                    <span class="file-name">{{ variable.fileName }}</span>
                        <span v-if="variable.fileUploaded" class="file-status success">
                          <el-icon><CircleCheck /></el-icon>
                          已上传
                        </span>
                        <span v-else class="file-status pending">
                          <el-icon><Loading /></el-icon>
                          待上传
                        </span>
                      </div>
                    <el-button
                      size="small"
                      type="danger"
                      text
                      @click="clearFileVariable(variable)"
                        class="file-remove"
                    >
                      <el-icon><IconDelete /></el-icon>
                    </el-button>
                    </div>
                  </div>
                </div>
                
                <!-- Array[File] 类型 -->
                <div v-else-if="variable.var_type === 'array[file]'" class="file-array-upload-section">
                  <el-upload
                    class="variable-file-upload"
                    :auto-upload="false"
                    :show-file-list="false"
                    :multiple="true"
                    :on-change="(file, fileList) => handleFileArrayChange(variable, fileList)"
                    :accept="FILE_ACCEPT_TYPES"
                    drag
                  >
                    <template #trigger>
                      <div class="upload-trigger">
                        <el-icon class="upload-icon"><IconUpload /></el-icon>
                        <div class="upload-text">
                          <span>点击上传</span>
                          <span class="upload-hint">或将文件拖拽到此处</span>
                        </div>
                      </div>
                    </template>
                    <template #tip>
                      <div class="upload-tip">
                        {{ getFileUploadTip(variable) }}
                      </div>
                    </template>
                  </el-upload>
                  
                  <!-- 已选择的文件列表 -->
                  <div v-if="variable.fileList && variable.fileList.length > 0" class="file-list">
                    <div v-for="(file, index) in variable.fileList" :key="index" class="file-item">
                      <div class="file-info">
                        <el-icon class="file-icon"><Document /></el-icon>
                      <span class="file-name">{{ file.name }}</span>
                        <span v-if="variable.fileListUploaded" class="file-status success">
                          <el-icon><CircleCheck /></el-icon>
                          已上传
                        </span>
                        <span v-else class="file-status pending">
                          <el-icon><Loading /></el-icon>
                          待上传
                        </span>
                      </div>
                      <el-button
                        size="small"
                        type="danger"
                        text
                        @click="removeFileFromArray(variable, index)"
                        class="file-remove"
                      >
                        <el-icon><IconDelete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
                
                <!-- Array[String] 类型 -->
                <div v-else-if="variable.var_type === 'array[string]'" class="string-array-section">
                  <el-input
                    v-model="variable.stringArrayInput"
                    placeholder="输入后按回车添加，或用逗号分隔多个值"
                    size="small"
                    @keydown.enter="addStringToArray(variable)"
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
                
                <!-- Secret 类型 -->
                <el-input
                  v-else-if="variable.var_type === 'secret'"
                  v-model="variable.displayValue"
                  type="password"
                  :placeholder="getVariablePlaceholder(variable)"
                  size="small"
                  show-password
                  @input="handleVariableInput(variable)"
                  class="variable-input"
                />
                
                <!-- 其他类型 -->
                <el-input
                  v-else
                  v-model="variable.displayValue"
                  :placeholder="getVariablePlaceholder(variable)"
                  size="small"
                  @input="handleVariableInput(variable)"
                  class="variable-input"
                />
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="internalVariables.length === 0 && !variablesLoading" class="empty-state">
            <div class="empty-icon">⚙️</div>
            <div class="empty-text">变量配置面板</div>
            <div class="empty-hint">当工作流包含变量时，可以在这里配置变量值</div>
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
import { Document, CircleCheck, Loading } from '@element-plus/icons-vue'
import { updateVariable } from '@/api/variable'
import { uploadFilesForVariable, deleteSession } from '@/apis/paths/conversation'

// 常量定义
const VARIABLE_TYPE_MAP: Record<string, string> = {
  'string': 'String',
  'number': 'Number', 
  'boolean': 'Boolean',
  'object': 'Object',
  'array': 'Array',
  'file': 'File',
  'array[file]': 'File[]',
  'array[string]': 'String[]',
  'secret': 'Secret'
}

const PLACEHOLDER_MAP: Record<string, string> = {
  'string': '请输入文本值',
  'number': '请输入数字',
  'boolean': 'true 或 false',
  'object': '请输入JSON格式',
  'secret': '请输入密钥',
  'array[string]': '输入字符串值'
}

const FILE_ACCEPT_TYPES = '.pdf,.docx,.doc,.txt,.md,.xlsx'

const SYSTEM_VARIABLE_PATTERNS = [
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.result$/i,
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\./i,
  /^node_\d+\./i,
  /^sys\./i,
  /^_/i
]

interface Variable {
  name: string
  var_type: string
  scope: string
  value?: any
  description?: string
  displayValue?: string
  booleanValue?: boolean
  fileName?: string
  fileObject?: File
  fileUploaded?: boolean
  fileList?: Array<{ name: string; file?: File }>
  fileListUploaded?: boolean
  stringArray?: string[]
  stringArrayInput?: string
}

interface Props {
  visible: boolean
  conversationVariables: Variable[]
  variablesLoading?: boolean
  flowId: string
  conversationId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['toggleVisibility', 'variableUpdated'])

// 内部状态
const internalVariables = ref<Variable[]>([])

// 计算属性
const shouldDefaultCollapse = computed(() => internalVariables.value.length === 0)

// 工具函数
const isEditableVariable = (variable: Variable): boolean => {
  if (variable.scope !== 'conversation') return false
  return !SYSTEM_VARIABLE_PATTERNS.some(pattern => pattern.test(variable.name))
}

const getVariableDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}



const getVariablePlaceholder = (variable: Variable): string => {
  return PLACEHOLDER_MAP[variable.var_type] || '请输入变量值'
}

// 获取文件接受类型
const getFileAcceptTypes = (): string => {
  return FILE_ACCEPT_TYPES
}

// 获取文件上传提示信息
const getFileUploadTip = (variable: Variable): string => {
  if (variable.var_type === 'file') {
    return `${FILE_ACCEPT_TYPES} 文件，单个文件不超过 ${getVariableMaxFileSize(variable)}MB`
  } else if (variable.var_type === 'array[file]') {
    return `${FILE_ACCEPT_TYPES} 文件，最多 ${getVariableMaxFiles(variable)} 个文件，单个文件不超过 ${getVariableMaxFileSize(variable)}MB`
  }
  return `${FILE_ACCEPT_TYPES} 文件`
}

// 获取变量的最大文件数
const getVariableMaxFiles = (variable: Variable): number => {
  if (variable.value && typeof variable.value === 'object' && 'max_files' in variable.value) {
    return variable.value.max_files
  }
  return variable.var_type === 'file' ? 1 : 10
}

// 获取变量的最大文件大小（MB）
const getVariableMaxFileSize = (variable: Variable): number => {
  if (variable.value && typeof variable.value === 'object' && 'max_file_size' in variable.value) {
    return Math.round(variable.value.max_file_size / (1024 * 1024))
  }
  return 10 // 默认10MB
}

// 初始化内部变量状态
const initializeInternalVariables = () => {
  const editableVariables = props.conversationVariables.filter(isEditableVariable)
  
  // 保存当前的文件变量状态
  const currentFileStates = new Map<string, { fileName?: string; fileObject?: File; fileUploaded?: boolean; fileList?: Array<{ name: string; file?: File }>; fileListUploaded?: boolean }>()
  
  // 保存现有的文件变量状态
  internalVariables.value.forEach(variable => {
    if (variable.var_type === 'file' || variable.var_type === 'array[file]') {
      currentFileStates.set(variable.name, {
        fileName: variable.fileName,
        fileObject: variable.fileObject,
        fileUploaded: variable.fileUploaded,
        fileList: variable.fileList,
        fileListUploaded: variable.fileListUploaded
      })
    }
  })
  
  internalVariables.value = editableVariables.map(variable => {
    // 处理文件类型变量的特殊逻辑
    let fileName: string | undefined = undefined
    let fileList: Array<{ name: string; file?: File }> = []
    let fileObject: File | undefined = undefined
    let fileUploaded: boolean = false
    let fileListUploaded: boolean = false
    
    // 🔑 重要：优先使用用户已输入的文件状态
    const existingFileState = currentFileStates.get(variable.name)
    if (existingFileState) {
      fileName = existingFileState.fileName
      fileObject = existingFileState.fileObject
      fileUploaded = existingFileState.fileUploaded || false
      fileList = existingFileState.fileList || []
      fileListUploaded = existingFileState.fileListUploaded || false
    } else if (variable.var_type === 'file' && variable.value) {
      // 从后端返回的文件变量数据中提取文件名
      try {
        let fileValue = variable.value
        if (typeof fileValue === 'string') {
          // 如果value是字符串，尝试解析JSON
          fileValue = JSON.parse(fileValue)
        }
        
        if (typeof fileValue === 'object' && fileValue !== null) {
          // 如果有file_id，说明文件已上传，需要显示文件名
          if (fileValue.file_id) {
            // 🔑 重要：这里应该根据file_id获取文件名，但暂时使用file_id作为显示
            // 在实际应用中，可能需要调用文件服务API获取文件名
            fileName = `已上传文件 (${fileValue.file_id.substring(0, 8)}...)`
            // 标记为已上传状态
            fileUploaded = true
          }
        }
              } catch (e) {
        // 解析失败，使用默认值
      }
    } else if (variable.var_type === 'array[file]' && variable.value) {
      // 处理文件数组类型
      try {
        let fileValue = variable.value
        if (typeof fileValue === 'string') {
          fileValue = JSON.parse(fileValue)
        }
        
        if (typeof fileValue === 'object' && fileValue !== null && Array.isArray(fileValue.file_ids)) {
          // 如果有file_ids，说明文件已上传
          fileList = fileValue.file_ids.map((fileId: string) => ({
            name: `已上传文件 (${fileId.substring(0, 8)}...)`
          }))
          // 标记为已上传状态
          fileListUploaded = true
        }
      } catch (e) {
        // 解析失败，使用默认值
      }
    }
    
    return {
    ...variable,
    displayValue: getVariableDisplayValue(variable.value),
    booleanValue: variable.var_type === 'boolean' ? (variable.value === true || variable.value === 'true') : undefined,
      fileName: fileName,
      fileObject: fileObject,
      fileUploaded: fileUploaded,
      fileList: fileList,
      fileListUploaded: fileListUploaded,
    stringArray: variable.var_type === 'array[string]' && Array.isArray(variable.value) 
      ? [...variable.value] 
      : [],
    stringArrayInput: ''
    }
  })
}

// 这个函数已被新的两阶段批量处理逻辑替代，不再需要

// 从变量中提取文件配置信息（不包括file_id/file_ids）
const getFileConfigFromVariable = (variable: Variable): any => {
  try {
    if (variable.value && typeof variable.value === 'object') {
      const { file_id, file_ids, ...config } = variable.value
      return config
    }
  } catch (e) {
    // 解析失败，返回默认配置
  }
  
  // 返回默认文件配置
  return {
    supported_types: [],
    upload_methods: ["manual"],
    max_files: variable.var_type === 'file' ? 1 : 10,
    max_file_size: 10 * 1024 * 1024, // 10MB
    required: false
  }
}

// 处理变量值
const processVariableValue = (variable: Variable): any => {
  switch (variable.var_type) {
    case 'boolean':
      return variable.booleanValue
    case 'number': {
      const numValue = Number(variable.displayValue)
      return isNaN(numValue) ? variable.value : numValue
    }
    case 'object':
      try {
        return JSON.parse(variable.displayValue || '{}')
      } catch {
        return variable.displayValue
      }
    case 'array[string]':
      return variable.stringArray || []
    default:
      return variable.displayValue || variable.value
  }
}

// 批量更新所有变量到后端
const batchUpdateVariables = async (conversationId: string) => {
  if (!conversationId) return false

  const editableVariables = internalVariables.value.filter(isEditableVariable)
  if (editableVariables.length === 0) return true

  try {
    // 🔑 新的两阶段处理流程
    
    // 第一阶段：更新所有变量（包括清空文件变量的file_id）
    const updateResults: Array<{ success: boolean; variable: string; error?: any }> = []
    
    for (const variable of editableVariables) {
      try {
        let processedValue
        
        if (variable.var_type === 'file' || variable.var_type === 'array[file]') {
          // 文件变量：清空file_id但保留配置
          const isArrayType = variable.var_type === 'array[file]'
          processedValue = isArrayType ? 
            { file_ids: [], ...getFileConfigFromVariable(variable) } : 
            { file_id: "", ...getFileConfigFromVariable(variable) }
        } else {
          // 非文件变量：正常处理值
          processedValue = processVariableValue(variable)
        }
        
        await updateVariable(
          { 
            name: variable.name, 
            scope: 'conversation',
            conversation_id: conversationId,
            flow_id: props.flowId
          },
          { 
            value: processedValue,
            var_type: variable.var_type,
            description: variable.description
          }
        )
        
        updateResults.push({ success: true, variable: variable.name })
      } catch (error) {
        console.error(`变量 ${variable.name} 更新失败:`, error)
        updateResults.push({ success: false, variable: variable.name, error })
      }
    }
    
    // 检查第一阶段是否有失败
    const failedUpdates = updateResults.filter(r => !r.success)
    if (failedUpdates.length > 0) {
      ElMessage.error(`变量更新失败: ${failedUpdates.map(r => r.variable).join(', ')}`)
      return false
    }
    
    // 第二阶段：处理文件上传
    const fileVariables = editableVariables.filter(v => v.var_type === 'file' || v.var_type === 'array[file]')
    const fileVariablesWithFiles = fileVariables.filter(v => 
      (v.var_type === 'file' && v.fileName) || 
      (v.var_type === 'array[file]' && v.fileList && v.fileList.length > 0)
    )
    
    if (fileVariablesWithFiles.length > 0) {
      for (const variable of fileVariablesWithFiles) {
        const isArrayType = variable.var_type === 'array[file]'
        const isUploaded = isArrayType ? variable.fileListUploaded : variable.fileUploaded
        
        if (!isUploaded) {
          try {
            // 准备上传数据
            const formData = new FormData()
            if (isArrayType) {
              variable.fileList?.forEach(fileItem => {
                if (fileItem.file) formData.append('documents', fileItem.file)
              })
            } else if (variable.fileObject) {
              formData.append('documents', variable.fileObject)
            }

            // 上传文件
            const [error] = await uploadFilesForVariable(
              formData,
              conversationId,
              variable.name,
              variable.var_type,
              'conversation',
              props.flowId
            )

            if (error) {
              // 提取具体的错误信息
              let errorMessage = '文件上传失败'
              
              try {
                if (error?.response?.data) {
                  const responseData = error.response.data
                  if (typeof responseData === 'string') {
                    try {
                      const parsedData = JSON.parse(responseData)
                      if (parsedData.detail) {
                        errorMessage = parsedData.detail
                      } else if (parsedData.message) {
                        errorMessage = parsedData.message
                      }
                    } catch (jsonError) {
                      errorMessage = responseData
                    }
                  } else if (typeof responseData === 'object') {
                    if (responseData.detail) {
                      errorMessage = responseData.detail
                    } else if (responseData.message) {
                      errorMessage = responseData.message
                    }
                  }
                } else if (error?.response?.statusText) {
                  errorMessage = error.response.statusText
                } else if (error?.detail) {
                  errorMessage = error.detail
                } else if (error?.message) {
                  errorMessage = error.message
                }
              } catch (parseError) {
                // 解析错误信息时出错，使用默认消息
              }
              
              ElMessage.error(errorMessage)
              
              // 清空文件缓存
              if (isArrayType) {
                variable.fileList = []
                variable.fileListUploaded = false
              } else {
                variable.fileName = undefined
                variable.fileObject = undefined
                variable.fileUploaded = false
              }
              
              // 文件上传失败时，清理可能已创建的无效会话
              try {
                await deleteSession({ conversationList: [conversationId] })
              } catch (cleanupError) {
                // 清理无效会话失败，静默处理
              }
              
              return false
            }

            // 标记上传完成
            if (isArrayType) {
              variable.fileListUploaded = true
            } else {
              variable.fileUploaded = true
            }
          } catch (error) {
            console.error(`文件变量 ${variable.name} 上传失败:`, error)
            ElMessage.error(`文件变量 ${variable.name} 上传失败`)
            return false
          }
        }
      }
    }
    
    emit('variableUpdated')
    return true
  } catch (error) {
    console.error('批量更新变量失败:', error)
    ElMessage.error('变量更新失败，无法开始对话')
    return false
  }
}

// 处理变量输入事件（不触发API调用）
const handleVariableInput = (variable: Variable) => {
  // 只做本地状态更新，不调用API
}

// 处理变量更新
const handleVariableUpdate = async (variable: Variable) => {
  // 🔑 重要设计决策：
  // 1. 如果没有conversationId（配置阶段），只做前端缓存更新，不调用后端
  // 2. 如果有conversationId（运行阶段），保持即时更新以支持调试
  // 3. 文件变量的删除操作统一延迟到批量更新，避免复杂的状态管理
  
  if (!props.conversationId) {
    // 配置阶段：只做前端缓存，不调用后端
    ElMessage.success('变量值已更新，开始对话时将同步到后端')
    return
  }
  
  // 运行阶段：对非文件变量提供即时更新支持
  if (variable.var_type === 'file' || variable.var_type === 'array[file]') {
    // 文件变量：不做即时更新，等待批量处理
    ElMessage.success('文件变量已更新，开始对话时将同步到后端')
    return
  }
  
  // 非文件变量：提供即时更新（支持调试模式）
  try {
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        conversation_id: props.conversationId,
        flow_id: props.flowId
      },
      { 
        value: processVariableValue(variable),
        var_type: variable.var_type,
        description: variable.description
      }
    )
    ElMessage.success('变量值已更新')
    emit('variableUpdated')
  } catch (error) {
    ElMessage.error('更新变量失败')
  }
}

// 暴露方法给父组件调用
defineExpose({ batchUpdateVariables })

// 处理文件选择
const handleFileChange = async (variable: Variable, file: any) => {
  if (!file) return
  
  variable.fileName = file.name
  variable.fileObject = file.raw || file
  variable.fileUploaded = false
  
  // 🔑 与新的两阶段处理设计保持一致：
  // 文件选择只做前端缓存，不立即调用后端API
  // 后端状态将在开始对话时通过两阶段处理统一更新
  ElMessage.success('文件已选择，开始对话时将上传')
}

// 清除文件变量
const clearFileVariable = async (variable: Variable) => {
  // 🔑 重要优化：只做前端缓存清理，不立即调用后端API
  // 后端状态将在开始对话时通过两阶段处理统一更新
  variable.fileName = undefined
  variable.fileObject = undefined
  variable.fileUploaded = false
  
  // 🔑 与新的两阶段处理设计保持一致：
  // 1. 删除操作只影响前端缓存
  // 2. 后端变量池的更新留给batchUpdateVariables处理
  // 3. 这样确保所有变量更新都在同一个事务中，避免状态冲突
  
  ElMessage.success('文件已移除，开始对话时将同步到后端')
}

// 处理文件数组选择
const handleFileArrayChange = async (variable: Variable, fileList: any[]) => {
  if (!variable.fileList) variable.fileList = []
  
  // 🔑 重要修复：过滤掉已经在内部列表中的文件，避免重复
  const existingFileNames = new Set(variable.fileList.map(f => f.name))
  const newFiles = fileList.filter(file => !existingFileNames.has(file.name))
  
  // 🔑 只添加新文件，保持现有文件
  newFiles.forEach(file => {
    variable.fileList!.push({
      name: file.name,
      file: file.raw || file
    })
  })
  
  variable.fileListUploaded = false
  
  // 🔑 与新的两阶段处理设计保持一致：
  // 文件选择只做前端缓存，不立即调用后端API
  // 后端状态将在开始对话时通过两阶段处理统一更新
  ElMessage.success('文件已选择，开始对话时将上传')
}

// 从文件数组中移除文件
const removeFileFromArray = async (variable: Variable, index: number) => {
  if (!variable.fileList) return
  
  // 🔑 重要优化：只做前端缓存清理，不立即调用后端API
  // 后端状态将在开始对话时通过两阶段处理统一更新
  const removedFile = variable.fileList[index]
  variable.fileList.splice(index, 1)
  
  // 🔑 与新的两阶段处理设计保持一致：
  // 1. 删除操作只影响前端缓存
  // 2. 后端变量池的更新留给batchUpdateVariables处理
  // 3. 这样确保所有变量更新都在同一个事务中，避免状态冲突
  
  ElMessage.success(`文件 "${removedFile.name}" 已移除，开始对话时将同步到后端`)
}

// 添加字符串到数组
const addStringToArray = (variable: Variable) => {
  if (!variable.stringArrayInput?.trim()) return
  
  if (!variable.stringArray) variable.stringArray = []
  
  const value = variable.stringArrayInput.trim()
  if (!variable.stringArray.includes(value)) {
    variable.stringArray.push(value)
    variable.stringArrayInput = ''
    if (props.conversationId) {
      handleVariableUpdate(variable)
    }
  }
}

// 从字符串数组中移除项
const removeStringFromArray = (variable: Variable, index: number) => {
  if (!variable.stringArray) return
  
  variable.stringArray.splice(index, 1)
  if (props.conversationId) {
    handleVariableUpdate(variable)
  }
}



// 监听props变化，重新初始化内部变量（只在外部数据源变化时）
watch(
  () => props.conversationVariables,
  (newVariables, oldVariables) => {
    // 🔑 重要修复：只在以下情况重新初始化
    // 1. 首次加载（immediate: true）
    // 2. 变量数量发生变化（新增或删除变量）
    // 3. 变量类型发生变化
    if (!oldVariables || newVariables.length !== oldVariables.length) {
      initializeInternalVariables();
      return;
    }
    
    // 检查变量类型是否发生变化
    const hasTypeChange = newVariables.some((newVar, index) => {
      const oldVar = oldVariables[index];
      return oldVar && (newVar.name !== oldVar.name || newVar.var_type !== oldVar.var_type);
    });
    
    if (hasTypeChange) {
      initializeInternalVariables();
      return;
    }
    
    // 如果只是变量值的变化，不重新初始化，保持用户输入的状态
  },
  { immediate: true }
)

// 监听内部变量变化，在数据加载完成后判断是否需要折叠
watch(
  () => internalVariables.value,
  (newInternalVariables) => {
    // 只有在数据不为空（即已经完成初始化）且没有可编辑变量时才折叠
    // 避免在组件刚挂载时就折叠
    if (newInternalVariables !== null && shouldDefaultCollapse.value && props.visible && !props.variablesLoading) {
      emit('toggleVisibility');
    }
  },
  { deep: true }
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
                
                :deep(.el-upload-dragger) {
                  width: 100%;
                  height: 120px;
                  border: 2px dashed var(--el-border-color);
                  border-radius: 8px;
                  background: var(--el-fill-color-extra-light);
                  transition: all 0.3s ease;
                  
                  &:hover {
                    border-color: var(--el-color-primary);
                    background: var(--el-color-primary-light-9);
                  }
                  
                  &.is-dragover {
                    border-color: var(--el-color-primary);
                    background: var(--el-color-primary-light-8);
                  }
                }
                
                .upload-trigger {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100%;
                  padding: 20px;
                  
                  .upload-icon {
                    font-size: 28px;
                    color: var(--el-color-primary);
                    margin-bottom: 8px;
                  }
                  
                  .upload-text {
                    text-align: center;
                    
                    span {
                      display: block;
                      font-size: 14px;
                      color: var(--el-text-color-primary);
                      margin-bottom: 4px;
                    }
                    
                    .upload-hint {
                      font-size: 12px;
                      color: var(--el-text-color-secondary);
                    }
                  }
                }
                
                .upload-tip {
                margin-top: 8px;
                  font-size: 12px;
                  color: var(--el-text-color-secondary);
                  text-align: center;
                }
              }

              .file-list {
                margin-top: 12px;
                
                .file-item {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 8px 12px;
                  background: var(--el-fill-color-extra-light);
                  border: 1px solid var(--el-border-color-lighter);
                  border-radius: 6px;
                  margin-bottom: 8px;
                  transition: all 0.2s ease;
                  
                  &:hover {
                    background: var(--el-fill-color-light);
                    border-color: var(--el-color-primary-light-7);
                  }
                  
                  &:last-child {
                    margin-bottom: 0;
                  }
                  
                  .file-info {
                    display: flex;
                    align-items: center;
                    flex: 1;
                    min-width: 0;
                    
                    .file-icon {
                      font-size: 16px;
                      color: var(--el-color-primary);
                      margin-right: 8px;
                      flex-shrink: 0;
                    }
                  
                  .file-name {
                      font-size: 13px;
                      color: var(--el-text-color-primary);
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                      margin-right: 8px;
                    }
                    
                    .file-status {
                      display: flex;
                      align-items: center;
                      font-size: 12px;
                      padding: 2px 6px;
                      border-radius: 4px;
                      flex-shrink: 0;
                      
                      .el-icon {
                        margin-right: 4px;
                        font-size: 12px;
                      }
                      
                      &.success {
                        color: var(--el-color-success);
                        background: var(--el-color-success-light-9);
                      }
                      
                      &.pending {
                        color: var(--el-color-warning);
                        background: var(--el-color-warning-light-9);
                      }
                    }
                  }
                  
                  .file-remove {
                    flex-shrink: 0;
                    margin-left: 8px;
                    
                    &:hover {
                      color: var(--el-color-danger);
                      background: var(--el-color-danger-light-9);
                    }
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
  transition: all 0.15s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 