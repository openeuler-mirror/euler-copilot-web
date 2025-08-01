<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, watch } from 'vue';
import { getSrcIcon, opertionListMap } from '../types';
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
  },
});
const emits = defineEmits(['delNode', 'editYamlDrawer', 'updateConnectHandle']);

const statusList = ref(['running', 'success', 'error']);

const branchIdList = ref([]);

// 当前handle是否连接中[分别是target和source]
const handleTargetConnecting = ref(false);
const handleSourceConnecting = ref(false);

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
  () => props.data?.parameters?.input_parameters?.choices,
  ()=>{
    console.log(props.data?.parameters?.input_parameters?.choices)

  },
  {
    immediate: true,
    deep: true,
  }
)
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
      branchIdList.value =
        props.data?.parameters?.input_parameters?.choices.map(
          (item) => item?.branchId,
        );
    }
    // 默认的输入赋值
    inputAndOutput.value.input_parameters =
      props.data?.parameters?.input_parameters || {};
    // 判断是否有调试的输入输出，有调试的输入输出，需要将其显示/否则显示默认的输出
    if (props.data.content?.type === 'input') {
      inputAndOutput.value.input_parameters = props.data.content.params;
    } else if (props.data.content?.type === 'output') {
      inputAndOutput.value.output_parameters = props.data.content.params;
    } else {
      inputAndOutput.value.input_parameters =
        props.data?.parameters?.input_parameters || {};
      inputAndOutput.value.output_parameters =
        props.data?.parameters?.output_parameters || {};
    }
  },
  { deep: true, immediate: true },
);

const delNode = (id) => {
  emits('delNode', id);
};

// 编辑yaml
const editYaml = (nodeName, nodeDesc, yamlCode, nodeId) => {
  emits('editYamlDrawer', nodeName, nodeDesc, yamlCode, props.id, nodeId);
};

// 设置当前正在连接[这里是使连接过程中，handle节点高亮]
const setConnectStatus = (type, sourceIndex?) => {
  if (type === 'source') {
    handleSourceConnecting.value = true;
    // 存储当前活动的连接点索引
    const sourceHandleId = sourceIndex !== undefined ? `source_${sourceIndex}` : 'source_default';
    // 更新当前节点handle连接状态，并传递正确的sourceHandle ID
    emits('updateConnectHandle', props.id, sourceHandleId);
  } else {
    handleTargetConnecting.value = true;
    // 更新当前节点handle连接状态
    emits('updateConnectHandle', props.id);
  }
};

// 计算每个连接点的样式，使其与choiceContent对齐
const getHandleStyle = (index, total) => {
  // 如果只有一个连接点，居中显示
  if (total === 1) {
    return { top: '50%' };
  }
  const spacing = 100 / (total + 1); // 平均分配空间
  const position = spacing * (index + 1); // 计算每个连接点的位置
  return { top: `${position}% ` };
};
</script>

<template>
  <div class="customNodeStyle" :class="curStatus">
    <Handle type="target" :position="Position.Left"></Handle>
    <div class="nodeBox">
      <div class="title" v-if="props.data.name">
        <img
            class="iconStyle"
            v-if="props.data.nodeId"
            :src="getSrcIcon(props.data)"
          />
          <el-icon v-else class="warnTiangleIcon">
            <WarnTriangleFilled />
          </el-icon>
        <div class="label">{{ props.data.name }}</div>
        <div class="moreTip" :class="{ notAllow: props.disabled }">
          <el-popover
            :disabled="props.disabled"
            placement="bottom-end"
            trigger="hover"
            popper-class="nodeDealPopper"
          >
            <template #reference>···</template>
            <el-button
              text
              class="dealItem"
              @click="
                editYaml(
                  props.data.name,
                  props.data.description,
                  props.data.parameters,
                  props.data.nodeId
                )
              "
            >
              {{ $t('semantic.edit') }}
            </el-button>
            <el-button text class="dealItem" @click="delNode(props.id)">
              {{ $t('semantic.interface_delete') }}
            </el-button>
          </el-popover>
        </div>
      </div>
      <div class="choiceNode">
        <div class="choiceContent" v-for="(item, index) in [...props.data.parameters?.input_parameters?.choices]?.reverse()" :key="index">   
          <div class="choiceLabel">
            <div v-if="item.is_default" >
              否则
            </div>
            <div v-else>
              <div v-if="index === 0">
                如果
              </div>
              <div v-else>
                否则如果
              </div>
            </div>
          </div>
          <div class="choice">
            <div v-for="(condition, cIndex) in item.conditions" :key="cIndex" class="choiceCondition">
              <el-tooltip :content="condition.left.value" placement="top">
                <div class="choiceLeft" v-if="condition.left.value"> {{ condition.left.value }}</div>
              </el-tooltip>
              <span class="choiceOperate" v-if="condition.operate">{{ opertionListMap.get(condition.operate)?.str || opertionListMap.get(condition.operate)?.label }}</span>
              <el-tooltip :content="condition.right.value" placement="top">
                <div class="choiceRight" v-if="condition.right.value">{{ condition.right.value }}</div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Handle
        v-for="(choice, index) in [...props.data.parameters?.input_parameters.choices].reverse()"
        :key="choice.branch_id + index"
        :id="choice.branch_id"
        type="source"
        :position="Position.Right"
        @mousedown="setConnectStatus('source', choice.branch_id)"
        :class="{ isConnecting: handleSourceConnecting }"
        :connectable="props.data?.isConnectSource"
        :style="getHandleStyle(index, props.data.parameters?.input_parameters.choices.length)"
      ></Handle>
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
