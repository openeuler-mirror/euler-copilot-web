<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { ElPopover, ElSelect, ElOption, ElSwitch } from 'element-plus';
import i18n from '@/i18n';

interface ModelOption {
  llmId: string;
  icon: string;
  modelName: string;
  maxTokens: number;
  isEditable?: boolean;
}

const props = defineProps<{
  models?: ModelOption[];
  embeddingOptions?: ModelOption[];
  rerankerOptions?: ModelOption[];
  initialSettings?: Partial<SystemModelSettings>;
  userPreferences?: any;
}>();

const emit = defineEmits<{
  'save': [settings: SystemModelSettings];
  'cancel': [];
}>();

interface SystemModelSettings {
  reasoningModel: string;
  embeddingModel: string;
  rerankModel: string;
  chainOfThought: boolean;
}

const { t } = i18n.global;

// 使用从父组件传递的模型数据
const reasoningModels = computed(() => props.models || []);

const embeddingModels = computed(() => props.embeddingOptions || []);

const rerankModels = computed(() => props.rerankerOptions || []);

// 从用户偏好设置中获取默认值的函数
const getDefaultModelId = (preferenceKey: string, optionsArray: any[]): string => {
  const preference = props.userPreferences?.[preferenceKey];
  
  if (preference && optionsArray.length > 0) {
    // 如果用户有偏好设置，尝试找到匹配的模型
    const match = optionsArray.find(model => {
      // 首先尝试通过 llmId 匹配（最准确）
      if (preference.llmId && model.llmId === preference.llmId) {
        return true;
      }
      // 如果没有 llmId，则通过 modelName 匹配
      if (preference.modelName && model.modelName === preference.modelName) {
        return true;
      }
      return false;
    });
    return match?.llmId || '';
  }
  return '';
};

// 当前选中的值
const currentSettings = ref<SystemModelSettings>({
  reasoningModel: props.initialSettings?.reasoningModel || getDefaultModelId('reasoningModelPreference', props.models || []),
  embeddingModel: props.initialSettings?.embeddingModel || getDefaultModelId('embeddingModelPreference', props.embeddingOptions || []),
  rerankModel: props.initialSettings?.rerankModel || getDefaultModelId('rerankerPreference', props.rerankerOptions || []),
  chainOfThought: props.initialSettings?.chainOfThought ?? props.userPreferences?.chainOfThoughtPreference ?? true,
});

const handleSave = () => {
  emit('save', currentSettings.value);
};

const handleCancel = () => {
  emit('cancel');
};

// 基于用户偏好设置更新选择的逻辑
const updateDefaultSelections = () => {
  nextTick(() => {
    // 基于用户偏好更新推理模型选择
    if (reasoningModels.value.length > 0) {
      const preferredId = getDefaultModelId('reasoningModelPreference', reasoningModels.value);
      if (preferredId) {
        // 如果有偏好设置，使用偏好设置的值
        currentSettings.value.reasoningModel = preferredId;
      } else {
        // 如果没有偏好设置，且当前选择无效，则设为空
        const currentValue = currentSettings.value.reasoningModel;
        const isValidSelection = currentValue && reasoningModels.value.some(model => model.llmId === currentValue);
        if (!isValidSelection) {
          currentSettings.value.reasoningModel = '';
        }
      }
    }
    
    // 基于用户偏好更新 embedding 模型选择
    if (embeddingModels.value.length > 0) {
      const preferredId = getDefaultModelId('embeddingModelPreference', embeddingModels.value);
      if (preferredId) {
        // 如果有偏好设置，使用偏好设置的值
        currentSettings.value.embeddingModel = preferredId;
      } else {
        // 如果没有偏好设置，且当前选择无效，则设为空
        const currentValue = currentSettings.value.embeddingModel;
        const isValidSelection = currentValue && embeddingModels.value.some(model => model.llmId === currentValue);
        if (!isValidSelection) {
          currentSettings.value.embeddingModel = '';
        }
      }
    }
    
    // 基于用户偏好更新 reranker 模型选择
    if (rerankModels.value.length > 0) {
      const preferredId = getDefaultModelId('rerankerPreference', rerankModels.value);
      if (preferredId) {
        // 如果有偏好设置，使用偏好设置的值
        currentSettings.value.rerankModel = preferredId;
      } else {
        // 如果没有偏好设置，且当前选择无效，则设为空
        const currentValue = currentSettings.value.rerankModel;
        const isValidSelection = currentValue && rerankModels.value.some(model => model.llmId === currentValue);
        if (!isValidSelection) {
          currentSettings.value.rerankModel = '';
        }
      }
    }
    
    // 更新思维链偏好
    if (props.userPreferences?.chainOfThoughtPreference !== undefined) {
      currentSettings.value.chainOfThought = props.userPreferences.chainOfThoughtPreference;
    }
  });
};

// 获取当前选中模型的图标
const selectedReasoningModelIcon = computed(() => {
  const selected = reasoningModels.value.find(model => model.llmId === currentSettings.value.reasoningModel);
  return selected?.icon || '';
});

const selectedEmbeddingModelIcon = computed(() => {
  const selected = embeddingModels.value.find(model => model.llmId === currentSettings.value.embeddingModel);
  return selected?.icon || '';
});

const selectedRerankModelIcon = computed(() => {
  const selected = rerankModels.value.find(model => model.llmId === currentSettings.value.rerankModel);
  return selected?.icon || '';
});

// 监听模型选项和用户偏好设置变化
watch([reasoningModels, embeddingModels, rerankModels, () => props.userPreferences], updateDefaultSelections, { 
  immediate: true,
  deep: true 
});

