<template>
  <div class="direct-reply-drawer">
    <el-drawer
      v-model="drawerVisible"
      :show-close="false"
      :modal="true"
      modal-class="transparent-modal"
      class="flowDrawer"
      size="60%"
      @close="closeDrawer"
    >
      <template #header>
        <div class="drawer-header">
          <div class="header-title">
            <div class="reply-icon">💬</div>
            <span>{{ $t('flow.step_configuration') }} - {{ nodeName }}</span>
          </div>
        </div>
      </template>

      <template #default>
        <div class="drawer-body">
          <el-collapse v-model="activeName" class="o-hpc-collapse">
            
            <!-- 基本信息 -->
            <el-collapse-item name="basic" class="basic-panel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('basic') }">
                  <IconCaretRight />
                </el-icon>
                <span>基本信息</span>
              </template>
              <div class="basic-content">
                <el-form :model="nodeConfig" label-position="left" label-width="120px">
                  <el-form-item label="节点名称" required>
                    <el-input
                      v-model="nodeConfig.name"
                      placeholder="请输入节点名称"
                      maxlength="50"
                      clearable
                    />
                  </el-form-item>
                  <el-form-item label="节点描述">
                    <el-input
                      v-model="nodeConfig.description"
                      type="textarea"
                      :rows="3"
                      placeholder="请输入节点描述"
                      maxlength="200"
                      show-word-limit
                    />
                  </el-form-item>
                </el-form>
              </div>
            </el-collapse-item>

            <!-- 回复内容 -->
            <el-collapse-item name="content" class="content-panel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('content') }">
                  <IconCaretRight />
                </el-icon>
                <span>回复内容</span>
              </template>
                                            <div class="content-section">
                 <!-- 文本编辑器 -->
                 <VariableRichTextEditor
                   ref="textEditorRef"
                   v-model="nodeConfig.answer"
                   :flow-id="flowId"
                   :current-step-id="nodeId"
                   placeholder="请输入回复内容，可以使用变量插入功能..."
                   @variable-inserted="handleFileVariableInserted"
                 />
                
                <!-- 字符统计 -->
                <div class="char-count">
                  {{ getCharCount() }} 字符
                </div>
                

                
                <!-- 文件变量附件区域 -->
                <div v-if="nodeConfig.fileVariables && nodeConfig.fileVariables.length > 0" class="file-variables-section">
                  <div class="file-variables-header">
                    <span class="header-icon">
                      <AttachmentIcon />
                    </span>
                    <span class="header-title">附件变量</span>
                    <span class="file-count">({{ nodeConfig.fileVariables.length }})</span>
                  </div>
                  <div class="file-variables-list">
                    <div 
                      v-for="(fileVar, index) in nodeConfig.fileVariables" 
                      :key="fileVar.variableName"
                      class="file-variable-card"
                    >
                      <div class="file-icon">
                        <SingleFileIcon v-if="fileVar.fileType === 'file'" />
                        <MultipleFilesIcon v-else-if="fileVar.fileType === 'array[file]'" />
                        <AttachmentIcon v-else />
                      </div>
                      <div class="file-info">
                        <div class="file-name">{{ fileVar.displayName }}</div>
                        <div class="file-variable">{{ formatVariableDisplay(fileVar.variableName) }}</div>
                        <div class="file-type">{{ fileVar.fileType === 'file' ? '单文件' : '多文件' }}</div>
                      </div>
                      <div class="file-actions">
                        <el-button 
                          size="small" 
                          type="danger" 
                          text 
                          @click="removeFileVariable(index)"
                          title="移除附件变量"
                        >
                          ✕
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </template>
      
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="closeDrawer">{{ $t('main.close') }}</el-button>
          <el-button type="primary" @click="saveNode">
            {{ $t('semantic.submit') }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { IconCaretRight } from '@computing/opendesign-icons'
import VariableRichTextEditor from '@/components/VariableRichTextEditor.vue'
import AttachmentIcon from '@/components/icons/AttachmentIcon.vue'
import SingleFileIcon from '@/components/icons/SingleFileIcon.vue'
import MultipleFilesIcon from '@/components/icons/MultipleFilesIcon.vue'



interface NodeConfig {
  name: string
  description: string
  answer: string
  fileVariables?: Array<{
    variableName: string
    fileName: string
    fileType: string
    displayName: string
  }>
}

interface Props {
  visible: boolean
  nodeData: any
  nodeId: string
  flowId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible', 'saveNode'])

// const { t } = useI18n() // 暂时不使用

// 响应式数据
const drawerVisible = ref(false)
const activeName = ref(['basic', 'content'])
const nodeName = ref('回答')
const textEditorRef = ref()



// 节点配置
const nodeConfig = ref<NodeConfig>({
  name: '回答',
  description: '',
  answer: '',
  fileVariables: []
})

// 监听显示状态
watch(() => props.visible, (newVal) => {
  drawerVisible.value = newVal
  if (newVal) {
    initializeNodeData()
  }
})

watch(drawerVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

// 初始化节点数据
const initializeNodeData = () => {
  if (props.nodeData) {
    // 从attachment字典中恢复fileVariables数组
    const attachment = props.nodeData.parameters?.input_parameters?.attachment
    
    let fileVariables: any[] = []
    
    if (attachment && typeof attachment === 'object' && !Array.isArray(attachment)) {
      // 新格式：attachment是对象字典
      fileVariables = Object.entries(attachment).map(([key, varInfo]: [string, any]) => {
        return {
          variableName: varInfo.variableName || key,
          fileName: varInfo.variableName || key,
          fileType: varInfo.fileType || 'file',
          displayName: varInfo.displayName || `conversation.${key}`
        }
      })
    }
    
    nodeConfig.value = {
      name: props.nodeData.name || '回答',
      description: props.nodeData.description || '',
      answer: props.nodeData.parameters?.input_parameters?.answer || '',
      fileVariables: fileVariables
    }

    nodeName.value = nodeConfig.value.name
  }
}

const getCharCount = (): number => {
  if (!nodeConfig.value.answer) return 0
  // 移除变量标签，只计算实际文本字符数
  const textOnly = nodeConfig.value.answer.replace(/\{\{[^}]+\}\}/g, '')
  return textOnly.length
}

// 处理文件变量插入
const handleFileVariableInserted = (variable: any) => {
  // 如果传入的是Variable对象
  if (typeof variable === 'object' && variable.var_type) {
    if (variable.var_type === 'file' || variable.var_type === 'array[file]') {
      // 检查是否已存在相同的文件变量
      const existingIndex = nodeConfig.value.fileVariables?.findIndex(f => f.variableName === variable.name)
      if (existingIndex !== undefined && existingIndex >= 0) {
        ElMessage.warning(`文件变量 ${variable.name} 已存在，无需重复添加`)
        return
      }
      
      // 添加到文件变量列表中而不是插入到文本编辑器
      const fileVar = {
        variableName: variable.name,
        fileName: variable.name,
        fileType: variable.var_type,
        displayName: getVariableDisplayName(variable)
      }
      
      // 添加新的文件变量
      if (!nodeConfig.value.fileVariables) {
        nodeConfig.value.fileVariables = []
      }
      nodeConfig.value.fileVariables.push(fileVar)
    }
  }
  // 如果传入的是字符串变量名（向后兼容）
  else if (typeof variable === 'string') {
    // 这里需要根据变量名查找变量类型，暂时跳过
    console.log('收到字符串变量名:', variable)
  }
}

// 获取变量显示名称
const getVariableDisplayName = (variable: any): string => {
  if (variable.scope === 'system') {
    const nameMap: Record<string, string> = {
      'query': 'system.query',
      'files': 'system.files',
      'dialogue_count': 'system.dialogue_count',
      'app_id': 'system.app_id',
      'flow_id': 'system.flow_id',
      'user_id': 'system.user_id',
      'session_id': 'system.session_id',
      'timestamp': 'system.timestamp'
    }
    return nameMap[variable.name] || `system.${variable.name}`
  }
  
  // 特殊处理具备step_id的conversation变量
  if (variable.scope === 'conversation' && variable.step_id && variable.step) {
    return `${variable.step}.${variable.name}`
  }
  
  return `${variable.scope}.${variable.name}`
}

// 移除文件变量
const removeFileVariable = (index: number) => {
  if (nodeConfig.value.fileVariables) {
    nodeConfig.value.fileVariables.splice(index, 1)
  }
}

// 格式化变量显示
const formatVariableDisplay = (variableName: string) => {
  return `变量: {{${variableName}}}`
}

const closeDrawer = () => {
  drawerVisible.value = false
}

const saveNode = () => {
  // 验证必填字段
  if (!nodeConfig.value.name.trim()) {
    ElMessage.error('请输入节点名称')
    return
  }

  // 构造保存数据
  const saveData = {
    name: nodeConfig.value.name,
    description: nodeConfig.value.description,
    callId: 'DirectReply',
    parameters: {
      input_parameters: {
        answer: nodeConfig.value.answer,
        attachment: nodeConfig.value.fileVariables?.reduce((acc, fileVar) => {
          acc[fileVar.variableName] = {
            variableName: fileVar.variableName,
            displayName: fileVar.displayName,
            fileType: fileVar.fileType
          }
          return acc
        }, {} as Record<string, any>) || {}
      },
      output_parameters: {}
    }
  }

  emit('saveNode', saveData, props.nodeId)
  closeDrawer()
}



// 生命周期
onMounted(() => {
  if (props.visible) {
    drawerVisible.value = true
    initializeNodeData()
  }
})
</script>

<style scoped lang="scss">
.direct-reply-drawer {
  .drawer-header {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      
      .reply-icon {
        font-size: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }

  .drawer-body {
    padding: 0;

    .basic-content {
      padding: 16px;
    }

    .content-section {
      padding: 16px;



      .char-count {
        text-align: right;
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
      }
      
      .file-variables-section {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #ebeef5;
        
        .file-variables-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          
          .header-icon {
            width: 16px;
            height: 16px;
            color: #606266;
            
            svg {
              width: 100%;
              height: 100%;
            }
          }
          
          .file-count {
            color: #909399;
            font-weight: normal;
          }
        }
        
        .file-variables-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .file-variable-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          background-color: #f8f9fa;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: #c0c4cc;
            background-color: #f5f7fa;
          }
          
          .file-icon {
            width: 20px;
            height: 20px;
            min-width: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #409eff;
            
            svg {
              width: 100%;
              height: 100%;
            }
          }
          
          .file-info {
            flex: 1;
            min-width: 0;
            
            .file-name {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .file-variable {
              font-size: 12px;
              color: #606266;
              margin-top: 2px;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              background-color: #f1f2f3;
              padding: 2px 6px;
              border-radius: 3px;
              display: inline-block;
            }
            
            .file-type {
              font-size: 12px;
              color: #909399;
              margin-top: 4px;
            }
          }
          
          .file-actions {
            .el-button {
              padding: 4px 8px;
              
              &:hover {
                color: #f56c6c;
              }
            }
          }
        }
      }
    }
  }

  .drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px;
    border-top: 1px solid #ebeef5;
  }
}
</style> 