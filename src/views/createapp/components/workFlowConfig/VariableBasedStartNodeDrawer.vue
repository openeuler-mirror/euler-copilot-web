<template>
  <div class="startNodeConfig">
    <el-drawer
      v-model="visible"
      :show-close="false"
      :modal="true"
      modal-class="transparent-modal"
      class="flowDrawer startNodeDrawer"
      @close="closeDrawer"
    >
      <template #header>
        <div class="drawerHeader">
          <div class="headerIcon">
            <div class="startIcon"></div>
          </div>
          <div class="headerText">开始</div>
        </div>
      </template>
      
      <template #default>
        <div class="drawerBody">
          <!-- 描述输入 - 移到最上方 -->
          <div class="descriptionSection">
            <div v-if="!isEditingDesc && (!nodeDescription || !nodeDescription.trim())" class="descPlaceholder" @click="startEditDesc">
              开始节点
            </div>
            <div v-else-if="!isEditingDesc" class="descDisplay" @click="startEditDesc">
              {{ nodeDescription }}
            </div>
            <el-input
              v-else
              v-model="nodeDescription"
              type="textarea"
              placeholder="开始节点"
              :rows="3"
              maxlength="200"
              show-word-limit
              class="descInput"
              @blur="finishEditDesc"

              ref="descInputRef"
            />
          </div>

          <!-- Tab切换 -->
          <div class="tabContainer">
            <div class="tabHeader">
              <div class="tabItem active">设置</div>
            </div>

            <!-- 输入字段区域 -->
            <div class="inputFieldsSection">
              <div class="inputFieldsHeader">
                <div class="inputFieldsLeft">
                  <div class="inputFieldsLabel">输入字段</div>
                  <div class="inputFieldsHint">设置的输入可在工作流程中使用</div>
                </div>
                <el-button 
                  type="text" 
                  @click="addConversationVariable"
                  class="addVariableBtn"
                  :icon="Plus"
                  size="small"
                >
                </el-button>
              </div>
              
              <!-- 变量列表 -->
              <div class="variableList" v-loading="variablesLoading">
                <!-- 对话变量管理 - 优先显示 -->
                <div 
                  v-for="variable in conversationVariables" 
                  :key="`conv_${variable.name}`"
                  class="variableItem editable"
                  @click="editConversationVariable(variable)"
                >
                  <div class="variableIcon">{x}</div>
                  <div class="variableInfo">
                    <div class="variableName">{{ variable.name }}</div>
                    <div class="variableType">{{ getVariableTypeDisplay(variable.var_type) }}</div>
                  </div>
                </div>

                <el-divider />
                <!-- 系统变量展示 -->
                <div 
                  v-for="variable in systemVariables" 
                  :key="`sys_${variable.name}`"
                  class="variableItem readonly"
                >
                  <div class="variableIcon">{x}</div>
                  <div class="variableInfo">
                    <div class="variableName">{{ getVariableDisplayName(variable) }}</div>
                    <div class="variableType">{{ getVariableTypeDisplay(variable.var_type) }}</div>
                  </div>
                </div>
                
                <!-- 空状态提示 -->
                <div v-if="conversationVariables.length === 0 && systemVariables.length === 0 && !variablesLoading" class="emptyState">
                  <div class="emptyText">暂无变量</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <template #footer>
        <div class="drawerFooter">
          <el-button @click="closeDrawer">{{ $t('main.close') }}</el-button>
          <el-button
            type="primary"
            @click="saveStartNodeConfig"
          >
            {{ $t('semantic.submit') }}
          </el-button>
        </div>
      </template>
    </el-drawer>
    
    <!-- 对话变量编辑弹窗 -->
    <el-dialog
      v-model="showVariableDialog"
      :title="isEditingVariable ? '编辑变量' : '添加变量'"
      width="500px"
      :close-on-click-modal="false"
      @close="handleVariableDialogClose"
    >
      <el-form v-if="editingVariable" :model="editingVariable" label-width="80px">
        <el-form-item label="变量名" required>
          <el-input 
            v-model="editingVariable.name" 
            placeholder="请输入变量名" 
            :disabled="isEditingVariable"
          />
        </el-form-item>
        
        <el-form-item label="变量类型">
          <el-select v-model="editingVariable.var_type" placeholder="选择变量类型">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="布尔值" value="boolean" />
            <el-option label="对象" value="object" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="变量值">
          <el-input 
            v-if="editingVariable.var_type !== 'object'"
            v-model="editingVariable.value" 
            placeholder="请输入变量值" 
          />
          <el-input 
            v-else
            v-model="editingVariable.valueJson" 
            type="textarea"
            :rows="4"
            placeholder="请输入JSON格式的对象值" 
          />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="editingVariable.description" 
            placeholder="请输入变量描述（可选）" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleVariableDialogClose">取消</el-button>
          <el-button 
            v-if="isEditingVariable"
            type="danger" 
            @click="deleteConversationVariable"
          >
            删除
          </el-button>
          <el-button 
            type="primary" 
            @click="saveConversationVariable"
          >
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  ElDrawer, ElButton, ElInput, ElDialog, ElForm, ElFormItem, 
  ElSelect, ElOption, ElMessage, ElAlert
} from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { listVariables, createVariable, updateVariable, deleteVariable } from '@/api/variable'

