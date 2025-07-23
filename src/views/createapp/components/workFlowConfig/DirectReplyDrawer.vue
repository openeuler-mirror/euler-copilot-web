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
                 />
                
                <!-- 字符统计 -->
                <div class="char-count">
                  {{ getCharCount() }} 字符
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



interface NodeConfig {
  name: string
  description: string
  answer: string
}

interface Props {
  visible: boolean
  nodeData: any
  nodeId: string
  flowId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible', 'saveNode'])

const { t } = useI18n()

// 响应式数据
const drawerVisible = ref(false)
const activeName = ref(['basic', 'content'])
const nodeName = ref('回答')
const textEditorRef = ref()



// 节点配置
const nodeConfig = ref<NodeConfig>({
  name: '回答',
  description: '',
  answer: ''
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
    nodeConfig.value = {
      name: props.nodeData.name || '回答',
      description: props.nodeData.description || '',
      answer: props.nodeData.parameters?.input_parameters?.answer || ''
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
        answer: nodeConfig.value.answer
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