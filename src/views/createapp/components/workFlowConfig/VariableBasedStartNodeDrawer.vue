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
      width="600px"
      :close-on-click-modal="false"
      @close="handleVariableDialogClose"
      class="variable-dialog"
    >
      <el-form v-if="editingVariable" :model="editingVariable" label-width="100px" :rules="variableFormRules" ref="variableFormRef">
          <el-form-item label="变量名称" prop="name" required>
            <el-input 
              v-model="editingVariable.name" 
              placeholder="请输入变量名称" 
              :disabled="isEditingVariable"
            />
          </el-form-item>
          
          <el-form-item label="变量类型" prop="var_type">
            <el-select v-model="editingVariable.var_type" placeholder="选择变量类型" @change="onVariableTypeChange">
              <el-option-group label="基础类型">
                <el-option label="字符串" value="string" />
                <el-option label="数字" value="number" />
                <el-option label="布尔值" value="boolean" />
                <el-option label="对象" value="object" />
                <el-option label="密钥" value="secret" />
                <el-option label="文件" value="file" />
              </el-option-group>
              <el-option-group label="数组类型">
                <el-option label="数组[任意]" value="array[any]" />
                <el-option label="数组[字符串]" value="array[string]" />
                <el-option label="数组[数字]" value="array[number]" />
                <el-option label="数组[对象]" value="array[object]" />
                <el-option label="数组[文件]" value="array[file]" />
                <el-option label="数组[布尔值]" value="array[boolean]" />
                <el-option label="数组[密钥]" value="array[secret]" />
              </el-option-group>
            </el-select>
          </el-form-item>
          
          <el-form-item label="支持的文件类型" v-if="isFileType(editingVariable.var_type)">
            <div class="file-config-container">
              <div class="supported-file-types">
                <div class="file-category">
                  <div class="category-header" @click="toggleFileTypeSupport('document')">
                    <div class="category-icon">
                      <img :src="DocumentIcon" alt="文档" />
                    </div>
                    <div class="category-info">
                      <div class="category-title">文档</div>
                      <div class="category-types">TXT, MD, MDX, MARKDOWN, PDF, HTML, XLSX, XLS, DOC, DOCX, CSV, EML, MSG, PPTX, PPT, XML, EPUB</div>
                    </div>
                    <el-checkbox v-model="editingVariable.supportedTypes!.document" @click.stop />
                  </div>
                </div>
                
                <div class="file-category">
                  <div class="category-header" @click="toggleFileTypeSupport('image')">
                    <div class="category-icon">
                      <img :src="ImageIcon" alt="图片" />
                    </div>
                    <div class="category-info">
                      <div class="category-title">图片</div>
                      <div class="category-types">JPG, JPEG, PNG, GIF, WEBP, SVG</div>
                    </div>
                    <el-checkbox v-model="editingVariable.supportedTypes!.image" @click.stop />
                  </div>
                </div>
                
                <div class="file-category">
                  <div class="category-header" @click="toggleFileTypeSupport('audio')">
                    <div class="category-icon">
                      <img :src="AudioIcon" alt="音频" />
                    </div>
                    <div class="category-info">
                      <div class="category-title">音频</div>
                      <div class="category-types">MP3, M4A, WAV, AMR, MPGA</div>
                    </div>
                    <el-checkbox v-model="editingVariable.supportedTypes!.audio" @click.stop />
                  </div>
                </div>
                
                <div class="file-category">
                  <div class="category-header" @click="toggleFileTypeSupport('video')">
                    <div class="category-icon">
                      <img :src="VideoIcon" alt="视频" />
                    </div>
                    <div class="category-info">
                      <div class="category-title">视频</div>
                      <div class="category-types">MP4, MOV, MPEG, WEBM</div>
                    </div>
                    <el-checkbox v-model="editingVariable.supportedTypes!.video" @click.stop />
                  </div>
                </div>
                
                <div class="file-category">
                  <div class="category-header" @click="toggleFileTypeSupport('others')">
                    <div class="category-icon">
                      <img :src="OtherFileIcon" alt="其他文件类型" />
                    </div>
                    <div class="category-info">
                      <div class="category-title">其他文件类型</div>
                      <div class="category-input">
                        <el-input 
                          v-model="editingVariable.customFileExtensions"
                          placeholder="+ + 文件扩展名，例如 .doc"
                          @click.stop
                        />
                      </div>
                    </div>
                    <el-checkbox v-model="editingVariable.supportedTypes!.others" @click.stop />
                  </div>
                </div>
              </div>
              
              <div class="upload-method-section">
                <div class="section-title">上传文件类型</div>
                <div class="upload-method-tabs">
                  <div 
                    :class="['method-tab', { active: editingVariable.uploadMethods?.includes('manual') }]"
                    @click="toggleUploadMethod('manual')"
                  >
                    本地上传
                  </div>
                  <div 
                    :class="['method-tab', { active: editingVariable.uploadMethods?.includes('url') }]"
                    @click="toggleUploadMethod('url')"
                  >
                    URL上传
                  </div>
                </div>
              </div>
              
              <div class="upload-limits">
                <div class="section-title">文件上传限制</div>
                <div class="upload-limit-item">
                  <label class="limit-label">最大文件数：</label>
                  <el-input-number 
                    v-model="editingVariable.maxFiles" 
                    :min="1" 
                    :max="100"
                    :disabled="editingVariable.var_type === 'file'"
                    size="small"
                    style="width: 120px"
                  />
                  <span v-if="editingVariable.var_type === 'file'" class="file-type-note">
                    文件类型固定为1个文件
                  </span>
                </div>
                <div class="upload-limit-item">
                  <label class="limit-label">单个文件最大大小：</label>
                  <el-input-number 
                    v-model="editingVariable.maxFileSize" 
                    :min="1" 
                    :max="1000"
                    size="small"
                    style="width: 120px"
                  />
                  <span class="unit-label">MB</span>
                </div>
                
                <div class="upload-limit-item">
                  <label class="limit-label">必填文件：</label>
                  <el-checkbox 
                    v-model="editingVariable.required"
                    size="small"
                  />
                  <span class="checkbox-note">选中后，用户在对话时必须上传文件</span>
                </div>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="变量值" prop="value">
            <!-- 字符串类型 -->
            <el-input 
              v-if="editingVariable.var_type === 'string'"
              v-model="editingVariable.value" 
              placeholder="请输入字符串值" 
            />
            
            <!-- 数字类型 -->
            <el-input-number 
              v-else-if="editingVariable.var_type === 'number'"
              v-model="editingVariable.value" 
              placeholder="请输入数字值"
              :precision="2"
              style="width: 100%"
            />
            
            <!-- 布尔值类型 -->
            <el-select 
              v-else-if="editingVariable.var_type === 'boolean'"
              v-model="editingVariable.value" 
              placeholder="选择布尔值"
            >
              <el-option label="true" :value="true" />
              <el-option label="false" :value="false" />
            </el-select>
            
            <!-- 密钥类型 -->
            <el-input 
              v-else-if="editingVariable.var_type === 'secret'"
              v-model="editingVariable.value" 
              type="password"
              placeholder="请输入密钥值"
              show-password
            />
            
            <!-- 对象类型 -->
            <el-input 
              v-else-if="editingVariable.var_type === 'object'"
              v-model="editingVariable.valueJson" 
              type="textarea"
              :rows="4"
              placeholder="请输入JSON格式的对象值" 
            />
            
            <!-- 文件类型 -->
            <div v-else-if="editingVariable.var_type === 'file'" class="file-input-section">
              <div class="file-type-note">
                <el-icon><IconDocument /></el-icon>
                <span>文件类型变量将在对话时由用户上传</span>
              </div>
            </div>
            
            <!-- 数组[字符串]类型 -->
            <div v-else-if="editingVariable.var_type === 'array[string]'" class="array-input-section">
              <div class="array-type-note">
                <el-icon><IconList /></el-icon>
                <span>字符串数组变量将在对话时由用户输入，默认为空数组</span>
              </div>
            </div>
            
            <!-- 数组[数字]类型 -->
            <div v-else-if="editingVariable.var_type === 'array[number]'" class="array-input-section">
              <div class="array-type-note">
                <el-icon><IconList /></el-icon>
                <span>数字数组变量将在对话时由用户输入，默认为空数组</span>
              </div>
            </div>
            
            <!-- 数组[布尔值]类型 -->
            <div v-else-if="editingVariable.var_type === 'array[boolean]'" class="array-input-section">
              <div class="array-type-note">
                <el-icon><IconList /></el-icon>
                <span>布尔值数组变量将在对话时由用户选择，默认为空数组</span>
              </div>
                         </div>
             
             <!-- 数组[文件]类型 -->
             <div v-else-if="editingVariable.var_type === 'array[file]'" class="file-array-section">
               <div class="file-type-note">
                 <el-icon><IconDocument /></el-icon>
                 <span>文件列表类型变量将在对话时由用户上传，默认为空数组</span>
               </div>
             </div>
             
             <!-- 数组[对象]类型 -->
            <div v-else-if="editingVariable.var_type === 'array[object]'" class="array-input-section">
              <div class="array-type-note">
                <el-icon><IconList /></el-icon>
                <span>对象数组变量将在对话时由用户输入JSON格式数据，默认为空数组</span>
              </div>
            </div>
            
            <!-- 数组[密钥]类型 -->
            <div v-else-if="editingVariable.var_type === 'array[secret]'" class="array-input-section">
              <div class="array-type-note">
                <el-icon><IconList /></el-icon>
                <span>密钥数组变量将在对话时由用户输入，默认为空数组</span>
              </div>
            </div>
            
            <!-- 数组[任意]类型 -->
            <div v-else-if="editingVariable.var_type === 'array[any]'" class="array-input-section">
              <div class="array-type-note">
                <el-icon><IconList /></el-icon>
                <span>任意类型数组变量将在对话时由用户输入，默认为空数组</span>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="描述">
            <el-input 
              v-model="editingVariable.description" 
              type="textarea"
              :rows="2"
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
  ElSelect, ElOption, ElMessage, ElAlert, ElUpload, ElCheckbox,
  ElInputNumber, ElTag, ElDivider, ElOptionGroup
} from 'element-plus'
import { Plus, Upload as IconUpload, Delete as IconDelete, Document as IconDocument, List as IconList } from '@element-plus/icons-vue'
import { listVariables, createVariable, updateVariable, deleteVariable } from '@/api/variable'

