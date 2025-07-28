<template>
  <div class="simpleCodeNodeDrawer">
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
        <div class="drawerHeader">
          <div class="headerTitle">
            <img class="nodeIcon" :src="getSrcIcon({ callId: 'Code' })" />
            <span>{{ $t('flow.step_configuration') }} - {{ nodeName }}</span>
          </div>
        </div>
      </template>
      
      <template #default>
        <div class="drawerBody">
          <el-collapse v-model="activeName" class="o-hpc-collapse codeContent">
            
            <!-- 设置 -->
            <el-collapse-item name="settings" class="settingsPanel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('settings') }">
                  <IconCaretRight />
                </el-icon>
                <span>设置</span>
              </template>
              <div class="settingsContent">
                <el-form :model="formData" label-position="left" label-width="120px">
                  <el-form-item label="节点名称">
                    <el-input
                      v-model="formData.name"
                      placeholder="请输入节点名称"
                      maxlength="50"
                      clearable
                    />
                  </el-form-item>
                  <el-form-item label="描述">
                    <el-input
                      v-model="formData.description"
                      type="textarea"
                      placeholder="请输入描述"
                      :rows="3"
                      maxlength="200"
                      show-word-limit
                    />
                  </el-form-item>
                  <el-form-item label="代码类型">
                    <el-select v-model="formData.code_type" placeholder="请选择代码类型">
                      <el-option label="Python" value="python" />
                      <el-option label="JavaScript" value="javascript" />
                      <el-option label="Bash" value="bash" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="安全等级">
                    <el-select v-model="formData.security_level" placeholder="请选择安全等级">
                      <el-option label="低安全级别" value="low" />
                      <el-option label="高安全级别" value="high" />
                    </el-select>
                  </el-form-item>
                </el-form>
              </div>
            </el-collapse-item>

            <!-- 输入变量 -->
            <el-collapse-item name="input" class="inputPanel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('input') }">
                  <IconCaretRight />
                </el-icon>
                <span>输入变量</span>
                <el-button 
                  type="text" 
                  class="addVariableBtn" 
                  @click.stop="addInputVariable"
                  v-if="activeName.includes('input')"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </template>
              <div class="variablesContent">
                <div 
                  v-for="(variable, index) in inputVariables" 
                  :key="'input-' + index"
                  class="variableItem"
                >
                  <div class="variableRow">
                    <el-input
                      v-model="variable.name"
                      placeholder="变量名称"
                      class="variableName"
                    />
                    <el-select
                      v-model="variable.type"
                      placeholder="变量类型"
                      class="variableType"
                    >
                      <el-option label="String" value="string" />
                      <el-option label="Number" value="number" />
                      <el-option label="Boolean" value="boolean" />
                      <el-option label="Array" value="array" />
                      <el-option label="Object" value="object" />
                    </el-select>
                    <el-button 
                      type="text" 
                      danger 
                      @click="removeInputVariable(index)"
                      class="removeBtn"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-input
                    v-model="variable.description"
                    placeholder="变量描述"
                    class="variableDesc"
                  />
                </div>
                <div v-if="inputVariables.length === 0" class="emptyVariables">
                  暂无输入变量
                </div>
              </div>
            </el-collapse-item>

            <!-- 代码编辑器 -->
            <el-collapse-item name="code" class="codePanel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('code') }">
                  <IconCaretRight />
                </el-icon>
                <span>{{ getCodeLanguageLabel() }}</span>
              </template>
              <div class="codeEditorContent">
                <div class="codeEditor">
                  <MirrorText
                    ref="codeEditorRef"
                    v-model:updateVal="formData.code"
                    :yamlCode="formData.code"
                    :disabled="false"
                    class="codeTextArea"
                  />
                </div>
              </div>
            </el-collapse-item>

            <!-- 输出变量 -->
            <el-collapse-item name="output" class="outputPanel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('output') }">
                  <IconCaretRight />
                </el-icon>
                <span>输出变量</span>
                <el-button 
                  type="text" 
                  class="addVariableBtn" 
                  @click.stop="addOutputVariable"
                  v-if="activeName.includes('output')"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </template>
              <div class="variablesContent">
                <div 
                  v-for="(variable, index) in outputVariables" 
                  :key="'output-' + index"
                  class="variableItem"
                >
                  <div class="variableRow">
                    <el-input
                      v-model="variable.name"
                      placeholder="变量名称"
                      class="variableName"
                    />
                    <el-select
                      v-model="variable.type"
                      placeholder="变量类型"
                      class="variableType"
                    >
                      <el-option label="String" value="string" />
                      <el-option label="Number" value="number" />
                      <el-option label="Boolean" value="boolean" />
                      <el-option label="Array" value="array" />
                      <el-option label="Object" value="object" />
                    </el-select>
                    <el-button 
                      type="text" 
                      danger 
                      @click="removeOutputVariable(index)"
                      class="removeBtn"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-input
                    v-model="variable.description"
                    placeholder="变量描述"
                    class="variableDesc"
                  />
                </div>
                <div v-if="outputVariables.length === 0" class="emptyVariables">
                  暂无输出变量
                </div>
              </div>
            </el-collapse-item>

            <!-- 失败时重试 -->
            <el-collapse-item name="retry" class="retryPanel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('retry') }">
                  <IconCaretRight />
                </el-icon>
                <span>失败时重试</span>
              </template>
              <div class="retryContent">
                <el-form :model="formData" label-position="left" label-width="120px">
                  <el-form-item label="启用重试">
                    <el-switch v-model="formData.enable_retry" />
                  </el-form-item>
                  <template v-if="formData.enable_retry">
                    <el-form-item label="最大重试次数">
                      <el-input-number
                        v-model="formData.max_retries"
                        :min="1"
                        :max="10"
                        :step="1"
                      />
                    </el-form-item>
                    <el-form-item label="重试延迟">
                      <el-input-number
                        v-model="formData.retry_delay"
                        :min="0"
                        :max="300"
                        :step="1"
                      />
                      <span class="unitText">秒</span>
                    </el-form-item>
                  </template>
                </el-form>
              </div>
            </el-collapse-item>

            <!-- 异常处理 -->
            <el-collapse-item name="exception" class="exceptionPanel">
              <template #title>
                <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeName.includes('exception') }">
                  <IconCaretRight />
                </el-icon>
                <span>异常处理</span>
              </template>
              <div class="exceptionContent">
                <el-form :model="formData" label-position="left" label-width="120px">
                  <el-form-item label="超时时间">
                    <el-input-number
                      v-model="formData.timeout_seconds"
                      :min="5"
                      :max="300"
                      :step="5"
                    />
                    <span class="unitText">秒</span>
                  </el-form-item>
                  <el-form-item label="内存限制">
                    <el-input-number
                      v-model="formData.memory_limit_mb"
                      :min="64"
                      :max="2048"
                      :step="64"
                    />
                    <span class="unitText">MB</span>
                  </el-form-item>
                  <el-form-item label="CPU限制">
                    <el-input-number
                      v-model="formData.cpu_limit"
                      :min="0.1"
                      :max="4.0"
                      :step="0.1"
                      :precision="1"
                    />
                    <span class="unitText">核心</span>
                  </el-form-item>
                </el-form>
              </div>
            </el-collapse-item>

          </el-collapse>
        </div>
      </template>

      <template #footer>
        <div class="drawerFooter">
          <el-button @click="closeDrawer">取消</el-button>
          <el-button type="primary" @click="saveNode">保存</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { IconCaretRight } from '@computing/opendesign-icons';
