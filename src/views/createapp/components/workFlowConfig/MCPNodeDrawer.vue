<template>
    <div class="mcp-drawer">
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
              <img class="node-icon" :src="getSrcIcon({ callId: 'MCP' })" />
              <span>
                {{ $t('flow.step_configuration') }} - {{ mcpForm.name }}
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
                  <span>{{ $t('mcpNode.basic_info') }}</span>
                </template>
                <div class="basic-content">
                  <el-form
                    :rules="mcpFormRules"
                    :model="mcpForm"
                    ref="mcpFormRef"
                    label-position="left"
                    label-width="120px"
                  >
                    <el-form-item
                      prop="name"
                      :label="$t('semantic.component_name')"
                      required
                    >
                      <el-input
                        v-model="mcpForm.name"
                        type="text"
                        :placeholder="$t('mcpNode.node_name_placeholder')"
                        maxlength="50"
                        clearable
                      />
                    </el-form-item>
                    <el-form-item
                      prop="description"
                      :label="$t('semantic.component_introduction')"
                    >
                      <el-input
                        v-model="mcpForm.description"
                        type="textarea"
                        :placeholder="$t('mcpNode.node_description_placeholder')"
                        :rows="3"
                      />
                    </el-form-item>
                    <el-form-item prop="mcp_list" :label="$t('mcpNode.mcp_tools_label')" required>
                      <el-select
                        v-model="mcpForm.mcp_list"
                        multiple
                        :placeholder="$t('mcpNode.mcp_tools_placeholder')"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="item in mcpListOption"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item prop="max_steps" :label="$t('mcpNode.max_steps_label')">
                      <el-slider
                        v-model="mcpForm.max_steps"
                        :max="20"
                        :min="1"
                        :step="1"
                        show-input
                      />
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
                  <span>{{ $t('mcpNode.output_variables') }}</span>
                </template>
                <div class="output-content">
                  <YamlContentOutput :yamlOutPutContent="mcpOutputInYaml" />
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
              @click="updateNodeYaml(mcpFormRef)"
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
  import { reactive, onMounted, ref, watch } from 'vue';
  import yaml from 'js-yaml';
  import { IconCaretRight } from '@computing/opendesign-icons';
  import YamlContentOutput from 'src/components/yamloutput/yamlContentOutput.jsx';
  import { ElMessage, FormInstance } from 'element-plus';
  import i18n from 'src/i18n';
  import { api } from '@/apis';
  import { NodeType, getSrcIcon } from '../types';
  
  const visible = ref(true);
  const infoDisabled = ref(true);
  const drawerVisible = ref(false);
  const saving = ref(false);
  const activeName = ref(['basic', 'output']);
  const mcpListOption = ref<MCPListItem[]>([]);
  
  const mcpFormRules = ref({
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
    mcp_list: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
    max_steps: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
  });
  
  interface MCPForm {
    name: string; // node name
    description: string; // node description
    node_type: string; // node type
    mcp_list: string[]; // 修改为字符串数组
    max_steps: number;
  }
  
  interface MCPListItem {
    value: string;
    label: string;
  }
  
  const mcpForm = reactive<MCPForm>({
    name: '',
    description: '',
    node_type: NodeType.MCP,
    mcp_list: [],
    max_steps: 5,
  });
  
  const mcpFormRef = ref<FormInstance>();
  const mcpOutputInYaml = ref('');
  
  const emits = defineEmits(['closeDrawer', 'saveNode']);
  const props = defineProps<{
    yamlContent: any;
    nodeName: string;
    nodeDesc: string;
    appId: any;
    flowId: any;
    nodeYamlId: any;
  }>();
  
  /**
   * 查询MCP服务
   */
  async function queryMcpList() {
    try {
      const [, res] = await api.getMcpList({
        keyword: '',
      });
      // 清空之前的选项
      mcpListOption.value = [];
      if (res?.result?.services) {
        res?.result.services.forEach((item) => {
          mcpListOption.value.push({
            value: item.mcpserviceId,
            label: item.name,
          });
        });
      }
    } catch (error) {
      console.error('查询MCP服务失败:', error);
      // 清空选项以避免显示旧数据
      mcpListOption.value = [];
      ElMessage.error(i18n.global.t('mcpNode.query_mcp_service_failed'));
    }
  }
  
  onMounted(() => {
    let input_content = props.yamlContent.input_parameters;
    queryMcpList();
  
    Object.assign(mcpForm, {
      ...input_content,
      name: props.nodeName,
      description: props.nodeDesc,
      mcp_list: Array.isArray(input_content.mcp_list)
        ? input_content.mcp_list.filter((item) => item)
        : [],
    });
  
    mcpOutputInYaml.value = props.yamlContent.output_parameters;
    if (mcpForm.name && mcpForm.description) {
      infoDisabled.value = false;
    } else {
      infoDisabled.value = true;
    }
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
    // 现在把每个数值单独提取出来是为了更好的可拓展性
  
    if (!formEl) return;
    await formEl.validate((valid, fields) => {
      if (valid) {
        const transResult = {
          ...mcpForm,
        };
        try {
          let transResultToYaml = yaml.load(JSON.stringify(transResult));
          // 调用接口并更新--根据id包含更新后的yamlCode, name, desc
          emits(
            'saveNode',
            transResultToYaml,
            props.nodeYamlId,
            transResult.name,
            transResult.description,
          );
          closeDrawer();
        } catch {
          ElMessage.error(i18n.global.t('semantic.checkFormat'));
        }
        console.log('submit!');
      } else {
        console.log('error submit!', fields);
      }
    });
  };
  </script>
  
  <style lang="scss" scoped>
  .mcp-drawer {
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
      :deep(.mcp-drawer .drawer-body .o-hpc-collapse) {
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
    .mcp-drawer .basic-content,
    .mcp-drawer .output-content {
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

        .el-slider {
          .el-slider__runway {
            background-color: var(--el-border-color-lighter) !important;
          }

          .el-slider__bar {
            background-color: var(--el-color-primary) !important;
          }

          .el-slider__button {
            border-color: var(--el-color-primary) !important;
            background-color: var(--el-color-primary) !important;
          }
        }
      }
    }
  
    .drawer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
  
  // 透明遮罩样式
  :deep(.transparent-modal) {
    background-color: transparent !important;
  }

  // 强制修复collapse头部背景颜色
  .mcp-drawer {
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
  body[theme='dark'] .mcp-drawer {
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
    
    // 只对特定区域设置白色文字，避免影响其他组件
    .basic-content,
    .output-content {
      color: #ffffff !important;
    }

    .el-collapse-item__wrap,
    .o-hpc-collapse {
      background-color: transparent !important;
    }

    .el-form-item__label {
      color: #ffffff !important;
    }

    // 针对各种输入框的深色模式适配
    .basic-content .el-form-item .el-input__wrapper,
    .output-content .el-form-item .el-input__wrapper {
      border-color: var(--el-collapse-border) !important;
      
      .el-input__inner {
        color: #ffffff !important;
        
        &::placeholder {
          color: #a0a8b6 !important;
        }
      }
    }

    .basic-content .el-form-item .el-textarea__inner,
    .output-content .el-form-item .el-textarea__inner {
      border-color: var(--el-collapse-border) !important;
      color: #ffffff !important;
      
      &::placeholder {
        color: #a0a8b6 !important;
      }
    }

    .basic-content .el-select .el-input__wrapper,
    .output-content .el-select .el-input__wrapper {
      border-color: var(--el-collapse-border) !important;
      
      .el-input__inner {
        color: #ffffff !important;
      }
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

    // 确保特定区域的文本为白色
    .basic-content span, 
    .output-content span,
    .drawer-header span {
      color: #ffffff !important;
    }
    
    .basic-content p, 
    .output-content p {
      color: #ffffff !important;
    }

    // 其他可能的文字元素
    .basic-content .el-form-item__content,
    .output-content .el-form-item__content {
      color: #ffffff !important;
    }

    // 滑块组件深色模式
    .el-slider {
      .el-slider__runway {
        background-color: #4a4a4a !important;
      }

      .el-slider__bar {
        background-color: var(--el-color-primary) !important;
      }

      .el-slider__button {
        border-color: var(--el-color-primary) !important;
        background-color: var(--el-color-primary) !important;
      }

      .el-input-number {
        .el-input__wrapper {
          background-color: #2c2c2c !important;
          border-color: #4a4a4a !important;

          .el-input__inner {
            color: #ffffff !important;
          }
        }
      }
    }
  }

  body[theme='light'] .mcp-drawer {
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
  }
  </style>