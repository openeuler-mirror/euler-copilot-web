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
  deletable: {
    type: Boolean,
    required: false,
  },
  position: {
    type: Object,
    required: false,
  },
  mark: {
    type: String,
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
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="nodeSaEBorder">
    <Handle :type="props.data.target" :position="Position[props.data.nodePosition]" :connectable-end="true"></Handle>
    <div class="outHandleRing outRingLeft"></div>
    <div class="outHandleRing outRingRight"></div>
    <div class="nodeShadow"></div>
    <div class="nodeSaEBorderBox">
      <img v-if="props.data.name === '开始'" src="@/assets/images/flow_start.svg" alt="">
      <img v-else="props.data.name === '结束'" src="@/assets/images/flow_end.svg" alt="">
    </div>
  </div>
  <div class="saEText">{{ props.data.name }}</div>
</template>

<style lang="scss">
.vue-flow__node {
  min-width: unset !important;
  padding: 0;
  margin-top: -4px;
  .nodeSaEBorderBox {
    div {
      text-align: center;
    }
    .desc {
      color: var(--o-text-color-tertiary);
    }
    &:hover {
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
    }
    img {
      width: 100%;
      height: 100%;
    }
  }
  .saEText {
    color: var(--o-text-color-primary);
    height: 24px;
    text-align: center;
    margin-top: 18px;
  }
}

.vue-flow__node:has(.default){
  margin-top: 0px;
}

.nodeSaEBorder {
  width: 56px;
  height: 56px;
  background: var(--o-bg-color-base);
  display: flex;
  align-items: center;
  border-radius: 8px;
  justify-content: center;
  position: relative;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.1);
  transform: rotate(45deg);

  .outHandleRing {
    position: absolute;
    display: block;
    width: 24px;
    height: 24px;
    background: #fff;
    border-radius: 50%;
    top: 50%;
    z-index: -1;
  }
  .outRingLeft {
    display: none;
    left: -12px;
    margin-top: -12px;
  }
  .outRingRight {
    display: none;
    right: -12px;
    margin-top: -12px;
  }
  .nodeSaEBorderBox {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #5ab3ff;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(127.6deg, rgba(109, 117, 250, 0.15) 8.685%, rgba(90, 179, 255, 0.15) 98.985%);
    * {
      transform: rotate(-45deg);
    }
  }
  &:hover {
    border: 4px solid rgba(99, 149, 253, 0.3);
    box-shadow: 0px 0px 0px 8px rgba(99, 149, 253, 0.1);
    .vue-flow__handle-right {
      right: -8px;
      width: 24px;
      height: 24px;
      right: -12px;
      margin-top: -12px;
      transform: rotate(45deg);
      border: 4px solid rgba(99, 149, 253, 0.3);
      z-index: -1;
      border-bottom: 4px solid transparent;
      &::after {
        border: 4px solid rgba(99, 149, 253, 0.3);
        background: rgba(99, 149, 253);
        background-clip: content-box;
      }
    }
    .vue-flow__handle-left {
      right: -8px;
      width: 24px;
      height: 24px;
      left: -12px;
      margin-top: -12px;
      transform: rotate(45deg);
      border: 4px solid rgba(99, 149, 253, 0.3);
      z-index: -1;
      border-top: 4px solid transparent;
      &::after {
        border: 4px solid rgba(99, 149, 253, 0.3);
        background: rgba(99, 149, 253);
        background-clip: content-box;
      }
    }
    .outRingRight {
      display: none;
      box-shadow: 0px 0px 0px 8px rgba(99, 149, 253, 0.1);
      background-clip: content-box;
    }
  }

  .vue-flow__handle-right {
    top: 0;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(253, 254, 255);
    display: flex;
    right: 4px;
    margin-top: 4px;
    align-items: center;
    justify-content: center;
  }

  .vue-flow__handle-right::after {
    content: '';
    width: 12px;
    height: 12px;
    border: 4px solid rgb(223, 229, 239);
    border-radius: 50%;
    background: rgb(141, 152, 170);
  }
  .vue-flow__handle-left {
    top: 100%;
    width: 16px;
    height: 16px;
    left: 4px;
    margin-top: -4px;
    border-radius: 50%;
    background: rgb(253, 254, 255);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vue-flow__handle-left::after {
    content: '';
    width: 12px;
    height: 12px;
    border: 4px solid rgb(223, 229, 239);
    border-radius: 50%;
    background: rgb(141, 152, 170);
  }
}
</style>
