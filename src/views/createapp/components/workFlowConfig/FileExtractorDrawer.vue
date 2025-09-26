<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="t('flow.file_extractor.title')"
    direction="rtl"
    size="600px"
    :before-close="handleClose"
    class="file-extractor-drawer"
  >
    <div class="drawer-content">
      <!-- Basic Information -->
      <div class="section">
        <h3 class="section-title">{{ t('flow.file_extractor.basic_info') }}</h3>
        <el-form :model="formData" label-width="120px">
          <el-form-item :label="t('flow.file_extractor.node_name')" required>
            <el-input v-model="formData.name" :placeholder="t('flow.file_extractor.node_name_placeholder')" />
          </el-form-item>
          <el-form-item :label="t('flow.file_extractor.node_description')">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="2"
              :placeholder="t('flow.file_extractor.node_description_placeholder')"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- Input Variable Configuration -->
      <div class="section">
        <h3 class="section-title">{{ t('flow.file_extractor.input_variables') }}</h3>
        <div class="input-variable-section">
          <el-form :model="formData" label-width="120px">
            <el-form-item :label="t('flow.file_extractor.parse_method')" required>
              <el-select 
                v-model="formData.parseMethod" 
                :placeholder="t('flow.file_extractor.parse_method_placeholder')"
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
                  <span>{{ t('flow.file_extractor.input_file') }}</span>
                  <el-tooltip 
                    :content="t('flow.file_extractor.supported_file_types', { types: supportedFileTypes.join(', ') })"
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
                :placeholder="t('flow.file_extractor.select_file_variable')"
                :selector-placeholder="t('flow.file_extractor.select_file_or_array_variable')"
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

      <!-- Output Variables -->
      <div class="section">
        <h3 class="section-title">{{ t('flow.file_extractor.output_variables') }}</h3>
        <div class="output-variable-section">
          <div class="output-info">
            <div class="output-item">
              <div class="output-label">{{ t('flow.file_extractor.variable_name') }}</div>
              <div class="output-value">text</div>
            </div>
            <div class="output-item">
              <div class="output-label">{{ t('flow.file_extractor.type') }}</div>
              <div class="output-value">
                <el-tag type="primary">{{ t('flow.file_extractor.string_type') }}</el-tag>
              </div>
            </div>
            <div class="output-item">
              <div class="output-label">{{ t('flow.file_extractor.description') }}</div>
              <div class="output-value">{{ t('flow.file_extractor.text_output_description') }}</div>
            </div>
          </div>
          
          <div class="output-info" style="margin-top: 12px;">
            <div class="output-item">
              <div class="output-label">{{ t('flow.file_extractor.variable_name') }}</div>
              <div class="output-value">error</div>
            </div>
            <div class="output-item">
              <div class="output-label">{{ t('flow.file_extractor.type') }}</div>
              <div class="output-value">
                <el-tag type="warning">{{ t('flow.file_extractor.string_type') }}</el-tag>
              </div>
            </div>
            <div class="output-item">
              <div class="output-label">{{ t('flow.file_extractor.description') }}</div>
              <div class="output-value">{{ t('flow.file_extractor.error_output_description') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">{{ t('flow.file_extractor.cancel') }}</el-button>
        <el-button type="primary" @click="saveNode">{{ t('flow.file_extractor.save') }}</el-button>
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
import i18n from '@/i18n';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

// Supported file types list
const supportedFileTypes = [
  'txt', 'markdown', 'pdf', 'html', 'xlsx', 'xls', 
  'doc', 'docx', 'csv', 'pptx', 'xml', 'ppt', 'md'
];

// Form data
const formData = ref({
  name: '',
  description: '',
  parseMethod: '',
  target: '',
});

// Parse method options
const parseMethodOptions = ref<Array<{value: string, label: string, description?: string}>>([]);
const parseMethodLoading = ref(false);

// Initialize form data
const initFormData = () => {
  if (props.nodeData) {
    formData.value = {
      name: props.nodeData.name || i18n.global.t('flow.node_names.file_extractor'),
      description: props.nodeData.description || '',
      parseMethod: props.nodeData.parameters?.input_parameters?.parse_method || '',
      target: props.nodeData.parameters?.input_parameters?.target || '',
    };
  } else {
    formData.value = {
      name: i18n.global.t('flow.node_names.file_extractor'),
      description: '',
      parseMethod: '',
      target: '',
    };
  }
};

// Load parse method list
const loadParseMethodList = async () => {
  parseMethodLoading.value = true;
  try {
    const [error, response] = await api.getParseMethodList();
    if (error) {
      console.error('Failed to load parse method list:', error);
      ElMessage.error(t('flow.file_extractor.load_parse_methods_failed'));
      return;
    }
    
    if (response?.result) {
      parseMethodOptions.value = response.result.map(method => ({
        value: method,
        label: method,
        description: t('flow.file_extractor.parse_method_description')
      }));
    }
  } catch (error) {
    console.error('Failed to load parse method list:', error);
    ElMessage.error(t('flow.file_extractor.load_parse_methods_failed'));
  } finally {
    parseMethodLoading.value = false;
  }
};

// Handle target file selection
const handleTargetSelected = (variable, reference) => {
  formData.value.target = reference;
};

// Form validation
const validateForm = () => {
  if (!formData.value.name || formData.value.name.trim() === '') {
    ElMessage.error(t('flow.file_extractor.node_name_required'));
    return false;
  }
  
  if (!formData.value.parseMethod || formData.value.parseMethod.trim() === '') {
    ElMessage.error(t('flow.file_extractor.parse_method_required'));
    return false;
  }
  
  if (!formData.value.target || formData.value.target.trim() === '') {
    ElMessage.error(t('flow.file_extractor.input_file_required'));
    return false;
  }
  
  return true;
};

// Save node
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
          description: t('flow.file_extractor.text_output_description')
        },
        error: {
          type: 'string',
          description: t('flow.file_extractor.error_output_description')
        }
      },
    },
  };
  
  emit('saveNode', nodeData, props.nodeId);
  handleClose();
};

// Close drawer
const handleClose = () => {
  emit('update:visible', false);
};

// Load parse method list when component mounts - removed, changed to load when drawer opens
// onMounted(() => {
//   loadParseMethodList();
// });

// Watch visible changes
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // Load parse method list and initialize form data when drawer opens
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

// Dark theme support
.dark {
  .file-extractor-drawer {
    .drawer-content {
      background: #1f2329;
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
      background: #1f2329;
      border-color: #4b5563;
    }
  }
}
</style> 