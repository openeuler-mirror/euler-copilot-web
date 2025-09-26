<template>
    <div class="llm-drawer">
      <el-drawer
        v-model="drawerVisible"
        :show-close="false"
        :modal="true"
        modal-class="transparent-modal"
        class="flowDrawer"
        size="70%"
        @close="closeDrawer"
      >
        <template #header>
          <div class="drawer-header">
            <div class="header-title">
              <img class="node-icon" :src="getSrcIcon({ callId: 'LLM' })" />
              <span>
                {{ $t('flow.step_configuration') }} - {{ llmForm.name }}
              </span>
            </div>
          </div>
        </template>
  
        <template #default>
          <div class="drawer-body">
            <el-collapse v-model="activeName" class="o-hpc-collapse">
              <!-- 基本信息 -->
              <el-collapse-item name="basic" class="basic-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('basic') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('llmNode.basic_info') }}</span>
                </template>
                <div class="basic-content">
                  <el-form
                    :rules="llmFormRules"
                    :model="llmForm"
                    ref="llmFormRef"
                    label-position="left"
                    label-width="120px"
                  >
                    <el-form-item
                      prop="name"
                      :label="$t('semantic.component_name')"
                      required
                    >
                      <el-input
                        v-model="llmForm.name"
                        type="text"
                        :placeholder="$t('llmNode.node_name_placeholder')"
                        maxlength="50"
                        clearable
                      />
                    </el-form-item>
                    <el-form-item
                      prop="description"
                      :label="$t('semantic.component_introduction')"
                    >
                      <el-input
                        v-model="llmForm.description"
                        type="textarea"
                        :placeholder="$t('llmNode.node_description_placeholder')"
                        :rows="3"
                      />
                    </el-form-item>
                    <el-form-item
                      prop="selectedModel"
                      :label="$t('semantic.selectedModel')"
                      required
                    >
                      <el-select
                        v-model="llmForm.selectedModel"
                        :placeholder="$t('llmNode.model_placeholder')"
                        style="width: 100%"
                      >
                        <template #label="{ value }">
                          <div style="display: flex; align-items: center">
                            <img
                              v-if="
                                llmForm.selectedModel.modelName ===
                                'default-model'
                              "
                              style="width: 16px"
                              src="@/assets/images/logo-euler-copilot.png"
                              alt=""
                            />
                            <img
                              v-else
                              style="width: 16px"
                              :src="value.icon"
                              alt=""
                            />
                            <span
                              style="
                                width: 100px;
                                overflow: hidden;
                                line-height: 32px;
                                padding-left: 8px;
                              "
                            >
                              {{ value.modelName }}
                            </span>
                          </div>
                        </template>
                        <el-option
                          :label="option.modelName"
                          :value="option"
                          v-for="option in llmOptions"
                          :key="option.llmId"
                        >
                          <div style="display: flex; align-items: center">
                            <img
                              v-if="option.modelName === 'default-model'"
                              style="width: 16px"
                              src="@/assets/images/logo-euler-copilot.png"
                              alt=""
                            />
                            <img
                              v-else
                              style="width: 16px"
                              :src="option.icon"
                              alt=""
                            />
                            <span
                              style="
                                width: 100px;
                                overflow: hidden;
                                line-height: 32px;
                                padding-left: 8px;
                              "
                            >
                              {{ option.modelName }}
                            </span>
                          </div>
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-item>
  
              <!-- 提示词配置 -->
              <el-collapse-item name="prompt" class="prompt-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('prompt') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('llmNode.prompt_config') }}</span>
                </template>
                <div class="prompt-content">
                  <el-form
                    :model="llmForm"
                    label-position="left"
                    label-width="120px"
                  >
                    <el-form-item :label="$t('llmNode.system_prompt_label')">
                      <VariableRichTextEditor
                        v-model="llmForm.system_prompt"
                        :current-step-id="nodeYamlId"
                        :flow-id="flowId"
                        :placeholder="$t('llmNode.system_prompt_placeholder')"
                      />
                    </el-form-item>
  
                    <el-form-item :label="$t('llmNode.user_prompt_label')">
                      <VariableRichTextEditor
                        v-model="llmForm.user_prompt"
                        :flow-id="flowId"
                        :current-step-id="nodeYamlId"
                        :placeholder="$t('llmNode.user_prompt_placeholder')"
                      />
                    </el-form-item>
  
                    <el-form-item :label="$t('llmNode.question_label')" required>
                      <VariableRichTextEditor
                        v-model="llmForm.user_question"
                        :flow-id="flowId"
                        :current-step-id="nodeYamlId"
                        :placeholder="$t('llmNode.question_placeholder')"
                      />
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-item>
  
              <!-- 参数配置 -->
              <el-collapse-item name="parameters" class="parameters-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('parameters') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('llmNode.parameter_config') }}</span>
                </template>
                <div class="parameters-content">
                  <el-form
                    :model="llmForm"
                    label-position="left"
                    label-width="120px"
                  >
                    <el-form-item :label="$t('llmNode.temperature_label')">
                      <div style="display: flex; align-items: center; gap: 12px">
                        <el-switch v-model="llmForm.enable_temperature" />
                        <el-slider
                          :disabled="!llmForm.enable_temperature"
                          v-model="llmForm.temperature"
                          :max="1"
                          :min="0"
                          :step="0.1"
                          show-input
                          style="flex: 1"
                        />
                      </div>
                    </el-form-item>
  
                    <el-form-item :label="$t('llmNode.context_label')">
                      <div style="display: flex; align-items: center; gap: 12px">
                        <el-switch v-model="llmForm.enable_context" />
                        <el-slider
                          :disabled="!llmForm.enable_context"
                          v-model="llmForm.step_history_size"
                          :max="10"
                          :min="1"
                          :step="1"
                          show-input
                          style="flex: 1"
                        />
                      </div>
                    </el-form-item>
  
                    <el-form-item :label="$t('llmNode.frequency_penalty_label')">
                      <div style="display: flex; align-items: center; gap: 12px">
                        <el-switch v-model="llmForm.enable_frequency_penalty" />
                        <el-slider
                          :disabled="!llmForm.enable_frequency_penalty"
                          v-model="llmForm.frequency_penalty"
                          :max="1"
                          :min="0"
                          :step="0.1"
                          show-input
                          style="flex: 1"
                        />
                      </div>
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-item>
  
              <!-- 输出变量 -->
              <el-collapse-item name="output" class="output-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('output') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('llmNode.output_variables') }}</span>
                </template>
                <div class="output-content">
                  <YamlContentOutput :yamlOutPutContent="LLMOutputInYaml" />
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </template>
  
        <template #footer>
          <div class="drawer-footer">
            <el-button @click="closeDrawer">{{ $t('main.close') }}</el-button>
            <el-button
              :disabled="infoDisabled"
              type="primary"
              @click="updateNodeYaml(llmFormRef)"
              :loading="saving"
            >
              {{ $t('semantic.submit') }}
            </el-button>
          </div>
        </template>
      </el-drawer>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { onMounted, ref, reactive, watch } from 'vue';
  import yaml from 'js-yaml';
  import { IconCaretRight } from '@computing/opendesign-icons';
  import YamlContentOutput from 'src/components/yamloutput/yamlContentOutput.jsx';
  import { ElMessage, FormInstance } from 'element-plus';
  import i18n from 'src/i18n';
  import { api } from 'src/apis';
  import VariableRichTextEditor from '@/components/VariableRichTextEditor.vue';
  import { NodeType, getSrcIcon } from '../types';
  
  const visible = ref(true);
  const infoDisabled = ref(true);
  const drawerVisible = ref(false);
  const saving = ref(false);
  const activeName = ref(['prompt', 'basic', 'output']);
  
  interface LLMForm {
    name: string;
    description: string;
    to_user: boolean;
    enable_context: boolean;
    step_history_size: number;
    system_prompt: string;
    temperature: number;
    user_prompt: string;
    enable_temperature: boolean;
    enable_frequency_penalty: boolean;
    frequency_penalty: number;
    llmId: string;
    user_question: string;
    node_type: string;
    selectedModel: {
      icon: string;
      modelName: string;
      llmId: string;
    };
  }
  
  const llmForm = reactive<LLMForm>({
    name: '',
    description: '',
    to_user: true,
    enable_context: false,
    step_history_size: 3,
    system_prompt: '',
    temperature: 0,
    user_prompt: '',
    enable_temperature: false,
    enable_frequency_penalty: false,
    frequency_penalty: 0,
    llmId: 'empty',
    user_question: '',
    node_type: NodeType.LLM,
    selectedModel: {
      icon: '@/assets/images/logo-euler-copilot.png',
      modelName: 'default-model',
      llmId: 'empty',
    },
  });
  
  const llmFormRef = ref<FormInstance>();
  
  const llmFormRules = ref({
    name: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
    description: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
    selectedModel: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
    user_question: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
  });
  
  // 获取可用LLM
  const getProviderLLM = async () => {
    const [_, res] = await api.getLLMList();
    if (!_ && res && res.code === 200) {
      if (res.result.length === 0) {
        ElMessage.error(i18n.global.t('feedback.no_model_error'));
      }
      llmOptions.value.push(...res.result);
      if (llmForm.llmId !== 'empty') {
        llmOptions.value.forEach((item) => {
          llmForm.selectedModel =
            item.llmId === llmForm.llmId ? item : llmForm.selectedModel;
        });
      }
    } else {
      ElMessage.error(i18n.global.t('feedback.network_error'));
    }
  };
  
  // 设计默认model是为了应对需要导出或平台配置改动导致模型找不到id的情况
  const llmOptions = ref([
    {
      icon: '@/assets/images/logo-euler-copilot.png',
      modelName: 'default-model',
      llmId: 'empty',
    },
  ]);
  
  // TODO app.outputContent 还没有对接 在预定义的插件那里会有outputContent
  const LLMOutputInYaml = ref('');
  const emits = defineEmits(['closeDrawer', 'saveNode']);
  const props = defineProps<{
    yamlContent: any;
    nodeName: string;
    nodeDesc: string;
    appId: any;
    flowId: any;
    nodeYamlId: any;
  }>();
  
  onMounted(() => {
    let input_content = props.yamlContent.input_parameters;
    Object.assign(llmForm, {
      ...input_content,
      name: props.nodeName,
      description: props.nodeDesc,
      enable_frequency_penalty: input_content.frequency_penalty !== 0,
      enable_temperature: input_content.temperature !== 0.7,
    });

    if (llmForm.name && llmForm.description) {
      infoDisabled.value = false;
    } else {
      infoDisabled.value = true;
    }

    // 转换output_parameters的数据结构以匹配YamlContentOutput组件的期望
    const outputParams = props.yamlContent.output_parameters;
    if (outputParams && outputParams.type === 'object' && outputParams.description) {
      // 如果output_parameters是一个描述对象，转换为YamlContentOutput期望的格式
      LLMOutputInYaml.value = {
        reply: {
          type: 'string',
          description: outputParams.description || 'LLM生成的回复内容'
        }
      };
    } else if (outputParams && typeof outputParams === 'object') {
      // 如果已经是正确的格式，直接使用
      LLMOutputInYaml.value = outputParams;
    } else {
      // 设置默认结构
      LLMOutputInYaml.value = {
        reply: {
          type: 'string',
          description: 'LLM生成的回复内容'
        }
      };
    }
    console.log('LLM Output Parameters:', LLMOutputInYaml.value);
    console.log('Props yamlContent:', props.yamlContent);
    getProviderLLM();
  });
  
  const closeDrawer = () => {
    drawerVisible.value = false;
  };
  
  // 监听器
  watch(
    () => visible.value,
    (newVal) => {
      drawerVisible.value = newVal;
    },
    { immediate: true },
  );
  
  watch(drawerVisible, (newVal) => {
    if (!newVal) {
      emits('closeDrawer');
    }
  });
  
  // 完成yaml更新
  const updateNodeYaml = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    console.log(llmForm);
  
    await formEl.validate((valid, fields) => {
      if (valid) {
        try {
          let transResult = {
            ...llmForm,
            step_history_size: llmForm.enable_context
              ? llmForm.step_history_size
              : 0,
            temperature: llmForm.enable_temperature ? llmForm.temperature : 0.7,
            frequency_penalty: llmForm.enable_frequency_penalty
              ? llmForm.frequency_penalty
              : 0,
            llmId: llmForm.selectedModel.llmId,
            node_type: NodeType.LLM,
          };
          let transResultToYaml = yaml.load(JSON.stringify(transResult));
  
          console.log(transResultToYaml);
          // 调用接口并更新--根据id包含更新后的yamlCode, name, desc
          emits(
            'saveNode',
            transResultToYaml,
            props.nodeYamlId,
            llmForm.name,
            llmForm.description,
          );
          closeDrawer();
        } catch {
          ElMessage.error(i18n.global.t('semantic.checkFormat'));
        }
      } else {
        console.log('submit failed!', fields);
      }
    });
  };
  </script>
  
  <style lang="scss" scoped>
  .llm-drawer {
    :deep(.el-drawer) {
      border-radius: 8px 0 0 8px;
      background-color: var(--el-bg-color);
    }

    :deep(.el-drawer__header) {
      padding: 24px 24px 16px !important;
      margin-bottom: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-bg-color);
    }

    :deep(.el-drawer__body) {
      padding: 0;
      background-color: var(--el-bg-color);
    }

    :deep(.el-drawer__footer) {
      padding: 16px 24px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-bg-color);
    }
  
    .drawer-header {
      .header-title {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);

        .node-icon {
          width: 24px;
          height: 24px;
          margin-right: 8px;
        }

        span {
          color: var(--el-text-color-primary);
        }
      }
    }
  
    .drawer-body {
      height: 100%;
      overflow-y: auto;

      // 增强选择器特异性来确保样式生效
      :deep(.llm-drawer .drawer-body .o-hpc-collapse) {
        background: transparent !important;
        border: none !important;

        .el-collapse-item {
          background: transparent !important;
          border: none !important;
          margin-bottom: 1px;

          &__header {
            padding: 16px 24px !important;
            font-weight: 500 !important;
            background: var(--el-bg-color-page) !important;
            border-bottom: 1px solid var(--el-border-color-lighter) !important;
            border-radius: 0 !important;
            color: var(--el-text-color-primary) !important;

            .el-collapse-item__arrow {
              color: var(--el-text-color-primary) !important;
            }

            span {
              color: var(--el-text-color-primary) !important;
            }
          }

          &__wrap {
            border-bottom: none !important;
            background: transparent !important;
          }

          &__content {
            padding: 24px !important;
            background: transparent !important;
            color: var(--el-text-color-primary) !important;
          }
        }
      }
    }
  
    // 增强表单样式的选择器特异性
    .llm-drawer .basic-content,
    .llm-drawer .prompt-content,
    .llm-drawer .parameters-content,
    .llm-drawer .output-content {
      :deep(.el-form-item) {
        margin-bottom: 16px !important;

        .el-form-item__label {
          color: var(--el-text-color-primary) !important;
          font-weight: 500 !important;
        }

        .el-input {
          .el-input__wrapper {
            background-color: var(--el-bg-color-page) !important;
            border-color: var(--el-border-color) !important;
            box-shadow: 0 0 0 1px var(--el-border-color) inset !important;

            &.is-focus {
              border-color: var(--el-color-primary) !important;
              box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
            }

            .el-input__inner {
              background-color: transparent !important;
              color: var(--el-text-color-primary) !important;

              &::placeholder {
                color: var(--el-text-color-placeholder) !important;
              }
            }
          }
        }

        .el-textarea {
          .el-textarea__inner {
            background-color: var(--el-bg-color-page) !important;
            border-color: var(--el-border-color) !important;
            color: var(--el-text-color-primary) !important;

            &::placeholder {
              color: var(--el-text-color-placeholder) !important;
            }

            &:focus {
              border-color: var(--el-color-primary) !important;
            }
          }
        }

        .el-select {
          .el-input .el-input__wrapper {
            background-color: var(--el-bg-color-page) !important;
            border-color: var(--el-border-color) !important;

            &.is-focus {
              border-color: var(--el-color-primary) !important;
            }

            .el-input__inner {
              color: var(--el-text-color-primary) !important;
            }
          }
        }

        .el-switch {
          .el-switch__core {
            background-color: var(--el-fill-color-darker) !important;
            border-color: var(--el-border-color) !important;

            &::after {
              background-color: var(--el-color-white) !important;
            }
          }

          &.is-checked .el-switch__core {
            background-color: var(--el-color-primary) !important;
          }
        }

        .el-slider {
          .el-slider__runway {
            background-color: var(--el-fill-color-darker) !important;
          }

          .el-slider__bar {
            background-color: var(--el-color-primary) !important;
          }

          .el-slider__button {
            background-color: var(--el-color-white) !important;
            border-color: var(--el-color-primary) !important;
          }

          .el-input-number {
            .el-input__wrapper {
              background-color: var(--el-bg-color-page) !important;
              border-color: var(--el-border-color) !important;

              .el-input__inner {
                background-color: transparent !important;
                color: var(--el-text-color-primary) !important;
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
      
      // 深色模式适配
      body[theme='dark'] & {
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }
  }
  
  // 透明遮罩样式
  :deep(.transparent-modal) {
    background-color: transparent !important;
  }

  // 强制修复collapse头部背景颜色
  .llm-drawer {
    :deep(.el-collapse-item__header) {
      background-color: var(--el-bg-color-page) !important;
      color: var(--el-text-color-primary) !important;
    }
    
    :deep(.el-collapse-item__content) {
      background-color: transparent !important;
    }

    :deep(.el-collapse-item__wrap) {
      background-color: transparent !important;
    }

    :deep(.o-hpc-collapse) {
      background-color: transparent !important;
    }
  }

  // 全局深色模式样式增强
  :deep(.el-popper) {
    background-color: var(--el-bg-color-overlay) !important;
    border-color: var(--el-border-color) !important;

    .el-select-dropdown__item {
      background-color: transparent !important;
      color: var(--el-text-color-primary) !important;

      &:hover {
        background-color: var(--el-fill-color-light) !important;
      }

      &.selected {
        background-color: var(--el-color-primary-light-9) !important;
        color: var(--el-color-primary) !important;
      }
    }
  }

</style>

<!-- 使用正确的主题切换机制 -->
<style lang="scss">
// 使用项目的主题系统
body[theme='dark'] .llm-drawer {
  // Drawer标题文字颜色
  .drawer-header .header-title {
    color: #ffffff !important;
    
    span {
      color: #ffffff !important;
    }
  }

  .el-collapse-item__header {
    background-color: var(--el-collapse-header-bg) !important;
    color: #ffffff !important;
    
    span {
      color: #ffffff !important;
    }
    
    .el-collapse-item__arrow {
      color: #ffffff !important;
    }
  }
  
  .el-collapse-item__content {
    background-color: rgb(31 35 41) !important;
  }
  
  // 只对特定区域设置白色文字，避免影响VariableRichTextEditor
  .basic-content,
  .parameters-content,
  .output-content {
    color: #ffffff !important;
  }

  // 确保VariableRichTextEditor及其容器占满宽度
  .prompt-content .el-form-item {
    width: 100% !important;
    
    .el-form-item__content {
      width: 100% !important;
    }
  }
  
  .prompt-content .variable-rich-text-editor,
  .prompt-content .variable-rich-text-editor .editor-container {
    width: 100% !important;
    min-width: 100% !important;
  }

  .el-collapse-item__wrap,
  .o-hpc-collapse {
    background-color: transparent !important;
  }

  .el-form-item__label {
    color: #ffffff !important;
  }

  // 只针对基础信息和参数配置中的输入框，严格排除VariableRichTextEditor
  .basic-content .el-form-item:not(.variable-rich-text-editor-wrapper) .el-input__wrapper,
  .parameters-content .el-form-item:not(.variable-rich-text-editor-wrapper) .el-input__wrapper {
    border-color: var(--el-collapse-border) !important;
    
    .el-input__inner {
      color: #ffffff !important;
      
      &::placeholder {
        color: #a0a8b6 !important;
      }
    }
  }

  .basic-content .el-form-item:not(.variable-rich-text-editor-wrapper) .el-textarea__inner,
  .parameters-content .el-form-item:not(.variable-rich-text-editor-wrapper) .el-textarea__inner {
    border-color: var(--el-collapse-border) !important;
    color: #ffffff !important;
    
    &::placeholder {
      color: #a0a8b6 !important;
    }
  }

  .basic-content .el-select .el-input__wrapper,
  .parameters-content .el-select .el-input__wrapper {
    border-color: var(--el-collapse-border) !important;
    
    .el-input__inner {
      color: #ffffff !important;
    }
  }

  // 其他可能的文字元素，但排除VariableRichTextEditor
  .basic-content .el-form-item__content,
  .parameters-content .el-form-item__content,
  .output-content .el-form-item__content {
    color: #ffffff !important;
  }

  // 修复YamlContentOutput组件在深色模式下的显示
  .output-content .outputContainer {
    margin: 16px;

    .yamlKey {
      color: #ffffff !important;
    }
    
    .yamlKeyType {
      color: #a0a8b6 !important;
    }
    
    .yamlDes {
      color: #ffffff !important;
    }
    
    .el-collapse-item__header {
      color: #ffffff !important;
    }
  }

  .el-slider__input .el-input__inner {
    color: #ffffff !important;
  }

  // 确保特定区域的文本为白色，但完全排除prompt-content
  .basic-content span, 
  .parameters-content span,
  .output-content span,
  .drawer-header span {
    color: #ffffff !important;
  }
  
  .basic-content p, 
  .parameters-content p,
  .output-content p {
    color: #ffffff !important;
  }

  // 只对基础信息和参数配置区域的按钮设置白色文字
  .basic-content .el-button,
  .parameters-content .el-button {
    color: #ffffff !important;
  }
}

body[theme='light'] .llm-drawer {
  .el-collapse-item__header {
    background-color: var(--el-collapse-header-bg) !important;
    color: var(--el-text-color-primary) !important;
  }

  .el-collapse-item__wrap,
  .o-hpc-collapse {
    background-color: transparent !important;
  }

  .el-form-item__label {
    color: var(--el-text-color-primary) !important;
  }

  .el-input__wrapper {
    border-color: var(--el-collapse-border) !important;
  }

  .el-textarea__inner {
    border-color: var(--el-collapse-border) !important;
    color: var(--el-text-color-primary) !important;
  }

  .el-select .el-input__wrapper {
    border-color: var(--el-collapse-border) !important;
  }

  // 确保VariableRichTextEditor及其容器占满宽度（浅色模式）
  .prompt-content .el-form-item {
    width: 100% !important;
    
    .el-form-item__content {
      width: 100% !important;
    }
  }
  
  .prompt-content .variable-rich-text-editor,
  .prompt-content .variable-rich-text-editor .editor-container {
    width: 100% !important;
    min-width: 100% !important;
  }
}
</style>