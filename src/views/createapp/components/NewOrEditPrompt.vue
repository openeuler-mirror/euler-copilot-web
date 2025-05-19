<script lang="ts" setup>
import i18n from '@/i18n';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { onMounted, reactive, ref, watch } from 'vue';
import { Prompt } from '@/apis/appCenter';
import { api } from '@/apis';

const { t } = i18n.global;
const props = defineProps<{
  visible: boolean;
  title: string;
  prompt?: Prompt;
}>();

const emits = defineEmits<{
  (e: 'update:visible', status: boolean): void;
}>();

const form = ref({
  name: '',
  description: '',
  prompt: '',
});
const formRef = ref<FormInstance>();

const rules = reactive<FormRules<typeof form>>({
  name: [{ required: true, message: '请输入提示词名称', trigger: 'blur' }],
  description: [
    { required: true, message: '请输入提示词简介', trigger: 'blur' },
  ],
  prompt: [{ required: true, message: '请选择提示词简介', trigger: 'blur' }],
});

async function onSubmit(formEl) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (!valid) return;
    const [err, _] = await api.createOrUpdatePrompts({
      ...form.value,
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
  () => props.visible,
  (newValue) => {
    if (!newValue) {
      form.value = { name: '', description: '', prompt: '' };
    } else {
      form.value = { ...form.value, ...props.prompt };
    }
  },
);
</script>
<template>
  <div class="new-prompt">
    <el-dialog
      :model-value="visible"
      :title="title"
      @close="emits('update:visible', false)"
    >
      <el-form ref="formRef" :model="form" :rules="rules">
        <el-form-item label="提示词名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入提示词名称"
          ></el-input>
        </el-form-item>

        <el-form-item label="提示词描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :maxlength="200"
            show-word-limit
            :rows="5"
            placeholder="请输入提示词描述"
          ></el-input>
        </el-form-item>

        <el-form-item label="提示词简介" prop="prompt">
          <el-input
            v-model="form.prompt"
            type="textarea"
            :maxlength="200"
            show-word-limit
            :rows="15"
            placeholder="请输入提示词简介"
          ></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" class="button" @click="onSubmit(formRef)">
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
.new-prompt {
  .el-input > .el-input__wrapper {
    --o-input-border-radius: 4px;
  }
  .el-textarea {
    --o-textarea-border-radius: 4px;
  }

  :deep(.el-dialog) {
    --o-dialog-width: 544px;

    .el-dialog__body {
      max-height: none;
      padding-bottom: 5px;
    }

    .el-dialog__footer {
      padding-top: 0;
    }
  }
}
.dialog-footer {
  .button {
    width: 64px;
    height: 24px;
    border-radius: 4px;
  }
}
</style>
