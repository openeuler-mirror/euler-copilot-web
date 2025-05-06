<script lang="ts" setup>
import { ElMessage, FormInstance, FormRules, UploadProps } from 'element-plus';
import { nextTick, reactive, ref, watch } from 'vue';
import MonacoEditor from './MonacoEditor.vue';
import defaultIcon from '@/assets/svgs/app_upload.svg';
import { api } from '@/apis';

interface McpDetail {
  icon: string;
  name: string;
  description: string;
  type: 'Stdio' | 'SSE' | 'Streamable';
  mcpConfig: string;
}

const props = defineProps<{
  visible: boolean;
  serviceId?: string;
}>();

const emits = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
}>();

const form = reactive<McpDetail>({
  icon: '',
  name: '',
  description: '',
  type: 'Stdio',
  mcpConfig: '',
});

const formRef = ref<FormInstance>();
const jsonEditorRef = ref();

const rules = reactive<FormRules<typeof form>>({
  icon: [{ required: true, message: '请上传MCP图标', trigger: 'blur' }],
  name: [{ required: true, message: '请输入MCP名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入MCP描述', trigger: 'blur' }],
  type: [{ required: true }],
});

const mcpTypes = [
  { label: 'Stdio', value: 'Stdio' },
  { label: 'SSE', value: 'sse' },
  { label: 'Streamable', value: 'Ssreamable' },
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
    const [err, _] = await api.createMcpService({
      icon: form.icon,
      name: form.name,
      description: form.description,
      config: {
        transmitProto: form.type as 'Stdio' | 'Streamable' | 'SSE',
        config: form.mcpConfig,
      },
    });
    ElMessage.success('Success');
    emits('update:visible', false);
  });
}

async function getMcpServiceDetail(serviceId: string) {
  const [_, res] = await api.getMcpServiceDetail(serviceId);
  if (res) {
    const { icon, name, description, data } = res.result;
    form.icon = icon;
    form.name = name;
    form.description = description;
    form.type = data.transmitProto as 'Stdio' | 'Streamable' | 'SSE';
    form.mcpConfig = data.config;
    jsonEditorRef.value.setJsonValue(form.mcpConfig);
  }
}

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      if (!props.serviceId) return;
      getMcpServiceDetail(props.serviceId);
    }
  },
);
</script>
<template>
  <div class="mcp-drawer">
    <el-drawer
      size="700"
      title="创建MCP服务"
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
            <el-form-item label="图标" prop="icon">
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
                <span class="text">上传图标</span>
              </div>
            </el-form-item>
            <el-form-item label="MCP名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入MCP名称" />
            </el-form-item>
            <el-form-item label="MCP描述" prop="description">
              <el-input
                type="textarea"
                :maxlength="1000"
                show-word-limit
                v-model="form.description"
                :rows="8"
                placeholder="请输入MCP描述"
              />
            </el-form-item>
            <el-form-item label="MCP类型" prop="type" class="form-item">
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

        <div class="footer">
          <el-button @click="emits('update:visible', false)">取消</el-button>
          <el-button type="primary" @click="onConfirm(formRef)">确定</el-button>
        </div>
      </div>
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
  .footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100%;
    padding: 8px 24px;
    box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.1);
    z-index: 9999;
  }
}
</style>
