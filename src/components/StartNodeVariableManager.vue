<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { 
  ElTabs, ElTabPane, ElTable, ElTableColumn, ElButton, ElDialog, 
  ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElMessage,
  ElTag, ElPopconfirm, ElIcon, ElCollapse, ElCollapseItem
} from 'element-plus'
import { Plus, Delete, InfoFilled } from '@element-plus/icons-vue'
import { listVariables, createVariable, deleteVariable, getVariableTypes } from '@/api/variable'

interface Variable {
  name: string
  var_type: string
  scope: string
  value: string
  description?: string
  created_at?: string
  updated_at?: string
}

interface Props {
  conversationId?: string
  flowId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'variables-updated': []
}>()

// 响应式数据
const activeTab = ref('system')
const systemVariables = ref<Variable[]>([])
const conversationVariables = ref<Variable[]>([])
const loading = ref(false)
const variableTypes = ref<{types: string[], scopes: string[]}>({types: [], scopes: []})

// 新增变量对话框
const addVariableDialogVisible = ref(false)
const newVariable = ref({
  name: '',
  var_type: 'string',
  value: '',
  description: ''
})
const addVariableForm = ref()

// 系统变量说明
const systemVariableDescriptions = {
  query: '用户当前的查询内容',
  files: '用户上传的文件列表',
  dialogue_count: '当前对话轮数',
  app_id: '当前应用ID',
  flow_id: '当前工作流ID',
  user_id: '当前用户ID',
  session_id: '当前会话ID',
  timestamp: '当前时间戳'
}

// 计算属性
const typeLabels = computed(() => ({
  string: '字符串',
  number: '数字',
  boolean: '布尔值',
  object: '对象',
  secret: '密钥',
  file: '文件',
  'array[any]': '数组',
  'array[string]': '字符串数组',
  'array[number]': '数字数组',
  'array[object]': '对象数组',
  'array[file]': '文件数组',
  'array[boolean]': '布尔数组',
  'array[secret]': '密钥数组'
}))

