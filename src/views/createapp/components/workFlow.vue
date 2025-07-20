<script setup lang="ts">
import '../../styles/workFlowArrange.scss';
import { onMounted, ref, watch, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { VueFlow, useVueFlow } from '@vue-flow/core';
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
import { api } from 'src/apis';
// 导入变量API
import { listVariables } from '@/api/variable';
import { StatusInfoTitle } from './types';
import { useRoute } from 'vue-router';
import { getSrcIcon, DefaultViewPortZoom } from './types';
import $bus from 'src/bus/index';
import CustomLoading from '../../customLoading/index.vue';
import EditFlowName from './workFlowConfig/editFlowName.vue';

const { t } = useI18n();
const copilotAside = ref<HTMLElement>();
const isCopilotAsideVisible = ref(true);
const apiSearchValue = ref();
const activeNames = ref([]);
const activeName = ref();
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
const nodeName = ref('');
const nodeDesc = ref('');
const currentCodeNodeData = ref({});
const currentDirectReplyNodeData = ref({});
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
const isNodeConnect = ref(false);
const loading = ref(false);
const apiLoading = ref(false);
const themeStore = useChangeThemeStore();
const connectHandleNodeId = ref('');
const updateFlowsDebugStatus = ref(false);
// 添加选中节点状态管理
const selectedNodeId = ref('');

// 变量相关状态管理
const variablesCache = ref(new Map());
const variablesLoading = ref(false);
const conversationId = ref(''); // 从路由或props获取

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
const handleChange = () => {
  activeNames.value = activeName.value;
};

// 打开新增工作流弹窗
const addWorkFlow = () => {
  // 待增加新增弹窗
  dialogType.value = '新增';
  isAddWorkFlow.value = true;
};
// 关闭工作流弹出
const handleClose = (flowId?: string) => {
  if (isEditFlowName.value) {
    api.querySingleAppData({ id: route.query.appId }).then((res) => {
      //workflowList 数据更新
      workFlowList.value = res[1]?.result.workflows;
      choiceFlowId(workFlowList.value.find((item) => item.id === flowId));
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

// 注意：变量管理通过variable接口直接处理，不需要附加到工作流节点中

// 获取对话变量用于显示 - 使用computed确保响应式更新
const conversationVariablesForDisplay = computed(() => {
  const conversationVars = variablesCache.value.get('conversation') || [];
  console.log('🎯 获取对话变量用于显示 (computed) - 重新计算触发!');
  console.log('🎯 当前变量数据:', conversationVars);
  console.log('🎯 变量数量:', conversationVars.length);
  console.log('🎯 变量名列表:', conversationVars.map(v => v?.name || 'unnamed'));
  console.log('🎯 缓存Map引用:', variablesCache.value);
  console.log('🎯 conversation键是否存在:', variablesCache.value.has('conversation'));
  return conversationVars;
});

// 处理变量更新事件
const handleVariablesUpdated = async () => {
  console.log('🔄 收到变量更新通知，延迟300ms后重新加载变量数据...');
  console.log('🔄 删除前缓存的对话变量:', variablesCache.value.get('conversation'));
  
  // 延迟加载，确保后端数据已经同步
  setTimeout(async () => {
    await loadWorkflowVariables();
    console.log('✅ 父组件变量数据已重新加载');
    console.log('📊 删除后缓存的对话变量:', variablesCache.value.get('conversation'));
  }, 300);
};

// 加载工作流变量
const loadWorkflowVariables = async () => {
  if (!flowObj.value?.flowId) {
    console.warn('没有flowId，跳过变量加载');
    return;
  }
  
  variablesLoading.value = true;
  
  try {
    console.log('🔄 开始加载工作流变量...');
    
    // 加载系统变量
    const systemVars = await listVariables({ scope: 'system' });
    const systemVariables = systemVars?.result?.variables || systemVars?.variables || (Array.isArray(systemVars) ? systemVars : []);
    if (systemVariables.length > 0) {
      variablesCache.value.set('system', systemVariables);
      console.log('✅ 系统变量加载成功:', systemVariables.length, '个');
    }
    
    // 加载用户变量  
    const userVars = await listVariables({ scope: 'user' });
    const userVariables = userVars?.result?.variables || userVars?.variables || (Array.isArray(userVars) ? userVars : []);
    if (userVariables.length > 0) {
      variablesCache.value.set('user', userVariables);
      console.log('✅ 用户变量加载成功:', userVariables.length, '个');
    }
    
    // 加载环境变量
    const envVars = await listVariables({ scope: 'env' });
    const envVariables = envVars?.result?.variables || envVars?.variables || (Array.isArray(envVars) ? envVars : []);
    if (envVariables.length > 0) {
      variablesCache.value.set('env', envVariables);
      console.log('✅ 环境变量加载成功:', envVariables.length, '个');
    }
    
    // 加载对话变量（使用flowId）
    console.log('🔄 准备调用对话变量API, flowId:', flowObj.value.flowId);
    console.log('🔍 父组件LIST API使用的flowId:', flowObj.value.flowId);
    const convVars = await listVariables({ 
      scope: 'conversation', 
      flow_id: flowObj.value.flowId 
    });
    console.log('📥 对话变量API响应:', convVars);
    
    // 修复：支持多种API响应结构
    let variables = null;
    if (convVars?.result?.variables) {
      // 结构1: { result: { variables: [...] } }
      variables = convVars.result.variables;
      console.log('📋 使用result.variables结构');
    } else if (convVars?.variables) {
      // 结构2: { variables: [...], total: 1 }
      variables = convVars.variables;
      console.log('📋 使用直接variables结构');
    } else if (Array.isArray(convVars)) {
      // 结构3: 直接返回数组
      variables = convVars;
      console.log('📋 使用数组结构');
    }
    
    if (variables && Array.isArray(variables)) {
      // 无论数组是否为空，都要更新缓存
      variablesCache.value.set('conversation', variables);
      if (variables.length > 0) {
        console.log('✅ 对话变量加载成功:', variables.length, '个');
        console.log('📋 变量详情:', variables);
      } else {
        console.log('✅ 对话变量已清空（空数组）');
      }
    } else {
      // API返回的不是数组，设置为空数组
      variablesCache.value.set('conversation', []);
      console.log('⚠️ 对话变量API返回非数组，设置为空数组 - API响应结构:', {
        convVars,
        hasResult: !!convVars?.result,
        hasResultVariables: !!convVars?.result?.variables,
        hasDirectVariables: !!convVars?.variables,
        isArray: Array.isArray(convVars),
        variablesLength: variables?.length || 0
      });
    }
    
    console.log('🎉 所有变量加载完成');
  } catch (error) {
    console.error('❌ 加载变量失败:', error);
    ElMessage.error('加载变量失败');
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

// 编辑开始节点
const editStartNodeDrawer = async (name, desc, yamlCode, nodeId) => {
  yamlContent.value = yamlCode;
  nodeName.value = name;
  nodeDesc.value = desc;
  nodeYamlId.value = nodeId;
  // 设置选中的节点
  selectedNodeId.value = nodeId;
  
  // 加载变量数据
  await loadWorkflowVariables();
  
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
  console.log('📝 收到保存节点描述事件:', nodeInfo);
  // 调用saveFlow方法保存到后端
  saveFlow(nodeInfo);
  console.log('✅ 节点描述已通过saveFlow方法保存到后端');
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
      
      // 添加"直接回复"节点到第一个服务组中
      if (services.length > 0) {
        const directReplyNode = {
          name: '直接回复',
          callId: 'DirectReply',
          nodeId: 'DirectReply',
          type: 'custom',
          description: '直接回复用户输入的内容，支持变量插入'
        };
        
        if (!services[0].nodeMetaDatas) {
          services[0].nodeMetaDatas = [];
        }
        
        // 检查是否已经存在DirectReply节点，避免重复添加
        const existingDirectReply = services[0].nodeMetaDatas.find(node => node.callId === 'DirectReply');
        if (!existingDirectReply) {
          services[0].nodeMetaDatas.unshift(directReplyNode);
        }
      }
      
      apiServiceList.value = services;
      allApiServiceList.value = services;
      activeName.value = [services[0]?.serviceId];
      activeNames.value = [services[0]?.serviceId];
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
      redrageFlow(flowObj.value.nodes, flowObj.value.edges);
      
      // 加载工作流变量
      console.log('🔄 工作流加载完成，开始加载变量...');
      await loadWorkflowVariables();
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
      appId: route.query?.appId,
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
    } else if (node.callId === 'choice') {
      newNode.type = 'branch';
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
          // 确保parameters对象存在
          if (!item.parameters) {
            item.parameters = {};
          }
          if (!item.parameters.input_parameters) {
            item.parameters.input_parameters = {};
          }
          item.parameters.input_parameters.choices =
            updateNodeParameter.inputStream;
        } else if (item.type === 'Code') {
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
          isCopilotAsideVisible ? t('history.collapse') : t('history.expand')
        "
      >
        <div
          class="trapezoid"
          :class="{ isExpandIcon: isCopilotAsideVisible }"
          @click="hanleAsideVisible"
        />
      </el-tooltip>

      <transition name="transition-fade">
        <div class="copilot-aside nodes" v-if="isCopilotAsideVisible">
          <CustomLoading :loading="apiLoading"></CustomLoading>
          <div class="apiCenterBox">
            <div class="apiCenterTitle">
              {{ $t('semantic.semantic_interface_center') }}
            </div>
            <div class="apiCenterSearch">
              <el-input
                v-model="apiSearchValue"
                class="o-style-search"
                :placeholder="$t('semantic.interface_search')"
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
                  :key="item.serviceId"
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
                    <el-tooltip
                    :disabled="true"
                    class="popper-class"
                    placement="top"
                    :content="node.name">
                        <div class="stancesName">
                    <img class="nodeIcon" :src="getSrcIcon(node)" />

                          {{ node.name }}
                        </div>
                    </el-tooltip>
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
</template>