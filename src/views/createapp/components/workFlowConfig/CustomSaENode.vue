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
const emits = defineEmits(['updateConnectHandle']);

const statusList = ref(['running', 'success', 'error']);

const curStatus = ref('');

// 当前handle是否连接中[分别是target和source]
const handleTargetConnecting = ref(false);
const handleSourceConnecting = ref(false);

// 设置当前正在连接
const setConnectStatus = (type) => {
  if (type === 'source') {
    handleSourceConnecting.value = true;
  } else {
    handleTargetConnecting.value = true;
  }
  // 更新当前节点handle连接状态
  emits('updateConnectHandle', props.id);
};

watch(
  () => props.data,
  () => {
    const isInclude = statusList.value.includes(props.data?.status);
    if (!isInclude) {
      curStatus.value = 'default';
    } else {
      curStatus.value = props.data?.status;
    }
    handleTargetConnecting.value = false;
    handleSourceConnecting.value = false;
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="customStartAndEndNode">
    <div class="customNodeStyle nodeSaEBorder" :class="curStatus">
      <Handle
        :class="{ isConnecting: handleTargetConnecting }"
        :type="props.data.target"
        @mousedown="setConnectStatus('target')"
        :position="Position[props.data.nodePosition]"
        :connectable-end="true"
      ></Handle>
      <div class="nodeSaEBorderBox">
        <div
          v-if="props.data.name === '开始' || props.data.name === 'start'"
          class="saEIcon startIcon"
        ></div>
        <div
          v-else-if="props.data.name === '结束' || props.data.name === 'end'"
          class="saEIcon endIcon"
        ></div>
        <div class="saEText"  v-if="props.data.name === '开始'">{{ $t('main.start') }}</div>
        <div class="saEText"  v-else-if="props.data.name === '结束'">{{ $t('main.end') }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.nodeSaEBorder {
  width: 96px !important;
  border: 2px solid transparent;
  min-height: 56px;
  max-height: 60px;

  background: var(--flow-bg-color);
  border-radius: 8px;
  background-clip: padding-box;

  box-sizing: border-box;
  border-radius: 10px;
  .vue-flow__handle {
    right: 0px;
  }
  .nodeSaEBorderBox {
    padding: 16px;
    background: var(--flow-startEnd-bg);
    display: flex;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    align-items: center;
    justify-content: space-between;
    .img {
      width: 24px;
      height: 24px;
    }
    .startIcon {
      background: url('@/assets/svgs/flowStartIcon.svg') 100% 100% no-repeat;
    }
    .endIcon {
      background: url('@/assets/svgs/flowEndIcon.svg') 100% 100% no-repeat;
    }
    .saEIcon {
      width: 24px;
      height: 24px;
    }
    .saEText {
      font-size: 14px;
      color: var(--o-text-color-primary);
    }
  }
}
.nodeSaEBorder.success {
  .vue-flow__handle {
    margin-top: 0px;
  }
}
</style>
