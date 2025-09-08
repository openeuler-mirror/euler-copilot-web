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
  item: any;
  type: 'add' | 'edit';
  title?: string;
  provider?: ModelProvider;
}>();

const emits = defineEmits<{
  (e: 'update:visible', status: boolean): void;
  (e: 'doParams', form?: any): void;
}>();

const form = reactive({ description: '' });

const formRef = ref<FormInstance>();
const rules = computed<FormRules<typeof form>>(() => {
  const rulesObj = {};
  Object.keys(props.item.params).forEach((key) => {
    rulesObj[key] = [
      {
        required: true,
        message: t('semantic.pleaseEnter'), // 使用统一的提示信息
        trigger: 'blur',
      },
    ];
  });

  return rulesObj;
});

async function onConfirm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (!valid) return;
    emits('doParams', form);
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
          {{ props.item.message }}
        </div>
        <template v-for="(value, key) in item.params" :key="key">
          <el-form-item :label="key" :prop="key">
            <el-input
              v-model="form[key]"
              clearable
              :placeholder="t('semantic.pleaseEnter')"
            />
          </el-form-item>
        </template>
        <el-form-item :label="t('flow.additionalNotes')">
          <el-input
            v-model="form.description"
            clearable
            :placeholder="t('semantic.pleaseEnter')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="onConfirm(formRef)">
            {{ t('common.confirm') }}
          </el-button>
          <el-button @click="emits('update:visible', false)">
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
  text-align: left;
  margin-bottom: 8px;
}

/* 使用 :deep() 来穿透 scoped 样式，修改 Element Plus 的输入框样式 */
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset !important; /* 模拟默认边框 */
  // 或者使用你期望的边框样式
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset !important; /* 模拟聚焦状态 */
}
</style>
