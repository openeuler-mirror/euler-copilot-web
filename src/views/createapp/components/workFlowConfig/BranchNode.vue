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
  disabled: {
    type: Boolean,
    required: false,
  }
});
const emits = defineEmits(['delNode', 'editYamlDrawer']);

const statusList = ref(['running', 'success', 'error']);

const branchIdList = ref([]);

// 当前节点状态-工作流调试结果-成功/失败/运行中
const curStatus = ref('');

// 当前节点运行耗时
const costTime = ref('');

// 定义传给mirror展示输入输出的存储量
const inputAndOutput = ref({
  input_parameters: {},
  output_parameters: {},
});

watch(
  () => props.data,
  () => {
    const isInclude = statusList.value.includes(props.data?.status);
    // 设置节点的状态-默认以及成功、失败、运行中
    if (!isInclude) {
      curStatus.value = 'default';
    } else {
      curStatus.value = props.data?.status;
    }
    // 节点调试消耗时间【目前只有调试接口返回的节点step.output才有值，其余状态为''不显示】
    costTime.value = props.data?.constTime || '';
    // 这里是分支节点独有的，需要根据接口拖拽节点里的choices决定有几个handle节点
    if (props.data?.parameters?.input_parameters?.choices) {
      branchIdList.value = props.data?.parameters?.input_parameters?.choices.map(
        item => item?.branchId,
      );
    }
    // 默认的输入赋值
    inputAndOutput.value.input_parameters = props.data?.parameters?.input_parameters || {};
    // 判断是否有调试的输入输出，有调试的输入输出，需要将其显示/否则显示默认的输出
    if (props.data.content?.type === 'input') {
      inputAndOutput.value.input_parameters = props.data.content.params;
    } else if (props.data.content?.type === 'output') {
      inputAndOutput.value.output_parameters = props.data.content.params;
    } else {
      inputAndOutput.value.input_parameters = props.data?.parameters?.input_parameters || {};
      inputAndOutput.value.output_parameters = props.data?.parameters?.output_parameters || {};
    }
  },
  { deep: true, immediate: true },
);

const delNode = id => {
  emits('delNode', id);
};

// 编辑yaml
const editYaml = (nodeName, nodeDesc, yamlCode) => {
  emits('editYamlDrawer', nodeName, nodeDesc, yamlCode, props.id);
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
        <div class="moreTip" :class="{'notAllow': props.disabled}">
          <el-popover :disabled="props.disabled" placement="right" trigger="hover" popper-class="nodeDealPopper">
            <template #reference>···</template>
            <el-button text class="dealItem" @click="editYaml(props.data.name, props.data.description, props.data.parameters)">编辑</el-button>
            <el-button text class="dealItem" @click="delNode(props.id)">删除</el-button>
          </el-popover>
        </div>
      </div>
      <div class="desc" v-if="props.data.description">{{ props.data.description }}</div>
      <div class="branchDesc" v-if="props.data?.parameters?.input_parameters?.choices">
        <div
          class="branchItem"
          v-for="(item, index) in props.data?.parameters?.input_parameters?.choices"
          :key="index"
        >
          {{ item.description }}
          <Handle class="souceFirstHandle" :id="branchIdList[index]" type="source" :position="Position.Right"></Handle>
          <div class="delOverShadow rightBox" style="top: 0%"></div>
          <div class="outHandleRing outRingRight" style="top: 30%"></div>
        </div>
      </div>
    </div>
    <!-- 调试时出现-暂时隐藏 -->
    <NodeMirrorText
      v-if="curStatus !== 'default'"
      :status="curStatus"
      :costTime="costTime"
      :inputAndOutput="inputAndOutput"
      style="display: block"
    ></NodeMirrorText>
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
          right: -30px;
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
  .customNodeStyle.default {
    .branchDesc {
      .branchItem {
        .vue-flow__handle-right {
          right: -18px;
        }
      }
    }
    &:hover {
      .branchItem {
        .vue-flow__handle-right {
          right: -30px;
        }
      }
    }
  }
}
</style>