interface Variable {
  name: string
  var_type: string
  scope: string
  value?: any
  description?: string
  valueJson?: string
}

interface Props {
  yamlContent: any
  nodeName: string
  nodeDesc: string
  appId: any
  flowId: any
  nodeYamlId: any
  conversationId?: string
}

const props = defineProps<Props>()

const { t } = useI18n()
const visible = ref(true)
const nodeName = ref('')
const nodeDescription = ref('')
const isEditingDesc = ref(false)
const descInputRef = ref()

// 变量相关状态
const systemVariables = ref<Variable[]>([])
const conversationVariables = ref<Variable[]>([])
const variablesLoading = ref(false)

// 变量编辑状态
const showVariableDialog = ref(false)
const editingVariable = ref<Variable | null>(null)
const isEditingVariable = ref(false)

const emits = defineEmits(['closeDrawer', 'saveStartNode', 'variablesUpdated', 'saveNodeDescription'])

// 加载所有变量 - 将函数定义提前
const loadAllVariables = async () => {
  variablesLoading.value = true
  
  try {
    console.log('🔄 开始加载变量...')
    
    // 加载系统变量 - 修复数据结构解析
    try {
      console.log('🔄 正在调用系统变量API...')
      const systemResponse = await listVariables({ scope: 'system' })
      console.log('📥 系统变量API响应:', systemResponse)
      
      // 修复：支持多种响应数据结构
      let variables: any[] | null = null
      const response = systemResponse as any // 类型断言避免TS错误
      
      if (response?.result?.variables) {
        // 结构1: { result: { variables: [...] } }
        variables = response.result.variables
        console.log('📋 使用result.variables结构')
      } else if (response?.variables) {
        // 结构2: { variables: [...], total: 8 }  
        variables = response.variables
        console.log('📋 使用直接variables结构')
      } else if (Array.isArray(response)) {
        // 结构3: 直接返回数组
        variables = response
        console.log('📋 使用数组结构')
      }
      
      if (variables && Array.isArray(variables)) {
        systemVariables.value = variables
        console.log('✅ 系统变量加载成功:', systemVariables.value.length, '个')
        console.log('📋 系统变量详情:', systemVariables.value.map(v => ({
          name: v.name,
          type: v.var_type,
          value: v.value,
          description: v.description
        })))
      } else {
        console.log('⚠️ 未找到系统变量数据')
        console.log('📋 完整响应结构:', JSON.stringify(systemResponse, null, 2))
        systemVariables.value = []
      }
    } catch (systemError: any) {
      console.error('❌ 系统变量加载失败:', systemError)
      console.error('❌ 错误详情:', {
        message: systemError.message,
        stack: systemError.stack,
        response: systemError.response
      })
      
      // 检查是否是Pydantic验证错误
      if (systemError.message?.includes('validation error')) {
        console.log('🔧 检测到Pydantic验证错误，可能是系统变量值为None')
        ElMessage.warning('系统变量加载失败：后端数据验证错误，请检查系统变量初始化')
      } else {
        ElMessage.error('系统变量加载失败')
      }
      systemVariables.value = []
    }
    
    // 加载对话变量（如果有flowId）
    if (props.flowId) {
      try {
        console.log('🔄 正在调用对话变量API...')
        console.log('🔍 LIST API使用的flowId:', props.flowId)
        const convResponse = await listVariables({ 
          scope: 'conversation', 
          flow_id: props.flowId 
        })
        console.log('📥 对话变量API响应:', convResponse)
        
        // 修复：支持多种响应数据结构
        let convVariables: any[] | null = null
        const convResponseAny = convResponse as any
        
        if (convResponseAny?.result?.variables) {
          convVariables = convResponseAny.result.variables
          console.log('📋 对话变量使用result.variables结构')
        } else if (convResponseAny?.variables) {
          convVariables = convResponseAny.variables
          console.log('📋 对话变量使用直接variables结构')
        } else if (Array.isArray(convResponseAny)) {
          convVariables = convResponseAny
          console.log('📋 对话变量使用数组结构')
        }
        
        if (convVariables && Array.isArray(convVariables)) {
          conversationVariables.value = convVariables
          console.log('✅ 对话变量加载成功:', conversationVariables.value.length, '个')
          console.log('📋 具体变量列表:', conversationVariables.value.map(v => v.name))
        } else {
          conversationVariables.value = []
          console.log('ℹ️ 对话变量为空，设置为空数组')
          console.log('📋 convVariables:', convVariables)
        }
      } catch (convError: any) {
        console.error('❌ 对话变量加载失败:', convError)
        conversationVariables.value = []
      }
    } else {
      console.log('ℹ️ 无flowId，跳过对话变量加载')
      conversationVariables.value = []
    }
    
    console.log('🎉 变量加载完成')
  } catch (error) {
    console.error('❌ 变量加载过程发生未知错误:', error)
    ElMessage.error('变量加载失败')
  } finally {
    variablesLoading.value = false
  }
}

