<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, onMounted, watch } from 'vue';
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object, // 目前定义的对象中只有label，description属性是有的，后续可能会有展开的情形
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
});

const statusList = ref(['running', 'success', 'error']);

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
  <div class="customStartAndEndNode" :class="curStatus">
    <div class="customNodeStyle nodeSaEBorder">
      <Handle :type="props.data.target" :position="Position[props.data.nodePosition]" :connectable-end="true"></Handle>
      <div class="nodeSaEBorderBox">
        <img v-if="props.data.name === '开始'" src="@/assets/images/flow_start.svg" alt="" />
        <img v-else="props.data.name === '结束'" src="@/assets/images/flow_end.svg" alt="" />
      </div>
      <div class="recoverShadow" :class="props.data.name === '开始' ? 'shadowLeftTop' : 'shadowRightTop'"></div>
      <div class="recoverShadow" :class="props.data.name === '开始' ? 'shadowLeftBottom' : 'shadowRightBottom'"></div>
    </div>
    <div class="saEText">{{ props.data.name }}</div>
    <div class="handleShadow" :class="props.data.name === '开始' ? 'startShadow' : 'endShadow'"></div>
  </div>
</template>

<style lang="scss">
.vue-flow__node-start,
.vue-flow__node-end {
  margin-top: 0px;
  &:has(.default) {
    margin-top: -4px;
  }
  // 默认状态不显示-悬浮时显示
  .handleShadow {
    display: none;
  }
  .recoverShadow {
    display: none;
  }
  .nodeSaEBorder {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    border-radius: 8px;
    justify-content: center;
    background-color: var(--o-bg-color-base);
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.1);
    transform: rotate(45deg);
    border: none;
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
    img {
      width: 100%;
      height: 100%;
    }
    .vue-flow__handle-right {
      top: 0;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      right: 4px;
      margin-top: 4px;
      z-index: -1;
    }
    .vue-flow__handle-left {
      top: 100%;
      left: 4px;
      width: 24px;
      height: 24px;
      margin-top: -4px;
      border-radius: 50%;
      z-index: -1;
    }
  }

  &:hover {
    // 由于开始结束节点多一层nodeSaEBorder结构，因此这里handle样式单独写
    .nodeSaEBorder {
      border: 4px solid rgba(99, 149, 253, 0.3);
      box-shadow: 0px 0px 0px 8px rgba(99, 149, 253, 0.1);
      .vue-flow__handle-right {
        right: -12px;
        margin-top: -12px;
        transform: rotate(45deg);
        border: 4px solid rgba(99, 149, 253, 0.3);
        z-index: -1;
        border-bottom: 4px solid transparent;
      }
      .vue-flow__handle-left {
        left: -12px;
        margin-top: -12px;
        transform: rotate(45deg);
        border: 4px solid rgba(99, 149, 253, 0.3);
        z-index: -1;
        border-top: 4px solid transparent;
      }
    }
    .handleShadow {
      display: block;
      position: absolute;
      top: 16px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      box-shadow: 0px 0px 0px 8px var(--flow-node-default-over-color);
      z-index: -1;
    }
    .startShadow {
      left: 50px;
    }
    .endShadow {
      left: -18px;
    }
    // 悬浮时成功状态样式
    .success {
      .nodeSaEBorder {
        box-shadow: 0px 0px 0px 8px rgba(36, 171, 54, 0.1);
        .recoverShadow {
          background-color: var(--flow-node-success-over-color);
        }
      }
      .handleShadow {
        box-shadow: 0px 0px 0px 8px rgba(36, 171, 54, 0.1);
      }
    }
    // 悬浮时失败状态样式
    .error {
      .nodeSaEBorder {
        box-shadow: 0px 0px 0px 8px rgba(227, 32, 32, 0.1);
        .recoverShadow {
          background-color: var(--flow-node-error-over-color);
        }
      }
      .handleShadow {
        box-shadow: 0px 0px 0px 8px rgba(227, 32, 32, 0.1);
      }
    }
    .recoverShadow {
      display: block;
      position: absolute;
      background-color: var(--flow-node-default-over-color);
      z-index: -2;
    }
    .shadowLeftTop {
      width: 8px;
      height: 18px;
      right: -12px;
      top: 2px;
    }
    .shadowLeftBottom {
      width: 18px;
      height: 8px;
      right: 2px;
      top: -12px;
    }
    .shadowRightTop {
      width: 18px;
      height: 8px;
      left: 2px;
      bottom: -12px;
    }
    .shadowRightBottom {
      width: 8px;
      height: 18px;
      left: -12px;
      bottom: 2px;
    }
  }
  .success {
    .nodeSaEBorder {
      border: 4px solid rgba(36, 171, 54, 0.3);
      .vue-flow__handle-left {
        transform: rotate(-45deg);
        left: -12px;
        margin-top: -12px;
        border: 4px solid rgba(36, 171, 54, 0.3);
        border-right: 4px solid transparent;
      }
      .vue-flow__handle-right {
        right: -12px;
        margin-top: -12px;
        transform: rotate(45deg);
        border: 4px solid rgba(36, 171, 54, 0.3);
        border-bottom: 4px solid transparent;
      }
    }
  }
  .error {
    .nodeSaEBorder {
      border: 4px solid rgba(227, 32, 32, 0.3);
      .vue-flow__handle-left {
        left: -12px;
        margin-top: -12px;
        transform: rotate(-45deg);
        border: 4px solid rgba(227, 32, 32, 0.3);
        border-right: 4px solid transparent;
      }
      .vue-flow__handle-right {
        right: -12px;
        margin-top: -12px;
        transform: rotate(45deg);
        border: 4px solid rgba(227, 32, 32, 0.3);
        border-bottom: 4px solid transparent;
      }
    }
  }
}

.saEText {
  color: var(--o-text-color-primary);
  width: 56px;
  height: 24px;
  text-align: center;
  margin-top: 18px;
}
</style>
