<template>
    <div class="api-call-drawer">
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
              <img class="node-icon" :src="getSrcIcon({ callId: 'API' })" />
              <span>
                {{ $t('flow.step_configuration') }} - {{ apiCallForm.name }}
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
                  <span>{{ $t('apiCall.basic_info') }}</span>
                </template>
                <div class="basic-content">
                  <el-form
                    :rules="apiCallFormRules"
                    :model="apiCallForm"
                    ref="APICallFormRef"
                    label-position="left"
                    label-width="120px"
                  >
                    <el-form-item
                      prop="name"
                      :label="$t('semantic.component_name')"
                      required
                    >
                      <el-input
                        v-model="apiCallForm.name"
                        type="text"
                        :placeholder="$t('apiCall.node_name_placeholder')"
                        maxlength="50"
                        clearable
                      />
                    </el-form-item>
                    <el-form-item
                      prop="description"
                      :label="$t('semantic.component_introduction')"
                    >
                      <el-input
                        v-model="apiCallForm.description"
                        type="textarea"
                        :placeholder="$t('apiCall.node_description_placeholder')"
                        :rows="3"
                      />
                    </el-form-item>
                    <el-form-item prop="url" label="URL" required>
                      <el-input
                        v-model="apiCallForm.url"
                        clearable
                        :placeholder="$t('apiCall.api_url_placeholder')"
                      >
                        <template #prepend>
                          <el-select
                            v-model="apiCallForm.method"
                            placeholder="Select"
                            style="width: 120px"
                          >
                            <el-option
                              :label="option"
                              :value="option"
                              v-for="option in method_options"
                              :key="option"
                            />
                          </el-select>
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-form>
                </div>
              </el-collapse-item>
  
              <!-- 请求头 -->
              <el-collapse-item name="headers" class="headers-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('headers') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('apiCall.request_headers') }}</span>
                </template>
                <div class="headers-content">
                  <div class="section">
                    <table class="api-table">
                      <tbody>
                        <tr
                          v-for="(row, index) in apiCallForm.headers"
                          :key="index"
                        >
                          <td>
                            <el-input
                              class="key-value-input"
                              type="text"
                              v-model="row.key"
                              :placeholder="$t('apiCall.key_placeholder')"
                            >
                              <template #prepend>
                                {{ $t('semantic.key') }}
                              </template>
                            </el-input>
                          </td>
                          <td>
                            <div class="value-cell">
                              <el-input
                                class="key-value-input"
                                v-model="row.value"
                                :placeholder="$t('apiCall.value_placeholder')"
                              >
                                <template #prepend>
                                  {{ $t('semantic.value') }}
                                </template>
                              </el-input>
                              <button
                                v-if="apiCallForm.headers.length != 1"
                                @click="deleteRowIndex(apiCallForm.headers, index)"
                                class="remove-btn"
                                title="删除"
                              >
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="add-row-section">
                      <button 
                        @click="addNewRow(apiCallForm.headers)"
                        class="add-btn"
                      >
                        + {{ $t('apiCall.add_header') || '添加 Header' }}
                      </button>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
  
              <!-- 查询参数 -->
              <el-collapse-item name="query" class="query-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('query') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('apiCall.query_params') }}</span>
                </template>
                <div class="query-content">
                  <div class="section">
                    <table class="api-table">
                      <tbody>
                        <tr
                          v-for="(row, index) in apiCallForm.query"
                          :key="index"
                        >
                          <td>
                            <el-input
                              type="text"
                              class="key-value-input"
                              v-model="row.key"
                              :placeholder="$t('apiCall.key_placeholder')"
                            >
                              <template #prepend>
                                {{ $t('semantic.key') }}
                              </template>
                            </el-input>
                          </td>
                          <td>
                            <div class="value-cell">
                              <el-input
                                class="key-value-input"
                                v-model="row.value"
                                :placeholder="$t('apiCall.value_placeholder')"
                              >
                                <template #prepend>
                                  {{ $t('semantic.value') }}
                                </template>
                              </el-input>
                              <button
                                v-if="apiCallForm.query.length != 1"
                                @click="deleteRowIndex(apiCallForm.query, index)"
                                class="remove-btn"
                                title="删除"
                              >
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="add-row-section">
                      <button 
                        @click="addNewRow(apiCallForm.query)"
                        class="add-btn"
                      >
                        + {{ $t('apiCall.add_query_param') || '添加查询参数' }}
                      </button>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
  
              <!-- 请求体 -->
              <el-collapse-item name="body" class="body-panel">
                <template #title>
                  <el-icon
                    class="el-collapse-item__arrow"
                    :class="{ 'is-active': activeName.includes('body') }"
                  >
                    <IconCaretRight />
                  </el-icon>
                  <span>{{ $t('apiCall.request_body') }}</span>
                </template>
                <div class="body-content">
                  <div class="section">
                    <el-radio-group v-model="apiCallForm.content_type">
                      <el-radio
                        v-for="(value, key) in ContentType"
                        :key="key"
                        :value="value"
                      >
                        {{ key.toLowerCase() }}
                      </el-radio>
                    </el-radio-group>
                    <div class="body-box" style="margin-top: 16px">
                      <div v-if="apiCallForm.content_type === ContentType.JSON">
                        <VariableRichTextEditor
                          ref="jsonEditorRef"
                          v-model="apiCallForm.json"
                          :flow-id="flowId"
                          :current-step-id="nodeYamlId"
                          :placeholder="$t('apiCall.json_body_placeholder')"
                        />
                      </div>
  
                      <div
                        v-if="
                          apiCallForm.content_type === ContentType.FORM_URLENCODED
                        "
                      >
                        <table class="api-table">
                          <tbody>
                            <tr
                              v-for="(row, index) in apiCallForm.formData"
                              :key="index"
                            >
                              <td>
                                <el-input
                                  type="text"
                                  class="key-value-input"
                                  v-model="row.key"
                                  :placeholder="$t('apiCall.key_placeholder')"
                                >
                                  <template #prepend>
                                    {{ $t('semantic.key') }}
                                  </template>
                                </el-input>
                              </td>
                              <td style="width: 80px">
                                <el-select
                                  style="width: 80px"
                                  v-model="row.type"
                                  placeholder="Select"
                                >
                                  <el-option
                                    :label="option"
                                    :value="option"
                                    v-for="option in ['text', 'file']"
                                    :key="option"
                                  />
                                </el-select>
                              </td>
                              <td>
                                <div class="value-cell">
                                  <el-input
                                    v-model="row.value"
                                    class="key-value-input"
                                    :placeholder="$t('apiCall.value_placeholder')"
                                  >
                                    <template #prepend>
                                      {{ $t('semantic.value') }}
                                    </template>
                                  </el-input>
                                  <button
                                    v-if="apiCallForm.formData.length != 1"
                                    @click="deleteRowIndex(apiCallForm.formData, index)"
                                    class="remove-btn"
                                    title="删除"
                                  >
                                    ×
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div class="add-row-section">
                          <button 
                            @click="addNewFormDataRow()"
                            class="add-btn"
                          >
                            + {{ $t('apiCall.add_form_data') || '添加表单数据' }}
                          </button>
                        </div>
                      </div>

                      <div
                        v-if="
                          apiCallForm.content_type ===
                          ContentType.MULTIPART_FORM_DATA
                        "
                      >
                        <table class="api-table">
                          <tbody>
                            <tr
                              v-for="(
                                row, index
                              ) in apiCallForm.xWwwFormUrlencoded"
                              :key="index"
                            >
                              <td>
                                <el-input
                                  type="text"
                                  class="key-value-input"
                                  v-model="row.key"
                                  :placeholder="$t('apiCall.key_placeholder')"
                                >
                                  <template #prepend>
                                    {{ $t('semantic.key') }}
                                  </template>
                                </el-input>
                              </td>
                              <td>
                                <div class="value-cell">
                                  <el-input
                                    v-model="row.value"
                                    class="key-value-input"
                                    :placeholder="$t('apiCall.value_placeholder')"
                                  >
                                    <template #prepend>
                                      {{ $t('semantic.value') }}
                                    </template>
                                  </el-input>
                                  <button
                                    v-if="
                                      apiCallForm.xWwwFormUrlencoded.length != 1
                                    "
                                    @click="
                                      deleteRowIndex(
                                        apiCallForm.xWwwFormUrlencoded,
                                        index,
                                      )
                                    "
                                    class="remove-btn"
                                    title="删除"
                                  >
                                    ×
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div class="add-row-section">
                          <button 
                            @click="addNewRow(apiCallForm.xWwwFormUrlencoded)"
                            class="add-btn"
                          >
                            + {{ $t('apiCall.add_multipart_data') || '添加数据' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <span>{{ $t('apiCall.output_variables') }}</span>
                </template>
                <div class="output-content">
                  <YamlContentOutput :yamlOutPutContent="apiCallOutputInYaml" />
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
              @click="updateNodeYaml(APICallFormRef)"
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
  import { onMounted, ref, reactive, computed, watch } from 'vue';
  import yaml from 'js-yaml';
  import { IconCaretRight } from '@computing/opendesign-icons';
  import { Delete } from '@element-plus/icons-vue';
  import YamlContentOutput from 'src/components/yamloutput/yamlContentOutput.jsx';
  import { ElMessage, FormInstance } from 'element-plus';
  import i18n from 'src/i18n';
  import VariableRichTextEditor from '@/components/VariableRichTextEditor.vue';
  import { NodeType, getSrcIcon } from '../types';
  
  const visible = ref(true);
  const infoDisabled = ref(true);
  const drawerVisible = ref(false);
  const saving = ref(false);
  type MethodOptions = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  const method_options = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const activeName = ref(['basic', 'headers', 'query', 'body', 'output']);
  
  interface ParamInterface {
    key: string;
    value: string;
  }
  
  interface FormDataParamInterface {
    key: string;
    type: string;
    value: string;
  }
  
  const ContentType = {
    JSON: 'application/json',
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
    MULTIPART_FORM_DATA: 'multipart/form-data',
  };
  
  interface APICallForm {
    name: string;
    description: string;
    url: string;
    method: MethodOptions;
    headers: ParamInterface[];
    query: ParamInterface[];
    content_type: string;
    json: string;
    formData: FormDataParamInterface[];
    xWwwFormUrlencoded: ParamInterface[];
    to_user: boolean;
    timeout: number;
    node_type: string;
  }
  
  const apiCallForm = reactive<APICallForm>({
    name: '',
    description: '',
    url: '',
    method: 'GET',
    headers: [
      {
        key: '',
        value: '',
      },
    ],
    query: [
      {
        key: '',
        value: '',
      },
    ], // TODO 有bug 当读取预制插件yaml的时候是{msg: ''} 当以api调用node传入的时候是{key: '', value: ''}
    content_type: ContentType.JSON,
    json: '',
    formData: [
      {
        key: '',
        type: 'text', // text or file
        value: '',
      },
    ],
    xWwwFormUrlencoded: [
      {
        key: '',
        value: '',
      },
    ],
    to_user: true,
    timeout: 300,
    node_type: NodeType.API,
  });
  
  const apiCallFormRules = ref({
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
    url: [
      {
        required: true,
        message: i18n.global.t('semantic.pleaseEnter'),
        trigger: 'blur',
      },
      {
        pattern: /^(https?:\/\/)/,
        message: i18n.global.t('apiCall.url_validation_message'),
        trigger: 'blur',
      },
    ],
  });
  
  const apiCallOutputInYaml = ref('');
  const jsonEditorRef = ref();
  
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
    console.log(input_content);
    Object.assign(apiCallForm, {
      ...apiCallForm,
      name: props.nodeName,
      description: props.nodeDesc,
      url: input_content.url,
      contentType: input_content.content_type
        ? input_content.content_type
        : 'json',
      headers:
        !input_content.headers || Object.keys(input_content.headers).length === 0
          ? apiCallForm.headers
          : input_content.headers,
      query:
        Object.keys(input_content.query).length === 0
          ? apiCallForm.query
          : input_content.query,
      json:
        input_content.content_type === ContentType.JSON ? input_content.body : '',
      formData:
        input_content.content_type === ContentType.FORM_URLENCODED &&
        Object.keys(input_content.body).length !== 0
          ? input_content.body
          : apiCallForm.formData,
      xWwwFormUrlencoded:
        input_content.content_type === ContentType.MULTIPART_FORM_DATA &&
        Object.keys(input_content.body).length !== 0
          ? input_content.body
          : apiCallForm.formData,
      to_user: input_content.to_user,
      timeout: input_content.timeout,
      method: input_content.method
        ? input_content.method.toUpperCase()
        : apiCallForm.method,
    });
    apiCallOutputInYaml.value = props.yamlContent.output_parameters;
    if (apiCallForm.name && apiCallForm.description) {
      infoDisabled.value = false;
    } else {
      infoDisabled.value = true;
    }
  });
  
  const APICallFormRef = ref<FormInstance>();
  
  // 添加新的键值对行
  const addNewRow = (rows) => {
    rows.push({
      key: '',
      value: '',
    });
  };

  // 添加新的表单数据行
  const addNewFormDataRow = () => {
    apiCallForm.formData.push({
      key: '',
      type: 'text',
      value: '',
    });
  };

  const deleteRowIndex = (rows, index) => {
    if (rows.length > 1) {
      rows.splice(index, 1);
    }
  };
  
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
  
    console.log(apiCallForm);
    await formEl.validate((valid, fields) => {
      if (valid) {
        let body;
        try {
          // 根据不同的content-type组装body
          if (apiCallForm.content_type === ContentType.FORM_URLENCODED) {
            body = apiCallForm.formData.reduce(
              // 此处reduce逻辑都是过滤存在空的键值(类型)对
              (acc: FormDataParamInterface[], { key, type, value }) => {
                if (key && type && value) {
                  acc.push({ key, type, value });
                }
                return acc;
              },
              [] as FormDataParamInterface[],
            );
          } else if (apiCallForm.content_type === ContentType.JSON) {
            body = apiCallForm.json;
          } else if (
            apiCallForm.content_type === ContentType.MULTIPART_FORM_DATA
          ) {
            body = apiCallForm.xWwwFormUrlencoded.reduce(
              (acc: ParamInterface[], { key, value }) => {
                if (key && value) {
                  acc.push({ key, value });
                }
                return acc;
              },
              [] as ParamInterface[],
            );
          } else {
            body = '';
          }
          let transResult = {
            ...apiCallForm,
            method: apiCallForm.method.toLowerCase(),
            timeout: 300, // 这个后面加上按钮允许配置
            body: body,
            query: apiCallForm.query.filter((item) => {
              return item.key !== '' && item.value !== '';
            }),
            headers: apiCallForm.headers.filter((item) => {
              return item.key !== '' && item.value !== '';
            }),
            node_type: NodeType.API,
          };
          let transResultToYaml = yaml.load(JSON.stringify(transResult));
          // 调用接口并更新--根据id包含更新后的yamlCode, name, desc
          emits(
            'saveNode',
            transResultToYaml,
            props.nodeYamlId,
            apiCallForm.name,
            apiCallForm.description,
          );
          closeDrawer();
        } catch (error) {
          ElMessage.error(i18n.global.t('semantic.checkFormat'));
        }
      } else {
        console.log('submit failed!', fields);
      }
    });
  };
  </script>
  
