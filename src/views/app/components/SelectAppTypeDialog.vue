<script lang="ts" setup>
import i18n from '@/i18n';
import { ref } from 'vue';

const { t } = i18n.global;

type AppType = 'agent' | 'flow';

defineProps<{
  visible: boolean;
  title?: string;
}>();

const emits = defineEmits<{
  (e: 'update:visible', status: boolean): void;
  (e: 'selectType', type: AppType): void;
}>();

const selectedType = ref<AppType>('agent');
</script>
<template>
  <div class="select-app">
    <el-dialog
      :model-value="visible"
      :title="title"
      align-center
      @close="emits('update:visible', false)"
    >
      <div class="dialog-body">
        <div
          class="agent app-type"
          :class="{ 'app-type__active': selectedType === 'agent' }"
          @click="selectedType = 'agent'"
        >
          <p>{{ $t('app.mcp_app') }}</p>
          <span>{{ $t('app.mcp_app_desc') }}</span>
        </div>
        <div
          class="workflow app-type"
          :class="{ 'app-type__active': selectedType === 'flow' }"
          @click="selectedType = 'flow'"
        >
          <p>{{ $t('app.workflow_app') }}</p>
          <span>{{ $t('app.workflow_app_desc') }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            type="primary"
            class="button"
            @click="emits('selectType', selectedType)"
          >
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
.dialog-footer {
  .button {
    width: 64px;
    height: 24px;
    border-radius: 4px;
  }
}
.select-app {
  :deep(.el-dialog) {
    --o-dialog-width: 544px;
  }

  .dialog-body {
    display: flex;
    gap: 16px;
    color: #000;

    p {
      font-size: 16px;
      font-weight: 700;
    }

    span {
      font-size: 12px;
      font-weight: 400;
      color: rgb(78, 88, 101);
    }

    .agent {
      padding: 0 0 24px 0;
      width: 240px;
      height: 272px;
      background-image: url('@/assets/svgs/agent.svg');
    }

    .workflow {
      padding: 0 0 24px 0;
      width: 240px;
      height: 272px;
      background-image: url('@/assets/svgs/workflow.svg');
    }

    .app-type {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: end;
      gap: 8px;
      cursor: pointer;
      border-radius: 8px;
      box-sizing: border-box;
    }

    .app-type__active {
      outline: 2px solid rgb(99, 149, 253);
    }
  }
}
</style>
