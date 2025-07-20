<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
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

// 响应式数据
const activeTab = ref('basic')
const formData = ref({
  description: '',
  input_parameters: {} as Record<string, any>,
  output_parameters: {} as Record<string, any>
})
const conversationVariables = ref<Record<string, any>>({})
const variablesLoading = ref(false)

const form = ref()

// 计算属性
const drawerVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 方法
const initFormData = () => {
  formData.value = {
    description: props.nodeDescription || '',
    input_parameters: props.nodeParams.input_parameters ? { ...props.nodeParams.input_parameters } : {},
    output_parameters: props.nodeParams.output_parameters ? { ...props.nodeParams.output_parameters } : {}
  }
}

const loadConversationVariables = async () => {
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
    
    const variables = response.result?.variables || []
    const variablesObj = {}
    variables.forEach(variable => {
      variablesObj[variable.name] = {
        value: variable.value,
        type: variable.var_type,
        description: variable.description
      }
    })
    
    conversationVariables.value = variablesObj
  } catch (error) {
    console.error('加载对话变量失败:', error)
    ElMessage.error('加载对话变量失败')
  } finally {
    variablesLoading.value = false
  }
}

const handleSave = async () => {
  try {
    await form.value?.validate()
    
    const params: StartNodeParams = {
      input_parameters: formData.value.input_parameters,
      output_parameters: formData.value.output_parameters
    }
    
    // 分别传递节点参数、描述和对话变量
    emit('save', params, formData.value.description, conversationVariables.value)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const handleClose = () => {
  emit('close')
}

const handleVariablesUpdated = async () => {
  // 当变量更新时，重新加载对话变量
  await loadConversationVariables()
  ElMessage.success('变量已更新')
}

// 添加输入参数
const addInputParameter = () => {
  const key = `param_${Date.now()}`
  formData.value.input_parameters[key] = ''
}

// 删除输入参数
const removeInputParameter = (key: string) => {
  delete formData.value.input_parameters[key]
}

// 添加输出参数
const addOutputParameter = () => {
  const key = `output_${Date.now()}`
  formData.value.output_parameters[key] = ''
}

// 删除输出参数
const removeOutputParameter = (key: string) => {
  delete formData.value.output_parameters[key]
}

// 监听props变化
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick()
    initFormData()
    await loadConversationVariables()
  }
}, { immediate: false })

watch(() => [props.nodeParams, props.nodeDescription], async () => {
  if (props.visible) {
    await nextTick()
    initFormData()
  }
}, { deep: true })

// 生命周期
onMounted(async () => {
  initFormData()
  if (props.visible) {
    await loadConversationVariables()
  }
})
</script>

<template>
  <ElDrawer
    v-model="drawerVisible"
    title="编辑开始节点"
    :size="800"
    direction="rtl"
    :close-on-click-modal="false"
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
    
    <div class="drawer-content">
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
                <ElFormItem :label="key">
                  <div class="parameter-row">
                    <ElInput
                      v-model="formData.input_parameters[key]"
                      placeholder="请输入参数值"
                    />
                    <ElButton 
                      type="danger" 
                      size="small" 
                      @click="removeInputParameter(key)"
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
                <ElFormItem :label="key">
                  <div class="parameter-row">
                    <ElInput
                      v-model="formData.output_parameters[key]"
                      placeholder="请输入参数值"
                    />
                    <ElButton 
                      type="danger" 
                      size="small" 
                      @click="removeOutputParameter(key)"
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
            :conversation-id="conversationId"
            :flow-id="flowId"
            @variables-updated="handleVariablesUpdated"
          />
        </ElTabPane>
      </ElTabs>
    </div>
    
    <template #footer>
      <div class="drawer-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" @click="handleSave">保存</ElButton>
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

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid var(--el-border-color-light);
}
</style> 