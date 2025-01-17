<script setup lang="ts">
import './workFlowStyle.scss';
import { nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElTooltip } from 'element-plus';
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import CustomEdge from './workFlowConfig/CustomEdge.vue';
import CustomNode from './workFlowConfig/CustomNode.vue';
import CustomControl from './CustomControl.vue';
import CustomSaENode from './workFlowConfig/CustomSaENode.vue';
import useDragAndDrop from './workFlowConfig/useDnD';
import WorkFlowDialog from './workFlowConfig/workFlowDialog.vue';
import { useRunProcess } from './workFlowConfig/useRunProcess';
import { useLayout } from './workFlowConfig/useLayout';
import { IconSearch, IconCaretRight, IconCaretDown, IconPlusCircle } from '@computing/opendesign-icons';
const { t } = useI18n();
const copilotAside = ref<HTMLElement>();
const isCopilotAsideVisible = ref(true);
const apiSearchValue = ref();
const activeNames = ref([1]);
const activeName = ref(1);
const workFlowItem = ref();
const isAddWorkFlow = ref(false);
const editData = ref();
const dialogType = ref('');
const flowZoom = ref(1);
const cancelOnError = ref(true);
function hanleAsideVisible(): void {
  if (!copilotAside.value) return;
  if (isCopilotAsideVisible.value) {
    isCopilotAsideVisible.value = false;
  } else {
    isCopilotAsideVisible.value = true;
  }
}

const { onConnect, addEdges, getNodes, getEdges, findNode, removeNodes, setViewport, getViewport, fitView } =
  useVueFlow();
const { graph, layout } = useLayout();
const { run, stop, reset, isRunning } = useRunProcess({ graph, cancelOnError: cancelOnError.value });

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
  {
    id: '3',
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
const edges = ref([]);
// 下方为死数据--之后有接口请将其替换为接口
const nodeStancesList = ref([
  {
    id: '11',
    type: 'custom',
    mark: 'iiiiii',
    data: {
      label: '知识库(成功节点)',
      desc: '这里是知识库说明',
      status: 'success',
    },
  },
  {
    id: '12',
    type: 'custom',
    mark: 'iiiiii',
    data: {
      label: 'LLM(失败节点)',
      desc: '调用大模型，生成自然语言报告',
      status: 'error',
    },
  },
  {
    id: '13',
    type: 'custom',
    mark: 'iiiiii',
    data: {
      label: '条件(正常初始化节点)',
      desc: '条件说明',
    },
  },
]);

const handleChangeZoom = zoomValue => {
  setViewport({
    zoom: zoomValue,
    x: 0,
    y: 0,
  });
};

onConnect(e => {
  addEdges({
    ...e,
    type: 'custom',
  });
});

const handleChange = () => {};
// 打开新增工作流弹窗
const addWorkFlow = () => {
  // 待增加新增弹窗
  dialogType.value = '新增';
  isAddWorkFlow.value = true;
};
// 关闭工作流弹出
const handleClose = () => {
  isAddWorkFlow.value = false;
};
// 删除节点
const delNode = id => {
  if (id) {
    const node = findNode(id);
    node ? removeNodes(node) : '';
  }
};

const handleZommOnScroll = () => {
  const zoomObj = getViewport();
  flowZoom.value = Number(zoomObj.zoom.toFixed(1));
};

async function layoutGraph(direction) {
  await stop();

  reset(nodes.value);

  nodes.value = layout(nodes.value, edges.value, direction);

  nextTick(() => {
    fitView();
  });
}
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
                    <span>系统</span>
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
        @paneScroll="handleZommOnScroll"
      >
        <Background pattern-color="#aaa" :gap="8" />
        <MiniMap :width="220" mask-color="#f4f6fa" :mask-stroke-width="250" />
        <CustomControl :handleChangeZoom="handleChangeZoom" :flowZoom="flowZoom" :layoutGraph="layoutGraph" />
        <!-- 自定义节点 -->
        <template #node-custom="customNodeProps">
          <CustomNode v-bind="customNodeProps" @delNode="delNode"></CustomNode>
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
        <div class="workFlowSelect">
          <el-select>
            <el-option></el-option>
          </el-select>
        </div>
      </VueFlow>
      <div class="workFlowSelect">
        <el-select v-model="workFlowItem" placeholder="请选择" :suffix-icon="IconCaretDown">
          <template #footer class="selectFooter">
            <div class="addWorkFlow" @click="addWorkFlow">
              <el-icon>
                <IconPlusCircle></IconPlusCircle>
              </el-icon>
              <span>新建工作流</span>
            </div>
          </template>
        </el-select>
      </div>
    </div>
    <WorkFlowDialog
      v-if="isAddWorkFlow"
      :editData="editData"
      :dialogType="dialogType"
      @handleClose="handleClose"
    ></WorkFlowDialog>
  </div>
</template>
<style lang="scss" scoped>
.stancesItem {
  width: 264px;
  height: 32px;
  line-height: 32px;
  background-color: var(--o-bash-bg);
  color: var(--o-text-color-primary);
  margin-bottom: 8px;
  padding-left: 16px;
  border-radius: 4px;
}
.workFlowContainerRight {
  position: relative;
  .workFlowSelect {
    position: absolute;
    left: 24px;
    top: 24px;
    display: block;
    width: 180px;
    height: 32px;
    .el-select {
      width: 144px;
      height: 32px;
    }
  }
}
.addWorkFlow {
  display: flex;
  gap: 8px;
  align-items: center;
  .el-icon {
    color: var(--o-text-color-tertiary);
  }
}
</style>