<style lang="scss" scoped>
.api-call-drawer {
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
    :deep(.api-call-drawer .drawer-body .o-hpc-collapse) {
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
  .api-call-drawer .basic-content,
  .api-call-drawer .headers-content,
  .api-call-drawer .query-content,
  .api-call-drawer .body-content,
  .api-call-drawer .output-content {
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

      .el-radio-group .el-radio {
        .el-radio__label {
          color: var(--el-text-color-primary) !important;
        }
      }

      .el-button {
        &.remove-btn {
          color: var(--el-color-white) !important;
        }
      }
    }
  }

  .headers-content,
  .query-content,
  .body-content {
    .section {
      margin: 15px 0;

      .api-table {
        width: 100%;
        border-collapse: collapse;

        th,
        td {
          padding: 8px;
          text-align: left;
        }

        .key-value-input {
          width: 100%;
        }

        .value-cell {
          display: flex;
          gap: 12px;
          align-items: center;

          .remove-btn {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            border: 1px solid #dcdfe6;
            background-color: #ffffff;
            color: #606266;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s;

            &:hover {
              background-color: #f56c6c;
              border-color: #f56c6c;
              color: #ffffff;
            }
          }
        }
      }

      .add-row-section {
        margin-top: 12px;
        text-align: left;

        .add-btn {
          padding: 8px 16px;
          border: 1px dashed var(--el-border-color);
          background-color: transparent;
          color: var(--el-color-primary);
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;

          &:hover {
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
          }
        }
      }
    }
  }

  .body-content {
    .el-radio-group {
      margin-bottom: 16px;
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
.api-call-drawer {
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
body[theme='dark'] .api-call-drawer {
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
  .headers-content,
  .query-content,
  .body-content,
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

  // 只针对基础信息、表头、查询参数、请求体和输出变量中的输入框
  .basic-content .el-form-item .el-input__wrapper,
  .headers-content .el-form-item .el-input__wrapper,
  .query-content .el-form-item .el-input__wrapper,
  .body-content .el-form-item .el-input__wrapper,
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
  .headers-content .el-form-item .el-textarea__inner,
  .query-content .el-form-item .el-textarea__inner,
  .body-content .el-form-item .el-textarea__inner,
  .output-content .el-form-item .el-textarea__inner {
    border-color: var(--el-collapse-border) !important;
    color: #ffffff !important;
    
    &::placeholder {
      color: #a0a8b6 !important;
    }
  }

  .basic-content .el-select .el-input__wrapper,
  .headers-content .el-select .el-input__wrapper,
  .query-content .el-select .el-input__wrapper,
  .body-content .el-select .el-input__wrapper,
  .output-content .el-select .el-input__wrapper {
    border-color: var(--el-collapse-border) !important;
    
    .el-input__inner {
      color: #ffffff !important;
    }
  }

  // 修复radio按钮文字颜色
  .body-content .el-radio-group .el-radio .el-radio__label {
    color: #ffffff !important;
  }

  // 其他可能的文字元素
  .basic-content .el-form-item__content,
  .headers-content .el-form-item__content,
  .query-content .el-form-item__content,
  .body-content .el-form-item__content,
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

  // 确保特定区域的文本为白色
  .basic-content span, 
  .headers-content span,
  .query-content span,
  .body-content span,
  .output-content span,
  .drawer-header span {
    color: #ffffff !important;
  }
  
  .basic-content p, 
  .headers-content p,
  .query-content p,
  .body-content p,
  .output-content p {
    color: #ffffff !important;
  }

  // 表格中的prepend标签
  .headers-content .el-input-group__prepend,
  .query-content .el-input-group__prepend,
  .body-content .el-input-group__prepend {
    border-color: var(--el-collapse-border) !important;
    color: #ffffff !important;
  }

  // 删除按钮样式
  .remove-btn {
    background-color: #2c2c2c !important;
    border-color: #4a4a4a !important;
    color: #ffffff !important;

    &:hover {
      background-color: #f56c6c !important;
      border-color: #f56c6c !important;
      color: #ffffff !important;
    }
  }

  // 添加按钮样式
  .add-btn {
    border-color: #4a4a4a !important;
    color: var(--el-color-primary) !important;
    background-color: transparent !important;

    &:hover {
      border-color: var(--el-color-primary) !important;
      background-color: rgba(64, 158, 255, 0.1) !important;
    }
  }
}

body[theme='light'] .api-call-drawer {
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