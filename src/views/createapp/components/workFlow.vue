<script setup lang="ts">
import '../../styles/workFlowArrange.scss';
import { onMounted, ref, watch, onUnmounted } from 'vue';
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
import {
  IconSearch,
  IconCaretRight,
  IconCaretDown,
  IconPlusCircle,
} from '@computing/opendesign-icons';
import EditYamlDrawer from './workFlowConfig/yamlEditDrawer.vue';
import { api } from 'src/apis';
import { BranchSourceIdType, StatusInfoTitle } from './types';
import { useRoute } from 'vue-router';
import {
  nodeTypeToIcon,
  iconTypeList,
  getSrcIcon,
  DefaultViewPortZoom,
} from './types';
import yaml from 'js-yaml';
import $bus from 'src/bus/index';
import CustomLoading from '../../customLoading/index.vue';

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
const nodeName = ref('');
const nodeDesc = ref('');
const flowZoom = ref(1);
const debugDialogVisible = ref(false);
const apiServiceList = ref([]);
const allApiServiceList = ref([]);
const yamlContent = ref();
const nodeYamlId = ref();
const emits = defineEmits(['updateFlowsDebug']);
const route = useRoute();
const workFlowList = ref([]);
const props = defineProps(['flowList']);
const flowObj = ref({});
const nodes = ref([]);
const debugStatus = ref('');
const debugTime = ref('');
const totalTime = ref(0);
const isNodeAndLineConnect = ref(false);
const loading = ref(false);
const apiLoading = ref(false);
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
  addEdges,
  getNodes,
  updateEdgeData,
  getEdges,
  findNode,
  removeNodes,
  setViewport,
  getViewport,
  setNodes,
  setEdges,
  removeSelectedNodes,
  getSelectedNodes,
} = useVueFlow();
const { layout } = useLayout();

const { onDragOver, onDrop, onDragLeave, onDragStart } = useDragAndDrop();
// 开始的边默认为空数组【当然回显时应该有值】
const edges = ref([]);

const handleChangeZoom = (zoomValue) => {
  const viewPortX = Number(sessionStorage.getItem('workflowViewPortX')) || 0;
  const viewPortY = Number(sessionStorage.getItem('workflowViewPortY')) || 20;
  setViewport({
    zoom: zoomValue,
    x: viewPortX,
    y: viewPortY,
  });
};

// 监听viewPort变化
const viewportChangeEndFunc = (e) => {
  sessionStorage.setItem('workflowViewPortX', e.x);
  sessionStorage.setItem('workflowViewPortY', e.y);
};

watch(
  props,
  () => {
    // 获取当前工作流
    workFlowList.value = [...props.flowList];
    if (workFlowList.value.length) {
      // 默认选中第一个
      choiceFlowId(workFlowList.value?.[0]);
    }
  },
  { deep: true, immediate: true },
);

onConnect((e) => {
  // 边的起点和终点节点的两个状态
  const sourceItem = findNode(e.source);
  const targetItem = findNode(e.target);
  // 获取当前状态
  const sourceStatus = sourceItem?.data?.status || 'default';
  const targetStatus = targetItem?.data?.status || 'default';
  addEdges({
    ...e,
    data: {
      sourceStatus,
      targetStatus,
    },
    type: 'normal',
  });
});
const handleChange = (activeList) => {
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
const delNode = (id) => {
  if (id) {
    const node = findNode(id);
    node ? removeNodes(node) : '';
  }
};
// 验证节点是否都连接
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
      isNodeConnect = curEdges.some(
        (item) => item.sourceNode?.type === 'start',
      );
    } else if (curNodes[i].type === 'end') {
      // 判断结束节点是否连接
      isNodeConnect = curEdges.some((item) => item.targetNode?.type === 'end');
    } else {
      // 判断普通节点是否有连接-普通节点开始和结束都需要进行判断
      const isStartCustomNodeConnect = curEdges.some(
        (item) => item.sourceNode?.id === curNodes[i].id,
      );
      const isEndCustomNodeConnect = curEdges.some(
        (item) => item.targetNode?.id === curNodes[i].id,
      );
      isNodeConnect = isStartCustomNodeConnect && isEndCustomNodeConnect;
    }
    if (!isNodeConnect) {
      break;
    }
  }
  // 是否所有节点都已连接
  isNodeAndLineConnect.value = isNodeConnect;
};
// 编辑yaml
const editYamlDrawer = (name, desc, yamlCode, nodeId) => {
  yamlContent.value = yamlCode;
  nodeName.value = name;
  nodeDesc.value = desc;
  isEditYaml.value = true;
  nodeYamlId.value = nodeId;
};
// 关闭抽屉
const closeDrawer = () => {
  isEditYaml.value = false;
};

