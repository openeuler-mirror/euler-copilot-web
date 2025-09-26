<script lang="ts" setup>
import { computed, markRaw, onMounted, ref, watch } from 'vue';
import ModelCard from './components/ModelCard.vue';
import SystemModelSettings from './components/SystemModelSettings.vue';
import lightNull from '@/assets/svgs/light_null.svg';
import DarkNull from '@/assets/svgs/dark_null.svg';
import { ElEmpty, ElMessage, ElMessageBox, ElPopover } from 'element-plus';
import AddModel, { ModelProvider } from './components/AddModel.vue';
import { IconAlarm } from '@computing/opendesign-icons';
import i18n from '@/i18n';
import { api } from '@/apis';
import { storeToRefs } from 'pinia';
import { useChangeThemeStore } from '@/store';

interface Model {
  llmId: string;
  icon: string;
  openaiBaseUrl: string;
  openaiApiKey: string;
  modelName: string;
  maxTokens: number;
  isEditable?: boolean;
}

const { t } = i18n.global;

const { theme } = storeToRefs(useChangeThemeStore());

const emptyImg = computed(() =>
  theme.value === 'light' ? lightNull : DarkNull,
);

const models = ref<Model[]>([]);

const modelProviders = ref<ModelProvider[]>([]);

const embeddingOptions = ref<any[]>([]);

const rerankerOptions = ref<any[]>([]);

// 用户偏好设置
const userPreferences = ref<any>({});

const isAddModelVisible = ref(false);

const dialogTitle = ref();

const selectedModel = ref();
function onModelEdit(model?: Model) {
  if (!model) return;
  dialogTitle.value = t(`common.edit`, { name: t('settings.model') });
  selectedModel.value = model;
  isAddModelVisible.value = true;
}

function onAddModel(provider: ModelProvider) {
  dialogTitle.value = t(`common.add`, { name: t('settings.model') });
  selectedProvider.value = provider;
  isAddModelVisible.value = true;
}

async function queryModels() {
  const [, res] = await api.getUserModelList();
  if (res) {
    models.value = res.result;
  }
}

async function queryModelProviders() {
  const [, res] = await api.getModelProviderList();
  if (res) {
    modelProviders.value = res.result;
  }
}

async function queryEmbeddingOptions() {
  const [, res] = await api.getEmbeddingConfig();
  if (res) {
    // 将 embedding 配置转换为选项格式
    const result = res.result as any;
    embeddingOptions.value = [{
      llmId: 'embedding_default',
      modelName: result.model || 'Default Embedding Model',
      icon: result.icon || '',
      type: result.type,
      endpoint: result.endpoint,
      apiKey: result.api_key
    }];
  }
}

async function queryRerankerOptions() {
  const [, res] = await api.getRerankerConfig();
  if (res && res.result) {
    // 将 reranker 配置转换为选项格式
    rerankerOptions.value = res.result.map((item: any, index: number) => {
      // 根据不同类型设置正确的模型名称
      let modelName = '';
      if (item.type === 'algorithm') {
        modelName = item.name || `Algorithm Reranker ${index + 1}`;
      } else if (item.type === 'openai') {
        modelName = item.model || `OpenAI Reranker ${index + 1}`;
      } else {
        modelName = item.name || item.model || `Reranker ${index + 1}`;
      }
      
      return {
        llmId: `reranker_${index}`,
        modelName: modelName,
        icon: item.icon || '',
        type: item.type
      };
    });
  }
}

async function queryUserPreferences() {
  const [, res] = await api.getUserPreferences();
  if (res) {
    userPreferences.value = res.result || {};
  }
}

const selectedProvider = ref<ModelProvider>();

const isDeleteVisible = ref(false);
const beDeleteModelId = ref('');

// 系统模型设置相关
const isSystemModelSettingsVisible = ref(false);

// 移除手动控制，让 el-popover 自动管理显示状态

async function handleSystemModelSettingsSave(settings: any) {
  try {
    // 构建偏好设置对象，只包含非空的选择
    const preferences: any = {};
    
    if (settings.reasoningModel) {
      preferences.reasoningModelPreference = models.value.find(m => m.llmId === settings.reasoningModel);
    }
    
    if (settings.embeddingModel) {
      preferences.embeddingModelPreference = embeddingOptions.value.find(m => m.llmId === settings.embeddingModel);
    }
    
    if (settings.rerankModel) {
      preferences.rerankerPreference = rerankerOptions.value.find(m => m.llmId === settings.rerankModel);
    }
    
    // 思维链偏好总是包含，因为它有明确的boolean值
    preferences.chainOfThoughtPreference = settings.chainOfThought;
    
    // 调用API保存用户偏好设置
    const [err] = await api.updateUserPreferences(preferences);
    
    if (err) {
      ElMessage.error(err.message || t('common.save_failed'));
    } else {
      ElMessage.success(t('common.save_success'));
      isSystemModelSettingsVisible.value = false;
      // 重新获取用户偏好设置
      await queryUserPreferences();
    }
  } catch (error) {
    console.error('保存系统模型设置失败:', error);
    ElMessage.error(t('common.save_failed'));
  }
}

function handleSystemModelSettingsCancel() {
  console.log('取消系统模型设置');
  isSystemModelSettingsVisible.value = false;
}

async function handleDelete(modelId: string) {
  if (!modelId) return;
  ElMessageBox.confirm(t('settings.confirm_to_delete'), t('common.tip'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
    icon: markRaw(IconAlarm),
  }).then(async () => {
    const [err] = await api.deleteModel(modelId);
    if (err) ElMessage.error(err.message);
    else {
      ElMessage.success(t('common.delete_success'));
      queryModels();
      beDeleteModelId.value = '';
      isDeleteVisible.value = false;
    }
  });
}