import { Plus, Delete } from '@element-plus/icons-vue';
import { getSrcIcon } from '../types';
import MirrorText from '../codeMirror/mirrorTextArea.vue';
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
});

const emits = defineEmits(['update:visible', 'saveNode']);

// 控制面板展开状态
const activeName = ref(['settings', 'input', 'code', 'output']);

// 抽屉可见性
const drawerVisible = ref(false);

// 节点名称
const nodeName = computed(() => props.nodeData?.name || '代码执行');

// 表单数据
const formData = ref({
  name: '',
  description: '',
  code: '',
  code_type: 'python',
  security_level: 'low',
  timeout_seconds: 30,
  memory_limit_mb: 128,
  cpu_limit: 0.5,
  enable_retry: false,
  max_retries: 3,
  retry_delay: 1,
});

// 输入变量
const inputVariables = ref<Array<{name: string, type: string, description: string}>>([]);

// 输出变量
const outputVariables = ref<Array<{name: string, type: string, description: string}>>([]);

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    drawerVisible.value = newVal;
  },
  { immediate: true }
);

// 监听drawerVisible变化
watch(drawerVisible, (newVal) => {
  if (!newVal) {
    emits('update:visible', false);
  }
});

// 监听props变化
watch(
  () => props.nodeData,
  (newData) => {
    if (newData) {
      formData.value = {
        name: newData.name || '',
        description: newData.description || '',
        code: newData.code || getDefaultCode(),
        code_type: newData.code_type || 'python',
        security_level: newData.security_level || 'low',
        timeout_seconds: newData.timeout_seconds || 30,
        memory_limit_mb: newData.memory_limit_mb || 128,
        cpu_limit: newData.cpu_limit || 0.5,
        enable_retry: newData.enable_retry || false,
        max_retries: newData.max_retries || 3,
        retry_delay: newData.retry_delay || 1,
      };

      // 对于新建节点，应该从空数组开始，让用户自己定义变量
      inputVariables.value = newData.input_variables || [];

      outputVariables.value = newData.output_variables || [];
    }
  },
  { immediate: true, deep: true }
);

