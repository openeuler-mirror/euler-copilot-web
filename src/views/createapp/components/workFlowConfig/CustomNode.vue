<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, onMounted, watch } from 'vue';
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object, // 目前定义的对象中只有label，desc属性是有的，后续可能会有展开的情形
    required: true,
  },
  type: {
    type: String,
    required: false,
  },
  position: {
    type: Object,
    required: false,
  },
});

const statusList = ref(['waiting', 'success', 'error', 'default']);
const curStatus = ref('');

watch(
  () => props.data,
  () => {
    const isInclude = statusList.value.includes(props.data?.status);
    if (!isInclude) {
      curStatus.value = 'default';
    } else {
      curStatus.value = props.data?.status;
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="customNodeStyle" :class="curStatus">
    <Handle type="target" :position="Position.Left" :x="props.position?.x" :y="props.position?.y"></Handle>
    <div class="nodeBox">
      <div class="title" v-if="props.data.label">
        <div class="iconStyle"></div>
        <div class="label">{{ props.data.label }}</div>
      </div>
      <div class="desc" v-if="props.data.desc">{{ props.data.desc }}</div>
    </div>
    <Handle type="source" :position="Position.Right"></Handle>
  </div>
</template>

<style lang="scss">
.vue-flow__node {
  min-width: 200px;
  padding: 0px;
  .customNodeStyle {
    width: 328px;
    height: fit-content;
    border-radius: 4px;
    border: 4px solid transparent;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.1);
    .nodeBox {
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      background-color: var(--o-bg-color-base);
      gap: 8px;
      .title {
        display: flex;
        height: 24px;
        font-size: 16px;
        color: #000;
        gap: 8px;
        .iconStyle {
          width: 24px;
          height: 24px;
          background: linear-gradient(120deg, rgba(109, 117, 250, 0.15), rgba(90, 179, 255, 0.15));
        }
      }
      .desc {
        font-size: 12px;
        color: var(--o-text-color-tertiary);
      }
    }
    &:hover {
      border: 4px solid rgba(122, 165, 255, 0.3);
      .vue-flow__handle-left {
        width: 24px;
        height: 24px;
        left: -8px;
        margin-top: -12px;
        transform: rotate(-45deg);
        border: 4px solid rgba(122, 165, 255, 0.3);
        border-right: 4px solid transparent;
        border-bottom: 4px solid transparent;
        &::after {
          border: 3px solid rgba(122, 165, 255, 0.3);
          background: rgba(122, 165, 255);
          background-clip: content-box;
        }
      }
      .vue-flow__handle-right {
        right: -8px;
        width: 24px;
        height: 24px;
        margin-top: -12px;
        transform: rotate(45deg);
        border: 4px solid rgba(122, 165, 255, 0.3);
        border-left: 4px solid transparent;
        border-bottom: 4px solid transparent;
        &::after {
          border: 3px solid rgba(122, 165, 255, 0.3);
          background: rgba(122, 165, 255);
          background-clip: content-box;
        }
      }
    }
  }

  .customNodeStyle.success {
    border: 4px solid rgba(36, 171, 54, 0.2);
    .vue-flow__handle-left {
      width: 24px;
      height: 24px;
      left: -8px;
      margin-top: -12px;
      transform: rotate(-45deg);
      border: 4px solid rgba(36, 171, 54, 0.2);
      border-right: 4px solid transparent;
      border-bottom: 4px solid transparent;
      &::after {
        border: 3px solid rgb(36, 171, 54, 0.2);
        background: rgb(36, 171, 54);
        background-clip: content-box;
      }
    }
    .vue-flow__handle-right {
      width: 24px;
      height: 24px;
      right: -8px;
      margin-top: -12px;
      transform: rotate(45deg);
      border: 4px solid rgba(36, 171, 54, 0.2);
      border-left: 4px solid transparent;
      border-bottom: 4px solid transparent;
      &::after {
        border: 3px solid rgb(36, 171, 54, 0.2);
        background: rgb(36, 171, 54);
        background-clip: content-box;
      }
    }
    &:hover {
      .vue-flow__handle-left {
        // 需添加阴影
      }
      .vue-flow__handle-right {
        // 需添加阴影
      }
    }
  }

  .customNodeStyle.error {
    border: 4px solid rgba(227, 32, 32, 0.2);
    .vue-flow__handle-left {
      width: 24px;
      height: 24px;
      left: -8px;
      margin-top: -12px;
      transform: rotate(-45deg);
      border: 4px solid rgba(227, 32, 32, 0.2);
      border-right: 4px solid transparent;
      border-bottom: 4px solid transparent;

      &::after {
        border: 3px solid rgba(227, 32, 32, 0.2);
        background: rgba(227, 32, 32);
        background-clip: content-box;
      }
    }
    .vue-flow__handle-right {
      width: 24px;
      height: 24px;
      right: -8px;
      margin-top: -12px;
      transform: rotate(45deg);
      border: 4px solid rgba(227, 32, 32, 0.2);
      border-left: 4px solid transparent;
      border-bottom: 4px solid transparent;

      &::after {
        border: 3px solid rgba(227, 32, 32, 0.2);
        background: rgba(227, 32, 32);
        background-clip: content-box;
      }
    }
  }

  .vue-flow__handle-right {
    top: 50%;
    right: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(253, 254, 255);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vue-flow__handle-right::after {
    content: '';
    width: 10px;
    height: 10px;
    border: 3px solid rgb(223, 229, 239);
    border-radius: 50%;
    background: rgb(141, 152, 170);
  }
  .vue-flow__handle-left {
    top: 50%;
    left: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(253, 254, 255);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vue-flow__handle-left::after {
    content: '';
    width: 10px;
    height: 10px;
    border: 3px solid rgb(223, 229, 239);
    border-radius: 50%;
    background: rgb(141, 152, 170);
  }
}
</style>
