<template>
  <div class="welcome-detail-title">
    <div @click="handleBack" class="back-btn">
      <img :src="leftArrowIcon" alt="" />
      <span class="back-btn-text">返回</span>
    </div>
    <span class="divider"></span>
    <div class="welcome-detail-title-text">后端在线服务</div>
  </div>
  <el-form
    ref="ruleFormRef"
    label-position="left"
    label-width="auto"
    :model="ruleForm"
    :rules="rules"
    class="online-ruleForm"
    style="max-width: 600px"
  >
    <el-form-item label="后端服务链接" prop="url" label-position="left">
      <el-input
        placeholder="请输入"
        v-model="ruleForm.url"
        @change="handleUrlChange"
        @blur="handleUrlBlur"
      />
    </el-form-item>
  </el-form>
  <div class="submit-btn">
    <el-button type="primary" :disabled="isConfirmDisabled" @click="handleConfirm(ruleFormRef)">
      确定
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import leftArrowIcon from './assets/svgs/left_arrow.svg';

const props = withDefaults(
  defineProps<{
    back: Function;
  }>(),
  {},
);

interface RuleForm {
  url: string;
}

const ruleForm = reactive<RuleForm>({
  url: '',
});
const ruleFormRef = ref<FormInstance>();

const checkUrlValid = (_rule, value, callback) => {
  // 这里校验各个url链接
  window.eulercopilotWelcome.config.validateServer(value).then(({isValid,error}) => {
    if (!isValid) {
      callback(error);
    } else {
      callback();
    }
  }).catch((err) => {
    callback('校验失败:',err);
  });
};
const rules = reactive<FormRules<RuleForm>>({
  url: [
    { required: true, message: '请输入后端服务链接', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: ['change'] },
    { validator: checkUrlValid, trigger: ['blur'] },
  ],
});

const isConfirmDisabled = ref(true);

const handleUrlChange = () => {
  if (!ruleFormRef.value) return;
  ruleFormRef.value.validate((valid) => {
    isConfirmDisabled.value = !valid;
  });
};

const handleUrlBlur = () => {
  handleUrlChange();
};

onMounted(() => {
  // 组件挂载后进行一次表单验证
  if (ruleFormRef.value && ruleForm.url) {
    handleUrlChange();
  }
});

const handleConfirm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (!valid) {
      console.error('表单验证失败:', fields);
      return;
    }
    console.log('表单验证成功:', ruleForm);
    window.eulercopilotWelcome.config.setProxyUrl(ruleForm.url);
  });
};

const handleBack = () => {
  props.back();
};
</script>
<style lang="scss" scoped>
.online-ruleForm {
  margin: 0 48px 0 40px;
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
</style>