const handleZommOnScroll = () => {
  const zoomObj = getViewport();
  flowZoom.value = Number(zoomObj.zoom.toFixed(2));
};

async function layoutGraph(direction) {
  nodes.value = layout(getNodes.value, getEdges.value, direction);
  setViewport({
    zoom: DefaultViewPortZoom,
    x: 0,
    y: 20,
  });
}

// 拖拽添加
const dropFunc = (e) => {
  if (!flowObj.value?.flowId) {
    ElMessage.warning('请先创建/编辑工作流');
    return;
  }
  // 如果调试弹窗打开，不可拖拽
  if (debugDialogVisible.value) {
    return;
  }
  onDrop(e);
};

onMounted(() => {
  apiLoading.value = true;
  api
    .queryAllFlowService({
      page: 1,
      pageSize: 10,
    })
    .then((res) => {
      apiServiceList.value = res[1]?.result.services;
      allApiServiceList.value = res[1]?.result.services;
      activeName.value = [res[1]?.result.services[0]?.serviceId];
      activeNames.value = [res[1]?.result.services[0]?.serviceId];
      apiLoading.value = false;
    });
  handleChangeZoom(DefaultViewPortZoom);
});

onUnmounted(() => {
  // 组件销毁时，清空sessionStorage的veiwport位置
  sessionStorage.setItem('workflowViewPortX', '');
  sessionStorage.setItem('workflowViewPortY', '');
});

// 过滤工作流接口返回的可拖拽节点
const searchApiList = () => {
  apiServiceList.value = allApiServiceList.value.map((item) => {
    const filterObj = { ...item, nodeMetaDatas: [] };
    if (item?.nodeMetaDatas) {
      filterObj.nodeMetaDatas = item.nodeMetaDatas.filter((item) =>
        item?.name.includes(apiSearchValue.value),
      );
    }
    return filterObj;
  });
};

const handleDebugDialogOps = (visible) => {
  // 这里将对应的保存
  if (!debugDialogVisible.value) {
    saveFlow();
  }
  if (typeof visible === 'boolean') {
    debugDialogVisible.value = visible;
  }
  // 调试弹窗关闭时---结果清空
  debugStatus.value = '';
  // 调试弹窗关闭时---节点状态清空
  getNodes.value.forEach((node) => {
    updateNode(node.id, {
      data: { ...node.data, status: 'default', costTime: '' },
    });
  });
  // 调试弹窗关闭时---需要将边状态清空
  getEdges.value.forEach((edge) => {
    // 更新节点的起源与终点
    updateEdgeData(edge.id, { targetStatus: 'default' });
    updateEdgeData(edge.id, { sourceStatus: 'default' });
  });
};

const edgesChange = (edges) => {
  // 边增加删除时直接将工作流debug状态置为false
  if (edges?.[0]?.type === 'remove' || edges?.[0]?.type === 'add') {
    emits('updateFlowsDebug', false);
    nodeAndLineConnection();
  }
};

const nodesChange = (nodes) => {
  // 判断如果选中的节点数目大于1，则删除首个
  if (getSelectedNodes.value.length > 1) {
    removeSelectedNodes([getSelectedNodes.value[0]]);
  }
  if (nodes?.[0]?.type === 'remove') {
    delNode(nodes[0].id);
    // 节点增加删除时直接将工作流debug状态置为false
    emits('updateFlowsDebug', false);
    nodeAndLineConnection();
  }
  if (nodes?.[0]?.type === 'add') {
    // 节点增加删除时直接将工作流debug状态置为false
    emits('updateFlowsDebug', false);
    nodeAndLineConnection();
  }
};

