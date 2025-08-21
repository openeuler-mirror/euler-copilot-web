<template>
    <div class="rag-drawer">
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
              <img class="node-icon" :src="getSrcIcon({ callId: 'RAG' })" />
              <span>
                {{ $t('flow.step_configuration') }} - {{ ragForm.name }}
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
                  <span>{{ $t('ragNode.basic_info') }}</span>
                </template>
                <div class="basic-content">
                  <el-form
                    :rules="ragFormRules"
                    :model="ragForm"
                    ref="ragFormRef"
                    label-position="left"
                    label-width="120px"
                  >
                    <el-form-item
                      prop="name"
                      :label="$t('semantic.component_name')"
                      required
                    >
                      <el-input
                        v-model="ragForm.name"
                        type="text"
                        :placeholder="$t('ragNode.node_name_placeholder')"
                        maxlength="50"
                        clearable
                      />
                    </el-form-item>
                    <el-form-item
                      prop="description"
                      :label="$t('semantic.component_introduction')"
                    >
                      <el-input
                        v-model="ragForm.description"
                        type="textarea"
                        :placeholder="$t('ragNode.node_description_placeholder')"
                        :rows="3"
                      />
                    </el-form-item>
                    <el-form-item
                      prop="query_variables"
                      :label="$t('semantic.rag_query_variables')"
                      required
                    >
                      <VariableRichTextEditor
                        v-model="ragForm.query_variables"
                        :current-step-id="nodeYamlId"
                        title-placeholder="问题检索"
                        :flow-id="flowId"
                        :placeholder="$t('ragNode.query_placeholder')"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-item>
  
              <!-- 知识库配置 -->
              <el-collapse-item name="knowledge" class="knowledge-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('knowledge') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('ragNode.knowledge_config') }}</span>
                </template>
                <div class="knowledge-content">
                  <el-form
                    :model="ragForm"
                    label-position="left"
                    label-width="120px"
                  >
                    <el-form-item prop="document_ids" :label="$t('ragNode.knowledge_base_label')" required>
                      <el-select
                        v-model="ragForm.document_ids"
                        multiple
                        :placeholder="knowledgeBaseListOption.length > 0 ? $t('ragNode.knowledge_base_placeholder') : $t('ragNode.no_knowledge_base_available')"
                        style="width: 100%"
                        :disabled="knowledgeBaseListOption.length === 0"
                      >
                        <template v-for="item in knowledgeBaseListOption" :key="item.kb_id">
                          <el-option
                            v-if="item.kb_id && item.kb_name"
                            :label="item.kb_name + '(' + (item.team_name || '') + ')'"
                            :value="item.kb_id"
                          />
                        </template>
                      </el-select>
                    </el-form-item>
  
                    <el-form-item prop="search_method" :label="$t('ragNode.search_method_label')" required>
                      <el-select
                        v-model="ragForm.search_method"
                        :placeholder="$t('ragNode.search_method_placeholder')"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="item in searchMethodOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
  
                    <el-form-item prop="top_k" label="top k">
                      <el-slider
                        v-model="ragForm.top_k"
                        :max="10"
                        :min="1"
                        :step="1"
                        show-input
                      />
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-item>
  
              <!-- 高级选项 -->
              <el-collapse-item name="advanced" class="advanced-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('advanced') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('ragNode.advanced_options') }}</span>
                </template>
                <div class="advanced-content">
                  <el-form
                    :model="ragForm"
                    label-position="left"
                    label-width="160px"
                  >
                    <el-form-item prop="is_rerank" :label="$t('ragNode.is_rerank_label')">
                      <el-switch v-model="ragForm.is_rerank" />
                    </el-form-item>
                    <el-form-item prop="is_compress" :label="$t('ragNode.is_compress_label')">
                      <el-switch v-model="ragForm.is_compress" />
                    </el-form-item>
                    <el-form-item
                      prop="is_classify_by_doc"
                      :label="$t('ragNode.is_classify_by_doc_label')"
                    >
                      <el-switch v-model="ragForm.is_classify_by_doc" />
                    </el-form-item>
                    <el-form-item
                      prop="is_related_surrounding"
                      :label="$t('ragNode.is_related_surrounding_label')"
                    >
                      <el-switch v-model="ragForm.is_related_surrounding" />
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
                  <span>{{ $t('ragNode.output_variables') }}</span>
                </template>
                <div class="output-content">
                  <YamlContentOutput :yamlOutPutContent="ragOutputInYaml" />
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
              @click="updateNodeYaml(ragFormRef)"
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
  // 获取知识库列表
  import { api } from 'src/apis';
  
  import { reactive, onMounted, ref, watch } from 'vue';
  import yaml from 'js-yaml';
  import { IconCaretRight } from '@computing/opendesign-icons';
  import YamlContentOutput from 'src/components/yamloutput/yamlContentOutput.jsx';
  import { ElMessage, FormInstance } from 'element-plus';
  import i18n from 'src/i18n';
  import VariableRichTextEditor from '@/components/VariableRichTextEditor.vue';
  
  import { NodeType, getSrcIcon } from '../types';
  
  const visible = ref(true);
  const infoDisabled = ref(true);
  const drawerVisible = ref(false);
  const saving = ref(false);
  const activeName = ref(['basic', 'knowledge', 'advanced', 'output']);
  
  const ragFormRules = ref({
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
    query_variables: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
    document_ids: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
    search_method: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
    ],
  });
  
  interface RAGForm {
    name: string; // node name
    description: string; // node description
    node_type: string; // node type
    top_k: number; // 返回的分片数
    document_ids: string[]; // 文档id列表
    search_method: string; // 检索方法
    is_related_surrounding: boolean; // 是否关联上下文
    is_classify_by_doc: boolean; // 是否按文档分类
    is_rerank: boolean; // 是否重排
    is_compress: boolean; // 是否压缩
    token_limits: number; // TODO token限制 这个还没开放配置
    query_variables: string; // 查询变量
  }
  
  const ragForm = reactive<RAGForm>({
    name: '',
    description: '',
    node_type: NodeType.RAG,
    top_k: 0,
    document_ids: [],
    search_method: '',
    is_related_surrounding: true,
    is_classify_by_doc: false,
    is_rerank: false,
    is_compress: false,
    token_limits: 8192,
    query_variables: '',
  });
  
  const ragFormRef = ref<FormInstance>();
  
  // TODO app.outputContent 还没有对接 在预定义的插件那里会有outputContent
  const ragOutputInYaml = ref('');
  
  const emits = defineEmits(['closeDrawer', 'saveNode']);
  const props = defineProps<{
    yamlContent: any;
    nodeName: string;
    nodeDesc: string;
    appId: any;
    flowId: any;
    nodeYamlId: any;
  }>();
  
  const searchMethodOptions = [
    {
      value: 'keyword',
      label: i18n.global.t('ragNode.keyword_search'),
    },
    {
      value: 'vector',
      label: i18n.global.t('ragNode.vector_search'),
    },
    {
      value: 'keyword_and_vector',
      label: i18n.global.t('ragNode.hybrid_search'),
    },
    {
      value: 'doc2chunk',
      label: i18n.global.t('ragNode.doc2chunk_search'),
    },
    {
      value: 'doc2chunk_bfs',
      label: i18n.global.t('ragNode.doc2chunk_bfs_search'),
    },
    {
      value: 'enhanced_by_llm',
      label: i18n.global.t('ragNode.enhanced_by_llm_search'),
    },
  ];
  
  interface KnowledgeBaseListItem {
    kb_name: string;
    kb_id: string;
    team_name: string;
    team_id: string;
  }
  
  const knowledgeBaseListOption = ref<KnowledgeBaseListItem[]>([]);
  
  /**
   * 查询知识库列表
   */
  async function getKnowledgeList() {
    try {
      const [, res] = await api.getTeamKnowledgeList();
      // 清空之前的选项
      knowledgeBaseListOption.value = [];
  
      if (res?.result && Array.isArray(res.result)) {
        res.result.forEach((team: any) => {
          if (team.kbList && Array.isArray(team.kbList)) {
            team.kbList.forEach((kb) => {
              // 只添加有效的知识库数据
              if (kb && kb.kbId && kb.kbName) {
                knowledgeBaseListOption.value.push({
                  kb_name: kb.kbName,
                  kb_id: kb.kbId,
                  team_name: team.teamName || '',
                  team_id: team.teamId || '',
                });
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('查询知识库失败:', error);
      // 清空选项以避免显示旧数据
      knowledgeBaseListOption.value = [];
      ElMessage.error(i18n.global.t('ragNode.query_knowledge_base_failed'));
    }
  }
  
  onMounted(() => {
    getKnowledgeList();
    let input_content = props.yamlContent.input_parameters;
  
    Object.assign(ragForm, {
      ...input_content,
      name: props.nodeName,
      description: props.nodeDesc,
    });
  
    ragOutputInYaml.value = props.yamlContent.output_parameters;
    if (ragForm.name && ragForm.description) {
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
        console.log(ragForm);
        const transResult = {
          ...ragForm,
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
  .rag-drawer {
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
      :deep(.rag-drawer .drawer-body .o-hpc-collapse) {
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
    .rag-drawer .basic-content,
    .rag-drawer .knowledge-content,
    .rag-drawer .advanced-content,
    .rag-drawer .output-content {
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

        .el-switch {
          .el-switch__core {
            background-color: var(--el-border-color-lighter) !important;
            border-color: var(--el-border-color-lighter) !important;
          }

          &.is-checked .el-switch__core {
            background-color: var(--el-color-primary) !important;
            border-color: var(--el-color-primary) !important;
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
  .rag-drawer {
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
  body[theme='dark'] .rag-drawer {
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
    .knowledge-content,
    .advanced-content,
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
    .knowledge-content .el-form-item .el-input__wrapper,
    .advanced-content .el-form-item .el-input__wrapper,
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
    .knowledge-content .el-form-item .el-textarea__inner,
    .advanced-content .el-form-item .el-textarea__inner,
    .output-content .el-form-item .el-textarea__inner {
      border-color: var(--el-collapse-border) !important;
      color: #ffffff !important;
      
      &::placeholder {
        color: #a0a8b6 !important;
      }
    }

    .basic-content .el-select .el-input__wrapper,
    .knowledge-content .el-select .el-input__wrapper,
    .advanced-content .el-select .el-input__wrapper,
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
    .knowledge-content span,
    .advanced-content span,
    .output-content span,
    .drawer-header span {
      color: #ffffff !important;
    }
    
    .basic-content p, 
    .knowledge-content p,
    .advanced-content p,
    .output-content p {
      color: #ffffff !important;
    }

    // 其他可能的文字元素
    .basic-content .el-form-item__content,
    .knowledge-content .el-form-item__content,
    .advanced-content .el-form-item__content,
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

    // 开关组件深色模式
    .el-switch {
      .el-switch__core {
        background-color: #4a4a4a !important;
        border-color: #4a4a4a !important;
      }

      &.is-checked .el-switch__core {
        background-color: var(--el-color-primary) !important;
        border-color: var(--el-color-primary) !important;
      }

      .el-switch__action {
        background-color: #ffffff !important;
      }
    }
  }

  body[theme='light'] .rag-drawer {
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