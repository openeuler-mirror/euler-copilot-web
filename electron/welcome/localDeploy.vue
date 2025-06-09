<template>
  <div class="welcome-detail-title">
    <div @click="handleBack" class="back-btn">
      <img :src="leftArrowIcon" alt="" />
      <span class="back-btn-text">{{ $t('welcome.back') }}</span>
    </div>
    <span class="divider"></span>
    <div class="welcome-detail-title-text">{{ $t('welcome.localDeploy') }}</div>
  </div>
  <div v-if="!isTimeLine">
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
        {{ $t('localDeploy.model') }}
        <img :src="successIcon" alt="success" width="16" height="16" />
      </div>
      <el-form-item
        :label="$t('localDeploy.url')"
        prop="url"
        label-position="left"
      >
        <el-input
          :placeholder="$t('welcome.pleaseInput')"
          v-model="ruleForm.url"
        />
      </el-form-item>
      <el-form-item
        :label="$t('localDeploy.modelName')"
        prop="modelName"
        label-position="left"
      >
        <el-input
          :placeholder="$t('welcome.pleaseInput')"
          v-model="ruleForm.modelName"
        />
      </el-form-item>
      <el-form-item
        :label="$t('localDeploy.apiKey')"
        prop="apiKey"
        label-position="left"
      >
        <el-input
          :placeholder="$t('welcome.pleaseInput')"
          v-model="ruleForm.apiKey"
        />
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
        {{ $t('localDeploy.embeddingModel') }}
        <img :src="successIcon" alt="success" width="16" height="16" />
      </div>
      <el-form-item
        :label="$t('localDeploy.url')"
        prop="url"
        label-position="left"
      >
        <el-input
          :placeholder="$t('welcome.pleaseInput')"
          v-model="embeddingRuleForm.url"
        >
          <template #suffix>
            <el-tooltip
              :content="$t('localDeploy.copyTip')"
              placement="top"
              effect="light"
              popper-class="url-icon-tooltip"
            >
              <el-icon class="el-input__icon" @click="copyText(ruleForm)">
                <img :src="copyIcon" alt="copy" width="16" height="16" />
              </el-icon>
            </el-tooltip>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item
        :label="$t('localDeploy.modelName')"
        prop="modelName"
        label-position="left"
      >
        <el-input
          :placeholder="$t('welcome.pleaseInput')"
          v-model="embeddingRuleForm.modelName"
        />
      </el-form-item>
      <el-form-item
        :label="$t('localDeploy.apiKey')"
        prop="apiKey"
        label-position="left"
      >
        <el-input
          :placeholder="$t('welcome.pleaseInput')"
          v-model="embeddingRuleForm.apiKey"
        />
      </el-form-item>
    </el-form>
    <div class="submit-btn">
      <el-button
        type="primary"
        :disabled="isConfirmDisabled"
        @click="handleConfirm"
      >
        {{ $t('welcome.confirm') }}
      </el-button>
    </div>
  </div>
  <div v-else>
    <TimeLine />
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import copyIcon from './assets/svgs/copy_icon.svg';
import successIcon from './assets/svgs/success.svg';
import TimeLine from './timeLine.vue';
import leftArrowIcon from './assets/svgs/left_arrow.svg';
import i18n from './lang/index';

const props = withDefaults(
  defineProps<{
    back: () => void;
  }>(),
  {},
);

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
    {
      required: true,
      message:
        i18n.global.t('welcome.pleaseInput') + i18n.global.t('localDeploy.url'),
      trigger: ['change', 'blur'],
    },
    {
      type: 'url',
      message: i18n.global.t('welcome.validUrl'),
      trigger: 'blur',
    },
  ],
  modelName: [
    {
      required: true,
      message:
        i18n.global.t('welcome.pleaseInput') +
        i18n.global.t('localDeploy.modelName'),
      trigger: ['change', 'blur'],
    },
  ],
  apiKey: [
    {
      required: true,
      message:
        i18n.global.t('welcome.pleaseInput') +
        i18n.global.t('localDeploy.apiKey'),
      trigger: ['change', 'blur'],
    },
  ],
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
  const [ruleFormValid] = await new Promise<[boolean, any]>((resolve) => {
    ruleFormRef.value?.validate((valid, fields) => resolve([valid, fields]));
  });

  const [embeddingRuleFormValid] = await new Promise<[boolean, any]>(
    (resolve) => {
      embeddingRuleFormRef.value?.validate((valid, fields) =>
        resolve([valid, fields]),
      );
    },
  );

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

  try {
    // 切换到时间线视图
    isTimeLine.value = true;

    // 准备表单数据，格式与 DeploymentFormData 接口一致
    const formData = {
      ruleForm: {
        url: ruleForm.url,
        modelName: ruleForm.modelName,
        apiKey: ruleForm.apiKey,
      },
      embeddingRuleForm: {
        url: embeddingRuleForm.url,
        modelName: embeddingRuleForm.modelName,
        apiKey: embeddingRuleForm.apiKey,
      },
    };

    console.log('开始部署，表单数据:', formData);

    // 调用部署服务
    if (window.eulercopilotWelcome && window.eulercopilotWelcome.deployment) {
      await window.eulercopilotWelcome.deployment.startDeploymentFromForm(
        formData,
      );
    } else {
      console.error('部署服务不可用');
    }
  } catch (error) {
    console.error('部署启动失败:', error);
    // 可以在这里添加错误提示
  }
};
const handleBack = () => {
  if (isTimeLine.value) {
    isTimeLine.value = false;
  } else {
    props.back();
  }
};
</script>

<style lang="scss">
/* 自定义el-tooltip的背景色为绿色 */
.url-icon-tooltip.el-popper.is-light {
  background-color: rgb(244, 246, 250) !important;
  border-color: rgb(223, 229, 239) !important;
  box-shadow: 0 4px 8px 0 rgb(0 0 0 / 20%);
}
.url-icon-tooltip.el-popper.is-light .el-popper__arrow::before {
  background-color: rgb(244, 246, 250) !important;
  border-color: rgb(223, 229, 239) !important;
  border-left-color: transparent !important;
  border-top-color: transparent !important;
}
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
.el-form-item:not(.is-error) .el-input__wrapper {
  background-color: transparent !important;
}
.el-form-item.is-error .el-input__wrapper {
  background-color: rgb(247, 193, 193);
}
</style>