watch(
  () => [isAddModelVisible.value],
  () => {
    if (!isAddModelVisible.value) {
      selectedProvider.value = undefined;
      selectedModel.value = undefined;
      queryModels();
    }
  },
);

onMounted(() => {
  queryModels();
  queryModelProviders();
  queryEmbeddingOptions();
  queryRerankerOptions();
  queryUserPreferences();
});
</script>
<template>
  <div class="model">
    <div class="model-label-container">
      <p class="model-label">{{ t('settings.added_model') }}</p>
      <el-popover
        v-model:visible="isSystemModelSettingsVisible"
        placement="bottom-end"
        :width="420"
        trigger="click"
        popper-class="system-model-settings-popover-wrapper"
        :fallback-placements="['bottom-start', 'bottom', 'top-end', 'top-start', 'top']"
        :offset="10"
        :hide-after="0"
        :persistent="true"
        :popper-options="{
          modifiers: [
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
                padding: 16
              }
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['bottom-start', 'bottom', 'top-end', 'top-start', 'top']
              }
            },
            {
              name: 'offset',
              options: {
                offset: ({ placement, reference, popper }) => {
                  if (placement === 'bottom-end') {
                    const buttonWidth = reference.width;
                    const popoverWidth = 120; // 悬浮窗口宽度
                    const horizontalOffset = popoverWidth - buttonWidth;
                    return [-horizontalOffset, 8];
                  }
                  return [0, 8];
                }
              }
            },
            {
              name: 'eventListeners',
              options: {
                scroll: false,
                resize: true
              }
            }
          ]
        }"
      >
        <template #reference>
          <button class="system-model-btn">
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              style="flex-shrink: 0;"
            >
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
            <span>{{ t('settings.model_preferences_settings') }}</span>
          </button>
        </template>
        <SystemModelSettings 
          :models="models"
          :embedding-options="embeddingOptions"
          :reranker-options="rerankerOptions"
          :user-preferences="userPreferences"
          @save="handleSystemModelSettingsSave"
          @cancel="handleSystemModelSettingsCancel"
        />
      </el-popover>
    </div>
    <div class="added-model" v-if="models.length">
      <ModelCard
        v-for="item in models"
        :name="item.modelName"
        :icon="item.icon"
        :key="item.llmId"
        size="small"
      >
        <template #headerRight>
          <div class="added-model__operate">
            <a
              @click="onModelEdit(item.isEditable ? item : undefined)"
              :class="{ disabled: !item.isEditable }"
            >
              {{ t('common.edit') }}
            </a>
            <a
              @click="handleDelete(item.isEditable ? item.llmId : '')"
              :class="{ disabled: !item.isEditable }"
            >
              {{ t('common.delete') }}
            </a>
          </div>
        </template>
      </ModelCard>
    </div>
    <ElEmpty v-else :image="lightNull" :description="t('common.null')" />

    <p class="model-label">{{ t('settings.model_provider') }}</p>
    <div class="model-provider" v-if="modelProviders.length">
      <ModelCard
        v-for="item in modelProviders"
        :name="item.provider"
        :icon="item.icon"
        :description="item.description"
        :key="item.provider"
      >
        <template #cardFooter>
          <div class="model-provider-footer">
            <a @click="onAddModel(item)">{{ t('common.add') }}</a>
          </div>
        </template>
      </ModelCard>
    </div>
    <ElEmpty v-else :image="emptyImg" :description="t('common.null')" />
  </div>

  <AddModel
    v-model:visible="isAddModelVisible"
    type="add"
    :title="dialogTitle"
    :model="selectedModel"
    :provider="selectedProvider"
  />
</template>
<style lang="scss" scoped>
.model {
  &-label-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &-label {
    font-size: 14px;
    line-height: 22px;
    font-weight: 700;
    margin: 0;
    color: var(--o-text-color-primary);
  }

  .system-model-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--el-collapse-header-bg);
    color: var(--o-text-color-primary);
    border: 1px solid var(--o-border-color-lighter);
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--o-bg-color-base);
      border-color: var(--o-border-color);
    }
    
    &:focus {
      outline: none;
      border-color: var(--o-color-primary);
      box-shadow: 0 0 0 2px var(--o-color-primary-light-9);
    }
    
    &:active {
      transform: translateY(1px);
    }
    
    span {
      white-space: nowrap;
    }
  }

  .added-model {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-content: flex-start;
    gap: 16px;
    min-height: 210px;

    &__operate {
      display: flex;
      gap: 8px;
      font-size: 12px;
      line-height: 16px;
      color: var(--o-color-primary);

      .disabled {
        color: var(--o-text-disable);
      }

      a {
        cursor: pointer;
        user-select: none;
      }
    }
  }

  .model-provider {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    &-footer {
      display: flex;
      justify-content: flex-end;
      color: var(--o-color-primary);
      font-size: 12px;
      line-height: 16px;
      a {
        cursor: pointer;
        user-select: none;
      }
    }
  }
}
</style>

<style>
.system-model-settings-popover-wrapper {
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: var(--o-shadow-dark) !important;
}

/* 确保悬浮窗口与按钮右边界对齐 */
.system-model-settings-popover-wrapper[data-popper-placement^="bottom-end"] {
  transform-origin: top right !important;
}

.system-model-settings-popover-wrapper[data-popper-placement^="top-end"] {
  transform-origin: bottom right !important;
}
</style>
