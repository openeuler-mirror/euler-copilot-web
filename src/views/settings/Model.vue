<script lang="ts" setup>
import { computed, markRaw, onMounted, ref, watch } from 'vue';
import ModelCard from './components/ModelCard.vue';
import lightNull from '@/assets/svgs/light_null.svg';
import DarkNull from '@/assets/svgs/dark_null.svg';
import { ElEmpty, ElMessage, ElMessageBox } from 'element-plus';
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

const selectedProvider = ref<ModelProvider>();

const isDeleteVisible = ref(false);
const beDeleteModelId = ref('');

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
});
</script>
<template>
  <div class="model">
    <p class="model-label">{{ t('settings.added_model') }}</p>
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
  &-label {
    font-size: 14px;
    line-height: 22px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--o-text-color-primary);
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
      color: rgb(99, 149, 253);

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
      color: rgb(99, 149, 253);
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