// 组件挂载后也执行一次选择更新，确保选择行为正确
onMounted(() => {
  updateDefaultSelections();
});
</script>

<template>
  <div class="system-model-settings-popover">
    <div class="settings-content">
      <!-- 系统推理模型 -->
      <div class="setting-item">
        <div class="setting-label">
          <span>{{ t('settings.reasoning_model_preference') }}</span>
          <el-icon class="help-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
          </el-icon>
        </div>
        <el-select 
          v-model="currentSettings.reasoningModel" 
          class="setting-select"
          popper-class="system-model-select-dropdown"
          :teleported="false"
        >
          <template #prefix>
            <div class="selected-model-icon">
              <img v-if="selectedReasoningModelIcon" :src="selectedReasoningModelIcon" alt="model icon" class="model-icon-img" />
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3" fill="#8B5CF6"/>
              </svg>
            </div>
          </template>
          <el-option
            label="请选择推理模型"
            value=""
          />
          <el-option
            v-for="model in reasoningModels"
            :key="model.llmId"
            :label="model.modelName"
            :value="model.llmId"
          >
            <div class="model-option">
              <div class="model-icon">
                <img v-if="model.icon" :src="model.icon" :alt="model.modelName" class="model-icon-img" />
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="3" fill="#8B5CF6"/>
                </svg>
              </div>
              <span>{{ model.modelName }}</span>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- Embedding 模型 -->
      <div class="setting-item">
        <div class="setting-label">
          <span>{{ t('settings.embedding_model_preference') }}</span>
          <el-icon class="help-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
          </el-icon>
        </div>
        <el-select 
          v-model="currentSettings.embeddingModel" 
          class="setting-select"
          popper-class="system-model-select-dropdown"
          :teleported="false"
        >
          <template #prefix>
            <div class="selected-model-icon">
              <img v-if="selectedEmbeddingModelIcon" :src="selectedEmbeddingModelIcon" alt="model icon" class="model-icon-img" />
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3" fill="#10B981"/>
              </svg>
            </div>
          </template>
          <el-option
            label="请选择嵌入模型"
            value=""
          />
          <el-option
            v-for="model in embeddingModels"
            :key="model.llmId"
            :label="model.modelName"
            :value="model.llmId"
          >
            <div class="model-option">
              <div class="model-icon">
                <img v-if="model.icon" :src="model.icon" :alt="model.modelName" class="model-icon-img" />
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="3" fill="#10B981"/>
                </svg>
              </div>
              <span>{{ model.modelName }}</span>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- Reranker -->
      <div class="setting-item">
        <div class="setting-label">
          <span>{{ t('settings.reranker_preference') }}</span>
          <el-icon class="help-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
          </el-icon>
        </div>
        <el-select 
          v-model="currentSettings.rerankModel" 
          class="setting-select"
          popper-class="system-model-select-dropdown"
          :teleported="false"
        >
          <template #prefix>
            <div class="selected-model-icon">
              <img v-if="selectedRerankModelIcon" :src="selectedRerankModelIcon" alt="model icon" class="model-icon-img" />
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#F59E0B" stroke-width="2" fill="none"/>
              </svg>
            </div>
          </template>
          <el-option
            label="请选择重排序模型"
            value=""
          />
          <el-option
            v-for="model in rerankModels"
            :key="model.llmId"
            :label="model.modelName"
            :value="model.llmId"
          >
            <div class="model-option">
              <div class="model-icon">
                <img v-if="model.icon" :src="model.icon" :alt="model.modelName" class="model-icon-img" />
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#F59E0B" stroke-width="2" fill="none"/>
                </svg>
              </div>
              <span>{{ model.modelName }}</span>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 思维链偏好 -->
      <div class="setting-item">
        <div class="setting-label">
          <span>{{ t('settings.chain_of_thought_preference') }}</span>
        </div>
        <el-switch 
          v-model="currentSettings.chainOfThought"
          class="setting-switch"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="settings-footer">
      <button class="cancel-btn" @click="handleCancel">
        {{ t('common.cancel') }}
      </button>
      <button class="save-btn" @click="handleSave">
        {{ t('semantic.save') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-model-settings-popover {
  width: 420px;
  background: var(--el-collapse-header-bg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--o-border-color-lighter);
}

.settings-content {
  padding: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--o-text-color-primary);
  font-weight: 500;
  min-width: 120px;
  
  .help-icon {
    color: var(--o-text-color-secondary);
    cursor: help;
  }
}

.setting-select {
  width: 220px;
}

.selected-model-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;

  .model-icon-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 2px;
  }
}

.setting-switch {
  --el-switch-on-color: rgb(99, 149, 253);
}

.model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .model-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;

    .model-icon-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 2px;
    }
  }
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--o-border-color-lighter);
  background: var(--o-bg-color-base);
  border-radius: 0 0 8px 8px;
}

.cancel-btn, .save-btn {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-btn {
  background: transparent;
  color: var(--o-text-color-secondary);
  border: 1px solid var(--o-border-color-lighter);
  
  &:hover {
    background: var(--o-bg-color-base);
    border-color: var(--o-border-color);
  }
}

.save-btn {
  background: rgb(99, 149, 253);
  color: white;
  
  &:hover {
    background: rgb(79, 129, 233);
  }
}
</style>

<style>
.system-model-select-dropdown .el-select-dropdown__item {
  padding: 8px 12px;
  display: flex !important;
  align-items: center !important;
}

.system-model-select-dropdown .el-select-dropdown__item .model-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
