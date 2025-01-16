<template>
  <g>
    <!-- path -->
    <path :d="path" fill="none" stroke="#c3cedf" stroke-width="2" />
    <!-- 箭头markEnd -->
    <path
      :transform="transform"
      :d="`M ${targetX} ${targetY + 2} L ${targetX - 5} ${targetY - 10} L ${targetX + 5} ${targetY - 10} Z`"
      fill="#c3cedf"
      stroke="none"
    />
  </g>
</template>

<script setup>
import { getBezierPath, getSmoothStepPath } from '@vue-flow/core';
import { computed } from 'vue';

const props = defineProps({
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
});
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
