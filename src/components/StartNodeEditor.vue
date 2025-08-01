<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { 
  ElDrawer, ElTabs, ElTabPane, ElForm, ElFormItem, ElInput, 
  ElButton, ElMessage, ElDivider, ElIcon
} from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import StartNodeVariableManager from './StartNodeVariableManager.vue'
import { listVariables } from '@/api/variable'

interface StartNodeParams {
  input_parameters?: Record<string, any>
  output_parameters?: Record<string, any>
  conversation_variables?: Record<string, any>
}

interface Props {
  visible: boolean
  nodeName: string
  nodeDescription: string
  nodeParams: StartNodeParams
  nodeId: string
  conversationId?: string
  flowId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'save': [params: StartNodeParams, description: string, conversationVariables?: any]
  'close': []
}>()

// 响应式数据 - 使用更安全的初始化
const activeTab = ref('basic')
const formData = ref<{
  description: string
  input_parameters: Record<string, any>
  output_parameters: Record<string, any>
}>({
  description: '',
  input_parameters: {},
  output_parameters: {}
})

const conversationVariables = ref<Record<string, any>>({})
const variablesLoading = ref(false)
const isInitialized = ref(false)

const form = ref<any>(null)

// 计算属性 - 添加安全检查
const drawerVisible = computed({
  get: () => props.visible,
  set: (value) => {
    if (typeof value === 'boolean') {
      emit('update:visible', value)
    }
  }
})

// 安全的初始化方法
const safeInitFormData = () => {
  try {
    const newFormData = {
      description: props.nodeDescription || '',
      input_parameters: {},
      output_parameters: {}
    }
    
    // 安全复制参数
    if (props.nodeParams?.input_parameters && typeof props.nodeParams.input_parameters === 'object') {
      newFormData.input_parameters = { ...props.nodeParams.input_parameters }
    }
    
    if (props.nodeParams?.output_parameters && typeof props.nodeParams.output_parameters === 'object') {
      newFormData.output_parameters = { ...props.nodeParams.output_parameters }
    }
    
    formData.value = newFormData
    isInitialized.value = true
  } catch (error) {
    console.error('初始化表单数据失败:', error)
    // 使用默认值
    formData.value = {
      description: '',
      input_parameters: {},
      output_parameters: {}
    }
    isInitialized.value = true
  }
}

// 安全的变量加载
const safeLoadConversationVariables = async () => {
  if (!props.conversationId) {
    conversationVariables.value = {}
    return
  }
  
  variablesLoading.value = true
  try {
    const response = await listVariables({ 
      scope: 'conversation',
      conversation_id: props.conversationId 
    })
    
    if (response?.result?.variables && Array.isArray(response.result.variables)) {
      const variables = response.result.variables
      const variablesObj: Record<string, any> = {}
      
      variables.forEach(variable => {
        if (variable && variable.name) {
          variablesObj[variable.name] = {
            value: variable.value ?? '',
            type: variable.var_type || 'string',
            description: variable.description || ''
          }
        }
      })
      
      conversationVariables.value = variablesObj
    } else {
      conversationVariables.value = {}
    }
  } catch (error) {
    console.error('加载对话变量失败:', error)
    ElMessage.error('加载对话变量失败')
    conversationVariables.value = {}
  } finally {
    variablesLoading.value = false
  }
}

// 安全的保存方法
const handleSave = async () => {
  if (!isInitialized.value) {
    ElMessage.warning('编辑器未完全初始化，请稍后再试')
    return
  }
  
  try {
    // 验证表单
    if (form.value) {
      await form.value.validate()
    }
    
    const params: StartNodeParams = {
      input_parameters: { ...formData.value.input_parameters },
      output_parameters: { ...formData.value.output_parameters }
    }
    
    // 安全地传递数据
    emit('save', params, formData.value.description, { ...conversationVariables.value })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请检查输入内容')
  }
}

const handleClose = () => {
  emit('close')
}

const handleVariablesUpdated = async () => {
  try {
    await safeLoadConversationVariables()
    ElMessage.success('变量已更新')
  } catch (error) {
    console.error('更新变量失败:', error)
  }
}

// 参数管理方法
const addInputParameter = () => {
  const key = `param_${Date.now()}`
  formData.value.input_parameters[key] = ''
}

const removeInputParameter = (key: string) => {
  if (formData.value.input_parameters[key] !== undefined) {
    delete formData.value.input_parameters[key]
  }
}

const addOutputParameter = () => {
  const key = `output_${Date.now()}`
  formData.value.output_parameters[key] = ''
}

