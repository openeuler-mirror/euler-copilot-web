<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, onMounted, watch } from 'vue';
import { BranchSourceIdType } from '../types';
import NodeMirrorText from '../codeMirror/nodeMirrorText.vue';
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
const emits = defineEmits(['delNode', 'editYamlDrawer']);

const statusList = ref(['running', 'success', 'error']);

const branchIdList = ref([]);

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
    if (props.data?.parameters?.input_parameters?.choices) {
      branchIdList.value = props.data?.parameters?.input_parameters?.choices.map(item => item?.branchId);
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
    <div class="delOverShadow leftNodeBox"></div>
    <div class="nodeBox">
      <div class="title" v-if="props.data.name">
        <div class="iconStyle"></div>
        <div class="label">{{ props.data.name }}</div>
        <div class="moreTip">
          <el-popover placement="right" trigger="hover" popper-class="nodeDealPopper">
            <template #reference>···</template>
            <el-button text class="dealItem" @click="editYaml(props.data.name, props.data.parameters)">编辑</el-button>
            <el-button text class="dealItem" @click="delNode(props.id)">删除</el-button>
          </el-popover>
        </div>
      </div>
      <div class="desc" v-if="props.data.description">{{ props.data.description }}</div>
      <div class="branchDesc" v-if="props.data.parameters?.input_parameters?.choices">
        <div class="branchItem" v-for="(item, index) in props.data.parameters.input_parameters.choices" :key="index">
          {{ item.description }}

          <Handle class="souceFirstHandle" :id="branchIdList[index]" type="source" :position="Position.Right"></Handle>
          <div class="delOverShadow rightBox" style="top: 0%"></div>
          <div class="outHandleRing outRingRight" style="top: 30%"></div>
        </div>
      </div>
    </div>
    <!-- 调试时出现-暂时隐藏 -->
    <NodeMirrorText style="display: none"></NodeMirrorText>
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
    // 分支样式
    .branchDesc {
      font-size: 12px;
      .branchItem {
        position: relative;
        margin-bottom: 8px;
        .vue-flow__handle-right {
          right: -18px;
        }
        &:last-child {
          margin-bottom: 0px;
        }
      }
    }
    &:hover {
      .branchItem {
        .vue-flow__handle-right {
          right: -30px;
        }
        .rightBox {
          display: none;
        }
      }
    }
  }
}
</style>