// 强制重新加载变量
const forceReloadVariables = async () => {
  console.log('🔄 强制重新加载变量...')
  await loadAllVariables()
}

// 直接测试API调用
const testApiDirectly = async () => {
  console.log('🧪 开始直接测试API调用...')
  try {
    const response = await listVariables({ scope: 'system' })
    console.log('🔬 直接API调用结果:')
    console.log('- 原始响应:', response)
    console.log('- 响应类型:', typeof response)
    console.log('- 是否为数组:', Array.isArray(response))
    console.log('- response.variables:', (response as any)?.variables)
    console.log('- response.result:', (response as any)?.result)
    console.log('- response.result.variables:', (response as any)?.result?.variables)
    
    ElMessage.info('API测试完成，请查看控制台输出')
  } catch (error) {
    console.error('🔬 API测试失败:', error)
    ElMessage.error('API测试失败')
  }
}

// 初始化数据 - 在函数定义后设置watch
watch(
  () => [props.yamlContent, props.nodeName, props.nodeDesc],
  () => {
    nodeName.value = props.nodeName
    nodeDescription.value = props.nodeDesc
    // 使用nextTick确保组件完全初始化后再加载变量
    nextTick(() => {
      loadAllVariables()
    })
  },
  { deep: true, immediate: true }
)

// 组件挂载时立即加载变量
onMounted(() => {
  console.log('🚀 组件已挂载，开始加载变量...')
  nextTick(() => {
    loadAllVariables()
  })
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 获取变量显示值
const getVariableDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return '(未设置)'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// 获取变量类型的中文显示
const getVariableTypeDisplay = (type: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Number', 
    'boolean': 'Boolean',
    'object': 'Object',
    'array_file': 'Array[File]',
    'array[file]': 'Array[File]',  // 支持后端返回的格式
    'array': 'Array',
    'secret': 'Secret'
  }
  return typeMap[type] || type
}

// 获取变量的语义化显示名称
const getVariableDisplayName = (variable: any): string => {
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

// 描述编辑
const startEditDesc = () => {
  isEditingDesc.value = true
  nextTick(() => {
    descInputRef.value?.focus()
    // 添加全局点击监听器
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)
  })
}

// 处理点击外部区域
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  const inputEl = descInputRef.value?.$el || descInputRef.value
  
  if (inputEl && !inputEl.contains(target) && !target.closest('.descInput')) {
    finishEditDesc()
    document.removeEventListener('click', handleClickOutside)
  }
}

