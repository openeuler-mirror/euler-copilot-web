<script lang="ts" setup>
import { computed, CSSProperties, ref, onMounted, nextTick } from 'vue';

interface ModelCard {
  name: string;
  icon: string;
  /**
   * small | medium | large
   * @default medium
   * @type string
   * @description small: 64px, medium: 144px, large: 256px
   */
  size?: 'small' | 'medium' | 'large';
  description?: string;
}

const props = withDefaults(defineProps<ModelCard>(), {
  size: 'medium',
});

const nameRef = ref<HTMLElement>();
const isNameOverflow = ref(false);

const cardStyles = computed<CSSProperties>(() => {
  return {
    height:
      props.size === 'small'
        ? '64px'
        : props.size === 'medium'
          ? '144px'
          : '256px',
  };
});

const checkNameOverflow = () => {
  if (nameRef.value) {
    isNameOverflow.value = nameRef.value.scrollWidth > nameRef.value.clientWidth;
  }
};

onMounted(() => {
  nextTick(() => {
    checkNameOverflow();
  });
});
</script>
<template>
  <div class="model-card" :style="cardStyles">
    <div class="card-header">
      <div class="card-header__title">
        <div class="icon">
          <img :src="icon" alt="" />
        </div>
        <el-tooltip :content="name" placement="top" :disabled="!isNameOverflow">
          <span class="name" ref="nameRef">{{ name }}</span>
        </el-tooltip>
      </div>
      <div>
        <slot name="headerRight"></slot>
      </div>
    </div>

    <div class="card-description">
      {{ description }}
    </div>

    <div class="card-footer">
      <slot name="cardFooter"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.model-card {
  width: 100%;
  border-radius: 8px;
  padding: 16px;
  background-color: var(--el-collapse-header-bg);

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    &__title {
      display: flex;
      align-items: center;
      color: var(--o-text-color-primary);
      .icon {
        width: 30px;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        img {
          height: 100%;
          display: flex;
          justify-content: center;
          align-self: center;
        }
      }
      .name {
        font-size: 16px;
        line-height: 24px;
        font-weight: 700;
        margin-left: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }
    }
  }

  .card-description {
    height: 44px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
    line-height: 22px;
    font-size: 14px;
    color: var(--o-text-color-secondary);
    margin-top: 5px;
  }

  .card-footer {
    margin-top: 16px;
  }
}
</style>
