<template>
  <el-dialog
    :model-value="visible"
    :show-close="false"
    width="50%"
    title="服务协议" 
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    align-center
  >
    <template #default>
      <el-scrollbar height="400px">
        <div class="agreement-markdown" v-html="content"></div>
      </el-scrollbar>
    </template>
    <template #footer>
      <el-form v-if="needCheck && agreementName" ref="formRef" :rules="rules" :model="form">
        <el-form-item prop="check">
          <el-checkbox-group v-model="form.check">
            <el-checkbox :label="agreeMessage" name="check" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div class="button-group">
        <el-button class="confirm-button"  @click="submitForm(formRef)">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { FormRules } from 'element-plus';
import type { FormInstance } from 'element-plus';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    // 弹窗内容
    content: string;
    // 协议名称
    agreementName?: string;
    // 是否需要check
    needCheck?: boolean;
  }>(),
  {
    needCheck: true,
  }
);

const emits = defineEmits<{
  (e: 'close'): void;
  (e: 'submit'): void;
}>();

const form = reactive({
  check: [],
});

const formRef = ref<FormInstance>();

const rules = reactive<FormRules<{ check: string[] }>>({
  check: [
    {
      type: 'array',
      required: true,
      message: `请勾选${props.agreementName}`,
      trigger: 'change',
    },
  ],
});

const agreeMessage = computed(() => `我已阅读并同意 ${props.agreementName}`);

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!props.needCheck) {
    emits('submit');
  }
  if (!formEl) {
    return;
  }
  await formEl.validate((valid) => {
    if (valid) {
      emits('submit');
    }
  });
};
</script>

<style lang="scss" scoped>
.button-group {
  text-align: center;
  .confirm-button {
    margin-top: 32px;
    width: 64px;
    height: 24px;
    border-radius: 1;
    font-size: 12px;
  }
}
</style>

<style lang="scss">
.agreement-markdown {
  background-color: var(--o-bg-color-light);
  padding: 10px;
  h1 {
    text-align: center;
    padding-bottom: 16px;
    font-size: 20px;
    margin-top: 16px;
  }
  h2 {
    padding: 10px 0;
  }

  h3,
  h4 {
    padding-bottom: 5px;
  }
  p {
    margin: 12px 0;
  }
  hr {
    border-color: #eee;
    margin: 20px 0;
  }
}
form {
  margin-top: 10px;
}

</style>
