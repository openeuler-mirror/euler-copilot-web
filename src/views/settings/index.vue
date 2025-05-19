<script lang="ts" setup>
import { ref } from 'vue';
import Model from './Model.vue';
import ApiKey from './ApiKey.vue';
import type { TabsPaneContext } from 'element-plus';

const activeName = ref('model');

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event);
};
</script>
<template>
  <div class="settings">
    <div class="settings-container">
      <p class="settings-label">{{ $t('settings.setting') }}</p>
      <el-tabs
        v-model="activeName"
        class="settings-tabs"
        @tab-click="handleClick"
      >
        <el-tab-pane
          :label="$t('settings.model_setting')"
          name="model"
          :lazy="true"
        >
          <Model />
        </el-tab-pane>
        <el-tab-pane
          :label="$t('settings.api_key_management')"
          name="api_key"
          :lazy="true"
        >
          <ApiKey />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  padding: 24px;
  height: 100%;

  &-label {
    font-size: 16px;
    line-height: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--o-text-color-primary);
  }

  &-container {
    height: 100%;
    background-color: var(--o-bg-color-base);
    border-radius: 8px;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
}
</style>

<style>
.settings-tabs {
  --o-tabs-font-size: 14px;
  --o-tabs-item-padding: 5px 16px 0 5px;
  --o-tabs-line-height: 32px;
  --o-tabs-color_active: rgb(99, 149, 253);
  flex: 1;

  .el-tabs__content {
    padding: 16px 0;
    height: 100%;
    .el-tab-pane {
      height: 100%;
    }
  }
}
</style>
