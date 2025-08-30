<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="配置文件提取器"
    direction="rtl"
    size="600px"
    :before-close="handleClose"
    class="file-extractor-drawer"
  >
    <div class="drawer-content">
      <!-- 基本信息 -->
      <div class="section">
        <h3 class="section-title">基本信息</h3>
        <el-form :model="formData" label-width="120px">
          <el-form-item label="节点名称" required>
            <el-input v-model="formData.name" placeholder="请输入节点名称" />
          </el-form-item>
          <el-form-item label="节点描述">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="2"
              placeholder="请输入节点描述"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 输入变量配置 -->
      <div class="section">
        <h3 class="section-title">输入变量</h3>
        <div class="input-variable-section">
          <el-form :model="formData" label-width="120px">
            <el-form-item label="解析方法" required>
              <el-select 
                v-model="formData.parseMethod" 
                placeholder="请选择文件解析方法"
                :loading="parseMethodLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="option in parseMethodOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                >
                  <div class="parse-method-option">
                    <div class="option-label">{{ option.label }}</div>
                    <div v-if="option.description" class="option-description">
                      {{ option.description }}
                    </div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item required>
              <template #label>
                <div class="label-with-tooltip">
                  <span>输入文件</span>
                  <el-tooltip 
                    :content="`支持的文件类型：${supportedFileTypes.join(', ')}`"
                    placement="top"
                  >
                    <el-icon class="help-icon">
                      <QuestionFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </template>
              <VariableChooser
                v-model="formData.target"
                :flow-id="flowId"
                :conversation-id="conversationId"
                :current-step-id="nodeId"
                placeholder="选择文件变量"
                selector-placeholder="选择文件或文件数组变量"
                :show-variable-name="false"
                :show-label="false"
                :show-actions="false"
                :show-variable-info="false"
                :type-filter="['file', 'array[file]']"
                output-format="wrapped"
                style="width: 100%"
                prefix-icon="x"
                suffix-label="File | Array[File]"
                @variable-selected="handleTargetSelected"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 输出变量 -->
      <div class="section">
        <h3 class="section-title">输出变量</h3>
        <div class="output-variable-section">
          <div class="output-info">
            <div class="output-item">
              <div class="output-label">变量名</div>
              <div class="output-value">text</div>
            </div>
            <div class="output-item">
              <div class="output-label">类型</div>
              <div class="output-value">
                <el-tag type="primary">字符串</el-tag>
              </div>
            </div>
            <div class="output-item">
              <div class="output-label">描述</div>
              <div class="output-value">提取的文本内容</div>
            </div>
          </div>
          
          <div class="output-info" style="margin-top: 12px;">
            <div class="output-item">
              <div class="output-label">变量名</div>
              <div class="output-value">error</div>
            </div>
            <div class="output-item">
              <div class="output-label">类型</div>
              <div class="output-value">
                <el-tag type="warning">字符串</el-tag>
              </div>
            </div>
            <div class="output-item">
              <div class="output-label">描述</div>
              <div class="output-value">错误信息（如果有的话）</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="saveNode">保存</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { QuestionFilled } from '@element-plus/icons-vue';
import VariableChooser from '@/components/VariableChooser.vue';
import { api } from 'src/apis';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  nodeData: {
    type: Object,
    default: () => ({}),
  },
  nodeId: {
    type: String,
    default: '',
  },
  flowId: {
    type: String,
    default: '',
  },
  conversationId: {
    type: String,
    default: '',
  },
  isSubFlowNode: {
    type: Boolean,
    default: false,
  },
  loopNodeId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:visible', 'saveNode']);

// 支持的文件类型列表
const supportedFileTypes = [
  'txt', 'markdown', 'pdf', 'html', 'xlsx', 'xls', 
  'doc', 'docx', 'csv', 'pptx', 'xml', 'ppt', 'md'
];

// 表单数据
const formData = ref({
  name: '',
  description: '',
  parseMethod: '',
  target: '',
});

// 解析方法选项
const parseMethodOptions = ref<Array<{value: string, label: string, description?: string}>>([]);
const parseMethodLoading = ref(false);