// 表单验证规则
const addVariableRules = {
  name: [
    { required: true, message: '请输入变量名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '变量名只能包含字母、数字和下划线，且不能以数字开头', trigger: 'blur' }
  ],
  var_type: [
    { required: true, message: '请选择变量类型', trigger: 'change' }
  ],
  value: [
    { required: true, message: '请输入变量值', trigger: 'blur' }
  ]
}

// 方法
const loadSystemVariables = async () => {
  loading.value = true
  try {
    let params: any = { scope: 'system' }
    
    // 根据是否有conversation_id选择参数
    if (props.conversationId) {
      // 对话阶段：使用conversation_id查询实例
      params.conversation_id = props.conversationId
      console.log('🔄 加载系统变量（对话阶段）, conversationId:', props.conversationId)
    } else if (props.flowId) {
      // 配置阶段：使用flow_id查询模板
      params.flow_id = props.flowId
      console.log('🔄 加载系统变量（配置阶段）, flowId:', props.flowId)
    } else {
      console.warn('⚠️ 缺少conversationId和flowId，跳过系统变量加载')
      systemVariables.value = []
      return
    }
    
    const response = await listVariables(params)
    systemVariables.value = response.result?.variables || []
    console.log('✅ 系统变量加载成功:', systemVariables.value.length, '个')
  } catch (error) {
    console.error('加载系统变量失败:', error)
    ElMessage.error('加载系统变量失败')
  } finally {
    loading.value = false
  }
}

const loadConversationVariables = async () => {
  if (!props.conversationId) return
  
  loading.value = true
  try {
    const response = await listVariables({ 
      scope: 'conversation',
      conversation_id: props.conversationId 
    })
    conversationVariables.value = response.result?.variables || []
  } catch (error) {
    console.error('加载对话变量失败:', error)
    ElMessage.error('加载对话变量失败')
  } finally {
    loading.value = false
  }
}

const loadVariableTypes = async () => {
  try {
    const response = await getVariableTypes()
    variableTypes.value = response.result || {types: [], scopes: []}
  } catch (error) {
    console.error('加载变量类型失败:', error)
  }
}

const handleAddVariable = () => {
  newVariable.value = {
    name: '',
    var_type: 'string',
    value: '',
    description: ''
  }
  addVariableDialogVisible.value = true
}

const handleSaveVariable = async () => {
  try {
    await addVariableForm.value.validate()
    
    await createVariable({
      name: newVariable.value.name,
      var_type: newVariable.value.var_type,
      scope: 'conversation',
      value: newVariable.value.value,
      description: newVariable.value.description,
      conversation_id: props.conversationId
    })
    
    ElMessage.success('变量创建成功')
    addVariableDialogVisible.value = false
    await loadConversationVariables()
    emit('variables-updated')
  } catch (error) {
    console.error('创建变量失败:', error)
    ElMessage.error('创建变量失败')
  }
}

const handleDeleteVariable = async (variable: Variable) => {
  try {
    await deleteVariable({
      name: variable.name,
      scope: 'conversation',
      conversation_id: props.conversationId
    })
    
    ElMessage.success('变量删除成功')
    await loadConversationVariables()
    emit('variables-updated')
  } catch (error) {
    console.error('删除变量失败:', error)
    ElMessage.error('删除变量失败')
  }
}

const formatVariableReference = (variable: Variable): string => {
  const scopeMap = {
    system: 'system',
    conversation: 'conversation'
  }
  return `{{${scopeMap[variable.scope]}.${variable.name}}}`
}

const getVariableValuePreview = (variable: Variable): string => {
  if (variable.var_type === 'secret') {
    return '••••••••'
  }
  if (typeof variable.value === 'object') {
    return JSON.stringify(variable.value)
  }
  const str = String(variable.value)
  return str.length > 50 ? str.substring(0, 50) + '...' : str
}

const getInputType = (varType: string): string => {
  switch (varType) {
    case 'number':
      return 'number'
    case 'secret':
      return 'password'
    default:
      return 'text'
  }
}

// 生命周期
onMounted(() => {
  loadSystemVariables()
  loadConversationVariables()
  loadVariableTypes()
})
</script>

<template>
  <div class="start-node-variable-manager">
    <ElTabs v-model="activeTab" class="variable-tabs">
      <!-- 系统变量 -->
      <ElTabPane label="系统变量" name="system">
        <div class="tab-content">
          <div class="tab-header">
            <div class="tab-title">
              <ElIcon><InfoFilled /></ElIcon>
              <span>系统变量 (只读)</span>
            </div>
            <div class="tab-description">
              这些变量由系统自动提供，包含当前工作流执行的上下文信息
            </div>
          </div>
          
          <ElCollapse class="system-variables-collapse">
            <ElCollapseItem title="可用的系统变量" name="system-vars">
              <ElTable :data="systemVariables" v-loading="loading">
                <ElTableColumn prop="name" label="变量名" width="120">
                  <template #default="{ row }">
                    <code class="variable-name">{{ row.name }}</code>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="var_type" label="类型" width="100">
                  <template #default="{ row }">
                    <ElTag size="small" type="primary">
                      {{ typeLabels[row.var_type] || row.var_type }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="描述" min-width="200">
                  <template #default="{ row }">
                    {{ systemVariableDescriptions[row.name] || row.description || '系统变量' }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="引用语法" width="150">
                  <template #default="{ row }">
                    <code class="variable-reference">{{ formatVariableReference(row) }}</code>
                  </template>
                </ElTableColumn>
              </ElTable>
            </ElCollapseItem>
          </ElCollapse>
        </div>
      </ElTabPane>
      
      <!-- 对话变量 -->
      <ElTabPane label="对话变量" name="conversation">
        <div class="tab-content">
          <div class="tab-header">
            <div class="tab-title">
              <ElIcon><Plus /></ElIcon>
              <span>对话变量</span>
            </div>
            <div class="tab-description">
              这些变量在当前对话中有效，可以在工作流的各个步骤中使用
            </div>
            <ElButton type="primary" @click="handleAddVariable" :icon="Plus">
              新增变量
            </ElButton>
          </div>
          
          <ElTable :data="conversationVariables" v-loading="loading">
            <ElTableColumn prop="name" label="变量名" width="120">
              <template #default="{ row }">
                <code class="variable-name">{{ row.name }}</code>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="var_type" label="类型" width="100">
              <template #default="{ row }">
                <ElTag size="small" :type="row.var_type === 'secret' ? 'warning' : 'primary'">
                  {{ typeLabels[row.var_type] || row.var_type }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="值" min-width="150">
              <template #default="{ row }">
                <span class="variable-value">{{ getVariableValuePreview(row) }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="description" label="描述" min-width="150" />
            <ElTableColumn label="引用语法" width="180">
              <template #default="{ row }">
                <code class="variable-reference">{{ formatVariableReference(row) }}</code>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="80">
              <template #default="{ row }">
                <ElPopconfirm
                  title="确定要删除这个变量吗？"
                  @confirm="handleDeleteVariable(row)"
                >
                  <template #reference>
                    <ElButton type="danger" size="small" :icon="Delete" circle />
                  </template>
                </ElPopconfirm>
              </template>
            </ElTableColumn>
          </ElTable>
          
          <!-- 空状态 -->
          <div v-if="conversationVariables.length === 0 && !loading" class="empty-state">
            <div class="empty-text">暂无对话变量</div>
            <div class="empty-hint">点击上方"新增变量"按钮创建第一个对话变量</div>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>
    
    <!-- 新增变量对话框 -->
    <ElDialog
      v-model="addVariableDialogVisible"
      title="新增对话变量"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm
        ref="addVariableForm"
        :model="newVariable"
        :rules="addVariableRules"
        label-width="80px"
      >
        <ElFormItem label="变量名" prop="name">
          <ElInput
            v-model="newVariable.name"
            placeholder="请输入变量名（如：user_name）"
          />
        </ElFormItem>
        
        <ElFormItem label="变量类型" prop="var_type">
          <ElSelect v-model="newVariable.var_type" placeholder="请选择变量类型">
            <ElOption
              v-for="type in variableTypes.types"
              :key="type"
              :label="typeLabels[type] || type"
              :value="type"
            />
          </ElSelect>
        </ElFormItem>
        
        <ElFormItem label="变量值" prop="value">
          <!-- String, Number, Secret 类型 -->
          <ElInput
            v-if="['string', 'number', 'secret'].includes(newVariable.var_type)"
            v-model="newVariable.value"
            :type="getInputType(newVariable.var_type)"
            placeholder="请输入变量值"
            :show-password="newVariable.var_type === 'secret'"
          />
          
          <!-- Boolean 类型 -->
          <ElSelect
            v-else-if="newVariable.var_type === 'boolean'"
            v-model="newVariable.value"
            placeholder="请选择布尔值"
          >
            <ElOption label="true" value="true" />
            <ElOption label="false" value="false" />
          </ElSelect>
          
          <!-- Object 类型 -->
          <ElInput
            v-else-if="newVariable.var_type === 'object'"
            v-model="newVariable.value"
            type="textarea"
            :rows="4"
            placeholder="请输入JSON格式的对象"
          />
          
          <!-- Array[String] 类型 -->
          <ElInput
            v-else-if="newVariable.var_type === 'array[string]'"
            v-model="newVariable.value"
            placeholder="请输入逗号分隔的字符串，如：item1,item2,item3"
          />
          
          <!-- File 和 Array[File] 类型提示 -->
          <div
            v-else-if="newVariable.var_type === 'file' || newVariable.var_type === 'array[file]'"
            class="file-type-tip"
          >
            <el-alert
              title="文件类型变量将在调试时设置具体文件"
              type="info"
              :closable="false"
              show-icon
            />
            <ElInput
              v-model="newVariable.value"
              placeholder="可选：输入默认值或描述"
            />
          </div>
          
          <!-- 其他数组类型 -->
          <ElInput
            v-else-if="newVariable.var_type.startsWith('array[')"
            v-model="newVariable.value"
            type="textarea"
            :rows="3"
            placeholder="请输入JSON数组格式，如：[1,2,3] 或 [{},{}]"
          />
          
          <!-- 默认类型 -->
          <ElInput
            v-else
            v-model="newVariable.value"
            placeholder="请输入变量值"
          />
        </ElFormItem>
        
        <ElFormItem label="描述">
          <ElInput
            v-model="newVariable.description"
            placeholder="请输入变量描述（可选）"
          />
        </ElFormItem>
      </ElForm>
      
      <template #footer>
        <ElButton @click="addVariableDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSaveVariable">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.start-node-variable-manager {
  .variable-tabs {
    .tab-content {
      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--el-border-color-light);
        
        .tab-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 16px;
          color: var(--el-text-color-primary);
        }
        
        .tab-description {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
          max-width: 60%;
        }
      }
      
      .system-variables-collapse {
        margin-bottom: 16px;
      }
      
      .variable-name {
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 13px;
        color: var(--el-color-primary);
        background-color: var(--el-fill-color-extra-light);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--el-border-color);
      }
      
      .variable-reference {
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 12px;
        color: var(--el-color-success);
        background-color: var(--el-color-success-light-9);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--el-color-success-light-7);
      }
      
      .variable-value {
        font-size: 13px;
        color: var(--el-text-color-regular);
        word-break: break-all;
      }
      
      .empty-state {
        text-align: center;
        padding: 64px 16px;
        color: var(--el-text-color-secondary);
        
        .empty-text {
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .empty-hint {
          font-size: 14px;
          color: var(--el-text-color-placeholder);
        }
      }
      
      .file-type-tip {
        .el-alert {
          margin-bottom: 8px;
        }
        
        .el-input {
          margin-top: 4px;
        }
      }
    }
  }
}
</style> 