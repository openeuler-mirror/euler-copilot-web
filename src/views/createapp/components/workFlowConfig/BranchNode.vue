<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, onMounted, watch } from 'vue';
import { BranchSourceIdType } from '../types';
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
const editYaml = (nodeName, yamlCode) => {
  emits('editYamlDrawer', nodeName, yamlCode);
};
</script>

<template>
  <div class="customNodeStyle" :class="curStatus">
    <Handle type="target" :position="Position.Left"></Handle>
    <div class="outHandleRing outRingLeft"></div>
    <div class="delOverShadow leftBox"></div>
    <div class="nodeBox">
      <div class="title" v-if="props.data.name">
        <div class="iconStyle"></div>
        <div class="label">{{ props.data.name }}</div>
        <div class="moreTip">
          <el-popover placement="right" trigger="hover" popper-class="nodeDealPopper">
            <template #reference>···</template>
            <el-button text class="dealItem" @click="editYaml(props.data.name, props.data.parametersTemplate)"
              >编辑</el-button
            >
            <el-button text class="dealItem" @click="delNode(props.id)">删除</el-button>
          </el-popover>
        </div>
      </div>
      <div class="desc" v-if="props.data.description">{{ props.data.description }}</div>
    </div>
    <Handle
      class="souceFirstHandle"
      :connectable="props.data?.isConnectSourceA"
      :id="BranchSourceIdType.SOURCEA"
      type="source"
      :position="Position.Right"
    ></Handle>
    <Handle
      class="souceSecondHandle"
      :connectable="props.data?.isConnectSourceB"
      :id="BranchSourceIdType.SOURCEB"
      type="source"
      :position="Position.Right"
    ></Handle>
    <div class="delOverShadow rightBox" style="top: 0%"></div>
    <div class="delOverShadow rightBox" style="top: 50%"></div>
    <div class="outHandleRing outRingRight" style="top: 30%"></div>
    <div class="outHandleRing outRingRight" style="top: 70%"></div>
  </div>
</template>

<style lang="scss">
.vue-flow__node {
  .customNodeStyle {
    .vue-flow__handle-right.souceFirstHandle {
      top: 30%;
    }
    .vue-flow__handle-right.souceSecondHandle {
      top: 70%;
    }
  }
}
</style>
