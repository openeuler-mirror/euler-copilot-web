<script setup lang="ts">
import './workFlowStyle.scss';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElTooltip } from 'element-plus';
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import CustomEdge from './workFlowConfig/CustomEdge.vue';
import CustomNode from './workFlowConfig/CustomNode.vue';
import CustomSaENode from './workFlowConfig/CustomSaENode.vue';
import useDragAndDrop from './workFlowConfig/useDnD';
import { IconSearch, IconCaretRight } from '@computing/opendesign-icons';

const { t } = useI18n();
const copilotAside = ref<HTMLElement>();
const isCopilotAsideVisible = ref(true);
const apiSearchValue = ref();
const activeNames = ref([1]);
const activeName = ref(1);
function hanleAsideVisible(): void {
  if (!copilotAside.value) return;
  if (isCopilotAsideVisible.value) {
    isCopilotAsideVisible.value = false;
  } else {
    isCopilotAsideVisible.value = true;
  }
}

const { onInit, onNodeDragStop, onConnect, addEdges, updateNode, getNodes, getEdges, removeNodes } = useVueFlow();

const { onDragOver, onDrop, onDragLeave, isDragOver, onDragStart } = useDragAndDrop();
// 这里是初始化的开始结束的节点
const nodes = ref([
  {
    id: '1',
    type: 'custom-start',
    data: {
      label: '开始',
      desc: '',
      nodePosition: 'Right',
      target: 'source',
    },
    position: { x: 100, y: 160 },
  },
  {
    id: '2',
    type: 'custom-end',
    data: {
      label: '结束',
      desc: '',
      nodePosition: 'Left',
      target: 'target',
    },
    position: { x: 600, y: 160 },
  },
]);
// 开始的边默认为空数组【当然回显时应该有值】
const edges = ref([] as any);
// 下方为死数据--之后有接口请将其替换为接口
const nodeStancesList = ref([
  {
    id: '11',
    type: 'custom',
    data: {
      label: '知识库(成功节点)',
      desc: '这里是知识库说明',
      status: 'success',
    },
  },
  {
    id: '12',
    type: 'custom',
    data: {
      label: 'LLM(失败节点)',
      desc: '调用大模型，生成自然语言报告',
      status: 'error',
    },
  },
  {
    id: '13',
    type: 'custom',
    data: {
      label: '条件(正常初始化节点)',
      desc: '条件说明',
    },
  },
]);

onConnect(e => {
  addEdges({
    ...e,
    type: 'custom',
  });
});

// 这里设置/更新节点状态,更新所有-nodes.value = 新节点列表, edges.value = 新连线列表
const setNodeStatus = () => {
  // 通过使用updateNode方法对节点进行更新【包含状态以及位置等】如updateNode('1', { position:{ x: 400, y: 400 } })
  const curNodeList = getNodes.value;
  const curEdgeList = getEdges.value;
  curNodeList.forEach(item => {
    if (item.id) {
      updateNode(item.id, {
        data: { ...item.data, status: 'error' },
      });
    }
  });
};
const handleChange = () => {};
</script>
<template>
  <div class="workFlowContainer" @drop="onDrop">
    <aside class="aside-wrapper" ref="copilotAside">
      <ElTooltip placement="right" :content="isCopilotAsideVisible ? t('history.collapse') : t('history.expand')">
        <div class="trapezoid" @click="hanleAsideVisible" />
      </ElTooltip>

      <transition name="transition-fade">
        <div class="copilot-aside nodes" v-if="isCopilotAsideVisible">
          <div class="apiCenterBox">
            <div class="apiCenterTitle">语义接口中心</div>
            <div class="apiCenterSearch">
              <el-input
                v-model="apiSearchValue"
                class="o-style-search"
                placeholder="搜索"
                :prefix-icon="IconSearch"
                clearable
              ></el-input>
            </div>
            <div class="apiContanter">
              <el-collapse
                v-model="activeName"
                @change="handleChange"
                class="o-hpc-collapse"
                :prefix-icon="IconCaretRight"
              >
                <el-collapse-item title="Consistency" :name="1">
                  <template #title>
                    <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': activeNames.includes(1) }">
                      <IconCaretRight />
                    </el-icon>
                    <span> 系统 </span>
                  </template>
                  <div
                    class="stancesItem"
                    v-for="(item, index) in nodeStancesList"
                    :key="index"
                    :draggable="true"
                    @dragstart="onDragStart($event, 'custom', item.data)"
                  >
                    {{ item.data.label }}
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>
      </transition>
    </aside>
    <div class="workFlowContainerRight">
      <VueFlow
        :nodes="nodes"
        :default-viewport="{ zoom: 1 }"
        :min-zoom="0.5"
        :max-zoom="4"
        class="my-diagram-class"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
      >
        <Background pattern-color="#aaa" :gap="8" />
        <MiniMap />
        <!-- 自定义节点 -->
        <template #node-custom="customNodeProps">
          <CustomNode v-bind="customNodeProps"></CustomNode>
        </template>

        <template #node-custom-start="customNodeStartProps">
          <CustomSaENode v-bind="customNodeStartProps"></CustomSaENode>
        </template>

        <template #node-custom-end="customNodeEndProps">
          <CustomSaENode v-bind="customNodeEndProps"></CustomSaENode>
        </template>

        <!-- 自定义边线 -->
        <template #edge-custom="props">
          <CustomEdge v-bind="props" />
        </template>

        <template #connection-line="props">
          <CustomEdge v-bind="props" />
        </template>
      </VueFlow>
    </div>
  </div>
</template>
<style scoped>
.stancesItem {
  width: 264px;
  height: 32px;
  line-height: 32px;
  background-color: var(--o-bash-bg);
  color: #000;
  margin-bottom: 8px;
  padding-left: 16px;
  border-radius: 4px;
}
</style>