const finishEditDesc = async () => {
  isEditingDesc.value = false
  // 移除全局点击监听器
  document.removeEventListener('click', handleClickOutside)
  
  // 保存描述修改到后端
  try {    
    // 触发父组件事件，让父组件调用saveFlow方法保存节点描述
    emits('saveNodeDescription', {
      nodeId: props.nodeYamlId,
      name: nodeName.value,
      description: nodeDescription.value
    })
    
    ElMessage.success('描述保存成功')
  } catch (error) {
    ElMessage.error('描述保存失败')
  }
}

// 添加对话变量
const addConversationVariable = () => {
  editingVariable.value = {
    name: '',
    var_type: 'string',
    scope: 'conversation',
    value: '',
    description: '',
    valueJson: ''
  }
  isEditingVariable.value = false
  showVariableDialog.value = true
}

// 编辑对话变量
const editConversationVariable = (variable: Variable) => {
  editingVariable.value = {
    ...variable,
    valueJson: typeof variable.value === 'object' ? JSON.stringify(variable.value, null, 2) : ''
  }
  isEditingVariable.value = true
  showVariableDialog.value = true
}

// 保存对话变量
const saveConversationVariable = async () => {
  console.log('🔄 开始保存对话变量...')
  console.log('📋 当前编辑变量:', editingVariable.value)
  console.log('📋 工作流ID:', props.flowId)
  
  // 详细的参数验证
  if (!editingVariable.value) {
    ElMessage.error('缺少变量数据')
    return
  }
  
  if (!props.flowId) {
    ElMessage.error('缺少工作流ID (flowId)，无法保存对话变量')
    return
  }
  
  if (!editingVariable.value.name || !editingVariable.value.name.trim()) {
    ElMessage.error('变量名不能为空')
    return
  }
  
  if (!editingVariable.value.var_type) {
    ElMessage.error('请选择变量类型')
    return
  }

  try {
    let value = editingVariable.value.value
    
    // 处理对象类型的值
    if (editingVariable.value.var_type === 'object' && editingVariable.value.valueJson) {
      try {
        value = JSON.parse(editingVariable.value.valueJson)
      } catch (error) {
        ElMessage.error('JSON格式不正确，请检查对象值的语法')
        return
      }
    }

    const variableData = {
      name: editingVariable.value.name.trim(),
      var_type: editingVariable.value.var_type,
      scope: 'conversation',
      value: value || '',
      description: editingVariable.value.description || '',
      flow_id: props.flowId
    }
    
    console.log('📤 准备发送的变量数据:', variableData)

    if (isEditingVariable.value) {
      // 更新变量
      console.log('🔄 调用更新变量API...')
      const updateParams = { 
        name: editingVariable.value.name, 
        scope: 'conversation',
        flow_id: props.flowId
      }
      const updateData = { 
        value: variableData.value, 
        description: variableData.description,
        var_type: variableData.var_type  // 添加变量类型字段
      }
      console.log('📤 更新参数:', updateParams)
      console.log('📤 更新数据:', updateData)
      
      const updateResult = await updateVariable(updateParams, updateData)
      console.log('📥 更新结果:', updateResult)
      ElMessage.success('变量更新成功')
    } else {
      // 创建变量
      console.log('🔄 调用创建变量API...')
      const createResult = await createVariable(variableData)
      console.log('📥 创建结果:', createResult)
      ElMessage.success('变量创建成功')
    }

    handleVariableDialogClose()
    await loadAllVariables()
    
    // 通知父组件变量已更新
    emits('variablesUpdated')
  } catch (error: any) {
    console.error('💥 保存变量失败:', error)
    console.error('💥 错误详情:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response
    })
    
    // 更详细的错误信息
    let errorMessage = '保存变量失败'
    if (error?.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 400) {
        errorMessage = `参数错误: ${data?.message || '请检查变量数据格式'}`
      } else if (status === 401) {
        errorMessage = '权限不足，请重新登录'
      } else if (status === 404) {
        errorMessage = '接口不存在，请检查API配置'
      } else if (status === 500) {
        errorMessage = '服务器内部错误，请稍后重试'
      } else {
        errorMessage = `网络错误 (${status}): ${data?.message || error?.message}`
      }
    } else if (error?.message) {
      errorMessage = `请求失败: ${error.message}`
    }
    
    ElMessage.error(errorMessage)
  }
}

