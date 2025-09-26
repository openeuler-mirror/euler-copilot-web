<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { computed, nextTick, onMounted, ref, watch, reactive } from 'vue';
import i18n from '@/i18n';
import { api } from '@/apis';

import type { FormInstance, FormRules } from 'element-plus';

const { t } = i18n.global;

export interface ModelProvider {
  accessKey: string;
  icon: string;
  url: string;
  description: string;
}

const props = defineProps<{
  visible: boolean;
  item: {
    id?: string;
    name: string;
    description: string;
    accessKey: string;
  };
  type: 'add' | 'edit';
  title?: string;
  provider?: ModelProvider;
}>();

const emits = defineEmits<{
  (e: 'update:visible', status: boolean): void;
  (e: 'doActive', form?: any): void;
}>();

const form = reactive({});

const formRef = ref<FormInstance>();
const rules = computed<FormRules<typeof form>>(() => {
  const rulesObj = {};
  if (props.item.data.env) {
    Object.keys(props.item.data.env).forEach((key) => {
      rulesObj[key] = [
        {
          required: true,
          message: t('semantic.pleaseEnter'), // 使用统一的提示信息
          trigger: 'blur',
        },
      ];
    });
  } else if (props.item.data.headers) {
    Object.keys(props.item.data.headers).forEach((key) => {
      rulesObj[key] = [
        {
          required: true,
          message: t('semantic.pleaseEnter'), // 使用统一的提示信息
          trigger: 'blur',
        },
      ];
    });
  }

  return rulesObj;
});

async function onConfirm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (!valid) return;
    emits('doActive', form);
    emits('update:visible', false);
  });
}
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
        <div class="text">
          {{ props.item.description }}
        </div>
        <template v-for="(value, key) in item.data?.env" :key="key">
          <el-form-item :label="key" :prop="key">
            <el-input
              v-model="form[key]"
              clearable
              :placeholder="t('semantic.pleaseEnter')"
            />
          </el-form-item>
        </template>
        <template v-for="(value, key) in item.data?.headers" :key="key">
          <el-form-item :label="key" :prop="key">
            <el-input
              v-model="form[key]"
              clearable
              :placeholder="t('semantic.pleaseEnter')"
            />
          </el-form-item>
        </template>
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
.text {
  color: rgb(78, 88, 101);
  font-family: HarmonyOS Sans SC;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0px;
  text-align: center;
  margin-bottom: 8px;
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
.el-form {
  .el-form-item:last-child {
    margin-bottom: 0;
  }
}
.el-dialog__footer {
  padding-top: 16px !important;
}
</style>
