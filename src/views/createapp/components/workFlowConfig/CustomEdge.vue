<template>
  <g class="flowEdge" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <linearGradient id="success_error">
      <stop offset="0" stop-color="#24ab36" />
      <stop offset="100" stop-color="#e32020" />
    </linearGradient>
    <linearGradient id="error_success">
      <stop offset="0" stop-color="#e32020" />
      <stop offset="100" stop-color="#24ab36" />
    </linearGradient>
    
    <!-- 主路径 -->
    <path
      v-if="status === 'success_error' || status === 'error_success'"
      :d="`M ${targetX - 10} ${targetY - 60}` + path"
      fill="none"
      :stroke="`url(#${status})`"
      stroke-width="2"
      stroke-dasharray="0"
      class="edge-path"
    />
    <path
      v-else
      :d="`M ${targetX - 10} ${targetY - 60}` + path"
      fill="none"
      :stroke="strokeColor[status]"
      stroke-width="2"
      :stroke-dasharray="status === 'running' ? 5 : 0"
      class="edge-path"
    />
    
    <!-- 不可见的更宽路径，用于更好的悬停检测 -->
    <path
      :d="`M ${targetX - 10} ${targetY - 60}` + path"
      fill="none"
      stroke="transparent"
      stroke-width="20"
      class="edge-interaction"
    />

    <!-- 箭头 -->
    <path
      class="markEnd"
      :transform="transform"
      :d="`M ${targetX} ${targetY - 2} L ${targetX - 5} ${targetY - 10} L ${targetX + 5} ${targetY - 10} Z`"
      :fill="strokeColor[status] || '#c3cedf'"
      stroke="none"
    />
    
    <!-- 插入节点按钮 - 仅在非连接状态且悬停时显示 -->
    <g
      class="insert-node-button"
      :class="{ 'show': !isConnection && isHovered && !disabled }"
      @click="handleInsertNode"
    >
      <!-- 按钮背景圆圈 -->
      <circle
        :cx="midX"
        :cy="midY"
        :r="buttonRadius"
        fill="#6395fd"
        class="button-bg"
        @mouseenter="handleButtonHover"
        @mouseleave="handleButtonLeave"
      />
      <!-- + 图标 -->
      <path
        :d="`M${midX - 4} ${midY}h8M${midX} ${midY - 4}v8`"
        stroke="#ffffff"
        stroke-width="2"
        stroke-linecap="round"
        class="plus-icon"
        :class="{ 'visible': isButtonHovered }"
      />
    </g>
  </g>
</template>
<script setup>
import {
  getBezierPath,
  getSmoothStepPath,
  getSimpleBezierPath,
} from '@vue-flow/core';
import { computed, watch, ref, onMounted } from 'vue';

// 状态管理
const status = ref('default');
const startOffset = ref(0);
const endOffset = ref(100);
const isHovered = ref(false);
const isButtonHovered = ref(false);
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
  disabled: {
    type: Boolean,
    default: false,
  },
});

// 事件定义
const emit = defineEmits(['insertNode']);

// 计算边的中点坐标
const midX = computed(() => {
  return (props.sourceX + props.targetX) / 2;
});

const midY = computed(() => {
  return (props.sourceY + props.targetY) / 2;
});

// 计算按钮半径
const buttonRadius = computed(() => {
  return isButtonHovered.value ? 12 : 6;
});

// 悬停事件处理 - 统一处理所有悬停区域
const handleMouseEnter = () => {
  if (!props.disabled && !props.isConnection) {
    isHovered.value = true;
  }
};

const handleMouseLeave = () => {
  isHovered.value = false;
};

// 按钮区域悬停事件处理
const handleButtonHover = () => {
  if (!props.disabled && !props.isConnection) {
    isButtonHovered.value = true;
  }
};

const handleButtonLeave = () => {
  isButtonHovered.value = false;
};

// 插入节点事件处理
const handleInsertNode = (event) => {
  event.stopPropagation();
  if (props.disabled || props.isConnection) {
    return;
  }
  
  // 发射插入节点事件，传递边的信息和中点坐标
  emit('insertNode', {
    edgeId: props.id,
    midX: midX.value,
    midY: midY.value,
  });
};
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
        status.value =
          props.data?.sourceStatus === 'success' ? 'success_error' : 'error';
      } else if (props.data?.targetStatus === 'success') {
        // 如果目标节点为成功，根据起源节点判断边状态
        status.value =
          props.data?.sourceStatus === 'success' ? 'success' : 'error_success';
      } else if (props.data?.targetStatus === 'running') {
        // 运行中状态
        status.value = 'running';
      } else {
        // 否则默认展示default状态
        status.value = 'default';
      }
    }
    if (status.value === 'success_error' || status.value === 'error_success') {
      if (props?.targetX < props?.sourceX) {
        if (
          props.data.sourceStatus === 'success' &&
          props.data.targetStatus === 'error'
        ) {
          status.value = 'error_success';
        }
        if (
          props.data.sourceStatus === 'error' &&
          props.data.targetStatus === 'success'
        ) {
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
    .edge-path {
      stroke: #6395fd;
    }
    .markEnd {
      fill: #6395fd;
    }
  }
  
  .edge-interaction {
    cursor: pointer;
  }
  
  .insert-node-button {
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    pointer-events: none;
    
    &.show {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    
    .button-bg {
      transition: r 0.2s ease;
    }
    
    .plus-icon {
      opacity: 0;
      transition: opacity 0.2s ease;
      
      &.visible {
        opacity: 1;
      }
    }
  }

}

/* 删除全局动画样式，现在由.show类控制 */

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
