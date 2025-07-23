<template>
  <div class="dialogue-variable-panel" :class="{ 'panel-minimized': isMinimized }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <div class="variable-icon">💬</div>
        <span class="header-title">新对话设置</span>
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
    <div v-if="!isMinimized" class="panel-content">
      <div class="variable-list" v-loading="variablesLoading || false">
        <!-- 对话变量展示 -->
        <div 
          v-for="variable in internalVariables" 
          :key="`conv_${variable.name}`"
          class="variable-item"
        >
          <div class="variable-label">
            <span class="variable-type-icon">{{ getVariableTypeIcon(variable.var_type) }}</span>
            {{ variable.name }}
          </div>
          <div class="variable-note">可选</div>
          <div class="variable-input-wrapper">
            <!-- String 和 Number 类型：普通输入框 -->
            <el-input
              v-if="variable.var_type === 'string' || variable.var_type === 'number'"
              v-model="variable.displayValue"
              :placeholder="getVariablePlaceholder(variable)"
              :type="variable.var_type === 'number' ? 'number' : 'text'"
              size="default"
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
            
            <!-- File 类型：文件上传 -->
            <div v-else-if="variable.var_type === 'file'" class="file-upload-section">
              <el-upload
                class="variable-file-upload"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="(file) => handleFileChange(variable, file)"
                :accept="getFileAcceptTypes()"
              >
                <el-button size="default" type="primary">
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
import { ref, computed, watch } from 'vue'
import { ElMessage, ElTag, ElSwitch, ElUpload } from 'element-plus'
import { IconUpload, IconDelete } from '@computing/opendesign-icons'
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
  isMinimized: boolean
  conversationVariables: Variable[]
  variablesLoading?: boolean
  conversationId?: string
  appId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['expand', 'startConversation', 'variableUpdated'])

// 内部独立的变量状态
const internalVariables = ref<Variable[]>([])
const isStarting = ref(false)

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

// 初始化内部变量状态
const initializeInternalVariables = () => {
  // 只显示用户可编辑的 conversation 变量
  const editableVariables = props.conversationVariables.filter(isEditableVariable)
  
  internalVariables.value = editableVariables.map(variable => ({
    ...variable,
    displayValue: getVariableDisplayValue(variable.value),
    // 初始化特殊类型的属性
    booleanValue: variable.var_type === 'boolean' ? (variable.value === true || variable.value === 'true') : undefined,
    fileName: variable.var_type === 'file' && variable.value?.name ? variable.value.name : undefined,
    fileList: variable.var_type === 'array[file]' && Array.isArray(variable.value) 
      ? variable.value.map(v => ({ name: v.name || v, file: v })) 
      : [],
    stringArray: variable.var_type === 'array[string]' && Array.isArray(variable.value) 
      ? [...variable.value] 
      : [],
    stringArrayInput: ''
  }))
  
  console.log('💬 对话变量面板初始化，可编辑变量:', internalVariables.value.map(v => `${v.name}(${v.scope})`))
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
  return '.pdf,.docx,.doc,.txt,.md,.xlsx'
}

// 处理变量输入事件
const handleVariableInput = (variable: Variable) => {
  console.log('🔧 变量值更新:', variable.name, '=', variable.displayValue)
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
  // 这里可以添加文件上传逻辑
}

// 清除文件变量
const clearFileVariable = async (variable: Variable) => {
  variable.fileName = undefined
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
    console.log('❌ 缺少对话ID，无法批量更新变量')
    return false
  }

  const editableVariables = internalVariables.value.filter(isEditableVariable)

  if (editableVariables.length === 0) {
    console.log('📋 没有可编辑变量需要更新')
    return true
  }

  try {
    console.log('🔄 开始批量更新变量到后端...')
    console.log('📋 对话ID:', props.conversationId)
    console.log('📋 要更新的可编辑变量:', editableVariables.map(v => v.name))
    
    const updatePromises = editableVariables.map(async (variable) => {
      const updateParams = {
        name: variable.name,
        scope: 'conversation',
        conversation_id: props.conversationId,
        flow_id: props.appId
      }
      
      // 根据变量类型处理值
      let processedValue = variable.displayValue || variable.value
      
      // 特殊类型的值处理
      if (variable.var_type === 'boolean') {
        processedValue = variable.booleanValue
      } else if (variable.var_type === 'number' && variable.displayValue) {
        const numValue = Number(variable.displayValue)
        processedValue = isNaN(numValue) ? variable.value : numValue
      } else if (variable.var_type === 'object' && variable.displayValue) {
        try {
          processedValue = JSON.parse(variable.displayValue)
        } catch (error) {
          console.warn(`⚠️ 变量 ${variable.name} JSON 解析失败，使用原始值`)
          processedValue = variable.displayValue
        }
      } else if (variable.var_type === 'array[string]') {
        processedValue = variable.stringArray || []
      } else if (variable.var_type === 'file') {
        processedValue = variable.fileName ? { name: variable.fileName } : null
      }
      
      const updateData = {
        value: processedValue,
        var_type: variable.var_type,
        description: variable.description
      }
      
      try {
        const result = await updateVariable(updateParams, updateData)
        console.log(`✅ 变量 ${variable.name} 更新成功:`, result)
        return { success: true, variable: variable.name }
      } catch (error) {
        console.error(`❌ 变量 ${variable.name} 更新失败:`, error)
        return { success: false, variable: variable.name, error }
      }
    })
    
    const results = await Promise.all(updatePromises)
    const successCount = results.filter(r => r.success).length
    
    console.log(`📊 变量更新结果: 成功 ${successCount}/${results.length}`)
    
    if (successCount > 0) {
      emit('variableUpdated')
    }
    
    return successCount > 0
  } catch (error) {
    console.error('❌ 批量更新变量失败:', error)
    return false
  }
}

