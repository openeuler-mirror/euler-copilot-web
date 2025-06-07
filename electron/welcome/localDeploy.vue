<template>
  <div v-if="isTimeLine">
    <el-form
      ref="ruleFormRef"
      label-position="left"
      label-width="auto"
      :model="ruleForm"
      :rules="rules"
      validate-on-input
      class="model-ruleForm"
      style="max-width: 600px"
    >
      <div class="model-title">
        大模型
        <img :src="successIcon" alt="success" width="16" height="16" />
      </div>
      <el-form-item label="URL" prop="url" label-position="left">
        <el-input placeholder="请输入" v-model="ruleForm.url" />
      </el-form-item>
      <el-form-item label="模型名称" prop="modelName" label-position="left">
        <el-input placeholder="请输入" v-model="ruleForm.modelName" />
      </el-form-item>
      <el-form-item label="API_Key" prop="apiKey" label-position="left">
        <el-input placeholder="请输入" v-model="ruleForm.apiKey" />
      </el-form-item>
    </el-form>
    <el-form
      ref="embeddingRuleFormRef"
      label-position="left"
      label-width="auto"
      :model="embeddingRuleForm"
      :rules="rules"
      class="model-ruleForm"
      style="max-width: 600px"
    >
      <div class="model-title">
        Embedding模型
        <img :src="successIcon" alt="success" width="16" height="16" />
      </div>
      <el-form-item label="URL" prop="url" label-position="left">
        <el-input placeholder="请输入" v-model="embeddingRuleForm.url">
          <template #suffix>
            <el-tooltip
              content="复用大模型相同链接"
              placement="top"
              effect="light"
            >
              <el-icon class="el-input__icon" @click="copyText(ruleForm)">
                <img :src="copyIcon" alt="copy" width="16" height="16" />
              </el-icon>
            </el-tooltip>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="模型名称" prop="modelName" label-position="left">
        <el-input placeholder="请输入" v-model="embeddingRuleForm.modelName" />
      </el-form-item>
      <el-form-item label="API_Key" prop="apiKey" label-position="left">
        <el-input placeholder="请输入" v-model="embeddingRuleForm.apiKey" />
      </el-form-item>
    </el-form>
  </div>
  <div v-else>
    <TimeLine />
  </div>
  <div class="submit-btn">
    <el-button
      type="primary"
      :disabled="isConfirmDisabled"
      @click="handleConfirm"
    >
      确定
    </el-button>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import copyIcon from './assets/svgs/copy_icon.svg';
import successIcon from './assets/svgs/success.svg';
import TimeLine from './timeLine.vue';

interface RuleForm {
  url: string;
  modelName: string;
  apiKey: string;
}

const ruleForm = reactive<RuleForm>({
  url: '',
  modelName: '',
  apiKey: '',
});
const embeddingRuleForm = reactive<RuleForm>({
  url: '',
  modelName: '',
  apiKey: '',
});

const ruleFormRef = ref<FormInstance>();

const embeddingRuleFormRef = ref<FormInstance>();

const isConfirmDisabled = ref(true);
const isTimeLine = ref(false);

const rules = reactive<FormRules<RuleForm>>({
  url: [
    { required: true, message: '请输入后端服务链接', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: ['blur', 'change'] },
  ],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API_Key', trigger: 'blur' }],
});

watch(
  [() => ruleForm, () => embeddingRuleForm],
  ([newRuleForm, newEmbeddingRuleForm]) => {
    // 检查所有必填字段是否都有值
    const isRuleFormValid =
      newRuleForm.url && newRuleForm.modelName && newRuleForm.apiKey;
    const isEmbeddingRuleFormValid =
      newEmbeddingRuleForm.url &&
      newEmbeddingRuleForm.modelName &&
      newEmbeddingRuleForm.apiKey;

    // 如果两个表单都有效，则启用按钮
    isConfirmDisabled.value = !(isRuleFormValid && isEmbeddingRuleFormValid);
  },
  { immediate: true, deep: true }, // 立即执行一次初始检查
);

const copyText = (ruleForm: RuleForm) => {
  embeddingRuleForm.url = ruleForm.url;
  embeddingRuleForm.apiKey = ruleForm.apiKey;
};
const validateForm = async () => {
  const [ruleFormValid, ruleFormFields] = await new Promise<[boolean, any]>(
    (resolve) => {
      ruleFormRef.value?.validate((valid, fields) => resolve([valid, fields]));
    },
  );

  const [embeddingRuleFormValid, embeddingRuleFormFields] = await new Promise<
    [boolean, any]
  >((resolve) => {
    embeddingRuleFormRef.value?.validate((valid, fields) =>
      resolve([valid, fields]),
    );
  });

  if (!ruleFormValid || !embeddingRuleFormValid) {
    return false;
  }
  return true;
};

const handleConfirm = async () => {
  if (!ruleFormRef.value || !embeddingRuleFormRef.value) return;
  const isValid = await validateForm();
  if (!isValid) {
    return;
  }
  isTimeLine.value = true;

  console.log('表单验证成功:', { ruleForm, embeddingRuleForm });
};
</script>

<style lang="scss" scoped>
.model-ruleForm {
  margin: 0 48px 0 40px;
  .model-title {
    font-weight: 700;
    font-size: 16px;
    line-height: 24px;
    margin: 32px 0 16px 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .el-input__icon {
    cursor: pointer;
  }
}
.submit-btn {
  width: 100vw;
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 24px;
  button {
    padding: 8px 25px;
  }
}
.el-form-item.is-error .el-input__wrapper {
  background-color: rgb(247, 193, 193);
}
</style>
