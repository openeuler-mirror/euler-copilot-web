<script lang="ts" setup>
import { ElMessage, FormInstance, FormRules, UploadProps } from 'element-plus';
import { nextTick, reactive, ref, watch } from 'vue';
import MonacoEditor from './MonacoEditor.vue';
import defaultIcon from '@/assets/svgs/app_upload.svg';
import { api } from '@/apis';
import i18n from 'src/i18n';
import CustomLoading from '../../customLoading/index.vue';

interface McpDetail {
  icon: string;
  name: string;
  overview: string;
  description: string;
  type: 'stdio' | 'sse' | 'stream';
  mcpConfig: string;
}

const props = defineProps<{
  visible: boolean;
  serviceId?: string;
}>();

const emits = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}>();

const { t } = i18n.global;

const COMMAND_TEMPLATE = {
  command: '',
  args: [],
  env: {},
};
const URL_TEMPLATE = {
  headers: '',
  url: '',
};
const STREAM = {};

const loading = ref(false);

const mcpConfigTemplate = ref({
  stdio: COMMAND_TEMPLATE,
  sse: URL_TEMPLATE,
  stream: STREAM,
});

const form = reactive<McpDetail>({
  icon: '',
  name: '',
  overview: '',
  description: '',
  type: 'stdio',
  mcpConfig: '',
  rawFile: null,
});

const formRef = ref<FormInstance>();
const jsonEditorRef = ref();

const rules = reactive<FormRules<typeof form>>({
  icon: [
    {
      required: true,
      message: t('plugin_center.please_upload_icon'),
      trigger: 'blur',
    },
  ],
  overview: [
    {
      required: true,
      message: t('plugin_center.please_input_mcp_overview'),
      trigger: 'blur',
    },
  ],
  name: [
    {
      required: true,
      message: t('plugin_center.please_input_mcp_name'),
      trigger: 'blur',
    },
  ],
  description: [
    {
      required: true,
      message: t('plugin_center.please_select_mcp_description'),
      trigger: 'blur',
    },
  ],
  type: [{ required: true }],
});

const mcpTypes = [
  { label: 'Stdio', value: 'stdio' },
  { label: 'SSE', value: 'sse' },
  { label: 'Streamable', value: 'stream' },
];

const beforeIconUpload: UploadProps['beforeUpload'] = async (rawFile) => {
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage({
      message: 'Image size cannot exceed 2MB!',
      type: 'error',
    });
    return false;
  }

  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      form.icon = e.target?.result as string;
      form.rawFile = rawFile;
      console.log('Icon uploaded:', rawFile);
    };
    reader.readAsDataURL(rawFile);
    return false;
  } catch (error) {
    console.error('Error during file upload process:', error);
    ElMessage({
      message: 'An error occurred during file upload!',
      type: 'error',
    });
    return false;
  }
};
async function onConfirm(formEl: FormInstance | undefined) {
  if (!formEl) return;

  const json = jsonEditorRef.value.getJsonValue();
  if (json) form.mcpConfig = json;

  const valid = await formEl.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const [, serviceRes] = await api.createOrUpdateMcpService({
      serviceId: props.serviceId || undefined,
      overview: form.overview,
      icon: form.icon,
      name: form.name,
      description: form.description,
      config: JSON.parse(form.mcpConfig),
      mcpType: form.type,
    });

    console.log('MCP Service Response:', serviceRes);
    console.log('MCP Service Response:', serviceRes.result.serviceId, form.rawFile);

    const serviceId = serviceRes.result.serviceId;
    if (form.rawFile) {
      try {
        await api.uploadMcpIcon({
          serviceId,
          icon: form.rawFile,
        });
      } catch (error) {
        console.error('Error uploading icon:', error);
        ElMessage({
          message: 'Failed to upload icon!',
          type: 'error',
        });
        // 不阻断流程，仅提示
        loading.value = false;
      }
    }

    formEl.resetFields();
    jsonEditorRef.value.setJsonValue('{\n  \n}');
    emits('success');
    loading.value = false;
  } catch (error) {
    console.error('Create or update MCP service failed:', error);
    ElMessage({
      message: 'Failed to create/update service!',
      type: 'error',
    });
    loading.value = false;
  }
  loading.value = false;
}

async function getMcpServiceDetail(serviceId: string) {
  const [, res] = await api.getMcpServiceDetail(serviceId, true);
  if (res) {
    const { icon, name, description, data, mcpType, overview } = res.result;
    form.icon = icon;
    form.name = name;
    form.overview = overview;
    form.description = description;
    form.type = mcpType;
    form.mcpConfig = data;
    let json = {};
    if (mcpType === 'stdio') {
      json.command = data.command;
      json.args = data.args;
      json.env = data.env;
    } else if (mcpType === 'sse') {
      json.headers = data.headers;
      json.url = data.url;
    }
    jsonEditorRef.value.setJsonValue(JSON.stringify(json, null, 2));
    mcpConfigTemplate.value[mcpType] = json;
  }
}

