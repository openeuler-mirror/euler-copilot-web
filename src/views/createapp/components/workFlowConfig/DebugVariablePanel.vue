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
                  @input="handleVariableInput(variable)"
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
                  @input="handleVariableInput(variable)"
                  class="variable-input"
                />
                
                <!-- 其他类型：默认输入框 -->
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
  conversationId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['toggleVisibility', 'variableUpdated'])

// 内部独立的变量状态（与外部props解耦）
const internalVariables = ref<Variable[]>([])

// 计算属性：检查是否应该默认折叠
const shouldDefaultCollapse = computed(() => {
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

// 初始化内部变量状态
const initializeInternalVariables = () => {
  // 只显示用户可编辑的 conversation 变量，过滤掉系统变量和 node 变量
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
}

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

// 批量更新所有变量到后端
const batchUpdateVariables = async (conversationId: string) => {
  if (!conversationId) {
    return false;
  }

  // 只更新用户可编辑的变量
  const editableVariables = internalVariables.value.filter(isEditableVariable)

  if (editableVariables.length === 0) {
    return true;
  }

  try {
    const updatePromises = editableVariables.map(async (variable) => {
      const updateParams = {
        name: variable.name,
        scope: 'conversation',
        conversation_id: conversationId,
        flow_id: props.flowId
      };
      
      // 根据变量类型处理值
      let processedValue = variable.displayValue || variable.value;
      
      // 特殊类型的值处理
      if (variable.var_type === 'boolean') {
        processedValue = variable.booleanValue;
      } else if (variable.var_type === 'number' && variable.displayValue) {
        const numValue = Number(variable.displayValue);
        processedValue = isNaN(numValue) ? variable.value : numValue;
      } else if (variable.var_type === 'object' && variable.displayValue) {
        try {
          processedValue = JSON.parse(variable.displayValue);
        } catch (error) {
          console.warn(`⚠️ 变量 ${variable.name} JSON 解析失败，使用原始值`);
          processedValue = variable.displayValue;
        }
      } else if (variable.var_type === 'array[string]') {
        processedValue = variable.stringArray || [];
      } else if (variable.var_type === 'file') {
        processedValue = variable.fileName ? { name: variable.fileName } : null;
      } else if (variable.var_type === 'array[file]') {
        processedValue = variable.fileList ? variable.fileList.map(f => ({ name: f.name })) : [];
      }
      
      const updateData = {
        value: processedValue,
        var_type: variable.var_type,
        description: variable.description
      };
      
      try {
        const result = await updateVariable(updateParams, updateData);
        return { success: true, variable: variable.name };
      } catch (error) {
        console.error(`❌ 变量 ${variable.name} 更新失败:`, error);
        return { success: false, variable: variable.name, error };
      }
    });
    
    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
        
    if (successCount > 0) {
      emit('variableUpdated');
    }
    
    return successCount > 0; // 只要有一个成功就继续
  } catch (error) {
    console.error('❌ 批量更新变量失败:', error);
    return false;
  }
};

// 处理变量输入事件（不触发API调用）
const handleVariableInput = (variable: Variable) => {
  // 只做本地状态更新，不调用API
};

// 暴露方法给父组件调用
defineExpose({
  batchUpdateVariables
});

// 更新布尔变量
const updateBooleanVariable = async (variable: Variable) => {
  if (!props.conversationId) {
    ElMessage.error('缺少对话ID，无法保存变量')
    return
  }

  try {
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        conversation_id: props.conversationId,
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
        conversation_id: props.conversationId,
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
        conversation_id: props.conversationId,
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
        conversation_id: props.conversationId,
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
        conversation_id: props.conversationId,
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
  if (!props.conversationId) {
    ElMessage.error('缺少对话ID，无法保存变量')
    return
  }

  try {
    await updateVariable(
      { 
        name: variable.name, 
        scope: 'conversation',
        conversation_id: props.conversationId,
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
  if (!props.conversationId) {
    ElMessage.error('缺少对话ID，无法保存变量')
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
        conversation_id: props.conversationId,
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

// 监听props变化，重新初始化内部变量（只在外部数据源变化时）
watch(
  () => props.conversationVariables,
  (newVariables) => {
    if (newVariables && newVariables.length >= 0) {
      initializeInternalVariables();
    }
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