// 导入SVG图标组件
import DocumentIcon from '@/assets/svgs/document.svg'
import ImageIcon from '@/assets/svgs/image.svg'
import AudioIcon from '@/assets/svgs/audio.svg'
import VideoIcon from '@/assets/svgs/video.svg'
import OtherFileIcon from '@/assets/svgs/other-file.svg'

interface Variable {
  name: string
  var_type: string
  scope: string
  value?: any
  description?: string
  valueJson?: string
  // 移除没有后端意义的displayName
  supportedTypes?: {
    document: boolean
    image: boolean
    audio: boolean
    video: boolean
    others: boolean
  }
  uploadMethods?: string[] // 改为数组格式，与后端保持一致
  maxFiles?: number // 改为maxFiles，与后端保持一致
  customFileExtensions?: string
  maxFileSize?: number // 新增：文件大小限制
  required?: boolean // 新增：文件是否必填
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
const variableFormRef = ref()

// 表单验证规则
const variableFormRules = {
  name: [
    { required: true, message: '请输入变量名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '变量名只能包含字母、数字和下划线，且必须以字母或下划线开头', trigger: 'blur' }
  ],
  var_type: [
    { required: true, message: '请选择变量类型', trigger: 'change' }
  ]
}

const emits = defineEmits(['closeDrawer', 'saveStartNode', 'variablesUpdated', 'saveNodeDescription'])

// 加载所有变量 - 将函数定义提前
const loadAllVariables = async () => {
  variablesLoading.value = true
  
  try {    
    // 加载对话变量（配置阶段使用flowId）
    if (props.flowId) {
      try {
        const convResponse = await listVariables({ 
          scope: 'conversation', 
          flow_id: props.flowId,
          exclude_pattern: 'step_id'  // 🔑 使用后端过滤，排除包含step_id的变量
        })
        
        // 修复：支持多种响应数据结构
        let convVariables: any[] | null = null
        const convResponseAny = convResponse as any
        
        if (convResponseAny?.result?.variables) {
          convVariables = convResponseAny.result.variables
        } else if (convResponseAny?.variables) {
          convVariables = convResponseAny.variables
        } else if (Array.isArray(convResponseAny)) {
          convVariables = convResponseAny
        }
        
        if (convVariables && Array.isArray(convVariables)) {
          // 后端已经过滤了包含step_id的变量，直接使用
          conversationVariables.value = convVariables
        } else {
          conversationVariables.value = []
        }
      } catch (convError: any) {
        conversationVariables.value = []
      }
    } else {
      conversationVariables.value = []
    }
    
    // 加载系统变量 - 配置阶段使用flow_id，对话阶段使用conversation_id
    if (props.conversationId) {
      // 对话/调试阶段：使用conversation_id查询系统变量实例
      try {
        const systemResponse = await listVariables({ 
          scope: 'system',
          conversation_id: props.conversationId 
        })
        
        // 处理响应数据
        const systemVars = (systemResponse as any)?.variables || (systemResponse as any)?.result?.variables || []
        systemVariables.value = Array.isArray(systemVars) ? systemVars : []
      } catch (error) {
        console.error('❌ 系统变量加载失败（对话阶段）:', error)
        systemVariables.value = []
      }
    } else if (props.flowId) {
      // 配置阶段：使用flow_id查询系统变量模板
      try {
        const systemResponse = await listVariables({ 
          scope: 'system',
          flow_id: props.flowId 
        })
        
        // 处理响应数据
        const systemVars = (systemResponse as any)?.variables || (systemResponse as any)?.result?.variables || []
        systemVariables.value = Array.isArray(systemVars) ? systemVars : []
      } catch (error) {
        console.error('❌ 系统变量加载失败（配置阶段）:', error)
        systemVariables.value = []
      }
    } else {
      // 既没有conversation_id也没有flow_id
      systemVariables.value = []
    }
    
  } catch (error) {
    console.error('❌ 变量加载过程发生未知错误:', error)
    ElMessage.error('变量加载失败')
  } finally {
    variablesLoading.value = false
  }
}

// 强制重新加载变量
const forceReloadVariables = async () => {
  await loadAllVariables()
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
    valueJson: '',
    supportedTypes: { // 支持的文件类型
      document: false,
      image: false,
      audio: false,
      video: false,
      others: false
    },
    uploadMethods: ['manual'], // 默认支持手动上传，与后端保持一致
    maxFiles: 1, // 默认最大文件数，与后端保持一致
    customFileExtensions: '', // 自定义文件扩展名
    maxFileSize: 10, // 默认单个文件最大大小
    required: false // 默认非必填
  }
  isEditingVariable.value = false
  showVariableDialog.value = true
}

// 编辑对话变量
const editConversationVariable = (variable: Variable) => {
  let supportedTypes = {
    document: false,
    image: false,
    audio: false,
    video: false,
    others: false
  }
  
  let uploadMethods = ['manual']
  let maxFiles = 1
  let customFileExtensions = ''
  let maxFileSize = 10 // 默认单个文件最大大小
  let required = false // 默认非必填
  
  // 解析后端返回的value字段（如果是文件类型）
  if (isFileType(variable.var_type) && variable.value) {
    try {
      let parsedValue: any = variable.value
      
      // 如果value是字符串，尝试解析JSON
      if (typeof variable.value === 'string') {        
        // 先尝试直接解析
        try {
          parsedValue = JSON.parse(variable.value);
        } catch (firstError) {          
          let normalizedValue = variable.value
            .replace(/'/g, '"')  // 替换所有单引号为双引号
            .replace(/(\w+):/g, '"$1":')  // 确保属性名有双引号
          parsedValue = JSON.parse(normalizedValue);
        }
      }
      
      // 从解析的value中提取文件配置信息
      if (parsedValue && typeof parsedValue === 'object') {
        if (parsedValue.supported_types && Array.isArray(parsedValue.supported_types)) {
          const parsedTypes = parseExtensionsToFileTypes(parsedValue.supported_types)
          supportedTypes = {
            document: parsedTypes.document,
            image: parsedTypes.image,
            audio: parsedTypes.audio,
            video: parsedTypes.video,
            others: parsedTypes.others
          }
          
          // 处理自定义文件扩展名
          if (parsedTypes.customExts && parsedTypes.customExts.length > 0) {
            customFileExtensions = parsedTypes.customExts.join(', ')
          }
          
        }
        
        // 提取上传方式
        if (parsedValue.upload_methods && Array.isArray(parsedValue.upload_methods)) {
          uploadMethods = parsedValue.upload_methods
        }
        
        // 提取最大文件数
        if (parsedValue.max_files && typeof parsedValue.max_files === 'number') {
          maxFiles = parsedValue.max_files
        }

        // 提取单个文件最大大小
        if (parsedValue.max_file_size && typeof parsedValue.max_file_size === 'number') {
          maxFileSize = Math.round(parsedValue.max_file_size / (1024 * 1024)) // 转换为MB
        }

        // 提取是否必填
        if (parsedValue.required && typeof parsedValue.required === 'boolean') {
          required = parsedValue.required
        }
      }
    } catch (error) {
      console.error('❌ 解析文件类型变量value失败:', error)
      console.error('❌ 原始数据:', variable.value)
      console.error('❌ 数据类型:', typeof variable.value)
      // 使用默认值
    }
  }
  
  editingVariable.value = {
    ...variable,
    valueJson: typeof variable.value === 'object' ? JSON.stringify(variable.value, null, 2) : '',
    supportedTypes: supportedTypes,
    uploadMethods: uploadMethods,
    maxFiles: maxFiles,
    customFileExtensions: customFileExtensions,
    maxFileSize: maxFileSize,
    required: required
  }
  isEditingVariable.value = true
  showVariableDialog.value = true
}

// 保存对话变量
const saveConversationVariable = async () => {
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
    
    // 根据变量类型处理值
    switch (editingVariable.value.var_type) {
      case 'string':
        value = editingVariable.value.value || ''
        break
        
      case 'number':
        if (editingVariable.value.value !== null && editingVariable.value.value !== undefined) {
          value = Number(editingVariable.value.value)
          if (isNaN(value)) {
            ElMessage.error('请输入有效的数字')
            return
          }
        } else {
          value = 0
        }
        break
        
      case 'boolean':
        value = Boolean(editingVariable.value.value)
        break
        
      case 'secret':
        value = editingVariable.value.value || ''
        break
        
      case 'object':
        if (editingVariable.value.valueJson) {
          try {
            value = JSON.parse(editingVariable.value.valueJson)
          } catch (error) {
            ElMessage.error('JSON格式不正确，请检查对象值的语法')
            return
          }
        } else {
          value = {}
        }
        break
        
      case 'file':
      case 'array[file]':
        // 文件类型不需要保存默认值，只保存配置信息
        value = null
        break
        
      case 'array[string]':
      case 'array[number]':
      case 'array[boolean]':
      case 'array[object]':
      case 'array[secret]':
      case 'array[any]':
        // 所有数组类型默认为空数组
        value = []
        break
        
      default:
        value = editingVariable.value.value
    }
    
    const variableData = {
      name: editingVariable.value.name.trim(),
      var_type: editingVariable.value.var_type,
      scope: 'conversation',
      value: value,
      description: editingVariable.value.description || '',
      flow_id: props.flowId
    }
    
    // 如果是文件类型，添加文件专用字段
    if (isFileType(editingVariable.value.var_type)) {
      (variableData as any).supported_types = getSupportedTypesArray()
      ;(variableData as any).upload_methods = editingVariable.value.uploadMethods || ['manual']
      // 🔑 修复：array[file]类型默认支持多个文件
      ;(variableData as any).max_files = editingVariable.value.maxFiles || (editingVariable.value.var_type === 'array[file]' ? 10 : 1)
      ;(variableData as any).max_file_size = (editingVariable.value.maxFileSize || 10) * 1024 * 1024 // 转换为字节
      ;(variableData as any).required = editingVariable.value.required || false // 是否必填
    }

    if (isEditingVariable.value) {
      // 更新变量（配置阶段使用flow_id）
      const updateParams = { 
        name: editingVariable.value.name, 
        scope: 'conversation',
        flow_id: props.flowId
      }
      const updateData: any = { 
        value: value,
        description: variableData.description,
        var_type: variableData.var_type
      }
      
      // 如果是文件类型，添加文件专用字段到更新数据中
      if (isFileType(editingVariable.value.var_type)) {
        updateData.supported_types = getSupportedTypesArray()
        updateData.upload_methods = editingVariable.value.uploadMethods || ['manual']
        // 🔑 修复：array[file]类型默认支持多个文件
        updateData.max_files = editingVariable.value.maxFiles || (editingVariable.value.var_type === 'array[file]' ? 10 : 1)
        updateData.max_file_size = (editingVariable.value.maxFileSize || 10) * 1024 * 1024 // 转换为字节
        updateData.required = editingVariable.value.required || false // 是否必填
      }
      
      const updateResult = await updateVariable(updateParams, updateData)
      ElMessage.success('变量更新成功')
    } else {
      // 创建变量
      const createResult = await createVariable(variableData)
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
        errorMessage = `参数错误: ${data?.message || data?.detail || '请检查变量数据格式'}`
      } else if (status === 422) {
        errorMessage = `数据验证失败: ${data?.detail || data?.message || '请检查变量数据是否符合要求'}`
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

// 删除对话变量（配置阶段使用flow_id）
const deleteConversationVariable = async () => {
  if (!editingVariable.value || !props.flowId) {
    console.error('❌ 删除失败：缺少必要参数', { editingVariable: editingVariable.value, flowId: props.flowId })
    return
  }

  try {
    const deleteResult = await deleteVariable({
      name: editingVariable.value.name,
      scope: 'conversation',
      flow_id: props.flowId
    })
    
    ElMessage.success('变量删除成功')
    
    // 在关闭对话框前先保存变量名（避免引用失效）
    const deletedVariableName = editingVariable.value.name
    
    handleVariableDialogClose()
    
    // 直接从本地数组中移除（立即生效）
    // conversationVariables.value = conversationVariables.value.filter(v => v.name !== deletedVariableName)
    
    // 延迟后重新加载（确保数据一致性）
    setTimeout(async () => {
      await loadAllVariables()
    }, 200)
    
    // 通知父组件变量已更新
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
    
  emits('saveStartNode', nodeParams, props.nodeYamlId, nodeName.value, nodeDescription.value)
  ElMessage.success('保存成功')
  closeDrawer()
}

onMounted(() => {
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

// 检查是否为文件类型
const isFileType = (varType: string): boolean => {
  return varType === 'file' || varType === 'array[file]'
}

// 变量类型改变时的处理
const onVariableTypeChange = (newType: string) => {
  if (!editingVariable.value) return
  
  // 重置相关属性
  editingVariable.value.value = ''
  editingVariable.value.valueJson = ''
  editingVariable.value.customFileExtensions = '' // 重置自定义文件扩展名
  editingVariable.value.maxFileSize = 10 // 重置单个文件最大大小
  
  // 根据类型设置默认值
  if (newType === 'boolean') {
    editingVariable.value.value = false
  } else if (newType === 'number') {
    editingVariable.value.value = 0
  } else if (isFileType(newType)) {
    // 文件类型设置支持的文件格式，但不需要默认值
    editingVariable.value.supportedTypes = {
      document: true,
      image: false,
      audio: false,
      video: false,
      others: false
    }
    editingVariable.value.uploadMethods = ['manual']
    // 文件类型固定为1，数组文件类型默认为5
    editingVariable.value.maxFiles = newType === 'file' ? 1 : 5
    // 文件类型不需要默认值
    editingVariable.value.value = undefined
  }
}

// 获取支持的文件类型数组
const getSupportedTypesArray = (): string[] => {
  if (!editingVariable.value || !editingVariable.value.supportedTypes) return []
  
  const types: string[] = []
  const supportedTypes = editingVariable.value.supportedTypes
  
  if (supportedTypes.document) {
    types.push('.txt', '.md', '.mdx', '.markdown', '.pdf', '.html', '.xlsx', '.xls', '.doc', '.docx', '.csv', '.eml', '.msg', '.pptx', '.ppt', '.xml', '.epub')
  }
  if (supportedTypes.image) {
    types.push('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg')
  }
  if (supportedTypes.audio) {
    types.push('.mp3', '.m4a', '.wav', '.amr', '.mpga')
  }
  if (supportedTypes.video) {
    types.push('.mp4', '.mov', '.mpeg', '.webm')
  }
  
  if (editingVariable.value.customFileExtensions) {
    const customTypes = editingVariable.value.customFileExtensions
      .split(',')
      .map(ext => ext.trim())
      .filter(ext => ext.startsWith('.'))
    types.push(...customTypes)
  }
  
  return types
}

// 解析文件扩展名数组，确定应该勾选哪些文件类型分类
const parseExtensionsToFileTypes = (extensions: string[]): { document: boolean; image: boolean; audio: boolean; video: boolean; others: boolean; customExts: string[] } => {
  const documentExts = ['.txt', '.md', '.mdx', '.markdown', '.pdf', '.html', '.xlsx', '.xls', '.doc', '.docx', '.csv', '.eml', '.msg', '.pptx', '.ppt', '.xml', '.epub']
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const audioExts = ['.mp3', '.m4a', '.wav', '.amr', '.mpga']
  const videoExts = ['.mp4', '.mov', '.mpeg', '.webm']
  
  const result = {
    document: false,
    image: false,
    audio: false,
    video: false,
    others: false
  }
  
  const customExts: string[] = []
  
  extensions.forEach(ext => {
    const lowerExt = ext.toLowerCase()
    
    if (documentExts.includes(lowerExt)) {
      result.document = true
    } else if (imageExts.includes(lowerExt)) {
      result.image = true
    } else if (audioExts.includes(lowerExt)) {
      result.audio = true
    } else if (videoExts.includes(lowerExt)) {
      result.video = true
    } else {
      // 未知扩展名归类为其他类型
      customExts.push(ext)
      result.others = true
    }
  })
  
  return { ...result, customExts }
}

// 切换文件类型支持状态
const toggleFileTypeSupport = (fileType: 'document' | 'image' | 'audio' | 'video' | 'others') => {
  if (!editingVariable.value || !editingVariable.value.supportedTypes) return
  
  editingVariable.value.supportedTypes[fileType] = !editingVariable.value.supportedTypes[fileType]
}

// 切换上传方式
const toggleUploadMethod = (method: 'manual' | 'url') => {
  if (!editingVariable.value || !editingVariable.value.uploadMethods) return
  
  if (editingVariable.value.uploadMethods.includes(method)) {
    editingVariable.value.uploadMethods = editingVariable.value.uploadMethods.filter(m => m !== method)
  } else {
    editingVariable.value.uploadMethods.push(method)
  }
}

// 以下函数已移除，因为文件类型变量在定义阶段不需要实际文件上传：
// - handleSingleFileChange
// - handleMultipleFileChange  
// - clearFile
// - removeFromFileArray

// 以下函数已移除，因为数组类型变量在定义阶段不需要设置默认值：
// - addToStringArray
// - removeFromStringArray
// - addToNumberArray
// - removeFromNumberArray
// - addToBooleanArray
// - removeFromBooleanArray
// - addToObjectArray
// - removeFromObjectArray
// - addToSecretArray
// - removeFromSecretArray
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

// 文件类型选择标签页
.file-type-tabs {
  margin-bottom: 20px;
  
  .tab-header {
    display: flex;
    gap: 8px;
    background: var(--el-fill-color-extra-light);
    padding: 4px;
    border-radius: 8px;
    
    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      background: transparent;
      border: 1px solid transparent;
      
      &.active {
        background: var(--el-color-primary);
        color: white;
        border-color: var(--el-color-primary);
      }
      
      &:hover:not(.active) {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-7);
      }
      
      .tab-icon {
        font-size: 16px;
        margin-bottom: 4px;
      }
      
      .tab-text {
        font-size: 12px;
        font-weight: 500;
      }
    }
  }
}

// 支持的文件类型选择
.supported-file-types {
  margin-bottom: 20px;
  
  .file-category {
    margin-bottom: 12px;
    
    .category-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      background: var(--el-fill-color-extra-light);
      transition: all 0.2s;
      cursor: pointer;
      
      &:hover {
        border-color: var(--el-color-primary-light-7);
        background: var(--el-color-primary-light-9);
      }
      
      &:active {
        transform: translateY(1px);
      }
      
      .category-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        img {
          width: 20px;
          height: 20px;
          opacity: 0.6;
          transition: all 0.2s;
        }
      }
      
      &:hover {
        .category-icon img {
          opacity: 0.9;
        }
      }
      
      .category-info {
        flex: 1;
        
        .category-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }
        
        .category-types {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          line-height: 1.4;
        }
        
        .category-input {
          margin-top: 8px;
          
          .el-input {
            font-size: 12px;
          }
        }
      }
    }
  }
}

// 上传方式选择
.upload-method-section {
  margin-bottom: 20px;
  
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
  }
  
  .upload-method-tabs {
    display: flex;
    gap: 8px;
    
    .method-tab {
      flex: 1;
      padding: 8px 16px;
      text-align: center;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      background: white;
      
      &.active {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary);
        color: white;
      }
      
      &:hover:not(.active) {
        border-color: var(--el-color-primary-light-7);
        background: var(--el-color-primary-light-9);
      }
    }
  }
}

