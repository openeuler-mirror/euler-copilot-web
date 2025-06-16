<script setup lang="ts">
import { VNode } from 'vue';
import type { CSSProperties } from 'vue';

type Style = Record<'avatar' | 'content', CSSProperties>;

interface BubbleProps {
  avatar?: string;
  content?: string;
  loading?: boolean;
  placement?: 'start' | 'end';
  date?: string;
  shape?: 'round' | 'corner';
  styles?: Partial<Style>;
  contentRender?: (content: string) => VNode;
}

withDefaults(defineProps<BubbleProps>(), {
  loading: false,
  placement: 'start',
  shape: 'corner',
});
</script>

<template>
  <div class="bubble-wrapper">
    <div class="bubble-wrapper-date" v-if="date">
      <span>{{ date }}</span>
    </div>

    <div class="bubble-container">
      <div
        class="bubble-container-avatar"
        v-if="avatar"
        :style="styles ? styles['avatar'] : ''"
      >
        <img :src="avatar" alt="" />
      </div>
      <div
        class="bubble-container-content"
        :style="styles ? styles['content'] : ''"
      >
        <div class="loading" v-if="loading">
          <img src="@/assets/images/loading.png" alt="" class="loading-icon" />
          <div class="loading-text">openEuler Intelligence 正在生成回答...</div>
        </div>
        <template v-else>
          <slot name="content" v-if="$slots.content" />
          <component
            v-else-if="contentRender"
            :is="contentRender(content || '')"
          />
          <div v-else>
            {{ content }}
          </div>
        </template>

        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bubble-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;

  &-date {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    line-height: 20px;

    span {
      padding: 0 8px;
      border-radius: 12px;
      background-color: var(--o-time-text);
    }
  }

  .bubble-container {
    width: 100%;
    display: flex;

    &-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin-right: 24px;
      flex-shrink: 0;
      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }
    }

    &-content {
      background-color: var(--o-bg-color-base);
      color: var(--o-text-color-primary);
      padding: 14px;
      border-radius: 8px;
      border-top-left-radius: 0px;
      word-break: break-all;

      .loading {
        display: flex;
        background-color: var(--o-bg-color-base);
        border-radius: 8px;
        border-top-left-radius: 0px;

        @keyframes rotate-img {
          from {
            transform: rotate(0);
          }

          to {
            transform: rotate(360deg);
          }
        }

        &-icon {
          animation: rotate-img 1s infinite linear;
        }

        &-text {
          font-size: 16px;
          padding-left: 12px;
          color: var(--o-text-color-primary);
        }
      }
    }
  }
}
</style>