// 获取默认代码
function getDefaultCode() {
  const codeTemplates = {
    python: `def main(depth: int) -> dict:
    depth = depth or 3
    array = list(range(depth))
    return {
        "array": array,
        "depth": depth
    }`,
    javascript: `function main(depth) {
    depth = depth || 3;
    const array = Array.from({length: depth}, (_, i) => i);
    return {
        array: array,
        depth: depth
    };
}`,
    bash: `#!/bin/bash
depth=\${1:-3}
array=$(seq 0 $((depth-1)) | tr '\\n' ' ')
echo "{\\"array\\": [$array], \\"depth\\": $depth}"`
  };
  return codeTemplates[formData.value.code_type] || codeTemplates.python;
}

// 获取代码语言标签
function getCodeLanguageLabel() {
  const labels = {
    python: 'PYTHON3',
    javascript: 'JAVASCRIPT', 
    bash: 'BASH'
  };
  return labels[formData.value.code_type] || 'PYTHON3';
}

// 添加输入变量
function addInputVariable() {
  inputVariables.value.push({
    name: '',
    type: 'string',
    description: ''
  });
}

// 删除输入变量
function removeInputVariable(index) {
  inputVariables.value.splice(index, 1);
}

// 添加输出变量
function addOutputVariable() {
  outputVariables.value.push({
    name: '',
    type: 'string', 
    description: ''
  });
}

// 删除输出变量
function removeOutputVariable(index) {
  outputVariables.value.splice(index, 1);
}

// 关闭抽屉
function closeDrawer() {
  drawerVisible.value = false;
}

// 保存节点
function saveNode() {
  // 验证必填字段
  if (!formData.value.name.trim()) {
    ElMessage.error('请输入节点名称');
    return;
  }

  if (!formData.value.code.trim()) {
    ElMessage.error('请输入代码内容');
    return;
  }

  // 构建保存数据
  const saveData = {
    ...formData.value,
    input_variables: inputVariables.value,
    output_variables: outputVariables.value,
  };

  emits('saveNode', saveData, props.nodeId);
  closeDrawer();
}

// 监听代码类型变化，更新默认代码
watch(() => formData.value.code_type, () => {
  if (!formData.value.code.trim()) {
    formData.value.code = getDefaultCode();
  }
});
</script>

<style lang="scss" scoped>
.simpleCodeNodeDrawer {
  :deep(.el-drawer) {
    border-radius: 8px 0 0 8px;
  }

  :deep(.el-drawer__header) {
    padding: 24px 24px 16px !important;
    margin-bottom: 0;
    border-bottom: 1px solid var(--o-border-color-lighter);
  }

  :deep(.el-drawer__body) {
    padding: 0;
  }

  :deep(.el-drawer__footer) {
    padding: 16px 24px;
    border-top: 1px solid var(--o-border-color-lighter);
  }

  .drawerHeader {
    .headerTitle {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 500;
      color: var(--o-text-color-primary);

      .nodeIcon {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }
    }
  }

  .drawerBody {
    height: 100%;
    overflow-y: auto;

    .codeContent {
      :deep(.el-collapse-item__header) {
        padding: 16px 24px;
        font-weight: 500;
        background: var(--o-fill-color-extra-light);
        border-bottom: 1px solid var(--o-border-color-lighter);
      }

      :deep(.el-collapse-item__wrap) {
        border-bottom: none;
      }

      :deep(.el-collapse-item__content) {
        padding: 20px 24px;
      }

      .addVariableBtn {
        margin-left: auto;
        color: var(--o-color-primary);
      }
    }
  }

  .settingsContent,
  .retryContent,
  .exceptionContent {
    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    .unitText {
      margin-left: 8px;
      color: var(--o-text-color-secondary);
      font-size: 12px;
    }
  }

  .variablesContent {
    .variableItem {
      margin-bottom: 16px;
      padding: 16px;
      background: var(--o-fill-color-extra-light);
      border-radius: 6px;

      .variableRow {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;

        .variableName {
          flex: 1;
        }

        .variableType {
          width: 120px;
        }

        .removeBtn {
          color: var(--o-color-danger);
        }
      }

      .variableDesc {
        width: 100%;
      }
    }

    .emptyVariables {
      text-align: center;
      color: var(--o-text-color-placeholder);
      padding: 40px 0;
    }
  }

  .codeEditorContent {
    .codeEditor {
      border: 1px solid var(--o-border-color-light);
      border-radius: 6px;
      overflow: hidden;
      min-height: 400px;

      .codeTextArea {
        min-height: 400px;
      }
    }
  }

  .drawerFooter {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 透明遮罩样式
:deep(.transparent-modal) {
  background-color: transparent !important;
}
</style> 