// 上传限制设置
.upload-limits {
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }
  
  .upload-limit-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    
    .limit-label {
      font-size: 13px;
      color: var(--el-text-color-primary);
      font-weight: 500;
      min-width: 120px;
  }
  
    .unit-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
    
    .file-type-note {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      font-style: italic;
    }
    
    .checkbox-note {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-left: 8px;
    }
  }
}

// 文件输入区域
.file-input-section {
  .file-type-note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--el-fill-color-extra-light);
    border: 1px dashed var(--el-border-color-light);
    border-radius: 6px;
    margin-bottom: 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

// 文件数组区域
.file-array-section {
  .file-type-note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--el-fill-color-extra-light);
    border: 1px dashed var(--el-border-color-light);
    border-radius: 6px;
    margin-bottom: 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  

}

// 数组输入区域
.array-input-section {
  .array-type-note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--el-fill-color-extra-light);
    border: 1px dashed var(--el-border-color-light);
    border-radius: 6px;
    margin-bottom: 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

// 变量对话框样式增强
:deep(.el-dialog) {
  .el-dialog__body {
    padding: 20px 24px;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .el-form-item {
    margin-bottom: 20px;
    
    .el-form-item__label {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    
    .el-form-item__content {
      .el-input__wrapper {
        transition: all 0.2s;
        
        &:hover {
          box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
        }
      }
      
      .el-select {
        width: 100%;
      }
      
      .el-textarea__inner {
        transition: all 0.2s;
        
        &:hover {
          border-color: var(--el-color-primary-light-7);
        }
      }
    }
  }
  
  .el-upload {
    .el-button {
      border-style: dashed;
      transition: all 0.2s;
      
      &:hover {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
      }
    }
  }
}

// 变量对话框特定样式
.variable-dialog {
  :deep(.el-dialog) {
    max-height: 90vh;
    
    .el-dialog__header {
      border-bottom: 1px solid var(--el-border-color-light);
    }
    
    .el-dialog__body {
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .el-dialog__footer {
      border-top: 1px solid var(--el-border-color-light);
    }
  }
}

// 文件配置容器
.file-config-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-fill-color-extra-light);
  
  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-light);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
    
    &:hover {
      background: var(--el-border-color-dark);
    }
  }
}

// 支持的文件类型区域优化
.supported-file-types {
  margin-bottom: 16px;
  
  .file-category:last-child {
    margin-bottom: 0;
  }
}
</style> 