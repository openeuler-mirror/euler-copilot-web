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
  mark: {
    type: String,
    required: false,
  },
});
const emits = defineEmits(['delNode', 'editYamlDrawer']);

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

const delNode = id => {
  emits('delNode', id);
};

// 编辑yaml
const editYaml = id => {
  emits('editYamlDrawer', id);
};
</script>

<template>
  <div class="customNodeStyle" :class="curStatus">
    <Handle type="target" :position="Position.Left"></Handle>
    <div class="outHandleRing outRingLeft"></div>
    <div class="delOverShadow leftBox"></div>
    <div class="nodeBox">
      <div class="title" v-if="props.data.label">
        <div class="iconStyle"></div>
        <div class="label">{{ props.data.label }}</div>
        <div class="moreTip">
          <el-popover placement="right" trigger="hover" popper-class="nodeDealPopper">
            <template #reference>···</template>
            <el-button text class="dealItem" @click="editYaml(props.id)">编辑</el-button>
            <el-button text class="dealItem" @click="delNode(props.id)">删除</el-button>
          </el-popover>
        </div>
      </div>
      <div class="desc" v-if="props.data.desc">{{ props.data.desc }}</div>
    </div>
    <Handle type="source" :position="Position.Right"></Handle>
    <div class="delOverShadow rightBox"></div>
    <div class="outHandleRing outRingRight"></div>
  </div>
</template>

