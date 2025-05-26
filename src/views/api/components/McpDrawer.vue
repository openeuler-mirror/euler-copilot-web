<script lang="ts" setup>
import { ElMessage, FormInstance, FormRules, UploadProps } from 'element-plus';
import { reactive, ref, watch } from 'vue';
import MonacoEditor from './MonacoEditor.vue';
import defaultIcon from '@/assets/svgs/app_upload.svg';
import { api } from '@/apis';
import i18n from 'src/i18n';

interface McpDetail {
  icon: string;
  name: string;
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

const form = reactive<McpDetail>({
  icon: '',
  name: '',
  description: '',
  type: 'stdio',
  mcpConfig: '',
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
  await formEl.validate(async (valid) => {
    if (!valid) return;
    const [_, res] = await api.createOrUpdateMcpService({
      serviceId: props.serviceId || undefined,
      icon: form.icon,
      name: form.name,
      description: form.description,
      config: form.mcpConfig,
      mcpType: form.type,
    });

    formEl.resetFields();
    jsonEditorRef.value.setJsonValue('{\n  \n}');
    emits('success');
  });
}

async function getMcpServiceDetail(serviceId: string) {
  const [_, res] = await api.getMcpServiceDetail(serviceId);
  if (res) {
    const { icon, name, description, data, mcpType } = res.result;
    form.icon = icon;
    form.name = name;
    form.description = description;
    form.type = mcpType;
    form.mcpConfig = data;
    jsonEditorRef.value.setJsonValue(form.mcpConfig);
  }
}

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      if (!props.serviceId) return;
      getMcpServiceDetail(props.serviceId);
    } else {
      formRef.value && formRef.value.resetFields();
      jsonEditorRef.value.setJsonValue('{\n  \n}');
    }
  },
);
</script>
<template>
  <div class="mcp-drawer">
    <el-drawer
      size="700"
      :title="
        serviceId
          ? t('plugin_center.mcp.create_mcp')
          : t('plugin_center.mcp.edit_mcp')
      "
      :model-value="visible"
      @close="emits('update:visible', false)"
    >
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
              <el-radio-group v-model="form.type">
                <el-radio v-for="{ label, value } in mcpTypes" :value="value">
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
    .el-drawer__header {
      color: #000;
      font-weight: 700;
      padding: 24px 24px 0px 24px;
      margin: 0;
    }
    .el-drawer__body {
      padding: 0 24px;
    }
    .el-drawer__footer {
      padding: 0;
      padding: 8px 24px;
      box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.1);
    }
  }
}
.wrapper {
  height: calc(100% - 38px);
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
          max-height: 440px;
          flex: 1;
          border: 1px solid rgb(195, 206, 223);
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
