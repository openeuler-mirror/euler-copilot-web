<template>
  <g class="flowEdge">
    <linearGradient id="success_error">
      <stop offset="0" stop-color="#24ab36" />
      <stop offset="100" stop-color="#e32020" />
    </linearGradient>
    <linearGradient id="error_success">
      <stop offset="0" stop-color="#e32020" />
      <stop offset="100" stop-color="#24ab36" />
    </linearGradient>
    <path
      v-if="status === 'success_error' || status === 'error_success'"
      :d="`M ${targetX - 10} ${targetY - 60}` + path"
      fill="none"
      :stroke="`url(#${status})`"
      stroke-width="2"
      stroke-dasharray="0"
    />
    <path
      v-else
      :d="`M ${targetX - 10} ${targetY - 60}` + path"
      fill="none"
      :stroke="strokeColor[status]"
      stroke-width="2"
      :stroke-dasharray="status === 'running' ? 5 : 0"
    />
    <path
      class="markEnd"
      :transform="transform"
      :d="`M ${targetX} ${targetY - 2} L ${targetX - 5} ${targetY - 10} L ${targetX + 5} ${targetY - 10} Z`"
      :fill="strokeColor[status] || '#c3cedf'"
      stroke="none"
    />
  </g>
</template>
<script setup>
import { getBezierPath, getSmoothStepPath, getSimpleBezierPath } from '@vue-flow/core';
import { computed, watch, ref, onMounted } from 'vue';
const status = ref('default');
const startOffset = ref(0);
const endOffset = ref(100);
// default状态默认第一位，以便于判断包含时正好不包含index为0的default
const connectStatus = ref([
  'defau1lt',
  'running',
  'success',
  'error',
  'success_error',
  'error_success',
  'isConnection',
]);

const strokeColor = ref({
  default: '#c3cedf',
  isConnection: '#6395fd',
  running: '#6395fd', // 目前运行中和连接状态颜色一致，但是运行中为虚线
  success: '#24ab36',
  error: '#e32020',
  success_error: '#e32020', // 成功失败与失败成功都与失败一致，因为两个只针对箭头
  error_success: '#e32020',
});
const props = defineProps({
  id: {
    type: String,
    required: false,
  },
  sourceX: {
    type: Number,
    required: true,
  },
  sourceY: {
    type: Number,
    required: true,
  },
  targetX: {
    type: Number,
    required: true,
  },
  targetY: {
    type: Number,
    required: true,
  },
  sourcePosition: {
    type: String,
    required: true,
  },
  targetPosition: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
  },
  isConnection: {
    type: Boolean,
    required: false,
  },
});
watch(
  () => props.data,
  () => {
    // 更新当前的初始状态-这里为调试时节点状态才有变动，否则起始-目标节点状态都为undefined,无颜色显示
    // 判断当前边是否正在连线中
    if (props?.isConnection) {
      status.value = 'isConnection';
    } else {
      // 非连线过程，则需要判断当前的status
      if (props.data?.targetStatus === 'error') {
        // 如果目标节点为失败，根据起源节点判断边状态
        status.value = props.data?.sourceStatus === 'success' ? 'success_error' : 'error';
      } else if (props.data?.targetStatus === 'success') {
        // 如果目标节点为成功，根据起源节点判断边状态
        status.value = props.data?.sourceStatus === 'success' ? 'success' : 'error_success';
      } else if(props.data?.targetStatus === 'running') {
        // 运行中状态
        status.value = 'running';
      } else {
        // 否则默认展示default状态
        status.value = 'default';
      }
    }
    if (status.value === 'success_error' || status.value === 'error_success') {
      if (props?.targetX < props?.sourceX) {
        if (props.data.sourceStatus === 'success' && props.data.targetStatus === 'error') {
          status.value = 'error_success';
        }
        if (props.data.sourceStatus === 'error' && props.data.targetStatus === 'success') {
          status.value = 'success_error';
        }
      }
    }
  },
  {
    deep: true,
    immediate: true,
  },
);
const path = computed(() => getBezierPath(props)[0]);
const transform = computed(() => getArrowTransform(props));
function getArrowTransform(props) {
  const { targetPosition } = props;
  if (targetPosition === 'top') {
    // 这里调整下箭头向右移动两像素
    return `rotate(0 ${props.targetX + 1} ${props.targetY - 1})`;
  }
  if (targetPosition === 'bottom') {
    return `rotate(180 ${props.targetX + 1} ${props.targetY - 1})`;
  }
  if (targetPosition === 'left') {
    return `rotate(-90 ${props.targetX + 1} ${props.targetY - 1})`;
  }
  if (targetPosition === 'right') {
    return `rotate(90 ${props.targetX + 1} ${props.targetY - 1})`;
  }
}
</script>
<style lang="scss">
.flowEdge {
  &:hover {
    path {
      stroke: #6395fd;
    }
    .markEnd {
      fill: #6395fd;
    }
  }
}
</style>