<style lang="scss">
.vue-flow__node {
  min-width: 200px;
  padding: 0px;
  margin-top: -4px;
  .customNodeStyle {
    width: 328px;
    height: fit-content;
    border-radius: 4px;
    border: 4px solid transparent;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.1);
    background-color: var(--o-bg-color-base);
    position: relative;
    .nodeBox {
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      .title {
        display: flex;
        height: 24px;
        font-size: 16px;
        color: var(--o-text-color-primary);
        gap: 8px;
        .iconStyle {
          width: 24px;
          height: 24px;
          background: linear-gradient(120deg, rgba(109, 117, 250, 0.15), rgba(90, 179, 255, 0.15));
        }
        .label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .moreTip {
          margin-left: auto;
          width: 24px;
          &:hover {
            color: #6395fd;
          }
        }
      }
      .desc {
        font-size: 12px;
        color: var(--o-text-color-tertiary);
      }
    }
    .vue-flow__handle-right {
      top: 50%;
      right: 0px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--o-bg-color-base);
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      z-index: 2;
    }

    .vue-flow__handle-right::after {
      content: '';
      width: 12px;
      height: 12px;
      border: 3px solid rgb(223, 229, 239);
      border-radius: 50%;
      background: rgb(141, 152, 170);
    }
    .vue-flow__handle-left {
      top: 50%;
      left: 0px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--o-bg-color-base);
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      z-index: 2;
    }

    .vue-flow__handle-left::after {
      content: '';
      width: 12px;
      height: 12px;
      border: 3px solid rgb(223, 229, 239);
      border-radius: 50%;
      background: rgb(141, 152, 170);
    }
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
    .delOverShadow {
      width: 8px;
      height: 40px;
      position: absolute;
      background-color: transparent;
      top: 20px;
      z-index: 1;
    }
    .leftBox {
      left: -12px;
    }
    .rightBox {
      right: -12px;
    }
    &:hover {
      border: 4px solid rgba(99, 149, 253, 0.3);
      box-shadow: 0px 0px 0px 8px rgba(99, 149, 253, 0.1);
      .vue-flow__handle-left {
        width: 24px;
        height: 24px;
        left: -12px;
        margin-top: -12px;
        transform: rotate(-45deg);
        border: 4px solid rgba(99, 149, 253, 0.3);
        border-right: 4px solid transparent;
        border-bottom: 4px solid transparent;
        &::after {
          border: 3px solid rgba(99, 149, 253, 0.3);
          background: rgba(99, 149, 253);
          background-clip: content-box;
        }
      }
      .vue-flow__handle-right {
        right: -8px;
        width: 24px;
        height: 24px;
        right: -12px;
        margin-top: -12px;
        transform: rotate(45deg);
        border: 4px solid rgba(99, 149, 253, 0.3);
        border-left: 4px solid transparent;
        border-bottom: 4px solid transparent;
        &::after {
          border: 3px solid rgba(99, 149, 253, 0.3);
          background: rgba(99, 149, 253);
          background-clip: content-box;
        }
      }
      .outRingLeft {
        display: block;
        box-shadow: 0px 0px 0px 8px rgba(99, 149, 253, 0.1);
        background-clip: content-box;
      }
      .outRingRight {
        display: block;
        box-shadow: 0px 0px 0px 8px rgba(99, 149, 253, 0.1);
        background-clip: content-box;
      }
      .leftBox {
        background-color: var(--flow-node-default-over_color);
      }
      .rightBox {
        background-color: var(--flow-node-default-over_color);
      }
    }
  }

  .customNodeStyle.success {
    border: 4px solid rgba(36, 171, 54, 0.3);
    .vue-flow__handle-left {
      transform: rotate(-45deg);
      width: 24px;
      height: 24px;
      left: -12px;
      margin-top: -12px;
      border: 4px solid rgba(36, 171, 54, 0.3);
      border-right: 4px solid transparent;
      border-bottom: 4px solid transparent;
      &::after {
        border: 3px solid rgb(36, 171, 54, 0.3);
        background: rgb(36, 171, 54);
        background-clip: content-box;
      }
    }
    .vue-flow__handle-right {
      width: 24px;
      height: 24px;
      right: -12px;
      margin-top: -12px;
      transform: rotate(45deg);
      border: 4px solid rgba(36, 171, 54, 0.3);
      border-left: 4px solid transparent;
      border-bottom: 4px solid transparent;
      &::after {
        border: 3px solid rgb(36, 171, 54, 0.3);
        background: rgb(36, 171, 54);
        background-clip: content-box;
      }
    }
    &:hover {
      box-shadow: 0px 0px 0px 8px rgba(36, 171, 54, 0.1);
      .outRingLeft {
        box-shadow: 0px 0px 0px 8px rgba(36, 171, 54, 0.1);
      }
      .outRingRight {
        box-shadow: 0px 0px 0px 8px rgba(36, 171, 54, 0.1);
      }
      .leftBox {
        background-color: var(--flow-node-success-over_color);
      }
      .rightBox {
        background-color: var(--flow-node-success-over_color);
      }
    }
  }

  .customNodeStyle.error {
    border: 4px solid rgba(227, 32, 32, 0.3);
    .vue-flow__handle-left {
      transform: rotate(-45deg);
      width: 24px;
      height: 24px;
      left: -12px;
      margin-top: -12px;
      border: 4px solid rgba(227, 32, 32, 0.3);
      border-right: 4px solid transparent;
      border-bottom: 4px solid transparent;
      &::after {
        border: 3px solid rgb(227, 32, 32, 0.3);
        background: rgb(227, 32, 32);
        background-clip: content-box;
      }
    }
    .vue-flow__handle-right {
      width: 24px;
      height: 24px;
      right: -12px;
      margin-top: -12px;
      transform: rotate(45deg);
      border: 4px solid rgba(227, 32, 32, 0.3);
      border-left: 4px solid transparent;
      border-bottom: 4px solid transparent;
      &::after {
        border: 3px solid rgb(227, 32, 32, 0.3);
        background: rgb(227, 32, 32);
        background-clip: content-box;
      }
    }
    .leftBox {
      background-color: transparent;
    }
    .rightBox {
      background-color: transparent;
    }
    &:hover {
      box-shadow: 0px 0px 0px 8px rgba(227, 32, 32, 0.1);
      .outRingLeft {
        box-shadow: 0px 0px 0px 8px rgba(227, 32, 32, 0.1);
      }
      .outRingRight {
        box-shadow: 0px 0px 0px 8px rgba(227, 32, 32, 0.1);
      }
      .leftBox {
        background-color: var(--flow-node-error-over_color);
      }
      .rightBox {
        background-color: var(--flow-node-error-over_color);
      }
    }
  }
}
.vue-flow__node:has(.default) {
  margin-top: 0px;
}
.nodeDealPopper {
  width: 64px !important;
  min-width: 64px !important;
  height: 72px;
  padding: 4px 0px !important;
  border-radius: 4px;
  .dealItem {
    display: block;
    width: 100%;
    height: 32px;
    line-height: 32px;
    text-align: center;
    margin-left: 0px;
    color: var(--o-text-color-secondary);
    &:hover {
      span {
        color: var(--o-color-white) !important;
      }
      background-color: var(--o-color-primary-secondary) !important;
    }
  }
  &:hover {
    border: 1px solid var(--o-color-primary-secondary) !important;
  }
}
</style>
