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
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="nodeSaEBorder">
    <Handle :type="props.data.target" :position="Position[props.data.nodePosition]"></Handle>
    <div class="nodeShadow"></div>
    <div class="nodeSaEBorderBox">
      <div v-if="props.data.label">{{ props.data.label }}</div>
      <div class="desc" v-if="props.data.desc">{{ props.data.desc }}</div>
    </div>
  </div>
</template>

<style lang="scss">
.vue-flow__node {
  min-width: unset !important;
  padding: 0;
  .nodeSaEBorderBox {
    div {
      text-align: center;
    }
    .desc {
      color: var(--o-text-color-tertiary);
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
    }
  }
}

.nodeSaEBorder {
  width: 56px;
  height: 56px;
  background: rgb(253, 254, 255);
  display: flex;
  align-items: center;
  border-radius: 8px;
  justify-content: center;
  position: relative;
  box-shadow: 0px 8px 16px 0px rgb(0,0,0,0.1);
  transform: rotate(45deg);
  .nodeSaEBorderBox {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #5ab3ff;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(127.60deg, rgba(109,117,250,0.15) 8.685%,rgba(90,179,255,0.15) 98.985%);
    * {
      transform: rotate(-45deg);
    }
  }

  .vue-flow__handle-right{
    top: 0;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(253,254, 255);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .vue-flow__handle-right::after{
     content: "";
     width: 10px;
     height: 10px;
     border: 3px solid rgb(223, 229, 239);
      border-radius: 50%;
      background: rgb(141, 152, 170);

  }
  .vue-flow__handle-left{
    top: 100%;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(253,254, 255);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vue-flow__handle-left::after{
     content: "";
     width: 10px;
     height: 10px;
     border: 3px solid rgb(223, 229, 239);
      border-radius: 50%;
      background: rgb(141, 152, 170);

  }
}
</style>
