<script setup lang="ts">
import '../../styles/workFlowArrange.scss';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElTooltip, ElMessage } from 'element-plus';
import { VueFlow, useVueFlow, Panel, Position } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import BranchNode from './workFlowConfig/BranchNode.vue';
import CustomEdge from './workFlowConfig/CustomEdge.vue';
import CustomNode from './workFlowConfig/CustomNode.vue';
import CustomControl from './CustomControl.vue';
import CustomSaENode from './workFlowConfig/CustomSaENode.vue';
import useDragAndDrop from './workFlowConfig/useDnD';
import WorkFlowDialog from './workFlowConfig/workFlowDialog.vue';
import WorkFlowDebug from './workFlowDebug.vue';
import { useLayout } from './workFlowConfig/useLayout';
import { IconSearch, IconCaretRight, IconCaretDown, IconPlusCircle } from '@computing/opendesign-icons';
import EditYamlDrawer from './workFlowConfig/yamlEditDrawer.vue';
import { api } from 'src/apis';
import yaml from 'js-yaml';
import { BranchSourceIdType } from './types';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const copilotAside = ref<HTMLElement>();
const isCopilotAsideVisible = ref(true);
const apiSearchValue = ref();
const activeNames = ref([]);
const activeName = ref();
const workFlowItemName = ref();
const isAddWorkFlow = ref(false);
const editData = ref();
const dialogType = ref('');
const isEditYaml = ref(false);
const nodeName = ref();
const flowZoom = ref(1);
const debugDialogVisible = ref(false);
const isNodeAndLineConnect = ref(false);
const apiServiceList = ref([]);
const yamlContent = ref();
const hasWorkFlow = ref(true);
const emits = defineEmits(['validateConnect']);
const route = useRoute();
const workFlowList = ref([]);
const props = defineProps(['flowList']);
const flowObj = ref({});
const nodes = ref([]);
const hanleAsideVisible = () => {
  if (!copilotAside.value) return;
  if (isCopilotAsideVisible.value) {
    isCopilotAsideVisible.value = false;
  } else {
    isCopilotAsideVisible.value = true;
  }
};

const {
  onConnect,
  updateNode,
  updateEdgeData,
  addEdges,
  getNodes,
  getEdges,
  findNode,
  removeNodes,
  setViewport,
  getViewport,
  fitView,
  setNodes,
  setEdges,
} = useVueFlow();
const { layout } = useLayout();