// 删除对话变量
const deleteConversationVariable = async () => {
  if (!editingVariable.value || !props.flowId) {
    console.error('❌ 删除失败：缺少必要参数', { editingVariable: editingVariable.value, flowId: props.flowId })
    return
  }

  console.log('🗑️ 开始删除变量:', {
    name: editingVariable.value.name,
    scope: 'conversation',
    flow_id: props.flowId
  })
  console.log('🔍 DELETE API使用的flowId:', props.flowId)

  try {
    const deleteResult = await deleteVariable({
      name: editingVariable.value.name,
      scope: 'conversation',
      flow_id: props.flowId
    })
    
    console.log('✅ 删除变量API调用成功:', deleteResult)
    ElMessage.success('变量删除成功')
    
    // 在关闭对话框前先保存变量名（避免引用失效）
    const deletedVariableName = editingVariable.value.name
    
    handleVariableDialogClose()
    
    // 方案1：直接从本地数组中移除（立即生效）
    conversationVariables.value = conversationVariables.value.filter(v => v.name !== deletedVariableName)
    console.log('🗑️ 本地移除变量后的列表:', conversationVariables.value.map(v => v.name))
    
    // 方案2：延迟后重新加载（确保数据一致性）
    console.log('🔄 延迟200ms后重新加载变量数据...')
    setTimeout(async () => {
      await loadAllVariables()
      console.log('📊 重新加载后的对话变量:', conversationVariables.value.map(v => v.name))
    }, 200)
    
    // 通知父组件变量已更新
    console.log('📡 触发变量更新事件')
    emits('variablesUpdated')
  } catch (error) {
    console.error('❌ 删除变量失败:', error)
    ElMessage.error('删除变量失败')
  }
}

// 关闭变量编辑弹窗
const handleVariableDialogClose = () => {
  showVariableDialog.value = false
  editingVariable.value = null
  isEditingVariable.value = false
}

// 关闭抽屉
const closeDrawer = () => {
  visible.value = false
  emits('closeDrawer')
}

// 保存开始节点配置
const saveStartNodeConfig = () => {
  console.log('💾 保存开始节点配置（基于变量）')
  
  // 构建对话变量对象用于节点显示
  const conversationVariablesObj: Record<string, any> = {}
  conversationVariables.value.forEach(variable => {
    conversationVariablesObj[variable.name] = {
      type: variable.var_type,
      value: variable.value,
      description: variable.description
    }
  })
  
  // 传递包含变量数据的参数
  const nodeParams = {
    input_parameters: {},
    conversation_variables: conversationVariablesObj,
    variables: conversationVariablesObj // 同时保存到variables字段以兼容不同的取值方式
  }
  
  console.log('📋 传递给节点的变量数据:', conversationVariablesObj)
  
  emits('saveStartNode', nodeParams, props.nodeYamlId, nodeName.value, nodeDescription.value)
  ElMessage.success('保存成功')
  closeDrawer()
}

onMounted(() => {
  console.log('🚀 VariableBasedStartNodeDrawer 已挂载')
  // 确保组件挂载后初始化数据
  if (props.nodeName) {
    nodeName.value = props.nodeName
  }
  if (props.nodeDesc) {
    nodeDescription.value = props.nodeDesc  
  }
  // 延迟加载变量，确保组件完全准备就绪
  nextTick(() => {
    loadAllVariables()
  })
})
</script>

