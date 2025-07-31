<script setup lang="ts">
import '../../styles/workFlowArrange.scss';
import { onMounted, ref, watch, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import BranchNode from './workFlowConfig/BranchNode.vue';
import ChoiceBranchNode from './workFlowConfig/ChoiceBranchNode.vue';
import CustomEdge from './workFlowConfig/CustomEdge.vue';
import CustomNode from './workFlowConfig/CustomNode.vue';
import CustomControl from './CustomControl.vue';
import CustomSaENode from './workFlowConfig/CustomSaENode.vue';
import useDragAndDrop from './workFlowConfig/useDnD';
import WorkFlowDialog from './workFlowConfig/workFlowDialog.vue';
import WorkFlowDebug from './workFlowDebug.vue';
import { useLayout } from './workFlowConfig/useLayout';
import { useChangeThemeStore } from '@/store';
import i18n from '@/i18n';
import {
  IconSearch,
  IconCaretRight,
  IconCaretDown,
  IconPlusCircle,
} from '@computing/opendesign-icons';

import EditYamlDrawer from './workFlowConfig/yamlEditDrawer.vue';
import VariableBasedStartNodeDrawer from './workFlowConfig/VariableBasedStartNodeDrawer.vue';
import CodeNodeDrawer from './workFlowConfig/CodeNodeDrawer.vue';
import DirectReplyDrawer from './workFlowConfig/DirectReplyDrawer.vue';
import ChoiceBranchDrawer from './workFlowConfig/ChoiceBranchDrawer.vue';
import InsertNodeMenu from './workFlowConfig/insertNodeMenu.vue';
import { api } from 'src/apis';
// 导入变量API
import { listVariables } from '@/api/variable';
import { StatusInfoTitle } from './types';
import { useRoute } from 'vue-router';
import { getSrcIcon, DefaultViewPortZoom } from './types';
import $bus from 'src/bus/index';
import CustomLoading from '../../customLoading/index.vue';
import EditFlowName from './workFlowConfig/editFlowName.vue';
import NodeListPanel from './workFlowConfig/NodeListPanel.vue';
import EnvironmentVariableDrawer from './workFlowConfig/EnvironmentVariableDrawer.vue';

const { t } = useI18n();
const copilotAside = ref<HTMLElement>();
const isCopilotAsideVisible = ref(false);

const workFlowItemName = ref();
const isAddWorkFlow = ref(false);
const isEditFlowName = ref(false);
const editFlowNameId = ref();
const editData = ref();
const dialogType = ref('');
const isEditYaml = ref(false);
const isEditStartNode = ref(false);
const isEditCodeNode = ref(false);
const isEditDirectReplyNode = ref(false);
const isEditChoiceBranchNode = ref(false);
const isEditEnvironmentVariables = ref(false);
const nodeName = ref('');
const nodeDesc = ref('');
const currentCodeNodeData = ref({});
const currentDirectReplyNodeData = ref({});
const currentChoiceBranchNodeData = ref({});
const flowZoom = ref(1);
const debugDialogVisible = ref(false);
const apiServiceList = ref([]);
const allApiServiceList = ref([]);
const yamlContent = ref();
const nodeYamlId = ref();
const emits = defineEmits(['updateFlowsDebug']);
const route = useRoute();
const workFlowList = ref<any[]>([]);
const props = defineProps(['flowList']);
const flowObj = ref<{flowId?: string, debug?: boolean, name?: string, nodes?: any[], edges?: any[]}>({});
const nodes = ref<any[]>([]);
const debugStatus = ref('');
const debugTime = ref('');
const totalTime = ref(0);
const isNodeAndLineConnect = ref(false);
const isNodeConnect = ref(false);
const loading = ref(false);
const apiLoading = ref(false);
const themeStore = useChangeThemeStore();
const connectHandleNodeId = ref('');
const updateFlowsDebugStatus = ref(false);
// 添加选中节点状态管理
const selectedNodeId = ref('');

// 对话变量缓存 - 仅用于开始节点展示
const conversationVariablesForDisplay = ref<any[]>([]);
const variablesLoading = ref(false);

// 插入节点相关状态
const insertMenuData = ref({
  visible: false,
  position: { x: 0, y: 0 },
  edgeInfo: null,
  direction: 'right' as 'left' | 'right'
});

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

// 将watch移动到函数定义之后，避免提升问题

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


// 打开新增工作流弹窗
const addWorkFlow = () => {
  // 待增加新增弹窗
  dialogType.value = '新增';
  isAddWorkFlow.value = true;
};
// 关闭工作流弹出
const handleClose = (flowId?: string) => {
  if (isEditFlowName.value) {
    api.querySingleAppData({ id: route.query.appId as string }).then((res) => {
      //workflowList 数据更新
      workFlowList.value = res[1]?.result.workflows;
      const foundFlow = workFlowList.value.find((item: any) => item.id === flowId);
      if (foundFlow) {
        choiceFlowId(foundFlow);
      }
    });
  }
  isEditFlowName.value = false;
  isAddWorkFlow.value = false;
};
// 删除节点
const delNode = (id) => {
  if (id) {
    const node = findNode(id);
    node ? removeNodes(node) : '';
  }
};

// 处理变量更新事件 - 仅重新加载对话变量用于开始节点展示
const handleVariablesUpdated = async () => {  
  // 延迟加载，确保后端数据已经同步
  setTimeout(async () => {
    await loadConversationVariablesForDisplay();
  }, 300);
};

// 加载对话变量用于开始节点展示
const loadConversationVariablesForDisplay = async () => {
  if (!flowObj.value?.flowId) {
    console.warn('没有flowId，跳过变量加载');
    return;
  }
  
  variablesLoading.value = true;
  
  try {    
    // 只加载对话变量（不带current_step_id，因为是给开始节点展示用的）
    const convVars: any = await listVariables({ 
      scope: 'conversation', 
      flow_id: flowObj.value.flowId 
    });
    
    // 修复：支持多种API响应结构
    let variables: any[] = [];
    if (convVars?.result?.variables) {
      // 结构1: { result: { variables: [...] } }
      variables = convVars.result.variables;
    } else if (convVars?.variables) {
      // 结构2: { variables: [...], total: 1 }
      variables = convVars.variables;
    } else if (Array.isArray(convVars)) {
      // 结构3: 直接返回数组
      variables = convVars;
    }
    
    if (variables && Array.isArray(variables)) {
      conversationVariablesForDisplay.value = variables;
    } else {
      conversationVariablesForDisplay.value = [];
    }
    
  } catch (error) {
    console.error('❌ 加载对话变量失败:', error);
    ElMessage.error('加载对话变量失败');
  } finally {
    variablesLoading.value = false;
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
  // 查找当前节点
  const currentNode = findNode(nodeId);
  
  // 检查是否为Code类型节点
  if (currentNode && currentNode.data.callId === 'Code') {
    // 打开代码节点编辑器
    currentCodeNodeData.value = {
      name: currentNode.data.name,
      description: currentNode.data.description,
      callId: currentNode.data.callId,
      
      // 代码节点自身属性
      code: currentNode.data.code || '',
      codeType: currentNode.data.codeType || 'python',
      securityLevel: currentNode.data.securityLevel || 'low',
      timeoutSeconds: currentNode.data.timeoutSeconds || 30,
      memoryLimitMb: currentNode.data.memoryLimitMb || 128,
      cpuLimit: currentNode.data.cpuLimit || 0.5,
      
      // 用户定义的输入输出参数
      input_parameters: currentNode.data.parameters?.input_parameters || {},
      output_parameters: currentNode.data.parameters?.output_parameters || {},
    };
    nodeYamlId.value = nodeId;
    selectedNodeId.value = nodeId;
    isEditCodeNode.value = true;
  } else if (currentNode && currentNode.data.callId === 'DirectReply') {
    // 打开直接回复节点编辑器
    currentDirectReplyNodeData.value = {
      name: currentNode.data.name,
      description: currentNode.data.description,
      callId: currentNode.data.callId,
      parameters: {
        input_parameters: {
          answer: currentNode.data.parameters?.input_parameters?.answer || ''
        },
        output_parameters: currentNode.data.parameters?.output_parameters || {}
      }
    };
    nodeYamlId.value = nodeId;
    selectedNodeId.value = nodeId;
    isEditDirectReplyNode.value = true;
  } else if (currentNode && currentNode.data.callId === 'Choice') {
    // 打开条件分支节点编辑器
    currentChoiceBranchNodeData.value = {
      name: currentNode.data.name,
      description: currentNode.data.description,
      callId: currentNode.data.callId,
      parameters: currentNode.data.parameters || {
        input_parameters: { choices: [] },
        output_parameters: { 
  branch_id: {
    type: 'string',
    description: '选中的分支ID'
  }
}
      }
    };
    nodeYamlId.value = nodeId;
    selectedNodeId.value = nodeId;
    isEditChoiceBranchNode.value = true;
  } else {
    // 打开YAML编辑器（其他节点类型）
    yamlContent.value = yamlCode;
    nodeName.value = name;
    nodeDesc.value = desc;
    isEditYaml.value = true;
    nodeYamlId.value = nodeId;
    selectedNodeId.value = nodeId;
  }
  
  // 编辑时，需要debug 后才可发布
  emits('updateFlowsDebug', false);
};
// 关闭抽屉
const closeDrawer = () => {
  isEditYaml.value = false;
  // 清除选中状态
  selectedNodeId.value = '';
};

// 关闭代码节点抽屉
const closeCodeNodeDrawer = () => {
  isEditCodeNode.value = false;
  selectedNodeId.value = '';
  currentCodeNodeData.value = {};
};

// 保存代码节点
const saveCodeNode = (nodeData, nodeId) => {
  // 更新节点数据
  const updateNodeParameter = {
    id: nodeId,
    ...nodeData,
  };
  
  // 调用保存接口
  saveFlow(updateNodeParameter);
  
  // 关闭抽屉
  closeCodeNodeDrawer();
  
  ElMessage.success('代码节点保存成功');
};

// 关闭直接回复节点抽屉
const closeDirectReplyDrawer = () => {
  isEditDirectReplyNode.value = false;
  selectedNodeId.value = '';
  currentDirectReplyNodeData.value = {};
};

// 保存直接回复节点
const saveDirectReplyNode = (nodeData, nodeId) => {
  // 更新节点数据
  const updateNodeParameter = {
    id: nodeId,
    ...nodeData,
  };
  
  // 调用保存接口
  saveFlow(updateNodeParameter);
  
  // 关闭抽屉
  closeDirectReplyDrawer();
  
  ElMessage.success('直接回复节点保存成功');
};

// 关闭条件分支节点抽屉
const closeChoiceBranchDrawer = () => {
  isEditChoiceBranchNode.value = false;
  selectedNodeId.value = '';
  currentChoiceBranchNodeData.value = {};
};

// 保存条件分支节点
const saveChoiceBranchNode = (nodeData, nodeId) => {
  // 更新节点数据
  const updateNodeParameter = {
    id: nodeId,
    ...nodeData,
  };
  
  // 调用保存接口
  saveFlow(updateNodeParameter);
  
  // 关闭抽屉
  closeChoiceBranchDrawer();
  
  ElMessage.success('条件分支节点保存成功');
};

// 打开环境变量配置
const openEnvironmentVariables = () => {
  if (debugDialogVisible.value) {
    return; // 调试模式下不响应点击
  }
  if (!flowObj.value?.flowId) {
    ElMessage.warning('请先选择工作流');
    return;
  }
  isEditEnvironmentVariables.value = true;
};

// 关闭环境变量配置
const closeEnvironmentVariables = () => {
  isEditEnvironmentVariables.value = false;
};

// 编辑开始节点
const editStartNodeDrawer = async (name, desc, yamlCode, nodeId) => {
  yamlContent.value = yamlCode;
  nodeName.value = name;
  nodeDesc.value = desc;
  nodeYamlId.value = nodeId;
  // 设置选中的节点
  selectedNodeId.value = nodeId;
  
  isEditStartNode.value = true;
  // 编辑 yaml 时，需要debug 后才可发布
  emits('updateFlowsDebug', false);
};

// 关闭开始节点抽屉
const closeStartNodeDrawer = () => {
  isEditStartNode.value = false;
  // 清除选中状态
  selectedNodeId.value = '';
};

// 保存开始节点 - 注意：变量管理通过variable接口，这里只保存节点基础信息
const saveStartNode = (nodeId, name, description) => {
  // 只更新节点的基础信息
  const updateNodeParameter = {
    id: nodeId,
    name,
    description,
  };
  saveFlow(updateNodeParameter);
};

// 处理保存节点描述事件
const handleSaveNodeDescription = (nodeInfo) => {
  // 调用saveFlow方法保存到后端
  saveFlow(nodeInfo);
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
    ElMessage.warning(i18n.global.t('app.create_or_edit_workflow_first'));
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
      const services = res[1]?.result.services || [];
 
      apiServiceList.value = services;
      allApiServiceList.value = services;
      apiLoading.value = false;
    });
  handleChangeZoom(DefaultViewPortZoom);
});