const removeOutputParameter = (key: string) => {
  if (formData.value.output_parameters[key] !== undefined) {
    delete formData.value.output_parameters[key]
  }
}

// 安全的监听器
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    try {
      await nextTick()
      safeInitFormData()
      await safeLoadConversationVariables()
    } catch (error) {
      console.error('初始化编辑器失败:', error)
    }
  } else {
    // 重置状态
    isInitialized.value = false
  }
}, { immediate: false })

watch(() => [props.nodeParams, props.nodeDescription], async () => {
  if (props.visible && isInitialized.value) {
    try {
      await nextTick()
      safeInitFormData()
    } catch (error) {
      console.error('更新表单数据失败:', error)
    }
  }
}, { deep: true })

// 生命周期
onMounted(async () => {
  try {
    safeInitFormData()
    if (props.visible) {
      await safeLoadConversationVariables()
    }
  } catch (error) {
    console.error('组件初始化失败:', error)
  }
})

onBeforeUnmount(() => {
  // 清理资源
  isInitialized.value = false
})
</script>

<template>
  <ElDrawer
    v-model="drawerVisible"
    title="编辑开始节点"
    :size="800"
    direction="rtl"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <template #header>
      <div class="drawer-header">
        <ElIcon><Setting /></ElIcon>
        <span>编辑开始节点</span>
        <div class="node-info">
          <span class="node-name">{{ nodeName }}</span>
        </div>
      </div>
    </template>
    
    <div class="drawer-content" v-if="isInitialized">
      <ElTabs v-model="activeTab">
        <!-- 基本配置 -->
        <ElTabPane label="基本配置" name="basic">
          <ElForm ref="form" :model="formData" label-width="100px">
            <ElFormItem label="节点描述">
              <ElInput
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入节点描述"
              />
            </ElFormItem>
            
            <ElDivider content-position="left">输入参数</ElDivider>
            
            <div class="parameter-section">
              <div 
                v-for="(value, key) in formData.input_parameters" 
                :key="key"
                class="parameter-item"
              >
                <ElFormItem :label="String(key)">
                  <div class="parameter-row">
                    <ElInput
                      v-model="formData.input_parameters[key]"
                      placeholder="请输入参数值"
                    />
                    <ElButton 
                      type="danger" 
                      size="small" 
                      @click="removeInputParameter(String(key))"
                    >
                      删除
                    </ElButton>
                  </div>
                </ElFormItem>
              </div>
              
              <ElButton type="primary" size="small" @click="addInputParameter">
                添加输入参数
              </ElButton>
            </div>
            
            <ElDivider content-position="left">输出参数</ElDivider>
            
            <div class="parameter-section">
              <div 
                v-for="(value, key) in formData.output_parameters" 
                :key="key"
                class="parameter-item"
              >
                <ElFormItem :label="String(key)">
                  <div class="parameter-row">
                    <ElInput
                      v-model="formData.output_parameters[key]"
                      placeholder="请输入参数值"
                    />
                    <ElButton 
                      type="danger" 
                      size="small" 
                      @click="removeOutputParameter(String(key))"
                    >
                      删除
                    </ElButton>
                  </div>
                </ElFormItem>
              </div>
              
              <ElButton type="primary" size="small" @click="addOutputParameter">
                添加输出参数
              </ElButton>
            </div>
          </ElForm>
        </ElTabPane>
        
        <!-- 变量管理 -->
        <ElTabPane label="变量管理" name="variables">
          <StartNodeVariableManager
            v-if="conversationId"
            :conversation-id="conversationId"
            :flow-id="flowId"
            @variables-updated="handleVariablesUpdated"
          />
          <div v-else class="no-conversation">
            <p>需要会话ID才能管理变量</p>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>
    
    <div v-else class="loading-state">
      <ElIcon class="is-loading"><Setting /></ElIcon>
      <span>正在初始化...</span>
    </div>
    
    <template #footer>
      <div class="drawer-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton 
          type="primary" 
          @click="handleSave"
          :disabled="!isInitialized"
        >
          保存
        </ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<style lang="scss" scoped>
.drawer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  
  .node-info {
    margin-left: auto;
    
    .node-name {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      padding: 4px 8px;
      border-radius: 4px;
    }
  }
}

.drawer-content {
  height: 100%;
  
  .parameter-section {
    margin-bottom: 24px;
    
    .parameter-item {
      margin-bottom: 16px;
      
      .parameter-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
  color: var(--el-text-color-secondary);
}

.no-conversation {
  text-align: center;
  padding: 32px;
  color: var(--el-text-color-secondary);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid var(--el-border-color-light);
}
</style> 