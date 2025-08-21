<template>
  <div class="dialogue-variable-panel" :class="{ 'panel-minimized': isMinimized }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <span class="header-title">变量设置</span>
      </div>
        <div class="header-right" v-if="isMinimized">
          <el-button
            text
            type="default"
            size="small"
            @click="$emit('expand')"
          >
            编辑
          </el-button>
        </div>
    </div>

    <!-- 面板内容 -->
    <div v-show="!isMinimized" class="panel-content">
      <div class="variable-list" v-loading="variablesLoading || false">
        <!-- 对话变量展示 -->
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
            <!-- String 和 Number 类型：普通输入框 -->
              <el-input
                v-if="variable.var_type === 'string' || variable.var_type === 'number'"
                v-model="variable.displayValue"
                :placeholder="getVariablePlaceholder(variable)"
                :type="variable.var_type === 'number' ? 'number' : 'text'"
                size="small"
                @input="handleVariableInput(variable)"
                class="variable-input"
              />
            
            <!-- Boolean 类型：开关 -->
            <el-switch
              v-else-if="variable.var_type === 'boolean'"
              v-model="variable.booleanValue"
              active-text="true"
              inactive-text="false"
              size="default"
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
              size="default"
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
            
            <!-- Array[String] 类型：标签输入 -->
            <div v-else-if="variable.var_type === 'array[string]'" class="string-array-section">
              <el-input
                v-model="variable.stringArrayInput"
                placeholder="输入后按回车添加，或用逗号分隔多个值"
                size="default"
                @keydown.enter="addStringToArray(variable)"
                class="array-input"
              />
              <div v-if="variable.stringArray && variable.stringArray.length > 0" class="string-tags">
                <el-tag
                  v-for="(item, index) in variable.stringArray"
                  :key="index"
                  closable
                  @close="removeStringFromArray(variable, index)"
                  size="default"
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
              size="default"
              show-password
              @input="handleVariableInput(variable)"
              class="variable-input"
            />
            
            <!-- 其他类型：默认输入框 -->
            <el-input
              v-else
              v-model="variable.displayValue"
              :placeholder="getVariablePlaceholder(variable)"
              size="default"
              @input="handleVariableInput(variable)"
              class="variable-input"
              />
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="internalVariables.length === 0 && !variablesLoading" class="empty-state">
          <div class="empty-text">暂无需要配置的变量</div>
        </div>
      </div>

      <!-- 开始对话按钮 -->
      <div class="start-conversation-btn">
        <el-button
          type="primary"
          size="large"
          @click="handleStartConversation"
          :loading="isStarting"
          class="start-btn"
        >
          开始对话
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { ElMessage, ElTag, ElSwitch, ElUpload } from 'element-plus'
import { IconUpload, IconDelete } from '@computing/opendesign-icons'
import { Document, CircleCheck, Loading } from '@element-plus/icons-vue'
import { updateVariable } from '@/api/variable'
import { uploadFilesForVariable, deleteSession } from '@/apis/paths/conversation'

// 常量定义 - 与DebugVariablePanel保持一致
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

const FILE_ACCEPT_TYPES = '.pdf,.docx,.doc,.txt,.md,.xlsx'

interface Variable {
  name: string
  var_type: string
  scope: string
  value?: any
  description?: string
  displayValue?: string
  booleanValue?: boolean
  fileName?: string
  fileObject?: File  // 添加文件对象存储
  fileUploaded?: boolean  // 标记文件是否已上传
  fileList?: Array<{ name: string; file?: File }>  // file设为可选
  fileListUploaded?: boolean  // 标记文件数组是否已上传
  stringArray?: string[]
  stringArrayInput?: string
}

interface Props {
  isMinimized: boolean
  conversationVariables: Variable[]
  variablesLoading?: boolean
  conversationId?: string
  appId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['expand', 'startConversation', 'variableUpdated', 'minimize'])

// 内部独立的变量状态
const internalVariables = ref<Variable[]>([])
const isStarting = ref(false)
// 🔑 新增：防止重复调用标志
const hasUpdatedVariables = ref(false)

// 计算属性：检查是否应该默认最小化
const shouldDefaultMinimize = computed(() => {
  return internalVariables.value.length === 0
})

// 检查是否是用户可编辑的变量
const isEditableVariable = (variable: Variable): boolean => {
  // 必须是 conversation 类型
  if (variable.scope !== 'conversation') {
    return false
  }
  
  // 排除 UUID.result 格式的变量名（这些是 node 执行结果）
  const uuidResultPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.result$/i
  if (uuidResultPattern.test(variable.name)) {
    return false
  }
  
  // 排除其他系统变量格式
  const systemVariablePatterns = [
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\./i, // UUID.xxx 格式
    /^node_\d+\./i, // node_xxx.xxx 格式
    /^sys\./i, // sys.xxx 格式
    /^_/i // 下划线开头的内部变量
  ]
  
  for (const pattern of systemVariablePatterns) {
    if (pattern.test(variable.name)) {
      return false
    }
  }
  
  return true
}

