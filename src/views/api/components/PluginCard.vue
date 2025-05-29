<script lang="ts" setup>
import TextMoreTootip from '@/components/textMoreTootip/index.vue';
import DefaultIcon from '@/assets/svgs/defaultIcon.webp';

interface CardInfo {
  name: string;
  description: string;
  icon?: string;
}
const props = defineProps<CardInfo>();
</script>
<template>
  <div class="plugin-card">
    <div class="plugin-card-icon">
      <el-icon class="menu-icon">
        <img class="create-button__icon" :src="icon || DefaultIcon" />
      </el-icon>
    </div>
    <div class="plugin-card-content">
      <div class="plugin-card-content__top">
        <div class="title">
          {{ name }}
        </div>
        <slot name="topRight"></slot>
      </div>
      <div class="plugin-card-content__desc">
        <TextMoreTootip :value="description" :row="2" />
      </div>
    </div>
  </div>
  <slot name="footer"></slot>
</template>
<style lang="scss" scoped>
.plugin-card {
  display: flex;
  .plugin-card-icon {
    margin-right: 16px;
    display: flex;
    align-items: start;
    .menu-icon {
      width: 48px;
      height: 48px;
      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }
    }
  }

  .plugin-card-content {
    cursor: pointer;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    &__top {
      display: flex;
      justify-content: space-between;
      .title {
        color: var(--o-text-color-primary);
        font-size: 16px;
        line-height: 24px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        width: 80%;
      }
    }
  }

  .no-click {
    cursor: not-allowed;
  }
  .plugin-card-content__desc {
    font-size: 14px;
    line-height: 22px;
    height: 44px;
    .vue-text {
      cursor: pointer !important;
      color: var(--o-api-description);
    }
  }
}
</style>
