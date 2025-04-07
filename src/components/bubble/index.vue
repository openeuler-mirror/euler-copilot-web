<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';

type Style = Record<'avatar' | 'content', CSSProperties>;

interface BubbleProps {
  avatar?: string;
  content: string;
  loading?: boolean;
  placement?: 'start' | 'end';
  shape?: 'round' | 'corner';
  styles?: Partial<Style>;
}

const props = withDefaults(defineProps<BubbleProps>(), {
  loading: false,
  placement: 'start',
  shape: 'corner',
});
</script>

<template>
  <div class="bubble-wrapper">
    <div
      class="bubble-wrapper-avatar"
      v-if="avatar"
      :style="styles ? styles['avatar'] : ''"
    >
      <img :src="avatar" alt="" />
    </div>
    <div
      class="bubble-wrapper-content"
      :style="styles ? styles['content'] : ''"
    >
      <div>{{ content }}</div>

      <slot name="footer" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bubble-wrapper {
  width: 100%;
  display: flex;
  justify-content: flex-start;

  &-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin-right: 12px;
    flex-shrink: 0;
    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }
  }

  &-content {
    color: var(--o-text-color-primary);
    padding: 12px;
    border-radius: 8px;
    border-top-left-radius: 0px;
    background-color: var(--o-bg-color-base);
    line-height: 24px;
    white-space: pre-wrap;
    word-break: break-all;
    overflow-wrap: break-all;
  }
}
</style>
