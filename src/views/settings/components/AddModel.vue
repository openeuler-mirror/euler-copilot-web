<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { computed, nextTick, ref, watch } from 'vue';
import i18n from '@/i18n';
import { api } from '@/apis';

import type { FormInstance, FormRules } from 'element-plus';

const { t } = i18n.global;

interface From {
  modelId?: string;
  url: string;
  model: string;
  apiKey: string;
  maxTokens: string;
}

export interface ModelProvider {
  provider: string;
  icon: string;
  url: string;
  description: string;
}

const props = defineProps<{
  visible: boolean;
  type: 'add' | 'edit';
  model?: {
    llmId: string;
    icon: string;
    openaiBaseUrl: string;
    openaiApiKey: string;
    modelName: string;
    maxTokens: number;
  };
  title?: string;
  provider?: ModelProvider;
}>();

const emits = defineEmits<{
  (e: 'update:visible', status: boolean): void;
}>();

const form = ref<From>({
  url: '',
  model: '',
  apiKey: '',
  maxTokens: '',
});

const formRef = ref<FormInstance>();
const rules = computed<FormRules<typeof form>>(() => ({
  model: [
    {
      required: true,
      message: t('settings.placeHolder.model_name'),
      trigger: 'blur',
    },
  ],
  apiKey: [
    {
      required: true,
      message: t('settings.placeHolder.api_key'),
      trigger: 'blur',
    },
  ],
  maxTokens: [
    {
      required: true,
      message: t('settings.placeHolder.max_token'),
      trigger: 'blur',
    },
  ],
  url: [
    {
      required: true,
      message: t('settings.placeHolder.url'),
      trigger: 'blur',
    },
  ],
}));

async function onConfirm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (!valid) return;
    const [err] = await api.createOrUpdateModel({
      llmId: props.model?.llmId || undefined,
      icon: props.provider?.icon || '',
      openaiApiKey: form.value.apiKey,
      openaiBaseUrl: props.provider?.url || form.value.url,
      modelName: form.value.model,
      maxTokens: Number(form.value.maxTokens),
    });
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    ElMessage.success('Success');
    emits('update:visible', false);
  });
}

watch(
  () => [props.model, props.provider],
  () => {
    nextTick(() => {
      if (formRef.value) {
        formRef.value.resetFields();
      }

      if (props.model) {
        const { openaiApiKey, openaiBaseUrl, maxTokens, modelName } =
          props.model;
        form.value = {
          url: openaiBaseUrl,
          model: modelName,
          apiKey: openaiApiKey,
          maxTokens: String(maxTokens),
        };
      }
      if (props.provider) {
        form.value.url = props.provider.url;
      }
    });
  },
);

const disabledUrl = computed(() => {
  if (props.provider && props.provider.url) {
    return true;
  }
  return false;
});
</script>
<template>
  <div class="add-model-dialog">
    <el-dialog
      :model-value="visible"
      :title="title"
      @close="emits('update:visible', false)"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        label-position="left"
        label-width="auto"
        :model="form"
        :rules="rules"
      >
        <el-form-item :label="t('settings.placeHolder.url')" prop="url">
          <el-input
            v-model="form.url"
            :disabled="disabledUrl"
            clearable
            :placeholder="t('settings.placeHolder.url')"
          />
        </el-form-item>
        <el-form-item :label="t('settings.select_model')" prop="model">
          <el-input
            v-model="form.model"
            :placeholder="t('settings.placeHolder.model_name')"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="API_Key" prop="apiKey">
          <el-input
            v-model="form.apiKey"
            type="password"
            show-password
            :placeholder="t('settings.placeHolder.api_key')"
          />
        </el-form-item>
        <el-form-item label="Max-token" prop="maxTokens">
          <el-input
            v-model="form.maxTokens"
            clearable
            :placeholder="t('settings.placeHolder.max_token')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" class="button" @click="onConfirm(formRef)">
            {{ t('common.confirm') }}
          </el-button>
          <el-button class="button" @click="emits('update:visible', false)">
            {{ t('common.cancel') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<style lang="scss" scoped>
.dialog-footer {
  .button {
    width: 64px;
    height: 24px;
    border-radius: 4px;
  }
}
.add-model-dialog {
  :deep(.el-dialog) {
    --o-dialog-width: 544px;
  }
}
</style>
<style>
.add-model-dialog > .el-dialog__body {
  padding: 24px 24px 0px 24px;
  .el-input > .el-input__wrapper {
    --o-input-border-radius: 4px;
  }
  .el-select > .el-select__wrapper {
    --o-select-border-radius: 4px;
  }
}
.el-form{
  .el-form-item:last-child {
    margin-bottom: 0;
  }
}
.el-dialog__footer{
  padding-top: 16px !important;
}
</style>
