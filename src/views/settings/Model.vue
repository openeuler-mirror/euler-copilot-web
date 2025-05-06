<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import ModelCard from './components/ModelCard.vue';
import lightNull from '@/assets/svgs/light_null.svg';
import DarkNull from '@/assets/svgs/dark_null.svg';
import { ElEmpty, ElMessage } from 'element-plus';
import AddModel, { ModelProvider } from './components/AddModel.vue';
import i18n from '@/i18n';
import { api } from '@/apis';

interface Model {
  modelId: string;
  icon: string;
  description: string;
  name: string;
}

const { t } = i18n.global;

const models = ref<Model[]>([]);

const modelProviders = ref<ModelProvider[]>([]);

const isAddModelVisible = ref(false);

async function onModelDel(modelId: string) {
  const [err, _] = await api.deleteModel(modelId);
  if (err) ElMessage.error(err.message);
  else ElMessage.success('Success');
}
const dialogTitle = ref();

const toBeEditedModel = ref<Model>();
function onModelEdit(model: Model) {
  dialogTitle.value = t(`common.edit`, { name: t('settings.model') });
  toBeEditedModel.value = model;
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
    models.value = res.result.models;
  }
}

async function queryModelProviders() {
  const [, res] = await api.getModelProviderList();
  if (res) {
    modelProviders.value = res.result.providers;
  }
}

const selectedProvider = ref<ModelProvider>();

watch(
  () => [isAddModelVisible.value],
  () => {
    if (!isAddModelVisible.value) {
      selectedProvider.value = undefined;
      toBeEditedModel.value = undefined;
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
        :name="item.name"
        :icon="item.icon"
        size="small"
      >
        <template #headerRight>
          <div class="added-model__operate">
            <a @click="onModelEdit(item)">{{ t('common.edit') }}</a>
            <a @click="onModelDel(item.modelId)">{{ t('common.delete') }}</a>
          </div>
        </template>
      </ModelCard>
    </div>
    <ElEmpty v-else :image="lightNull" :description="t('common.null')" />

    <p class="model-label">{{ t('settings.model_provider') }}</p>
    <div class="model-provider" v-if="modelProviders.length">
      <ModelCard
        v-for="item in modelProviders"
        :name="item.name"
        :icon="item.icon"
        :description="item.description"
      >
        <template #cardFooter>
          <div class="model-provider-footer">
            <a @click="onAddModel(item)">{{ t('common.add') }}</a>
          </div>
        </template>
      </ModelCard>
    </div>
    <ElEmpty v-else :image="lightNull" :description="t('common.null')" />
  </div>

  <AddModel
    v-model:visible="isAddModelVisible"
    type="add"
    :title="dialogTitle"
    :default="toBeEditedModel"
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
  }

  .added-model {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    min-height: 210px;

    &__operate {
      display: flex;
      gap: 8px;
      color: rgb(99, 149, 253);
      font-size: 12px;
      line-height: 16px;
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