// 子组件获取的flow
const getCreatedFlow = (createdFlowObj) => {
  if (flowObj.value) {
    flowObj.value = { ...createdFlowObj };
    workFlowItemName.value = createdFlowObj.name;
    // 回显工作流节点和边
    redrageFlow(createdFlowObj?.nodes, createdFlowObj?.edges);
  }
  // 更新当前应用下的工作流列表下拉框
  queryFlow('create');
  handleClose();
};

const queryFlow = (deal: string) => {
  // 查询当前应用下的flowIdList
  loading.value = true;
  if (route.query?.appId) {
    api
      .querySingleAppData({
        id: route.query?.appId as string,
      })
      .then((res) => {
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
          // 更新当前publish状态
          emits('updateFlowsDebug');
        }
        loading.value = false;
      });
  }
};
// 点击编辑工作流--查询当前工作流数据-后续添加回显
const editFlow = (item) => {
  loading.value = true;
  api
    .querySingleFlowTopology({
      appId: route.query?.appId,
      flowId: item.id,
    })
    .then((res) => {
      if (res[1]?.result?.flow) {
        flowObj.value = res[1].result.flow;
        redrageFlow(flowObj.value.nodes, flowObj.value.edges);
      }
      loading.value = false;
    });
};

// 删除工作流
const delFlow = (item) => {
  // 删除的如果是当前选中的，需要将选中的清空
  if (workFlowItemName.value === item.name) {
    workFlowItemName.value = '';
  }
  loading.value = true;
  api
    .delFlowTopology({
      appId: route.query?.appId,
      flowId: item.id,
    })
    .then((res) => {
      if (res[1]?.result) {
        ElMessage.success('删除工作流成功');
        // 并且需要更新工作流下拉框--默认选中第一项
        queryFlow('del');
        loading.value = false;
      }
    });
};

// 下拉选择对应的工作流
const choiceFlowId = (flowItem) => {
  if (flowItem) {
    workFlowItemName.value = flowItem.name;
    editFlow(flowItem);
  }
};