async function setMcpConfig(type: string) {
  jsonEditorRef.value.setJsonValue(
    JSON.stringify(mcpConfigTemplate.value[type], null, 2),
  );
}

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      if (!props.serviceId) {
        nextTick(() => {
          setMcpConfig(form.type);
        });
        return;
      }
      getMcpServiceDetail(props.serviceId);
    } else {
      // 初始化
      mcpConfigTemplate.value = {
        stdio: COMMAND_TEMPLATE,
        sse: URL_TEMPLATE,
        stream: STREAM,
      };
      if (formRef.value) formRef.value.resetFields();
      setMcpConfig(form.type);
    }
  },
);
</script>
<template>
  <div class="mcp-drawer">
    <el-drawer
      size="700"
      :title="
        !serviceId
          ? t('plugin_center.mcp.create_mcp')
          : t('plugin_center.mcp.edit_mcp')
      "
      :model-value="visible"
      @close="emits('update:visible', false)"
    >
      <CustomLoading :loading="loading"></CustomLoading>
      <div class="wrapper">
        <div class="content">
          <el-form
            ref="formRef"
            class="content-form"
            label-position="left"
            label-width="auto"
            :model="form"
            :rules="rules"
          >
            <el-form-item :label="t('common.icon')" prop="icon">
              <div class="upload-area">
                <el-upload
                  class="uploader"
                  :show-file-list="false"
                  :before-upload="beforeIconUpload"
                  :accept="'image/*'"
                >
                  <div class="uploader-icon">
                    <img v-if="form.icon" :src="form.icon" alt="" />
                    <img v-else :src="defaultIcon" />
                  </div>
                </el-upload>
                <span class="text">{{ t('plugin_center.upload_icon') }}</span>
              </div>
            </el-form-item>
            <el-form-item :label="t('plugin_center.mcp.mcp_name')" prop="name">
              <el-input
                v-model="form.name"
                :placeholder="t('plugin_center.please_input_mcp_name')"
              />
            </el-form-item>
            <el-form-item
              :label="t('plugin_center.mcp.mcp_overview')"
              prop="overview"
            >
              <el-input
                v-model="form.overview"
                :placeholder="t('plugin_center.please_input_mcp_overview')"
              />
            </el-form-item>
            <el-form-item
              :label="t('plugin_center.mcp.mcp_description')"
              prop="description"
            >
              <el-input
                type="textarea"
                :maxlength="1000"
                show-word-limit
                v-model="form.description"
                :rows="8"
                :placeholder="t('plugin_center.please_select_mcp_description')"
              />
            </el-form-item>
            <el-form-item
              :label="t('plugin_center.mcp.mcp_type')"
              prop="type"
              class="form-item"
            >
              <el-radio-group v-model="form.type" @change="setMcpConfig">
                <el-radio
                  v-for="{ label, value } in mcpTypes"
                  :value="value"
                  :key="value"
                >
                  {{ label }}
                </el-radio>
              </el-radio-group>
              <div class="editor">
                <MonacoEditor ref="jsonEditorRef" />
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button @click="emits('update:visible', false)">
          {{ $t('common.close') }}
        </el-button>
        <el-button type="primary" @click="onConfirm(formRef)">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>
<style lang="scss" scoped>
.mcp-drawer {
  :deep(.el-drawer) {
    height: calc(100vh - 48px);
    .el-drawer__header {
      color: #000;
      font-weight: 700;
      padding: 24px 24px 0px 24px;
      margin: 0;
    }
    .el-drawer__body {
      padding: 0px 24px 16px;
    }
    .el-drawer__footer {
      padding: 0;
      padding: 8px 24px;
      box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.1);
    }
  }
}
.wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  .content {
    margin-top: 16px;
    flex: 1;
    &-form {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: start;
      :deep(.el-form-item:last-child) {
        margin-bottom: 0px;
      }
      .form-item {
        flex: 1;
        :deep(.el-form-item__content) {
          display: flex;
          flex-direction: column;
          align-items: start;
          height: 100%;
        }

        .editor {
          width: 100%;
        }
      }
    }
    .upload-area {
      display: flex;
      flex-direction: column;
      .uploader {
        cursor: pointer;

        .uploader-icon {
          position: relative;
          img {
            width: 48px;
            height: 48px;
            border-radius: 50%;
          }
          &::after {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            background-image: url('@/assets/svgs/upload_icon.svg');
            position: absolute;
            right: 2px;
            bottom: 12px;
          }
        }
      }
      .text {
        height: 16px;
        line-height: 12px;
        color: rgb(141, 152, 170);
      }
    }
  }
}
</style>