// 初始化表单数据
const initFormData = () => {
  if (props.nodeData) {
    formData.value = {
      name: props.nodeData.name || '文件提取器',
      description: props.nodeData.description || '',
      parseMethod: props.nodeData.parameters?.input_parameters?.parse_method || '',
      target: props.nodeData.parameters?.input_parameters?.target || '',
    };
  } else {
    formData.value = {
      name: '文件提取器',
      description: '',
      parseMethod: '',
      target: '',
    };
  }
};

// 加载解析方法列表
const loadParseMethodList = async () => {
  parseMethodLoading.value = true;
  try {
    const [error, response] = await api.getParseMethodList();
    if (error) {
      console.error('获取解析方法列表失败:', error);
      ElMessage.error('获取解析方法列表失败');
      return;
    }
    
    if (response?.result) {
      parseMethodOptions.value = response.result.map(method => ({
        value: method,
        label: method,
        description: `从文件中提取文本内容，支持多种文件格式的解析`
      }));
    }
  } catch (error) {
    console.error('获取解析方法列表失败:', error);
    ElMessage.error('获取解析方法列表失败');
  } finally {
    parseMethodLoading.value = false;
  }
};

// 处理目标文件选择
const handleTargetSelected = (variable, reference) => {
  formData.value.target = reference;
};

// 表单验证
const validateForm = () => {
  if (!formData.value.name || formData.value.name.trim() === '') {
    ElMessage.error('请填写节点名称');
    return false;
  }
  
  if (!formData.value.parseMethod || formData.value.parseMethod.trim() === '') {
    ElMessage.error('请选择文件解析方法');
    return false;
  }
  
  if (!formData.value.target || formData.value.target.trim() === '') {
    ElMessage.error('请选择输入文件变量');
    return false;
  }
  
  return true;
};

// 保存节点
const saveNode = () => {
  if (!validateForm()) {
    return;
  }
  
  const nodeData = {
    name: formData.value.name,
    description: formData.value.description,
    callId: 'FileExtract',
    parameters: {
      input_parameters: {
        parse_method: formData.value.parseMethod,
        target: formData.value.target,
      },
      output_parameters: {
        text: {
          type: 'string',
          description: '提取的文本内容'
        },
        error: {
          type: 'string',
          description: '错误信息（如果有的话）'
        }
      },
    },
  };
  
  emit('saveNode', nodeData, props.nodeId);
  handleClose();
};

// 关闭抽屉
const handleClose = () => {
  emit('update:visible', false);
};

// 组件挂载时加载解析方法列表 - 移除，改为在抽屉打开时加载
// onMounted(() => {
//   loadParseMethodList();
// });

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // 抽屉打开时加载解析方法列表和初始化表单数据
      nextTick(() => {
        initFormData();
        loadParseMethodList();
      });
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.file-extractor-drawer {
  :deep(.el-drawer__body) {
    padding: 0;
  }
}

.drawer-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.section {
  margin-bottom: 24px;
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
  }
}

.input-variable-section {
  .label-with-tooltip {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .help-icon {
      font-size: 14px;
      color: #909399;
      cursor: pointer;
      
      &:hover {
        color: #409eff;
      }
    }
  }
  
  .parse-method-option {
    .option-label {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
    
    .option-description {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
      line-height: 1.4;
    }
  }
}

.output-variable-section {
  .output-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    
    .output-item {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .output-label {
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        min-width: 80px;
      }
      
      .output-value {
        font-size: 14px;
        color: #212529;
        
        .el-tag {
          font-weight: 500;
        }
      }
    }
  }
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 深色主题支持
.dark {
  .file-extractor-drawer {
    .drawer-content {
      background: #1a1a1a;
    }
    
    .section-title {
      color: #e5e7eb;
    }
    
    .input-variable-section {
      .help-icon {
        color: #9ca3af;
        
        &:hover {
          color: #60a5fa;
        }
      }
    }
    
    .output-info {
      background: #374151;
      border-color: #4b5563;
      
      .output-label {
        color: #e5e7eb;
      }
      
      .output-value {
        color: #f3f4f6;
      }
    }
    
    .drawer-footer {
      background: #374151;
      border-color: #4b5563;
    }
  }
}
</style> 