// 回显工作流节点和边
const redrageFlow = (nodesList, edgesList) => {
  const newNodeList = nodesList.map((node) => {
    let newNode = {
      id: node.stepId,
      type: node.callId,
      data: {
        name: node.name,
        description: node.description,
        parameters: node.parameters,
        nodeId: node.nodeId,
        callId: node.callId,
        serviceId: node.serviceId,
      },
      position: node.position,
      deletable: true,
    };
    // 这里节点/handle的类型要根据返回的类型转换下
    if (node.callId === 'start' || node.callId === 'end') {
      newNode.data = {
        ...newNode.data,
        target: node.callId === 'start' ? 'source' : 'target',
        nodePosition: node.callId === 'start' ? 'Right' : 'Left',
      };
      newNode.deletable = false;
    } else if (node.callId === 'choice') {
      newNode.type = 'branch';
    } else {
      newNode.type = 'custom';
    }
    return newNode;
  });
  const newEdgeList = edgesList.map((edge) => {
    const newEdge = {
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
  // 回显节点和边后，判断各节点连接状态
  nodeAndLineConnection();
};

// 接受工作流调试时获取的相应的数据
$bus.on('getNodesStatue', (lines) => {
  // 对相应节点修改状态--此处需要分为开始/结束,分支,普通三种节点修改
  try {
    lines?.forEach((item) => {
      const newLines = yaml.load(item);
      // 工作流开始时更新debugResult
      if (newLines?.data?.event === 'flow.start') {
        totalTime.value = 0;
        debugTime.value = '';
        debugStatus.value = newLines.data.flow?.stepStatus;
        updateNodeFunc('start', 'success', '');
      }

      // 这里判断是否有调试状态的值，无值不处理
      if (!debugStatus.value) {
        return;
      }
      // step.input和step.output对应的节点状态需要修改
      if (
        newLines?.data?.event === 'step.input' ||
        newLines?.data?.event === 'step.output'
      ) {
        // output-节点运行结束时，获取节点运行的耗时
        let constTime = '';
        if (newLines.data.event === 'step.output') {
          totalTime.value += newLines.data?.metadata?.timeCost;
          constTime = `${newLines.data?.metadata?.timeCost?.toFixed(3)}s`;
          // 此处获取output的数据，并将此数据传给节点显示
          updateNodeFunc(
            newLines.data.flow.stepId,
            newLines.data.flow?.stepStatus,
            constTime,
            {
              params: newLines.data?.content,
              type: 'output',
            },
          );
        } else {
          updateNodeFunc(
            newLines.data.flow.stepId,
            newLines.data.flow?.stepStatus,
            constTime,
            {
              params: newLines.data?.content,
              type: 'input',
            },
          );
        }
      } else if (newLines?.data?.event === 'flow.stop') {
        debugStatus.value = newLines.data.flow?.stepStatus;
        debugTime.value = `${totalTime.value.toFixed(3)}s`;
        // 最后更新-调用一下接口
      } else {
        // do nothing
      }
    });
  } catch (error) {
    ElMessage.error('请检查格式是否正确');
  }
  // 修改节点时，需要将对应节点的边也进行修改
});

// 这里结束整个工作流对话
$bus.on('debugChatEnd', () => {
  // 更新发布按钮状态
  emits('updateFlowsDebug');
});

// 更新节点状态--调试到对应节点id，根据id设置节点与边状态
const updateNodeFunc = (id, status, constTime, content?) => {
  // 获取到当前的nodeId,更新状态
  const node = findNode(id);
  // 这里node的data也需要转换下
  const data = content ? { ...node?.data, content } : node?.data;
  // 更新当前节点的状态，以及运行时间
  updateNode(id, { data: { ...data, status, constTime } });
  // 遍历获取以当前节点为起源节点的边和为目的节点的边
  const changeSourceEdges = [
    ...getEdges.value.filter((item) => item.source === id),
  ];
  const changeTargetEdges = [
    ...getEdges.value.filter((item) => item.target === id),
  ];
  // 分别遍历相应的以该节点为起源的边-并更新它们的状态为最新状态
  changeSourceEdges.forEach((item) => {
    updateEdgeData(item.id, { sourceStatus: status });
  });
  // 分别遍历相应相应的以该节点为目标的边-并更新它们的状态为最新状态
  changeTargetEdges.forEach((item) => {
    updateEdgeData(item.id, { targetStatus: status });
  });
};

const saveFlow = (updateNodeParameter?) => {
  loading.value = true;
  const appId = route.query?.appId;
  if (!flowObj.value.flowId) {
    return;
  }
  // 将对应的节点和边存储格式改造
  let updateNodes = getNodes.value.map((item) => {
    const { ...otherItem } = item.data;
    let newItem = {
      enable: true,
      editable: false,
      position: item.position,
      apiId: item.data.nodeId,
      serviceId: item.data.serviceId,
      stepId: item.id,
      type: item.data.nodeId,
      ...otherItem,
    };
    if (item.type === 'end' || item.type === 'start') {
      // 更新开始结束节点结构
      newItem = {
        ...newItem,
        apiId: item.type, // 这两个id个应该没有-暂时随意复制
        serviceId: item.type,
        nodeId: 'Empty',
        callId: item.type,
        type: 'startAndEnd',
      };
    } else if (item.type === 'branch') {
      // 这里是需要将parameters
      newItem = {
        ...newItem,
        callId: 'choice',
        parameters: item.data.parameters,
      };
    }
    return newItem;
  });
  // 更新对应的边的结构
  const updateEdges = getEdges.value.map((item) => {
    let newEdge = {
      edgeId: item.id,
      sourceNode: item.sourceNode.id,
      targetNode: item.targetNode.id,
      type: item.type,
      branchId: item.sourceHandle || '',
    };
    return newEdge;
  });
  // 判断是否调用修改yaml文件，以确定是否修改对应的input_paramteters
  if (updateNodeParameter) {
    updateNodes.forEach((item) => {
      if (item.stepId === updateNodeParameter.id) {
        if (item.type === 'choice') {
          item.parameters.input_parameters.choices =
            updateNodeParameter.inputStream;
        } else {
          item.parameters.input_parameters = updateNodeParameter.inputStream;
        }
        item.name = updateNodeParameter.name;
        item.description = updateNodeParameter.description;
      }
    });
  }
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
    .then((res) => {
      if (res[1]?.result) {
        ElMessage.success('工作流更新成功');
        queryFlow('update');
        const updatedCurFlow = res[1].result.flow;
        redrageFlow(updatedCurFlow?.nodes, updatedCurFlow?.edges);
      }
      loading.value = false;
    });
};

const saveNode = (yamlCode, nodeId, name, description) => {
  // 调用更新接口更新当前节点数据
  const updateNodeParameter = {
    id: nodeId,
    inputStream: yamlCode,
    name,
    description,
  };
  saveFlow(updateNodeParameter);
};

defineExpose({
  saveFlow,
});
</script>
<template>
  <div class="workFlowContainer" @drop="dropFunc">
    <aside class="aside-wrapper" ref="copilotAside">
      <ElTooltip
        placement="right"
        :content="
          isCopilotAsideVisible ? t('history.collapse') : t('history.expand')
        "
      >
        <div
          class="trapezoid"
          :class="{ isExpandIcon: isCopilotAsideVisible }"
          @click="hanleAsideVisible"
        />
      </ElTooltip>

      <transition name="transition-fade">
        <div class="copilot-aside nodes" v-if="isCopilotAsideVisible">
          <CustomLoading :loading="apiLoading"></CustomLoading>
          <div class="apiCenterBox">
            <div class="apiCenterTitle">语义接口中心</div>
            <div class="apiCenterSearch">
              <el-input
                v-model="apiSearchValue"
                class="o-style-search"
                placeholder="搜索"
                @input="searchApiList"
                :prefix-icon="IconSearch"
                clearable
              ></el-input>
            </div>
            <div class="apiContanter">
              <el-collapse
                v-model="activeName"
                @change="handleChange"
                class="o-hpc-collapse"
              >
                <el-collapse-item
                  title="Consistency"
                  :name="item.serviceId"
                  v-for="item in apiServiceList"
                >
                  <template #title>
                    <el-icon
                      class="el-collapse-item__arrow"
                      :class="{
                        'is-active': activeNames.includes(item.serviceId),
                      }"
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
                    @dragstart="
                      onDragStart($event, node.type, {
                        serviceId: item.serviceId,
                        ...node,
                      })
                    "
                  >
                    <img class="nodeIcon" :src="getSrcIcon(node)" />
                    <div class="stanceName">{{ node.name }}</div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>
      </transition>
    </aside>
    <div class="workFlowContainerRight">
      <!-- vue-flow画布节点等区域 -->
      <CustomLoading :loading="loading"></CustomLoading>
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: DefaultViewPortZoom }"
        :min-zoom="0.5"
        :max-zoom="4"
        class="my-diagram-class"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @edges-change="edgesChange"
        @nodes-change="nodesChange"
        @paneScroll="handleZommOnScroll"
        @viewportChangeEnd="viewportChangeEndFunc"
      >
        <Background pattern-color="#aaa" :gap="8" />
        <MiniMap :width="220" mask-color="#f4f6fa" :mask-stroke-width="250" />
        <CustomControl
          :handleChangeZoom="handleChangeZoom"
          :flowZoom="flowZoom"
          :layoutGraph="layoutGraph"
        />
        <!-- 自定义节点 -->
        <template #node-custom="customNodeProps">
          <CustomNode
            v-bind="customNodeProps"
            :disabled="debugDialogVisible"
            @delNode="delNode"
            @editYamlDrawer="editYamlDrawer"
          ></CustomNode>
        </template>

        <!-- 自定义分支节点 -->
        <template #node-branch="branchNodeProps">
          <BranchNode
            v-bind="branchNodeProps"
            :disabled="debugDialogVisible"
            @delNode="delNode"
            @editYamlDrawer="editYamlDrawer"
          ></BranchNode>
        </template>

        <!-- 开始结束节点 -->
        <template #node-start="nodeStartProps">
          <CustomSaENode v-bind="nodeStartProps"></CustomSaENode>
        </template>

        <template #node-end="nodeEndProps">
          <CustomSaENode v-bind="nodeEndProps"></CustomSaENode>
        </template>

        <!-- 自定义边线-连接后 -->
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
        <!-- 连接时边线 -->
        <template #connection-line="props">
          <CustomEdge
            :sourceX="props.sourceX"
            :sourceY="props.sourceY"
            :targetX="props.targetX"
            :targetY="props.targetY"
            :sourcePosition="props.sourcePosition"
            :targetPosition="props.targetPosition"
            :isConnection="true"
          />
        </template>
      </VueFlow>
      <!-- vue-flow工作流的debug抽屉 -->
      <WorkFlowDebug
        v-if="debugDialogVisible"
        :appId="route.query?.appId"
        :flowId="flowObj?.flowId"
        :handleDebugDialogOps="handleDebugDialogOps"
      />
      <div class="workFlowOps" v-if="workFlowList.length">
        <!-- 工作流画布左上方选择工作流以及调试按钮等区域 -->
        <div class="workFlowSelect">
          <el-select
            :disabled="debugDialogVisible"
            v-model="workFlowItemName"
            placeholder="请选择"
            :suffix-icon="IconCaretDown"
          >
            <el-option
              class="workFlowOption"
              v-for="(item, index) in workFlowList"
              :label="item.name"
              :value="item.name"
              :key="item.id"
              @click="choiceFlowId(item)"
            >
              <div class="flowName">{{ item.name }}</div>
              <div class="dealIcon editIcon" @click="editFlow(item)"></div>
              <div class="dealIcon delIcon" @click.stop="delFlow(item)"></div>
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
        <el-tooltip
          v-if="!isNodeAndLineConnect"
          effect="dark"
          content="节点连接完成才能进行调试"
          placement="top"
        >
          <div
            class="debugBtn isDebugDis"
            @click="handleDebugDialogOps(true)"
          ></div>
        </el-tooltip>
        <div
          v-else
          class="debugBtn"
          :class="{ isDebugDis: debugDialogVisible }"
          @click="handleDebugDialogOps(true)"
        ></div>
        <div class="debugStatus"></div>
        <!-- 这里显示调试最终结果与耗时 -->
        <div class="debugStatus" v-if="debugStatus">
          <div class="icon" :class="`${debugStatus}Icon`"></div>
          <div class="resultText">{{ StatusInfoTitle[debugStatus] }}</div>
          <span
            class="time"
            :class="`${debugStatus}Bg`"
            v-if="debugStatus !== 'running'"
          >
            {{ debugTime }}
          </span>
        </div>
      </div>
      <!-- 暂无工作流展示 -->
      <div class="noWorkFlow" v-else>
        <div class="noFlow"></div>
        <div class="noFlowDesc">暂无工作流</div>
        <el-button type="primary" class="w96 addWorkFlow" @click="addWorkFlow">
          新建工作流
        </el-button>
      </div>
    </div>
    <!-- 工作流新建弹窗 -->
    <WorkFlowDialog
      v-if="isAddWorkFlow"
      :editData="editData"
      :dialogType="dialogType"
      :workFlowList="workFlowList"
      @handleClose="handleClose"
      @createFlowId="getCreatedFlow"
    ></WorkFlowDialog>
  </div>
  <!-- 节点yaml数据抽屉 -->
  <EditYamlDrawer
    v-if="isEditYaml"
    @closeDrawer="closeDrawer"
    @saveNode="saveNode"
    :appId="route.query?.appId"
    :flowId="flowObj?.flowId"
    :yamlContent="yamlContent"
    :nodeName="nodeName"
    :nodeDesc="nodeDesc"
    :nodeYamlId="nodeYamlId"
  ></EditYamlDrawer>
</template>
<style lang="scss">
.debugStatus {
  display: flex;
  height: 32px;
  padding: 8px 0px;
  gap: 8px;
  align-items: center;
  .icon {
    width: 16px;
    height: 16px;
    background-size: contain !important;
  }
  .successIcon {
    background: url(@/assets/images/flow_success.png) center center no-repeat;
  }

  .errorIcon {
    background: url(@/assets/images/flow_fail.png) center center no-repeat;
  }

  .runningIcon,
  .pendingIcon {
    background: url(@/assets/images/loading.png) center center no-repeat;
    animation: spin 2s linear infinite;
  }
  .time {
    height: 16px;
    line-height: 16px;
    padding: 0px 8px;
    border-radius: 4px;
  }
  .flexRight {
    margin-left: auto;
    margin-right: -4px;
  }
}
</style>