<style lang="scss" scoped>
.startNodeConfig {
  :deep(.flowDrawer) {
    .el-drawer__header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--o-border-color-light);
      margin-bottom: 0;
    }
    
    .el-drawer__body {
      padding: 0;
    }
  }

  .drawerHeader {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .headerIcon {
      .startIcon {
        width: 24px;
        height: 24px;
        background: url('@/assets/svgs/flowStartIcon.svg') 100% 100% no-repeat;
        background-size: contain;
      }
    }
    
    .headerText {
      font-size: 16px;
      font-weight: 600;
      color: var(--o-text-color-primary);
    }
  }

  .drawerBody {
    padding: 0;
    
    .descriptionSection {
      margin: 20px 24px;
      
      .descPlaceholder {
        color: var(--el-text-color-placeholder);
        cursor: pointer;
        padding: 12px 16px;
        border: 1px dashed var(--el-border-color);
        border-radius: 6px;
        text-align: center;
        font-size: 14px;
        transition: all 0.2s;
        
        &:hover {
          border-color: var(--el-color-primary);
          color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
        }
      }
      
      .descDisplay {
        cursor: pointer;
        padding: 12px 16px;
        border: 1px solid var(--el-border-color);
        border-radius: 6px;
        background: var(--el-fill-color-extra-light);
        font-size: 14px;
        line-height: 1.4;
        transition: all 0.2s;
        
        &:hover {
          border-color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
        }
      }
      
      .descInput {
        margin-top: 8px;
      }
    }
    
    .tabContainer {
      .tabHeader {
        display: flex;
        border-bottom: 1px solid var(--el-border-color-light);
        padding: 0 24px;
        margin-bottom: 20px;
        
        .tabItem {
          padding: 14px 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-secondary);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          
          &.active {
            color: var(--el-color-primary);
            border-bottom-color: var(--el-color-primary);
          }
          
          &:hover:not(.active) {
            color: var(--el-text-color-primary);
          }
        }
      }
      
      .inputFieldsSection {
        padding: 0 24px 24px;
        
        .inputFieldsHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding: 0 4px;
          
          .inputFieldsLeft {
            .inputFieldsLabel {
              font-size: 15px;
              font-weight: 600;
              color: var(--el-text-color-primary);
              margin-bottom: 6px;
            }
            
            .inputFieldsHint {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              line-height: 1.4;
            }
          }
          
          .addVariableBtn {
            color: var(--el-color-primary);
            font-size: 18px;
            padding: 6px;
            min-width: auto;
            height: auto;
            background: transparent;
            border: none;
            transition: all 0.2s;
            margin-top: -2px;
            border-radius: 4px;
            
            &:hover {
              color: var(--el-color-primary);
              background: var(--el-color-primary-light-9);
              transform: scale(1.1);
            }
            
            &:active {
              transform: scale(0.95);
            }
          }
        }
        
        .variableList {
          min-height: 100px;
          
          .variableItem {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 8px;
            border: 1px solid var(--el-border-color-light);
            background: var(--el-fill-color-extra-light);
            transition: all 0.2s;
            
            &.editable {
              cursor: pointer;
              
              &:hover {
                background: var(--el-color-primary-light-9);
                border-color: var(--el-color-primary-light-7);
              }
            }
            
            &.readonly {
              opacity: 0.8;
              background: var(--el-fill-color-lighter);
            }
            
            .variableIcon {
              color: var(--el-color-primary);
              font-family: 'Monaco', 'Consolas', monospace;
              font-weight: bold;
              margin-right: 12px;
              font-size: 14px;
              width: 20px;
              text-align: center;
            }
            
            .variableInfo {
              flex: 1;
              
              .variableName {
                font-size: 13px;
                color: var(--el-text-color-primary);
                font-family: 'Monaco', 'Consolas', monospace;
                line-height: 1.4;
                margin-bottom: 4px;
              }
              
              .variableType {
                font-size: 11px;
                color: var(--el-text-color-secondary);
                background: var(--el-fill-color);
                padding: 2px 6px;
                border-radius: 4px;
                display: inline-block;
              }
            }
          }
          
          .emptyState {
            text-align: center;
            padding: 40px 20px;
            color: var(--el-text-color-secondary);
            
            .emptyText {
              font-size: 14px;
            }
          }
        }
      }
    }

  }
}

.drawerFooter {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--o-border-color-light);
}

// 透明遮罩样式
:deep(.transparent-modal) {
  background-color: transparent !important;
}
</style> 