const { onDragOver, onDrop, onDragLeave, isDragOver, onDragStart } = useDragAndDrop();
// 这里是初始化的开始结束的节点
const initNodes = ref([
  {
    id: 'node1',
    type: 'start',
    data: {
      name: '开始',
      description: '',
      nodePosition: 'Right',
      target: 'source',
    },
    deletable: false,
    position: { x: 100, y: 160 },
  },
  {
    id: 'node2',
    type: 'end',
    data: {
      name: '结束',
      description: '',
      nodePosition: 'Left',
      target: 'target',
    },
    deletable: false,
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
  {
    id: '14',
    type: 'branch',
    mark: 'iiiiii',
    data: {
      label: 'LLM(分支节点)',
      desc: '调用大模型，生成自然语言报告',
    },
  },
  {
    id: '15',
    type: 'branch',
    mark: 'iiiiii',
    data: {
      label: 'LLM(分支节点-成功状态)',
      desc: '调用大模型，生成自然语言报告',
      status: 'success',
    },
  },
  {
    id: '16',
    type: 'branch',
    mark: 'iiiiii',
    data: {
      label: 'LLM(分支节点-失败状态)',
      desc: '调用大模型，生成自然语言报告',
      status: 'error',
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

watch(
  props,
  () => {
    // 获取当前工作流
    workFlowList.value = [...props.flowList];
    if (workFlowList.value.length) {
      nodes.value = initNodes.value;
      // 默认选中第一个
      choiceFlowId(workFlowList.value?.[0]);
    }
  },
  { deep: true, immediate: true },
);

onConnect(e => {
  // 边的起点和终点节点的两个状态
  const sourceItem = findNode(e.source);
  const targetItem = findNode(e.target);
  // 获取当前状态
  const sourceStatus = sourceItem?.data?.status || 'default';
  const targetStatus = targetItem?.data?.status || 'default';
  // 更新source源节点handle连接状态
  if (sourceItem?.id) {
    updateConnectNodeHandle(sourceItem.id, e.sourceHandle, false);
  }
  addEdges({
    ...e,
    data: {
      sourceStatus,
      targetStatus,
    },
    type: 'normal',
  });
  // 添加边连接时-判断节点是否都连接
  nodeAndLineConnection();
});
const handleChange = activeList => {
  activeNames.value = activeName.value;
};

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
    // 获取以该节点为target的相连的其他节点
    const connectEdges = getEdges.value.filter(edge => edge.target === id);
    connectEdges.forEach(item => {
      updateConnectNodeHandle(item.source, item.sourceHandle, true);
    });
    node ? removeNodes(node) : '';
    // 删除节点时-判断节点是否都连接
    nodeAndLineConnection();
  }
};
// 编辑yaml
const editYamlDrawer = (name, yamlCode) => {
  yamlContent.value = yamlCode;
  nodeName.value = name;
  isEditYaml.value = true;
};
// 关闭抽屉
const closeDrawer = () => {
  isEditYaml.value = false;
};

const handleZommOnScroll = () => {
  const zoomObj = getViewport();
  flowZoom.value = Number(zoomObj.zoom.toFixed(1));
};

async function layoutGraph(direction) {
  nodes.value = layout(getNodes.value, getEdges.value, direction);
}

const nodeAndLineConnection = () => {
  // 获取当前所有节点和边
  const curNodes = [...getNodes.value];
  const curEdges = [...getEdges.value];
  // 判断开始节点是否连接
  let isNodeConnect = true;
  const len = curNodes.length;
  // 遍历每个节点
  for (let i = 0; i < len; i++) {
    if (curNodes[i].type === 'start') {
      // 判断开始节点是否连接
      isNodeConnect = curEdges.some(item => item.sourceNode?.type === 'start');
    } else if (curNodes[i].type === 'end') {
      // 判断结束节点是否连接
      isNodeConnect = curEdges.some(item => item.targetNode?.type === 'end');
    } else {
      // 判断普通节点是否有连接-普通节点开始和结束都需要进行判断
      const isStartCustomNodeConnect = curEdges.some(item => item.sourceNode?.id === curNodes[i].id);
      const isEndCustomNodeConnect = curEdges.some(item => item.targetNode?.id === curNodes[i].id);
      isNodeConnect = isStartCustomNodeConnect && isEndCustomNodeConnect;
    }
    if (!isNodeConnect) {
      break;
    }
  }
  // 是否所有节点都已连接
  isNodeAndLineConnect.value = isNodeConnect;
  emits('validateConnect', isNodeAndLineConnect.value);
};

// 拖拽添加
const dropFunc = e => {
  if (!flowObj.value?.flowId) {
    ElMessage.warning('请先创建/编辑工作流');
    return;
  }
  onDrop(e);
  // 添加节点时-判断节点是否都连接
  nodeAndLineConnection();
};

// 更新节点状态--这里是测试第一个成功节点改变状态的方法【同时边也随之改变】
const updateNodeTest = state => {
  // 获取当前的success状态的
  const nodes = getNodes.value.filter(item => item.data.status === 'success');
  const id = nodes[0].id;
  const data = nodes[0].data;
  // 取第一个，状态改为error
  updateNode(id, { data: { ...data, status: 'error' } });
  // 遍历获取以当前节点为起源节点的边和为目的节点的边
  const changeSourceEdges = [...getEdges.value.filter(item => item.source === id)];
  const changeTargetEdges = [...getEdges.value.filter(item => item.target === id)];
  // 分别遍历相应的边-并更新它们的状态为最新状态
  changeSourceEdges.forEach(item => {
    updateEdgeData(item.id, { sourceStatus: 'error' });
  });
  changeTargetEdges.forEach(item => {
    updateEdgeData(item.id, { targetStatus: 'error' });
  });
};

onMounted(() => {
  api
    .queryAllFlowService({
      page: 1,
      pageSize: 10,
    })
    .then(res => {
      apiServiceList.value = res[1]?.result.services;
      activeName.value = [res[1]?.result.services[0]?.serviceId];
      activeNames.value = [res[1]?.result.services[0]?.serviceId];
    });
});

const handleDebugDialogOps = visible => {
  debugDialogVisible.value = visible;
};

const handleDemo = () => {
  return {
    nodes: getNodes.value,
    edges: getEdges.value,
  };
};

const edgesChange = edges => {
  if (edges?.[0]?.type === 'remove' && edges[0]?.source) {
    updateConnectNodeHandle(edges[0].source, edges[0]?.sourceHandle, true);
    // 删除节点时-判断节点是否都连接
    nodeAndLineConnection();
  }
};

const updateConnectNodeHandle = (id, handle, connectable) => {
  const node = findNode(id);
  let handleType = 'isConnectSource';
  // 默认为单节点
  if (handle) {
    // 说明是分支节点
    handleType = handle === BranchSourceIdType.SOURCEA ? 'isConnectSourceA' : 'isConnectSourceB';
  }
  updateNode(id, { data: { ...node?.data, [handleType]: connectable } });
};

const nodesChange = nodes => {
  if (nodes?.[0]?.type === 'remove') {
    delNode(nodes[0].id);
  }
};

// 子组件获取的flow
const getCreatedFlow = createdFlowObj => {
  if (flowObj) {
    flowObj.value = { ...createdFlowObj };
    workFlowItemName.value = createdFlowObj.name;
    redrageFlow(createdFlowObj?.nodes, createdFlowObj?.edges);
  }
  // 更新当前应用下的工作流列表下拉框
  queryFlow('create');
  handleClose();
};

const queryFlow = (deal: string) => {
  // 查询当前应用下的flowIdList
  if (route.query?.appId) {
    api
      .querySingleAppData({
        id: route.query?.appId as string,
      })
      .then(res => {
        const appInfo = res?.[1]?.result;
        if (appInfo) {
          workFlowList.value = appInfo.workflows ? [...appInfo.workflows] : [];
          if (!workFlowList.value.length) {
            nodes.value = [];
          } else {
            if (deal === 'del') {
              // 默认展示第一个
              choiceFlowId(workFlowList.value[0]);
            }
          }
        }
      });
  }
};

// 点击编辑工作流--查询当前工作流数据-后续添加回显
const editFlow = item => {
  api
    .querySingleFlowTopology({
      appId: route.query?.appId,
      flowId: item.id,
    })
    .then(res => {
      if (res[1]?.result?.flow) {
        flowObj.value = res[1].result.flow;
        redrageFlow(flowObj.value.nodes, flowObj.value.edges);
      }
    });
};

// 删除工作流
const delFlow = item => {
  // 删除的如果是当前选中的，需要将选中的清空
  if (workFlowItemName.value === item.name) {
    workFlowItemName.value = '';
  }
  api
    .delFlowTopology({
      appId: route.query?.appId,
      flowId: item.id,
    })
    .then(res => {
      if (res[1]?.result) {
        ElMessage.success('删除工作流成功');
        // 并且需要更新工作流下拉框--默认选中第一项
        queryFlow('del');
      }
    });
};

// 下拉选择对应的工作流
const choiceFlowId = flowItem => {
  workFlowItemName.value = flowItem.name;
  editFlow(flowItem);
};

const redrageFlow = (nodesList, edgesList) => {
  const newNodeList = nodesList.map(node => {
    let newNode = {
      id: node.nodeId,
      type: node.type,
      data: {
        name: node.name,
        description: node.description,
        parameters: node.parameters,
      },
      position: node.position,
      deletable: true,
    };
    if (node.type === 'start' || node.type === 'end') {
      newNode.data = {
        ...newNode.data,
        target: node.type === 'start' ? 'source' : 'target',
        nodePosition: node.type === 'start' ? 'Right' : 'Left',
      };
      newNode.deletable = false;
    } else if (node.type === 'choice') {
      newNode.type = 'branch';
      newNode.data.parameters['input_parameters'] = node.parameters;
    } else {
      newNode.type = 'custom';
    }
    return newNode;
  });
  const newEdgeList = edgesList.map(edge => {
    let newEdge = {
      id: edge.edgeId,
      source: edge.sourceNode,
      target: edge.targetNode,
      branchId: edge.branchId,
      type: 'normal',
      sourceHandle: edge.branchId, // 这里是分支边需要以确定源头handle
    };
    // 线分支条件需后续添加
    return newEdge;
  });
  setNodes(newNodeList);
  setEdges(newEdgeList);
};

const saveFlow = () => {
  const appId = route.query?.appId;
  if (!flowObj.value.flowId) {
    return;
  }
  // 将对应的节点和边存储格式改造
  const updateNodes = getNodes.value.map(item => {
    let newItem = {
      enable: true,
      editable: false,
      position: item.position,
      apiId: item.data.nodeMetaDataId,
      serviceId: item.data.serviceId,
      nodeId: item.id,
      ...item.data,
    };
    if (item.type === 'end' || item.type === 'start') {
      // 更新开始结束节点结构
      newItem = {
        ...newItem,
        apiId: item.type, // 这两个id个应该没有-暂时随意复制
        serviceId: item.type,
        nodeId: item.id,
        type: item.type,
      };
    } else if (item.type === 'branch') {
      // 这里是需要将parameters
      newItem = {
        ...newItem,
        type: 'choice',
        parameters: item.data.parameters,
      };
    }
    return newItem;
  });
  // 更新对应的边的结构
  const updateEdges = getEdges.value.map(item => {
    let newEdge = {
      edgeId: item.id,
      sourceNode: item.sourceNode.id,
      targetNode: item.targetNode.id,
      type: item.type,
      branchId: item.sourceHandle || '',
    };
    return newEdge;
  });
  // 更新最新的节点与边的数据
  api
    .createOrUpdateFlowTopology(
      {
        appId: appId,
        flowId: flowObj.value.flowId,
        topologyCheck: false,
      },
      {
        flow: {
          ...flowObj.value,
          nodes: updateNodes,
          edges: updateEdges,
        },
        focusPoint: {
          x: 800,
          y: 800,
        },
      },
    )
    .then(res => {
      if (res[1].result) {
        ElMessage.success('更新成功');
        queryFlow('update');
      }
    });
};

defineExpose({
  handleDemo,
  saveFlow,
});
</script>
<template>
  <div class="workFlowContainer" @drop="dropFunc">
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
              <el-collapse v-model="activeName" @change="handleChange" class="o-hpc-collapse">
                <el-collapse-item title="Consistency" :name="item.serviceId" v-for="item in apiServiceList">
                  <template #title>
                    <el-icon
                      class="el-collapse-item__arrow"
                      :class="{ 'is-active': activeNames.includes(item.serviceId) }"
                    >
                      <IconCaretRight />
                    </el-icon>
                    <span>{{ item.name }}</span>
                  </template>
                  <div
                    class="stancesItem"
                    v-for="(node, index) in item.nodeMetaDatas"
                    :key="index"
                    :draggable="true"
                    @dragstart="onDragStart($event, node.type, { serviceId: item.serviceId, ...node })"
                  >
                    {{ node.name }}
                  </div>
                </el-collapse-item>
              </el-collapse>
              <div style="display: none" @click="updateNodeTest">测试状态修改（暂不显示）</div>
            </div>
          </div>
        </div>
      </transition>
    </aside>
    <div class="workFlowContainerRight">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: 0.8 }"
        :min-zoom="0.5"
        :max-zoom="4"
        class="my-diagram-class"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @edges-change="edgesChange"
        @nodes-change="nodesChange"
        @paneScroll="handleZommOnScroll"
      >
        <Background pattern-color="#aaa" :gap="8" />
        <MiniMap :width="220" mask-color="#f4f6fa" :mask-stroke-width="250" />
        <CustomControl :handleChangeZoom="handleChangeZoom" :flowZoom="flowZoom" :layoutGraph="layoutGraph" />
        <!-- 自定义节点 -->
        <template #node-custom="customNodeProps">
          <CustomNode v-bind="customNodeProps" @delNode="delNode" @editYamlDrawer="editYamlDrawer"></CustomNode>
        </template>

        <!-- 自定义分支节点 -->
        <template #node-branch="branchNodeProps">
          <BranchNode v-bind="branchNodeProps" @delNode="delNode" @editYamlDrawer="editYamlDrawer"></BranchNode>
        </template>

        <template #node-start="nodeStartProps">
          <CustomSaENode v-bind="nodeStartProps"></CustomSaENode>
        </template>

        <template #node-end="nodeEndProps">
          <CustomSaENode v-bind="nodeEndProps"></CustomSaENode>
        </template>

        <!-- 自定义边线 -->
        <template #edge-normal="props">
          <CustomEdge
            :id="props.id"
            :key="props.id"
            :sourceX="props.sourceX"
            :sourceY="props.sourceY"
            :targetX="props.targetX"
            :targetY="props.targetY"
            :sourcePosition="props.sourcePosition"
            :targetPosition="props.targetPosition"
            :data="JSON.parse(JSON.stringify(props.data))"
          />
        </template>

        <template #connection-line="props">
          <CustomEdge
            :sourceX="props.sourceX"
            :sourceY="props.sourceY"
            :targetX="props.targetX"
            :targetY="props.targetY"
            :sourcePosition="props.sourcePosition"
            :targetPosition="props.targetPosition"
          />
        </template>

        <WorkFlowDebug v-if="debugDialogVisible" :handleDebugDialogOps="handleDebugDialogOps" />
      </VueFlow>
      <div class="workFlowOps" v-if="workFlowList.length">
        <div class="workFlowSelect">
          <el-select v-model="workFlowItemName" placeholder="请选择" :suffix-icon="IconCaretDown">
            <el-option
              class="workFlowOption"
              v-for="(item, index) in workFlowList"
              :label="item.name"
              :value="item.name"
              :key="item.id"
              @click="choiceFlowId(item)"
            >
              <div class="flowName">{{ item.name }}</div>
              <div class="dealIcon">
                <img class="conversation-title__svg" src="@/assets/svgs/light_editor.svg" @click="editFlow(item)" />
              </div>
              <div class="dealIcon">
                <img class="conversation-title__svg" src="@/assets/svgs/light_delete.svg" @click.stop="delFlow(item)" />
              </div>
            </el-option>
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
        <div class="debugBtn" @click="handleDebugDialogOps(true)">
          <img src="@/assets/images/debugBtnDis.png" v-if="debugDialogVisible" />
          <img src="@/assets/images/debugBtn.png" v-else />
        </div>
        <div class="debugStatus"></div>
      </div>
      <div class="noWorkFlow" v-else>
        <div class="noFlow"></div>
        <div class="noFlowDesc">暂无工作流</div>
        <el-button type="primary" class="w96 addWorkFlow" @click="addWorkFlow">新建工作流</el-button>
      </div>
    </div>
    <WorkFlowDialog
      v-if="isAddWorkFlow"
      :editData="editData"
      :dialogType="dialogType"
      @handleClose="handleClose"
      @createFlowId="getCreatedFlow"
    ></WorkFlowDialog>
  </div>
  <EditYamlDrawer
    v-if="isEditYaml"
    @closeDrawer="closeDrawer"
    :yamlContent="yamlContent"
    :nodeName="nodeName"
  ></EditYamlDrawer>
</template>