// 文件上传失败时删除conversation
const deleteConversationOnFailure = async (conversationId: string) => {
  try {
    await deleteSession({ conversationList: [conversationId] })
    ElMessage.warning('文件上传失败，已取消对话创建')
  } catch (error) {
    console.error('删除conversation失败:', error)
  }
}

// 初始化内部变量状态
const initializeInternalVariables = () => {
  // 只显示用户可编辑的 conversation 变量
  const editableVariables = props.conversationVariables.filter(isEditableVariable)
  
  // 🔑 重要修复：保存当前所有用户输入状态，不仅仅是文件
  const currentUserStates = new Map<string, {
    // 通用状态
    displayValue?: string;
    booleanValue?: boolean;
    stringArray?: string[];
    stringArrayInput?: string;
    // 文件相关状态
    fileName?: string; 
    fileObject?: File; 
    fileUploaded?: boolean; 
    fileList?: Array<{ name: string; file?: File }>; 
    fileListUploaded?: boolean;
  }>()
  
  // 保存现有的用户输入状态
  internalVariables.value.forEach(variable => {
    currentUserStates.set(variable.name, {
      displayValue: variable.displayValue,
      booleanValue: variable.booleanValue,
      stringArray: variable.stringArray,
      stringArrayInput: variable.stringArrayInput,
      fileName: variable.fileName,
      fileObject: variable.fileObject,
      fileUploaded: variable.fileUploaded,
      fileList: variable.fileList,
      fileListUploaded: variable.fileListUploaded
    })
  })
  
  internalVariables.value = editableVariables.map(variable => {
    // 🔑 重要：优先使用用户已输入的状态
    const existingUserState = currentUserStates.get(variable.name)
    if (existingUserState) {
      // 恢复用户状态
      return {
        ...variable,
        displayValue: existingUserState.displayValue ?? getVariableDisplayValue(variable.value),
        booleanValue: existingUserState.booleanValue ?? (variable.var_type === 'boolean' ? (variable.value === true || variable.value === 'true') : undefined),
        fileName: existingUserState.fileName,
        fileObject: existingUserState.fileObject,
        fileUploaded: existingUserState.fileUploaded ?? false,
        fileList: existingUserState.fileList ?? [],
        fileListUploaded: existingUserState.fileListUploaded ?? false,
        stringArray: existingUserState.stringArray ?? (variable.var_type === 'array[string]' && Array.isArray(variable.value) ? [...variable.value] : []),
        stringArrayInput: existingUserState.stringArrayInput ?? ''
      }
    } else {
      // 初次创建，使用默认值
      let fileName: string | undefined = undefined
      let fileList: Array<{ name: string; file?: File }> = []
      let fileObject: File | undefined = undefined
      let fileUploaded: boolean = false
      let fileListUploaded: boolean = false
      
      // 从后端返回的文件变量数据中提取文件名
      if (variable.var_type === 'file' && variable.value) {
        try {
          let fileValue = variable.value
          if (typeof fileValue === 'string') {
            fileValue = JSON.parse(fileValue)
          }
          
          if (typeof fileValue === 'object' && fileValue !== null) {
            if (fileValue.file_id) {
              fileName = `已上传文件 (${fileValue.file_id.substring(0, 8)}...)`
              fileUploaded = true
            }
          }
        } catch (e) {
          // 解析失败，使用默认值
        }
      } else if (variable.var_type === 'array[file]' && variable.value) {
        try {
          let fileValue = variable.value
          if (typeof fileValue === 'string') {
            fileValue = JSON.parse(fileValue)
          }
          
          if (typeof fileValue === 'object' && fileValue !== null && Array.isArray(fileValue.file_ids)) {
            fileList = fileValue.file_ids.map((fileId: string) => ({
              name: `已上传文件 (${fileId.substring(0, 8)}...)`
            }))
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
    }
  })
}

// 获取变量显示值
const getVariableDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// 获取变量类型图标
const getVariableTypeIcon = (type: string): string => {
  switch (type) {
    case 'string':
      return '📝'
    case 'number':
      return '🔢'
    case 'boolean':
      return '🔘'
    case 'object':
      return '📋'
    case 'secret':
      return '🔐'
    case 'file':
      return '📎'
    case 'array[string]':
      return '📝'
    case 'array[file]':
      return '📎'
    default:
      return '⚙️'
  }
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
  return FILE_ACCEPT_TYPES
}

// 获取文件上传提示信息
const getFileUploadTip = (variable: Variable): string => {
  if (variable.var_type === 'file') {
    return `${getFileAcceptTypes()} 文件，单个文件不超过 ${getVariableMaxFileSize(variable)}MB`
  } else if (variable.var_type === 'array[file]') {
    return `${getFileAcceptTypes()} 文件，最多 ${getVariableMaxFiles(variable)} 个文件，单个文件不超过 ${getVariableMaxFileSize(variable)}MB`
  }
  return `${getFileAcceptTypes()} 文件`
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

// 处理变量输入事件
const handleVariableInput = (variable: Variable) => {
}

// 更新布尔变量
const updateBooleanVariable = async (variable: Variable) => {
  if (!props.conversationId) {
    return
  }

  try {
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        conversation_id: props.conversationId,
        flow_id: props.appId
      },
      { 
        value: variable.booleanValue,
        var_type: variable.var_type,
        description: variable.description
      }
    )

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
  variable.fileObject = file.raw || file
  variable.fileUploaded = false
  
  // 🔑 重要：文件发生变化时，重置更新标志
  hasUpdatedVariables.value = false
  
  // 🔑 与DebugVariablePanel保持一致：没有conversationId时只做本地存储
  if (!props.conversationId) {
    ElMessage.success('文件已选择，开始对话后将上传')
    return
  }
  
  // 🔑 有conversationId时才通过batchUpdateVariables处理上传
  // 注意：不直接在这里上传，而是等待batchUpdateVariables统一处理
}

// 清除文件变量
const clearFileVariable = async (variable: Variable) => {
  // 🔑 重要优化：只做前端缓存清理，不立即调用后端API
  // 后端状态将在开始对话时通过两阶段处理统一更新
  variable.fileName = undefined
  variable.fileObject = undefined
  variable.fileUploaded = false
  
  // 🔑 重要：文件发生变化时，重置更新标志
  hasUpdatedVariables.value = false
  
  // 🔑 与新的两阶段处理设计保持一致：
  // 1. 删除操作只影响前端缓存
  // 2. 后端变量池的更新留给batchUpdateVariables处理
  // 3. 这样确保所有变量更新都在同一个事务中，避免状态冲突
  
  ElMessage.success('文件已移除，开始对话时将同步到后端')
}

// 处理文件数组选择
const handleFileArrayChange = async (variable: Variable, fileList: any[]) => {
  if (!variable.fileList) {
    variable.fileList = []
  }
  
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
  
  // 🔑 重要：文件发生变化时，重置更新标志
  hasUpdatedVariables.value = false
  
  // 🔑 与DebugVariablePanel保持一致：没有conversationId时只做本地存储
  if (!props.conversationId) {
    ElMessage.success('文件已选择，开始对话时将上传')
    return
  }
  
  // 🔑 有conversationId时才通过batchUpdateVariables处理上传
  // 注意：不直接在这里上传，而是等待batchUpdateVariables统一处理
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
  if (!variable.stringArrayInput || !variable.stringArrayInput.trim()) return
  
  if (!variable.stringArray) {
    variable.stringArray = []
  }
  
  const value = variable.stringArrayInput.trim()
  if (!variable.stringArray.includes(value)) {
    variable.stringArray.push(value)
    variable.stringArrayInput = ''
  }
}

// 从字符串数组中移除项
const removeStringFromArray = (variable: Variable, index: number) => {
  if (!variable.stringArray) return
  variable.stringArray.splice(index, 1)
}

// 批量更新所有变量到后端
const batchUpdateVariables = async (): Promise<boolean> => {
  if (!props.conversationId) {
    return false
  }

  // 🔑 重要：防止重复调用，避免清空已上传的文件
  if (hasUpdatedVariables.value) {
    return true
  }

  const editableVariables = internalVariables.value.filter(isEditableVariable)

  if (editableVariables.length === 0) {
    hasUpdatedVariables.value = true
    return true
  }

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
          if (variable.var_type === 'boolean') {
            processedValue = variable.booleanValue
          } else if (variable.var_type === 'number' && variable.displayValue) {
            const numValue = Number(variable.displayValue)
            processedValue = isNaN(numValue) ? variable.value : numValue
          } else if (variable.var_type === 'object' && variable.displayValue) {
            try {
              processedValue = JSON.parse(variable.displayValue)
            } catch (error) {
              processedValue = variable.displayValue
            }
          } else if (variable.var_type === 'array[string]') {
            processedValue = variable.stringArray || []
          } else {
            processedValue = variable.displayValue || variable.value
          }
        }
        
        await updateVariable(
          { 
            name: variable.name, 
            scope: 'conversation',
            conversation_id: props.conversationId,
            flow_id: props.appId
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
              props.conversationId!,
              variable.name,
              variable.var_type,
              'conversation',
              props.appId
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
                await deleteSession({ conversationList: [props.conversationId!] })
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
    
    // 🔑 重要：标记变量已更新，防止重复调用
    hasUpdatedVariables.value = true
    
    return true
  } catch (error) {
    console.error('批量更新变量失败:', error)
    ElMessage.error('变量更新失败，无法开始对话')
    return false
  }
}

// 这些函数已被新的两阶段批量处理逻辑替代，不再需要

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

// 处理开始对话
const handleStartConversation = async () => {
  isStarting.value = true
  try {
    // 🔑 重要修复：处理conversationId不存在的情况
    if (props.conversationId) {
      // 如果conversationId已存在，先执行变量更新再开始对话
      const updateSuccess = await batchUpdateVariables()
      if (!updateSuccess) {
        ElMessage.error('变量更新失败，无法开始对话')
        return
      }
      
      // 变量更新成功后，再通知父组件开始对话
      emit('startConversation')
    } else {
      // 🔑 新增：如果conversationId不存在，先开始对话（创建conversation），然后更新变量
      emit('startConversation')
      
      // 等待父组件创建conversation并设置conversationId
      // 使用轮询方式等待conversationId
      let retryCount = 0
      const maxRetries = 10
      
      while (!props.conversationId && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 等待500ms
        retryCount++
      }
      
      if (props.conversationId) {
        const updateSuccess = await batchUpdateVariables()
        if (!updateSuccess) {
          ElMessage.warning('文件变量更新失败，可能影响对话效果')
        }
      } else {
        ElMessage.warning('无法更新变量，对话可能受到影响')
      }
    }
    
  } catch (error) {
    console.error('开始对话失败:', error)
    ElMessage.error('开始对话失败')
  } finally {
    isStarting.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  batchUpdateVariables
})

// 组件销毁时清理文件缓存
onUnmounted(() => {
  internalVariables.value.forEach(variable => {
    if (variable.fileObject) {
      variable.fileObject = undefined
      variable.fileName = undefined
      variable.fileUploaded = false
    }
    if (variable.fileList) {
      variable.fileList = []
      variable.fileListUploaded = false
    }
  })
})

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

// 监听内部变量变化，在数据加载完成后判断是否需要最小化
watch(
  () => internalVariables.value,
  (newInternalVariables) => {
    // 只有在数据不为空（即已经完成初始化）且没有可编辑变量时才最小化
    // 避免在组件刚挂载时就最小化
    if (newInternalVariables !== null && shouldDefaultMinimize.value && !props.isMinimized && !props.variablesLoading) {
      emit('minimize')
    }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.dialogue-variable-panel {
  background: var(--o-bg-color-base, #ffffff);
  border: 1px solid var(--o-border-color-light, #dcdfe6);
  border-radius: 12px;
  margin-bottom: 16px;
  margin-top: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 90%;
  max-width: 800px;
  box-shadow: var(--o-shadow-base, 0 4px 12px rgba(0, 0, 0, 0.08));

  &.panel-minimized {
    width: 60%;
    max-width: 500px;
    
    .panel-header {
      padding: 8px 16px;
      border-bottom: none;
      
      .header-title {
        font-size: 12px !important;
      }
      
      .variable-icon {
        font-size: 14px;
      }
    }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, var(--o-color-primary-light-9, #f2f6fc), var(--o-color-primary-light-8, #ecf2ff));
    border-bottom: 1px solid var(--o-border-color-lighter, #e4e7ed);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .variable-icon {
        font-size: 20px;
        background: var(--o-color-primary-light-9, #f2f6fc);
        padding: 8px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--o-text-color-primary, #303133);
        letter-spacing: 0.5px;
      }
    }

    .header-right {
      .el-button {
        font-size: 12px;
        padding: 4px 8px;
        
        &:hover {
          background: var(--o-color-primary-light-9, #f2f6fc);
        }
      }
    }
  }

  .panel-content {
    padding: 20px;

    .variable-list {
      margin-bottom: 32px;
      
      .variable-item {
        margin-bottom: 12px;
        padding: 12px;
        background: var(--o-fill-color-extra-light, #f8f9fa);
        border-radius: 6px;
        border: 1px solid var(--o-border-color-lighter, #e4e7ed);
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--o-color-primary-light-7, #c6e2ff);
          background: var(--o-color-primary-light-9, #f2f6fc);
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
              color: var(--o-color-primary, #409eff);
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
                color: var(--o-text-color-primary, #303133);
                line-height: 1.2;
              }

              .variable-type {
                font-size: 11px;
                color: var(--o-text-color-secondary, #606266);
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
            
            // 重置 wrapper 的样式，避免与 inner 重叠
            :deep(.el-input__wrapper) {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              padding: 0 !important;
              
              &:hover {
                border: none !important;
                box-shadow: none !important;
              }
              
              &.is-focus {
                border: none !important;
                box-shadow: none !important;
              }
            }
            
            :deep(.el-textarea__wrapper) {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              padding: 0 !important;
              
              &:hover {
                border: none !important;
                box-shadow: none !important;
              }
              
              &.is-focus {
                border: none !important;
                box-shadow: none !important;
              }
            }
            
            // 只在 inner 上应用样式
            :deep(.el-input__inner),
            :deep(.el-textarea__inner) {
              border-radius: 6px;
              border: 2px solid var(--o-border-color-light, #dcdfe6);
              background: var(--o-bg-color-base, #ffffff);
              font-size: 14px;
              padding: 12px 16px;
              transition: all 0.2s ease;
              
              &:focus {
                border-color: var(--o-color-primary, #409eff);
                box-shadow: 0 0 0 3px var(--o-color-primary-light-9, #f2f6fc);
              }
              
              &:hover {
                border-color: var(--o-color-primary-light-7, #c6e2ff);
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
                border: 2px dashed var(--o-border-color, #dcdfe6);
                border-radius: 8px;
                background: var(--o-fill-color-extra-light, #f8f9fa);
                transition: all 0.3s ease;
                
                &:hover {
                  border-color: var(--o-color-primary, #409eff);
                  background: var(--o-color-primary-light-9, #f2f6fc);
                }
                
                &.is-dragover {
                  border-color: var(--o-color-primary, #409eff);
                  background: var(--o-color-primary-light-8, #ecf2ff);
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
                  color: var(--o-color-primary, #409eff);
                  margin-bottom: 8px;
                }
                
                .upload-text {
                  text-align: center;
                  
                  span {
                    display: block;
                    font-size: 14px;
                    color: var(--o-text-color-primary, #303133);
                    margin-bottom: 4px;
                  }
                  
                  .upload-hint {
                    font-size: 12px;
                    color: var(--o-text-color-secondary, #606266);
                  }
                }
              }
              
              .upload-tip {
              margin-top: 8px;
                font-size: 12px;
                color: var(--o-text-color-secondary, #606266);
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
                background: var(--o-fill-color-extra-light, #f8f9fa);
                border: 1px solid var(--o-border-color-lighter, #e4e7ed);
                border-radius: 6px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
                
                &:hover {
                  background: var(--o-fill-color-light, #f5f7fa);
                  border-color: var(--o-color-primary-light-7, #c6e2ff);
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
                    color: var(--o-color-primary, #409eff);
                    margin-right: 8px;
                    flex-shrink: 0;
                  }
                
                  .file-name {
                    font-size: 13px;
                    color: var(--o-text-color-primary, #303133);
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
                      color: var(--o-color-success, #67c23a);
                      background: var(--o-color-success-light-9, #f0f9ff);
                    }
                    
                    &.pending {
                      color: var(--o-color-warning, #e6a23c);
                      background: var(--o-color-warning-light-9, #fdf6ec);
                    }
                  }
                }
                
                .file-remove {
                  flex-shrink: 0;
                  margin-left: 8px;
                  
                  &:hover {
                    color: var(--o-color-danger, #f56c6c);
                    background: var(--o-color-danger-light-9, #fef0f0);
                  }
                }
              }
            }
          }

          .string-array-section {
            .array-input {
              width: 100%;
              margin-bottom: 12px;
            }

            .string-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }
            }
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--o-text-color-secondary, #606266);

        .empty-text {
          font-size: 16px;
          color: var(--o-text-color-regular, #909399);
          font-weight: 500;
        }
      }
    }

    .start-conversation-btn {
      text-align: center;
      padding-top: 8px;
      border-top: 1px solid var(--o-border-color-lighter, #e4e7ed);
      
      .start-btn {
        width: 100%;
        height: 48px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(135deg, var(--o-color-primary, #409eff), var(--o-color-primary-light-3, #79bbff));
        border: none;
        box-shadow: 0 2px 8px var(--o-color-primary-light-8, #ecf2ff);
        transition: all 0.2s ease;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--o-color-primary-light-7, #c6e2ff);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
    }
  }
}
</style> 