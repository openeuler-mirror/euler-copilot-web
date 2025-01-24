<template>
  <g :id="'edge' + props.id">
    <linearGradient id="success_success">
      <stop offset="0" stop-color="rgba(36, 171, 54, 0.2)" />
    </linearGradient>
    <linearGradient id="error_error">
      <stop offset="0" stop-color="rgba(227, 32, 32, 0.2)" />
    </linearGradient>
    <linearGradient id="success_error">
      <stop offset="0" stop-color="rgba(36, 171, 54, 0.2)" />
      <stop offset="100" stop-color="rgba(227, 32, 32, 0.2)" />
    </linearGradient>
    <linearGradient id="error_success">
      <stop offset="0" stop-color="rgba(227, 32, 32, 0.2)" />
      <stop offset="100" stop-color="rgba(36, 171, 54, 0.2)" />
    </linearGradient>
    <linearGradient id="success_runing" >
      <stop offset="0" stop-color="rgba(36, 171, 54, 0.2)" />
      <stop offset="100" stop-color="rgba(99, 149, 253, 0.3)" />
    </linearGradient>
    <linearGradient id="connect_runing">
      <stop offset="0" stop-color="rgba(99, 149, 253, 0.3)" />
      <stop offset="100" stop-color="#DFE5EF" />
    </linearGradient>
    <path
      :id="'line' + props.id"
      v-if="props.id && connectStatus.includes(status)"
      :key="pathKey"
      :d="`M  ${targetX } ${targetY - 1}` + path"
      fill="none"
      :stroke="`url(#${status})`"
      stroke-width="4"
    />
    <path v-else :d="path" fill="none" stroke="#c3cedf" stroke-width="4" />
    <!-- 箭头markEnd -->
    <path
      v-if="!connectStatus.includes(status) || !props.id"
      :transform="transform"
      :d="`M ${targetX} ${targetY + 2} L ${targetX - 5} ${targetY - 10} L ${targetX + 5} ${targetY - 10} Z`"
      fill="#c3cedf"
      stroke="none"
    />
  </g>
</template>
<script setup>
import { getBezierPath, getSmoothStepPath } from '@vue-flow/core';
import { computed, watch, ref, onMounted } from 'vue';
const status = ref('default');
const startOffset = ref(0);
const endOffset = ref(100);
// default状态默认第一位，以便于判断包含时正好不包含index为0的default
const connectStatus = ref([
  'defau1lt',
  'success_success',
  'error_error',
  'success_error',
  'error_success',
  'success_runing',
  'connect_runing',
]);
const pathKey = ref(false)
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
});
watch(
  () => props.data,
  () => {
    // 更新当前的初始状态
    status.value = props.data?.sourceStatus + '_' + props.data?.targetStatus;
    // 如果还未生成id，则返回
    if (!props.id) {
      return;
    }
    pathKey.value = !pathKey.key;
    // 否则需要根据当前的起源节点和目的节点的位置，对相应的状态进行修改符合样式
    if (props?.targetX < props?.sourceX) {
      if (props.data.sourceStatus === 'success' && props.data.targetStatus === 'error') {
        status.value = 'error_success';
      }
      if (props.data.sourceStatus === 'error' && props.data.targetStatus === 'success') {
        status.value = 'success_error';
      }
    }
  },
  {
    deep: true,
    immediate: true,
  },
);
const path = computed(() => getSmoothStepPath(props)[0]);
const transform = computed(() => getArrowTransform(props));
function getArrowTransform(props) {
  const { targetPosition } = props;
  if (targetPosition === 'top') {
    return `rotate(0 ${props.targetX} ${props.targetY})`;
  }
  if (targetPosition === 'bottom') {
    return `rotate(180 ${props.targetX} ${props.targetY})`;
  }
  if (targetPosition === 'left') {
    return `rotate(-90 ${props.targetX} ${props.targetY})`;
  }
  if (targetPosition === 'right') {
    return `rotate(90 ${props.targetX} ${props.targetY})`;
  }
}
</script>
