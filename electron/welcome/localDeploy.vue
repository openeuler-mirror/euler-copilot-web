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
        <img
          v-if="llmValidationStatus === 'validating'"
          :src="loadingIcon"
          alt="validating"
          width="16"
          height="16"
          class="loading-icon"
        />
        <img
          v-else-if="llmValidationStatus === 'success'"
          :src="successIcon"
          alt="success"
          width="16"
          height="16"
        />
        <img
          v-else-if="llmValidationStatus === 'error'"
          :src="errorIcon"
          alt="error"
          width="16"
          height="16"
        />
      </div>
      <el-form-item
        :label="$t('localDeploy.url')"
        prop="url"
        label-position="left"
      >
        <el-input
          :placeholder="$t('welcome.pleaseInput')"
          v-model="ruleForm.url"
          @focus="inputFocusStates.llmUrl = true"
          @blur="
            inputFocusStates.llmUrl = false;
            autoValidateModels();
          "
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
          @focus="inputFocusStates.llmModelName = true"
          @blur="
            inputFocusStates.llmModelName = false;
            autoValidateModels();
          "
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
          @focus="inputFocusStates.llmApiKey = true"
          @blur="
            inputFocusStates.llmApiKey = false;
            autoValidateModels();
          "
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
        <img
          v-if="embeddingValidationStatus === 'validating'"
          :src="loadingIcon"
          alt="validating"
          width="16"
          height="16"
          class="loading-icon"
        />
        <img
          v-else-if="embeddingValidationStatus === 'success'"
          :src="successIcon"
          alt="success"
          width="16"
          height="16"
        />
        <img
          v-else-if="embeddingValidationStatus === 'error'"
          :src="errorIcon"
          alt="error"
          width="16"
          height="16"
        />
      </div>
      <el-form-item
        :label="$t('localDeploy.url')"
        prop="url"
        label-position="left"
      >
        <el-input
          :placeholder="$t('welcome.pleaseInput')"
          v-model="embeddingRuleForm.url"
          @focus="inputFocusStates.embeddingUrl = true"
          @blur="
            inputFocusStates.embeddingUrl = false;
            autoValidateModels();
          "
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
          @focus="inputFocusStates.embeddingModelName = true"
          @blur="
            inputFocusStates.embeddingModelName = false;
            autoValidateModels();
          "
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
          @focus="inputFocusStates.embeddingApiKey = true"
          @blur="
            inputFocusStates.embeddingApiKey = false;
            autoValidateModels();
          "
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
import { ElMessageBox } from 'element-plus';
import copyIcon from './assets/svgs/copy_icon.svg';
import successIcon from './assets/svgs/success.svg';
import errorIcon from './assets/svgs/error.svg';
import loadingIcon from './assets/svgs/upload-loading.svg';
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

// 输入框焦点状态跟踪
const inputFocusStates = ref({
  llmUrl: false,
  llmModelName: false,
  llmApiKey: false,
  embeddingUrl: false,
  embeddingModelName: false,
  embeddingApiKey: false,
});

// 模型验证状态
const llmValidationStatus = ref<'none' | 'validating' | 'success' | 'error'>(
  'none',
);
const embeddingValidationStatus = ref<
  'none' | 'validating' | 'success' | 'error'
>('none');

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

// 检查是否所有字段都填写完整
const isAllFieldsFilled = () => {
  return (
    ruleForm.url &&
    ruleForm.modelName &&
    ruleForm.apiKey &&
    embeddingRuleForm.url &&
    embeddingRuleForm.modelName &&
    embeddingRuleForm.apiKey
  );
};

// 检查是否有输入框处于焦点状态
const hasInputFocus = () => {
  return Object.values(inputFocusStates.value).some((state) => state);
};

// 自动验证模型
const autoValidateModels = async () => {
  if (!isAllFieldsFilled() || hasInputFocus()) {
    return;
  }

  // 重置验证状态
  llmValidationStatus.value = 'validating';
  embeddingValidationStatus.value = 'validating';

  try {
    // 校验 LLM
    const llmResult = await validateOpenAIModel(
      ruleForm.url,
      ruleForm.apiKey,
      ruleForm.modelName,
      true,
    );

    if (llmResult.success) {
      llmValidationStatus.value = 'success';
    } else {
      llmValidationStatus.value = 'error';
      showValidationError('llm', llmResult.type || 'unknown');
    }

    // 校验 Embedding 模型
    const embeddingResult = await validateOpenAIModel(
      embeddingRuleForm.url,
      embeddingRuleForm.apiKey,
      embeddingRuleForm.modelName,
      false,
    );

    if (embeddingResult.success) {
      embeddingValidationStatus.value = 'success';
    } else {
      embeddingValidationStatus.value = 'error';
      showValidationError('embedding', embeddingResult.type || 'unknown');
    }
  } catch (error) {
    console.error('Model validation error:', error);
    llmValidationStatus.value = 'error';
    embeddingValidationStatus.value = 'error';
  }
};

watch(
  [() => ruleForm, () => embeddingRuleForm],
  () => {
    // 当表单数据变化时，重置验证状态
    llmValidationStatus.value = 'none';
    embeddingValidationStatus.value = 'none';

    // 延迟执行验证，避免在用户还在输入时触发
    setTimeout(() => {
      autoValidateModels();
    }, 500);
  },
  { immediate: true, deep: true },
);

// 监听验证状态变化，更新提交按钮状态
watch(
  [llmValidationStatus, embeddingValidationStatus],
  ([llmStatus, embeddingStatus]) => {
    // 只有当两个模型都验证成功时才启用提交按钮
    isConfirmDisabled.value = !(
      llmStatus === 'success' && embeddingStatus === 'success'
    );
  },
  { immediate: true },
);