onUnmounted(() => {
  // 组件销毁时，清空sessionStorage的veiwport位置
  sessionStorage.setItem('workflowViewPortX', '');
  sessionStorage.setItem('workflowViewPortY', '');
});



// 处理节点拖拽开始事件
const handleNodeDragStart = (event: DragEvent, node: any) => {
  onDragStart(event, node.type, {
    serviceId: node.serviceId,
    ...node,
  });
};

const handleDebugDialogOps = (visible) => {
  // 这里将对应的保存
  if (!debugDialogVisible.value) {
    //在点击调试时，默认该
    if (!updateFlowsDebugStatus.value) {
      flowObj.value.debug = false;
    }
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
    updateFlowsDebugStatus.value = false;
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
  updateFlowsDebugStatus.value = false;
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
          const flowDataList = res?.[1]?.result?.workflows || [];
          // 更新当前publish状态
          emits('updateFlowsDebug', '', flowDataList);
          updateFlowsDebugStatus.value = true;
        }
        loading.value = false;
      });
  }
};
const openEditFlowDialog = (item) => {
  editFlowNameId.value = item.id;
  editFlow(item);
  isEditFlowName.value = true;
};
// 点击编辑工作流--查询当前工作流数据-后续添加回显
const editFlow = async (item) => {
  loading.value = true;
  try {
    const res = await api.querySingleFlowTopology({
      appId: route.query?.appId,
      flowId: item.id,
    });
    
    if (res[1]?.result?.flow) {
      flowObj.value = res[1].result.flow;
      redrageFlow(flowObj.value.nodes || [], flowObj.value.edges || []);
      
      // 加载对话变量用于开始节点展示
      await loadConversationVariablesForDisplay();
    }
  } catch (error) {
    console.error('加载工作流失败:', error);
  } finally {
    loading.value = false;
  }
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
      appId: route.query?.appId as string,
      flowId: item.id,
    })
    .then((res) => {
      if (res[1]?.result) {
        ElMessage.success(i18n.global.t('app.deleteWorkflowSuccessfully'));
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

// 监听props变化，选择默认工作流
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
    } else if (node.callId === 'Choice') {
      newNode.type = 'Choice';
      
      // 处理Choice节点的参数，确保包含ELSE分支
      const choices = node.parameters?.input_parameters?.choices || [];
      
      // 检查是否已有默认分支
      const hasDefaultBranch = choices.some(choice => choice.is_default === true);
      
      // 如果没有默认分支，添加一个ELSE分支
      if (!hasDefaultBranch) {
        choices.push({
          branch_id: `else_${node.stepId || Date.now()}`,
          name: 'ELSE',
          is_default: true,
          conditions: [],
          logic: 'and'
        });
      }
      
      newNode.data = {
        ...newNode.data,
        parameters: {
          input_parameters: { 
            choices: choices 
          },
          output_parameters: node.parameters?.output_parameters || { 
            branch_id: {
              type: 'string',
              description: '选中的分支ID'
            }
          }
        }
      };
    } else if (node.callId === 'Code') {
      // Code节点特殊处理：从parameters中提取特有属性并添加到data中
      newNode.type = 'custom';
      newNode.data = {
        ...newNode.data,
        nodeId: 'Code',  // 设置正确的nodeId
        // 从parameters中提取Code节点特有的配置属性
        code: node.parameters?.code || '',
        codeType: node.parameters?.codeType || 'python',
        securityLevel: node.parameters?.securityLevel || 'low',
        timeoutSeconds: node.parameters?.timeoutSeconds || 30,
        memoryLimitMb: node.parameters?.memoryLimitMb || 128,
        cpuLimit: node.parameters?.cpuLimit || 0.5,
      };
    } else if (node.callId === 'DirectReply') {
      // DirectReply节点特殊处理
      newNode.type = 'custom';
      newNode.data = {
        ...newNode.data,
        nodeId: 'DirectReply',
        callId: 'DirectReply',
      };
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

// 处理插入节点事件
const handleInsertNode = (edgeInfo) => {
  if (debugDialogVisible.value) {
    return; // 调试模式下不允许插入节点
  }
  
  // 获取Vue Flow画布的viewport信息
  const viewport = getViewport();
  
  // 获取Vue Flow容器的位置信息
  const vueFlowElement = document.querySelector('.vue-flow__viewport');
  const containerRect = vueFlowElement?.getBoundingClientRect();
  
  if (!containerRect) {
    console.error('无法获取Vue Flow容器位置');
    return;
  }
  
  // 将画布坐标转换为相对于Vue Flow容器的坐标
  const containerX = edgeInfo.midX * viewport.zoom + viewport.x;
  const containerY = edgeInfo.midY * viewport.zoom + viewport.y;
  
  // 计算建议的菜单方向（不做位置调整，只做方向建议）
  const menuWidth = 400;
  let direction: 'left' | 'right' = 'right';
  
  // 简单的方向建议：如果右侧空间不足，建议左侧显示
  if (containerX + menuWidth + 20 > containerRect.width) {
    direction = 'left';
  } else {
    direction = 'right';
  }
  
  // 更新插入菜单数据（直接传递容器坐标，让子组件处理边界）
  insertMenuData.value = {
    visible: true,
    position: {
      x: containerX,
      y: containerY
    },
    edgeInfo,
    direction
  };
};

// 关闭插入节点菜单
const closeInsertNodeMenu = () => {
  insertMenuData.value.visible = false;
  insertMenuData.value.edgeInfo = null;
  insertMenuData.value.position = { x: 0, y: 0 };
};

// 执行插入节点操作
const executeInsertNode = (nodeMetaData) => {
  try {
    if (!insertMenuData.value.edgeInfo) {
      console.error('没有边信息，无法插入节点');
      return;
    }
    
    const edgeInfo = insertMenuData.value.edgeInfo;
    
    // 生成新节点ID
    const newNodeId = `node_${Date.now()}`;
    
    // 找到源边
    const sourceEdge = getEdges.value.find(edge => edge.id === edgeInfo.edgeId);
    if (!sourceEdge) {
      console.error('找不到要插入的边');
      return;
    }
    
    // 创建新节点
    const newNode = {
      id: newNodeId,
      type: nodeMetaData.callId === 'Choice' ? 'Choice' : 'custom',
      position: {
        x: edgeInfo.midX - 100, // 节点宽度的一半
        y: edgeInfo.midY - 40   // 节点高度的一半
      },
      data: {
        name: nodeMetaData.name,
        description: nodeMetaData.description,
        nodeId: nodeMetaData.nodeId,
        callId: nodeMetaData.callId,
        serviceId: nodeMetaData.serviceId || 'default',
        parameters: nodeMetaData.callId === 'Choice' ? {
          input_parameters: { 
            choices: [
              {
                branch_id: `else_${newNodeId}`,
                name: 'ELSE',
                is_default: true,
                conditions: [],
                logic: 'and'
              }
            ]
          },
          output_parameters: { 
            branch_id: {
              type: 'string',
              description: '选中的分支ID'
            }
          }
        } : {
          input_parameters: {},
          output_parameters: {}
        }
      },
      deletable: true
    };
    
    // 添加新节点
    const currentNodes = [...getNodes.value, newNode];
    setNodes(currentNodes);
    
    // 删除原来的边
    const currentEdges = getEdges.value.filter(edge => edge.id !== edgeInfo.edgeId);
    
    // 创建新的边：源节点 -> 新节点 -> 目标节点
    const newEdge1 = {
      id: `edge_${Date.now()}_1`,
      source: sourceEdge.source,
      target: newNodeId,
      sourceHandle: sourceEdge.sourceHandle,
      type: 'normal',
      data: {
        sourceStatus: 'default',
        targetStatus: 'default'
      }
    };
    
    const newEdge2 = {
      id: `edge_${Date.now()}_2`, 
      source: newNodeId,
      target: sourceEdge.target,
      targetHandle: sourceEdge.targetHandle,
      type: 'normal',
      data: {
        sourceStatus: 'default',
        targetStatus: 'default'
      }
    };
    
    // 设置新的边
    setEdges([...currentEdges, newEdge1, newEdge2]);
    
    // 触发工作流状态更新
    emits('updateFlowsDebug', false);
    updateFlowsDebugStatus.value = false;
    nodeAndLineConnection();
    
    // 关闭菜单
    closeInsertNodeMenu();
    
    ElMessage.success(`${nodeMetaData.name} 节点插入成功`);
    
  } catch (error) {
    console.error('插入节点失败:', error);
    ElMessage.error('插入节点失败');
  }
};

// 接受工作流调试时获取的相应的数据
$bus.on('getNodesStatue', (item: any) => {
  // 对相应节点修改状态--此处需要分为开始/结束,分支,普通三种节点修改
  try {
    const newLines = item;
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
  } catch {
    ElMessage.error(i18n.global.t('semantic.checkFormat'));
  }
  // 修改节点时，需要将对应节点的边也进行修改
});

// 这里结束整个工作流对话
$bus.on('debugChatEnd', () => {
  // 更新发布按钮状态
  queryFlow('update');
  updateFlowsDebugStatus.value = true;
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

// 保存当前handle拖拽的nodeid--以便于拖拽结束时，设置该节点handle恢复默认状态
const updateConnectHandle = (nodeId) => {
  connectHandleNodeId.value = nodeId;
};

// 这里是松开鼠标时[拖拽结束]-恢复不再拖拽的handle节点默认状态【对应的是customNode里拖拽节点设置状态】
const cancelConnectStatus = () => {
  if (connectHandleNodeId.value) {
    // 获取到当前的node,更新
    const node = findNode(connectHandleNodeId.value);
    // 这里获取node的data
    const data = node?.data;
    // 根据当前id，更新下data重新赋值，初始化节点状态和handle状态
    updateNode(connectHandleNodeId.value, { data: { ...data } });
    // 将其置空
    connectHandleNodeId.value = '';
  }
};

const saveFlow = (updateNodeParameter?, debug?) => {
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
      nodeId: item.data.nodeId,  // 添加nodeId字段
      type: item.data.nodeId,
    };
    
    // 对于Code节点，需要特殊处理parameters结构
    if (item.data.callId === 'Code') {
      // Code节点：将所有配置放在parameters中
      newItem = {
        ...newItem,
        callId: item.data.callId,
        name: item.data.name,
        description: item.data.description,
        parameters: {
          input_parameters: item.data.parameters?.input_parameters || {},
          output_parameters: item.data.parameters?.output_parameters || {},
          code: item.data.code || '',
          codeType: item.data.codeType || 'python',
          securityLevel: item.data.securityLevel || 'low',
          timeoutSeconds: item.data.timeoutSeconds || 30,
          memoryLimitMb: item.data.memoryLimitMb || 128,
          cpuLimit: item.data.cpuLimit || 0.5,
        }
      };
    } else {
      // 其他节点：使用原有逻辑
      newItem = {
        ...newItem,
        ...otherItem,
      };
    }
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
      // 处理分支节点保存，确保包含ELSE分支
      const choices = item.data.parameters?.input_parameters?.choices || [];
      
      // 检查是否已有默认分支
      const hasDefaultBranch = choices.some(choice => choice.is_default === true);
      
      // 如果没有默认分支，添加一个ELSE分支
      if (!hasDefaultBranch) {
        choices.push({
          branch_id: `else_${item.id || Date.now()}`,
          name: 'ELSE',
          is_default: true,
          conditions: [],
          logic: 'and'
        });
      }
      
      newItem = {
        ...newItem,
        callId: 'Choice',
        parameters: {
          input_parameters: { choices: choices },
          output_parameters: item.data.parameters?.output_parameters || { 
            branch_id: {
              type: 'string',
              description: '选中的分支ID'
            }
          }
        },
      };
    } else if (item.type === 'Choice') {
      // 处理Choice节点保存，确保包含ELSE分支
      const choices = item.data.parameters?.input_parameters?.choices || [];
      
      // 检查是否已有默认分支
      const hasDefaultBranch = choices.some(choice => choice.is_default === true);
      
      // 如果没有默认分支，添加一个ELSE分支
      if (!hasDefaultBranch) {
        choices.push({
          branch_id: `else_${item.id || Date.now()}`,
          name: 'ELSE',
          is_default: true,
          conditions: [],
          logic: 'and'
        });
      }
      
      newItem = {
        ...newItem,
        callId: 'Choice',
        parameters: {
          input_parameters: { choices: choices },
          output_parameters: item.data.parameters?.output_parameters || { 
            branch_id: {
              type: 'string',
              description: '选中的分支ID'
            }
          }
        },
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
        if (item.type === 'Code') {
          item.parameters.input_parameters = updateNodeParameter.parameters.input_parameters;
          item.parameters.output_parameters = updateNodeParameter.parameters.output_parameters;
          item.parameters.code = updateNodeParameter.parameters.code;
          item.parameters.codeType = updateNodeParameter.parameters.codeType;
          item.parameters.securityLevel = updateNodeParameter.parameters.securityLevel;
          item.parameters.timeoutSeconds = updateNodeParameter.parameters.timeoutSeconds;
          item.parameters.memoryLimitMb = updateNodeParameter.parameters.memoryLimitMb;
          item.parameters.cpuLimit = updateNodeParameter.parameters.cpuLimit;
        } else if (item.callId === 'DirectReply') {
          // 确保parameters对象存在
          if (!item.parameters) {
            item.parameters = {};
          }
          item.parameters.input_parameters = updateNodeParameter.parameters.input_parameters;
          item.parameters.output_parameters = updateNodeParameter.parameters.output_parameters;
        } else if (item.callId === 'Choice') {
          // 条件分支节点
          if (!item.parameters) {
            item.parameters = {};
          }
          item.parameters.input_parameters = updateNodeParameter.parameters.input_parameters;
          item.parameters.output_parameters = updateNodeParameter.parameters.output_parameters;
        } else if (item.type === 'start') {
          item.variables == updateNodeParameter.variables;
        } else if (item.inputStream !== undefined) {
          // 确保parameters对象存在
          if (!item.parameters) {
            item.parameters = {};
          }
          // 当Node以yaml编辑器形式修改了参数
          // 检查updateNodeParameter.inputStream是否包含新的数据结构
          if (updateNodeParameter.inputStream.input_parameters !== undefined && 
              updateNodeParameter.inputStream.output_parameters !== undefined) {
            
            item.parameters.input_parameters = updateNodeParameter.inputStream.input_parameters;
            item.parameters.output_parameters = updateNodeParameter.inputStream.output_parameters;
          } else {
            // 旧格式：兼容处理
            item.parameters.input_parameters = updateNodeParameter.inputStream;
          }
        }
        item.name = updateNodeParameter.name;
        item.description = updateNodeParameter.description;
      }
    });
  }
  if (debug) {
    flowObj.value.debug = true;
  }
  // 更新最新的节点与边的数据
  api
    .createOrUpdateFlowTopology(
      {
        appId: appId,
        flowId: flowObj.value.flowId,
      },
      {
        flow: {
          ...flowObj.value,
          nodes: updateNodes,
          edges: updateEdges,
          focusPoint: {
            x: 800,
            y: 800,
          },
        },
      },
    )
    .then((res) => {
      if (res[1]?.result) {
        queryFlow('update');
        const updatedCurFlow = res[1].result.flow;
        isNodeConnect.value = res[1].result.connectivity;
        redrageFlow(updatedCurFlow?.nodes, updatedCurFlow?.edges);
      }
      loading.value = false;
    });
};

// TODO saveNode -> saveNodeYaml，仅当以yaml形式保存时才调用
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
      <el-tooltip
        placement="right"
        :content="
          isCopilotAsideVisible ? '收起节点面板' : '展开节点面板 - 拖拽节点创建工作流'
        "
      >
        <div
          class="node-panel-toggle"
          :class="{ collapsed: !isCopilotAsideVisible, expanded: isCopilotAsideVisible }"
          @click="hanleAsideVisible"
        >
          <!-- 折叠状态：显示节点图标 + 箭头 -->
          <div v-if="!isCopilotAsideVisible" class="collapsed-content">
            <div class="expand-arrow">›</div>
            <div class="drag-hint">拖拉拽新建节点</div>
          </div>
          
          <!-- 展开状态：显示收起箭头 -->
          <div v-else class="expanded-content">
            <div class="collapse-arrow">‹</div>
          </div>
        </div>
      </el-tooltip>

      <transition name="transition-fade">
        <div class="copilot-aside-new" v-if="isCopilotAsideVisible">
          <CustomLoading :loading="apiLoading"></CustomLoading>
          <!-- Tab切换 -->
          <div class="aside-tabs">
            <div class="tab-item active">
              节点
            </div>
            <div class="tab-item disabled">
              应用
            </div>
          </div>
          
          <div class="aside-content">
            <NodeListPanel
              :api-service-list="apiServiceList"
              :search-placeholder="$t('semantic.interface_search')"
              :enable-drag="true"
              :on-drag-start="handleNodeDragStart"
            />
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
        @mouseup="cancelConnectStatus"
      >
        <Background
          :color="themeStore.theme === 'dark' ? '#3e4551' : '#dfe5ef'"
          :size="2"
          :gap="8"
        />
        <MiniMap
          v-if="workFlowList.length"
          :width="220"
          :mask-color="themeStore.theme === 'dark' ? '#2a2f37' : '#f4f6fa'"
          :mask-stroke-width="250"
        />
        <CustomControl
          v-if="workFlowList.length"
          :handleChangeZoom="handleChangeZoom"
          :flowZoom="flowZoom"
          :layoutGraph="layoutGraph"
        />
        <!-- 自定义节点 -->
        <template #node-custom="customNodeProps">
          <CustomNode
            v-bind="customNodeProps"
            :disabled="debugDialogVisible"
            :selected="selectedNodeId === customNodeProps.id"
            @delNode="delNode"
            @editYamlDrawer="editYamlDrawer"
            @updateConnectHandle="updateConnectHandle"
          ></CustomNode>
        </template>

        <!-- 自定义分支节点 -->
        <template #node-branch="branchNodeProps">
          <BranchNode
            v-bind="branchNodeProps"
            :disabled="debugDialogVisible"
            :selected="selectedNodeId === branchNodeProps.id"
            @delNode="delNode"
            @editYamlDrawer="editYamlDrawer"
          ></BranchNode>
        </template>

        <!-- 条件分支节点 -->
        <template #node-Choice="choiceBranchNodeProps">
          <ChoiceBranchNode
            v-bind="choiceBranchNodeProps"
            :disabled="debugDialogVisible"
            :selected="selectedNodeId === choiceBranchNodeProps.id"
            @delNode="delNode"
            @editYamlDrawer="editYamlDrawer"
            @updateConnectHandle="updateConnectHandle"
          ></ChoiceBranchNode>
        </template>

        <!-- 开始结束节点 -->
        <template #node-start="nodeStartProps">
          <CustomSaENode
            @updateConnectHandle="updateConnectHandle"
            @editYamlDrawer="editYamlDrawer"
            @editStartNodeDrawer="editStartNodeDrawer"
            :selected="selectedNodeId === nodeStartProps.id"
            :conversationVariables="conversationVariablesForDisplay"
            v-bind="nodeStartProps"
          ></CustomSaENode>
        </template>

        <template #node-end="nodeEndProps">
          <CustomSaENode
            @updateConnectHandle="updateConnectHandle"
            @editYamlDrawer="editYamlDrawer"
            @editStartNodeDrawer="editStartNodeDrawer"
            :selected="selectedNodeId === nodeEndProps.id"
            v-bind="nodeEndProps"
          ></CustomSaENode>
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
            :disabled="debugDialogVisible"
            @insertNode="handleInsertNode"
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
            :placeholder="$t('flow.choose_flow')"
            :suffix-icon="IconCaretDown"
          >
            <el-option
              class="workFlowOption"
              v-for="item in workFlowList"
              :label="item.name"
              :value="item.name"
              :key="item.id"
              @click="choiceFlowId(item)"
            >
              <div class="flowName">{{ item.name }}</div>
              <div
                class="dealIcon editIcon"
                @click="openEditFlowDialog(item)"
              ></div>
              <div class="dealIcon delIcon" @click.stop="delFlow(item)"></div>
            </el-option>
            <template #footer class="selectFooter">
              <div class="addWorkFlow" @click="addWorkFlow">
                <el-icon>
                  <IconPlusCircle></IconPlusCircle>
                </el-icon>
                <span>{{ $t('flow.create_flow') }}</span>
              </div>
            </template>
          </el-select>
        </div>
        <el-tooltip
          v-if="workFlowItemName && flowObj?.flowId"
          effect="dark"
          content="配置环境变量"
          placement="top"
        >
          <div
            class="envBtn"
            :class="{ isEnvDis: debugDialogVisible }"
            @click="openEnvironmentVariables"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M20 18a1 1 0 0 1-1 1h-4a3 3 0 0 0-3 3a3 3 0 0 0-3-3H5a1 1 0 0 1-1-1H2a3 3 0 0 0 3 3h4a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2h4a3 3 0 0 0 3-3Zm0-12a1 1 0 0 0-1-1h-4a3 3 0 0 1-3-3a3 3 0 0 1-3 3H5a1 1 0 0 0-1 1H2a3 3 0 0 1 3-3h4a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2h4a3 3 0 0 1 3 3Zm-8 6L9 8H7v8h2v-4l3 4h2V8h-2zm9-4l-2 5.27L17 8h-2l3 8h2l3-8zM1 8v8h5v-2H3v-1h2v-2H3v-1h3V8z" />
            </svg>
          </div>
        </el-tooltip>
        <el-tooltip
          v-if="!isNodeAndLineConnect && !isNodeConnect"
          effect="dark"
          :content="$t('semantic.publish_condition')"
          placement="top"
        >
          <div class="debugBtn isDebugDis"></div>
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
          <div class="resultText">{{ $t(`flow.${StatusInfoTitle[debugStatus]}`) }}</div>
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
        <div class="noFlowDesc">{{ $t('flow.no_flow') }}</div>
        <el-button type="primary" class="w96 addWorkFlow" @click="addWorkFlow">
          {{ $t('flow.create_flow') }}
        </el-button>
      </div>
    </div>
    <EditFlowName
      v-model="isEditFlowName"
      :flowObj="flowObj"
      :appId="route.query?.appId"
      :editFlowNameId="editFlowNameId"
      @handleClose="handleClose"
    ></EditFlowName>
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
  
  <!-- 开始节点表单编辑器 - 基于变量接口 -->
  <VariableBasedStartNodeDrawer
    v-if="isEditStartNode"
    @closeDrawer="closeStartNodeDrawer"
    @saveStartNode="saveStartNode"
    @variablesUpdated="handleVariablesUpdated"
    @saveNodeDescription="handleSaveNodeDescription"
    :appId="route.query?.appId"
    :flowId="flowObj?.flowId"
    :yamlContent="yamlContent"
    :nodeName="nodeName"
    :nodeDesc="nodeDesc"
    :nodeYamlId="nodeYamlId"
    :conversationId="conversationId"
  ></VariableBasedStartNodeDrawer>
  
  <!-- 代码节点编辑器 - 基于变量逻辑 -->
  <CodeNodeDrawer
    :visible="isEditCodeNode"
    :nodeData="currentCodeNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    @update:visible="closeCodeNodeDrawer"
    @saveNode="saveCodeNode"
  />
  
  <!-- 直接回复节点编辑器 -->
  <DirectReplyDrawer
    :visible="isEditDirectReplyNode"
    :nodeData="currentDirectReplyNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    @update:visible="closeDirectReplyDrawer"
    @saveNode="saveDirectReplyNode"
  />
  
  <!-- 条件分支节点编辑器 -->
  <ChoiceBranchDrawer
    :visible="isEditChoiceBranchNode"
    :nodeData="currentChoiceBranchNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    @update:visible="closeChoiceBranchDrawer"
    @saveNode="saveChoiceBranchNode"
  />
  
  <!-- 插入节点选择菜单 -->
  <InsertNodeMenu
    :visible="insertMenuData.visible"
    :position="insertMenuData.position"
    :menu-direction="insertMenuData.direction"
    :api-service-list="apiServiceList"
    @close="closeInsertNodeMenu"
    @select-node="executeInsertNode"
  />
  
  <!-- 环境变量配置抽屉 -->
  <EnvironmentVariableDrawer
    v-if="isEditEnvironmentVariables"
    :flowId="flowObj?.flowId"
    @closeDrawer="closeEnvironmentVariables"
  />
</template>

<style lang="scss" scoped>
// 新的展开按钮样式
.node-panel-toggle {
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: 2px solid white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  z-index: 1000;
  
  &.collapsed {
    width: 30px;
    height: 120px;
    
    &:hover {
      transform: translateY(-50%) scale(1.05);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
      
      .collapsed-content {
        .expand-arrow {
          transform: translate(-50%, -50%) translateY(-40px);
        }
        
        .drag-hint {
          opacity: 1;
          transform: translateX(-50%);
        }
      }
    }
  }
  
  &.expanded {
    width: 40px;
    height: 40px;
    
    &:hover {
      transform: translateY(-50%) scale(1.1);
      background: linear-gradient(135deg, #5b5fc7 0%, #7c3aed 100%);
    }
  }
  
  .collapsed-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 4px;
    position: relative;
    
    .expand-arrow {
      color: white;
      font-size: 16px;
      font-weight: bold;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .drag-hint {
      color: white;
      font-size: 8px;
      font-weight: 500;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: center;
      line-height: 1.2;
      position: absolute;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      writing-mode: vertical-rl;
      text-orientation: upright;
      letter-spacing: 2px;
    }
  }
  
  .expanded-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    
    .collapse-arrow {
      color: white;
      font-size: 18px;
      font-weight: bold;
    }
  }
}

// 新的Aside样式，模仿insertNodeMenu.vue
.copilot-aside-new {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e4e8;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .aside-tabs {
    display: flex;
    padding: 12px 20px;
    border-bottom: 1px solid #e1e4e8;
    background: #f8f9fa;
    
    .tab-item {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #586069;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      
      &.active {
        color: #6395fd;
        border-bottom-color: #6395fd;
      }
      
      &.disabled {
        color: #c0c4cc;
        cursor: not-allowed;
      }
      
      &:hover:not(.disabled) {
        color: #6395fd;
      }
    }
  }
  
  .aside-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

// 环境变量按钮样式
.envBtn {
  width: 32px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #e0e7ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  color: #486bf7;
  cursor: pointer;
  
  &:hover {
    background: #dbeafe;
    border-color: #93c5fd;
    color: #2563eb; 
  }
  &:active {
    background: #bfdbfe;
  }
}
.envBtn.isEnvDis {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

// 深色主题支持
.dark {
  .node-panel-toggle {
    background: linear-gradient(135deg, #4c1d95 0%, #6b21a8 100%);
    border-color: #374151;
    box-shadow: 0 4px 12px rgba(76, 29, 149, 0.3);
    
    &.collapsed {
      &:hover {
        box-shadow: 0 6px 20px rgba(76, 29, 149, 0.4);
      }
    }
    
    &.expanded {
      &:hover {
        background: linear-gradient(135deg, #3c1361 0%, #581c87 100%);
      }
    }
    

  }
  
  .copilot-aside-new {
    background: #2d3748;
    border-color: #4a5568;
    
    .aside-tabs {
      background: #374151;
      border-bottom-color: #4a5568;
      
      .tab-item {
        color: #a0aec0;
        
        &.active {
          color: #6395fd;
          border-bottom-color: #6395fd;
        }
        
        &.disabled {
          color: #718096;
          cursor: not-allowed;
        }
        
        &:hover:not(.disabled) {
          color: #e2e8f0;
        }
      }
    }
  }
  
  .envBtn {
    background: #1e3a8a;
    border-color: #3730a3;
    color: #60a5fa;
    
    &:hover {
      background: #1e40af;
      border-color: #4338ca;
      color: #93c5fd;
    }
    &:active {
      background: #1d4ed8;
    }
    
    &.isEnvDis {
      background: #374151;
      border-color: #4b5563;
      color: #6b7280;
    }
  }
}
</style>