// 处理开始对话
const handleStartConversation = async () => {
  isStarting.value = true
  try {
    // 先更新所有变量
    await batchUpdateVariables()
    
    // 通知父组件开始对话
    emit('startConversation')
  } catch (error) {
    console.error('开始对话失败:', error)
    ElMessage.error('开始对话失败')
  } finally {
    isStarting.value = false
  }
}

// 监听props变化，重新初始化内部变量
watch(
  () => props.conversationVariables,
  (newVariables) => {
    if (newVariables && newVariables.length >= 0) {
      console.log('📡 外部变量数据变化，重新初始化内部状态')
      initializeInternalVariables()
    }
  },
  { immediate: true }
)

// 暴露方法给父组件调用
defineExpose({
  batchUpdateVariables
})
</script>

<style lang="scss" scoped>
.dialogue-variable-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  margin-bottom: 16px;
  margin-top: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 90%;
  max-width: 800px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  &.panel-minimized {
    width: 60%;
    max-width: 500px;
    
    .panel-header {
      padding: 8px 16px;
      border-bottom: none;
      
      .header-title {
        font-size: 12px;
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
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .variable-icon {
        font-size: 20px;
        background: var(--el-color-primary-light-9);
        padding: 8px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        letter-spacing: 0.5px;
      }
    }

    .header-right {
      .el-button {
        font-size: 12px;
        padding: 4px 8px;
        
        &:hover {
          background: var(--el-color-primary-light-9);
        }
      }
    }
  }

  .panel-content {
    padding: 20px;

    .variable-list {
      margin-bottom: 32px;
      
      .variable-item {
        margin-bottom: 24px;
        padding: 20px;
        background: var(--el-fill-color-extra-light);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: var(--el-color-primary-light-7);
          background: var(--el-color-primary-light-9);
        }
        
        &:last-child {
          margin-bottom: 0;
        }

        .variable-label {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          
          .variable-type-icon {
            margin-right: 8px;
            font-size: 16px;
          }
        }

        .variable-note {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          margin-bottom: 12px;
          padding: 4px 8px;
          background: var(--el-color-warning-light-9);
          border-radius: 4px;
          display: inline-block;
        }

        .variable-input-wrapper {
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
              border: 2px solid var(--el-border-color-light);
              background: var(--el-bg-color);
              font-size: 14px;
              padding: 12px 16px;
              transition: all 0.2s ease;
              
              &:focus {
                border-color: var(--el-color-primary);
                box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
              }
              
              &:hover {
                border-color: var(--el-color-primary-light-7);
              }
            }
          }

          .variable-switch {
            display: flex;
            align-items: center;
          }

          .file-upload-section {
            .variable-file-upload {
              width: 100%;
              
              :deep(.el-upload) {
                width: 100%;
              }
            }

            .selected-file {
              margin-top: 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 12px;
              background: var(--el-fill-color-extra-light);
              border-radius: 6px;
              
              .file-name {
                font-size: 13px;
                color: var(--el-text-color-regular);
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
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

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--el-text-color-secondary);

        .empty-text {
          font-size: 16px;
          color: var(--el-text-color-regular);
          font-weight: 500;
        }
      }
    }

    .start-conversation-btn {
      text-align: center;
      padding-top: 8px;
      border-top: 1px solid var(--el-border-color-lighter);
      
      .start-btn {
        width: 100%;
        height: 48px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        border: none;
        box-shadow: 0 2px 8px var(--el-color-primary-light-8);
        transition: all 0.2s ease;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--el-color-primary-light-7);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
    }
  }
}
</style> 