const copyText = (ruleForm: RuleForm) => {
  embeddingRuleForm.url = ruleForm.url;
  embeddingRuleForm.apiKey = ruleForm.apiKey;
};

// OpenAI API 校验函数
const validateOpenAIModel = async (
  url: string,
  apiKey: string,
  modelName: string,
  isLLM: boolean = true,
) => {
  try {
    // 格式化 URL
    const baseURL = url.replace(/\/+$/, '');

    // 首先尝试检查模型列表（如果支持的话）
    let modelExists = true; // 默认假设模型存在，除非确认不存在

    try {
      const apiURL = baseURL.includes('/v1')
        ? `${baseURL}/models`
        : `${baseURL}/v1/models`;

      const modelsResponse = await fetch(apiURL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        const availableModels = modelsData.data || [];

        // 如果成功获取到模型列表，则检查模型是否存在
        modelExists = availableModels.some(
          (model: any) => model.id === modelName,
        );

        if (!modelExists) {
          throw new Error('model_not_found');
        }
      } else if (modelsResponse.status === 401) {
        throw new Error('auth');
      }
      // 如果是其他错误（如404），可能是不支持models接口，继续后续验证
    } catch (modelsError: any) {
      // 如果是认证错误，直接抛出
      if (modelsError.message === 'auth') {
        throw modelsError;
      }
      if (modelsError.message === 'model_not_found') {
        throw modelsError;
      }
      // 其他错误（如不支持models接口）则继续进行实际调用测试
      console.warn(
        'Models API not supported or failed, proceeding with direct testing',
      );
    }

    if (isLLM) {
      const chatURL = baseURL.includes('/v1')
        ? `${baseURL}/chat/completions`
        : `${baseURL}/v1/chat/completions`;

      // 首先测试基本的聊天功能
      const basicChatTest = {
        model: modelName,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      };

      const basicResponse = await fetch(chatURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basicChatTest),
      });

      if (!basicResponse.ok) {
        if (basicResponse.status === 401) {
          throw new Error('auth');
        }
        throw new Error('connection');
      }

      // 然后测试 function call 支持
      const testFunctionCall = {
        model: modelName,
        messages: [{ role: 'user', content: 'Test function call support' }],
        functions: [
          {
            name: 'test_function',
            description: 'A test function',
            parameters: {
              type: 'object',
              properties: {
                test: { type: 'string', description: 'Test parameter' },
              },
              required: ['test'],
            },
          },
        ],
        max_tokens: 10,
      };

      const functionResponse = await fetch(chatURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testFunctionCall),
      });

      if (!functionResponse.ok) {
        if (functionResponse.status === 400) {
          // 检查错误信息是否表明不支持 function call
          const errorData = await functionResponse.json().catch(() => null);
          if (
            errorData?.error?.message?.toLowerCase().includes('function') ||
            errorData?.error?.message?.toLowerCase().includes('tool')
          ) {
            throw new Error('function_call_not_supported');
          }
        }
        throw new Error('function_call_test_failed');
      }
    } else {
      // 对于 embedding 模型，测试 embeddings 接口
      const embeddingURL = baseURL.includes('/v1')
        ? `${baseURL}/embeddings`
        : `${baseURL}/v1/embeddings`;

      const embeddingTest = {
        model: modelName,
        input: 'Test embedding',
      };

      const embeddingResponse = await fetch(embeddingURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(embeddingTest),
      });

      if (!embeddingResponse.ok) {
        if (embeddingResponse.status === 401) {
          throw new Error('auth');
        }
        throw new Error('connection');
      }
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'unknown',
      type: error.message,
    };
  }
};

// 显示错误消息
const showValidationError = (modelType: string, errorType: string) => {
  let message = '';
  const modelLabel =
    modelType === 'llm'
      ? i18n.global.t('localDeploy.model')
      : i18n.global.t('localDeploy.embeddingModel');
  const modelName =
    modelType === 'llm' ? ruleForm.modelName : embeddingRuleForm.modelName;

  switch (errorType) {
    case 'auth':
      message = `${modelLabel}: ${i18n.global.t('localDeploy.authError')}`;
      break;
    case 'function_call_not_supported':
      message = `${modelLabel}: ${i18n.global.t('localDeploy.functionCallNotSupported')}`;
      break;
    case 'connection':
    case 'function_call_test_failed':
      message = `${modelLabel}: ${i18n.global.t('localDeploy.connectionError')}`;
      break;
    case 'model_not_found':
      message = `${modelLabel}: 模型 "${modelName}" 不存在`;
      break;
    default:
      message = `${modelLabel}: ${i18n.global.t('localDeploy.modelError')}`;
  }

  ElMessageBox.alert(message, i18n.global.t('localDeploy.validationFailed'), {
    confirmButtonText: i18n.global.t('welcome.confirm'),
    type: 'error',
  });
};

const handleConfirm = async () => {
  if (!ruleFormRef.value || !embeddingRuleFormRef.value) return;

  // 由于按钮只有在验证成功时才会启用，所以这里不需要再次验证
  // 但为了安全起见，还是检查一下验证状态
  if (
    llmValidationStatus.value !== 'success' ||
    embeddingValidationStatus.value !== 'success'
  ) {
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

    // 等待 TimeLine 组件挂载并设置好监听器
    // 使用 nextTick 确保 DOM 更新完成，再给一点额外时间让监听器设置完成
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 800); // 给 TimeLine 组件足够时间挂载和设置监听器
    });

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
  .loading-icon {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
