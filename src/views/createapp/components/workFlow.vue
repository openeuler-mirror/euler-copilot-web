<script setup lang="ts">
import '../../styles/workFlowArrange.scss';
import { onMounted, ref, watch, onUnmounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import ChoiceBranchNode from './workFlowConfig/ChoiceBranchNode.vue';
import VariableAssignNode from './workFlowConfig/VariableAssignNode.vue';
import LoopNode from './workFlowConfig/LoopNode.vue';
import LoopNodeDrawer from './workFlowConfig/LoopNodeDrawer.vue';
import CustomEdge from './workFlowConfig/CustomEdge.vue';
import CustomNode from './workFlowConfig/CustomNode.vue';
import CommentNode from './workFlowConfig/CommentNode.vue';
import PluginNode from './workFlowConfig/PluginNode.vue';
import CustomControl from './CustomControl.vue';
import CustomSaENode from './workFlowConfig/CustomSaENode.vue';
import useDragAndDrop from './workFlowConfig/useDnD';
import { getId, createNewNode, sanitizeNodeData } from './workFlowConfig/useDnD';
import WorkFlowDialog from './workFlowConfig/workFlowDialog.vue';
import WorkFlowDebug from './workFlowDebug.vue';
import { useLayout } from './workFlowConfig/useLayout';
import Upload from '@/components/Upload/index.vue';
import McpServiceDetailDrawer from '@/views/api/components/McpServiceDetail.vue';
import { useChangeThemeStore } from '@/store';
import i18n from '@/i18n';
import {
  IconSearch,
  IconCaretRight,
  IconCaretDown,
  IconPlusCircle,
} from '@computing/opendesign-icons';

import ApiCallDrawer from './workFlowConfig/ApiCallDrawer.vue';
import LLMNodeDrawer from './workFlowConfig/LLMNodeDrawer.vue';
import MCPNodeDrawer from './workFlowConfig/MCPNodeDrawer.vue';
import RAGNodeDrawer from './workFlowConfig/RAGNodeDrawer.vue';
import EditYamlDrawer from './workFlowConfig/yamlEditDrawer.vue';
import VariableBasedStartNodeDrawer from './workFlowConfig/VariableBasedStartNodeDrawer.vue';
import CodeNodeDrawer from './workFlowConfig/CodeNodeDrawer.vue';
import DirectReplyDrawer from './workFlowConfig/DirectReplyDrawer.vue';
import ChoiceBranchDrawer from './workFlowConfig/ChoiceBranchDrawer.vue';
import VariableAssignNodeDrawer from './workFlowConfig/VariableAssignNodeDrawer.vue';
import FileExtractorDrawer from './workFlowConfig/FileExtractorDrawer.vue';
import InsertNodeMenu from './workFlowConfig/insertNodeMenu.vue';
import { api } from 'src/apis';
// 导入变量API
import { listVariables } from '@/api/variable';
import { StatusInfoTitle } from './types';
import { useRoute } from 'vue-router';
import { getSrcIcon, DefaultViewPortZoom, NodeType } from './types';
import $bus from 'src/bus/index';
import CustomLoading from '../../customLoading/index.vue';
import EditFlowName from './workFlowConfig/editFlowName.vue';
import NodeSelector from './workFlowConfig/NodeSelector.vue';
import EnvironmentVariableDrawer from './workFlowConfig/EnvironmentVariableDrawer.vue';
import { useLangStore } from '@/store';

const { t } = useI18n();
const langStore = useLangStore();

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
const isEditVariableAssignNode = ref(false);
const isEditLoopNode = ref(false);
const isEditApiCall = ref(false);
const isEditMCPNode = ref(false);
const isEditRAGNode = ref(false);
const isEditLLMNode = ref(false);
const isEditEnvironmentVariables = ref(false);
const isEditFileExtractorNode = ref(false);
const nodeName = ref('');
const nodeDesc = ref('');
const currentCodeNodeData = ref({});
const currentDirectReplyNodeData = ref({});
const currentChoiceBranchNodeData = ref({});
const currentVariableAssignNodeData = ref({});
const currentLoopNodeData = ref({});
const currentFileExtractorNodeData = ref({});
const currentPluginNodeData = ref({});
// 插件详情相关状态
const pluginDetailDrawerVisible = ref(false);
const pluginDetailType = ref<'semantic_interface' | 'mcp'>('semantic_interface');
const selectedPluginServiceId = ref('');
const getServiceJson = ref('');
const getServiceName = ref('');
const flowZoom = ref(1);
const debugDialogVisible = ref(false);
const apiServiceList = ref([]);
const allApiServiceList = ref([]);
const yamlContent = ref();

// LoopNode InsertNodeMenu相关状态
const isLoopInsertNodeMenuVisible = ref(false);
const loopInsertMenuData = ref<{
  position: { x: number; y: number };
  direction: 'left' | 'right';
  loopNodeId: string;
  edgeInfo: any;
  extraNodeTypes?: any[];
} | null>(null);
const nodeYamlId = ref();
const emits = defineEmits(['updateFlowsDebug']);
const route = useRoute();
const workFlowList = ref<any[]>([]);
const props = defineProps(['flowList']);
const flowObj = ref<{
  flowId?: string, 
  debug?: boolean, 
  name?: string, 
  nodes?: any[], 
  edges?: any[], 
  notes?: any[]
}>({});
const nodes = ref<any[]>([]);
const debugStatus = ref('');
const debugTime = ref('');
const totalTime = ref(0);
const isNodeAndLineConnect = ref(false);
const isNodeConnect = ref(false);
const loading = ref(false);
const apiLoading = ref(false);
const themeStore = useChangeThemeStore();

// 确保HTML根元素与主题状态同步
watch(() => themeStore.theme, (newTheme) => {
  if (newTheme === 'dark') {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
  } else {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    }
  }
}, { immediate: true });

const connectHandleNodeId = ref('');
const updateFlowsDebugStatus = ref(false);
// 添加选中节点状态管理
const selectedNodeId = ref('');

// 对话变量缓存 - 仅用于开始节点展示
const conversationVariablesForDisplay = ref<any[]>([]);
const variablesLoading = ref(false);

// 添加 conversationId 变量（在工作流设计阶段，可以为空或生成临时ID）
const conversationId = ref<string>('');

// 插入节点相关状态
const insertMenuData = ref<{
  visible: boolean;
  position: { x: number; y: number };
  edgeInfo: any;
  handleInfo?: any;
  direction: 'left' | 'right';
  contextMenuInfo?: {
    canvasPosition: { x: number; y: number };
    originalPosition: { x: number; y: number };
  };
}>({
  visible: false,
  position: { x: 0, y: 0 },
  edgeInfo: null,
  handleInfo: null,
  direction: 'right'
});

// 右键菜单相关状态
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// YAML导入导出相关状态
const yamlFileInputRef = ref();
const yamlExportFileName = ref('workflow.yaml');

// 注释相关状态（已简化，注释现在直接在CommentNode中编辑）

// 额外的内置节点类型
const extraNodeTypes = ref([
  {
    nodeId: 'FileExtract',
    callId: 'FileExtract',
    name: i18n.global.t('flow.node_names.file_extractor'),
    description: '从文件中提取文本内容，支持多种文件格式',
    type: 'transform',
    serviceId: 'system'
  }
]);

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
      const foundFlow = workFlowList.value.find(
        (item: any) => item.id === flowId,
      );
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
    return;
  }
  
  variablesLoading.value = true;
  
  try {
    // 只显示全局对话变量
    const convVars: any = await listVariables({ 
      scope: 'conversation',
      flow_id: flowObj.value.flowId,
      exclude_pattern: 'step_id'  // 过滤掉包含step_id的变量
    });
    
    // 支持多种API响应结构
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
      // 后端已经过滤了包含step_id的变量，直接使用
      conversationVariablesForDisplay.value = variables;
    } else {
      conversationVariablesForDisplay.value = [];
    }
    
  } catch (error) {
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

const editCommonDrawer = (name, desc, nodeId, yamlCode) => {
  yamlContent.value = yamlCode;
  nodeName.value = name;
  nodeDesc.value = desc;
  selectedNodeId.value = nodeId;
};

// 编辑yaml
const editYamlDrawer = (name, desc, yamlCode, nodeId) => {
  // 先重置所有抽屉状态，确保不会同时显示多个抽屉
  isEditYaml.value = false;
  isEditCodeNode.value = false;
  isEditDirectReplyNode.value = false;
  isEditChoiceBranchNode.value = false;
  isEditVariableAssignNode.value = false;
  isEditLoopNode.value = false;
  isEditFileExtractorNode.value = false;
  
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
          answer: currentNode.data.parameters?.input_parameters?.answer || '',
          attachment: currentNode.data.parameters?.input_parameters?.attachment || {}
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
  } else if (currentNode && currentNode.data.callId === 'VariableAssign') {
    // 打开变量赋值节点编辑器
    currentVariableAssignNodeData.value = {
      name: currentNode.data.name,
      description: currentNode.data.description,
      callId: currentNode.data.callId,
      parameters: {
        input_parameters: currentNode.data.parameters?.input_parameters || { operations: [] },
        output_parameters: currentNode.data.parameters?.output_parameters || {}
      }
    };
    nodeYamlId.value = nodeId;
    selectedNodeId.value = nodeId;
    isEditVariableAssignNode.value = true;
  } else if (currentNode && currentNode.data.callId === 'FileExtract') {
    // 打开文件提取器节点编辑器
    currentFileExtractorNodeData.value = {
      name: currentNode.data.name,
      description: currentNode.data.description,
      callId: currentNode.data.callId,
      parameters: {
        input_parameters: currentNode.data.parameters?.input_parameters || { 
          parse_method: '',
          input_file: '' 
        },
        output_parameters: currentNode.data.parameters?.output_parameters || {
          text: {
            type: 'string',
            description: '提取的文本内容'
          }
        }
      }
    };
    nodeYamlId.value = nodeId;
    selectedNodeId.value = nodeId;
    isEditFileExtractorNode.value = true;
  } else if (currentNode && currentNode.type === 'plugin-node') {
    // 显示插件详情，不是编辑
    showPluginDetails(currentNode.data);
  } else if (currentNode && currentNode.data.callId === 'Loop') {
    // 打开Loop节点编辑器 - 直接调用editLoopNode方法
    editLoopNode(name, desc, currentNode.data.parameters, nodeId);
  } else if (currentNode && currentNode.data.callId === 'API') {
    isEditApiCall.value = true;
    editCommonDrawer(name, desc, nodeId, yamlCode);
  } else if (currentNode && currentNode.data.callId === 'LLM') {
    isEditLLMNode.value = true;
    editCommonDrawer(name, desc, nodeId, yamlCode);
  } else if (currentNode && currentNode.data.callId === 'RAG') {
    isEditRAGNode.value = true;
    editCommonDrawer(name, desc, nodeId, yamlCode);
  } else if (currentNode && currentNode.data.callId === 'MCP') {
    isEditMCPNode.value = true;
    editCommonDrawer(name, desc, nodeId, yamlCode);
  } else {
    // 打开YAML编辑器（其他节点类型）
    isEditYaml.value = true;
    editCommonDrawer(name, desc, nodeId, yamlCode);
  }
  
  // 编辑时，需要debug 后才可发布
  emits('updateFlowsDebug', false);
};

// 显示插件详情
const showPluginDetails = async (pluginData: any) => {
  selectedPluginServiceId.value = pluginData.serviceId;
  pluginDetailType.value = pluginData.pluginType;
  
  if (pluginData.pluginType === 'semantic_interface') {
    // 加载语义接口详情数据
    await getServiceJsonFun(pluginData.serviceId);
  }
  
  pluginDetailDrawerVisible.value = true;
};

// 获取语义接口JSON数据
const getServiceJsonFun = async (id: string) => {
  const [, res] = await api.querySingleApiData({ serviceId: id });
  if (res) {
    getServiceJson.value = res.result.apis;
    getServiceName.value = res.result.name;
  }
};

// 关闭插件详情抽屉
const closePluginDetailDrawer = () => {
  pluginDetailDrawerVisible.value = false;
  selectedPluginServiceId.value = '';
  getServiceJson.value = '';
  getServiceName.value = '';
};

// 获取插件Drawer标题
const getPluginDrawerTitle = () => {
  if (pluginDetailType.value === 'semantic_interface') {
    return i18n.global.t('semantic.view_semantic_interface');
  } else {
    return 'MCP服务详情';
  }
};

// 关闭抽屉
const closeDrawer = (nodeType) => {
  switch (nodeType) {
    case NodeType.API:
      isEditApiCall.value = false;
      break;
    case NodeType.LLM:
      isEditLLMNode.value = false;
      break;
    case NodeType.RAG:
      isEditRAGNode.value = false;
      break;
    case NodeType.MCP:
      isEditMCPNode.value = false;
      break;
    default:
      isEditYaml.value = false;
  }
  // 清除子工作流节点标识
  isEditingSubFlowNode.value = false;
  currentLoopNodeId.value = '';
  // 清除选中状态
  selectedNodeId.value = '';
};

// 关闭代码节点抽屉
const closeCodeNodeDrawer = () => {
  isEditCodeNode.value = false;
  selectedNodeId.value = '';
  currentCodeNodeData.value = {};
  // 清除子工作流节点标识
  isEditingSubFlowNode.value = false;
  currentLoopNodeId.value = '';
};

// 保存代码节点
const saveCodeNode = (nodeData, nodeId) => {
  if (isEditingSubFlowNode.value) {
    // 如果是子工作流节点，使用LoopNode的保存方法
    saveSubFlowNode(nodeData, nodeId);
  } else {
    // 外部节点，使用原有逻辑
    const updateNodeParameter = {
      id: nodeId,
      ...nodeData,
    };
    
    // 调用保存接口
    saveFlow(updateNodeParameter);
    
    // 关闭抽屉
    closeCodeNodeDrawer();
    
    ElMessage.success('代码节点保存成功');
  }
};

// 关闭直接回复节点抽屉
const closeDirectReplyDrawer = () => {
  isEditDirectReplyNode.value = false;
  selectedNodeId.value = '';
  currentDirectReplyNodeData.value = {};
  // 清除子工作流节点标识
  isEditingSubFlowNode.value = false;
  currentLoopNodeId.value = '';
};

// 保存直接回复节点
const saveDirectReplyNode = (nodeData, nodeId) => {
  if (isEditingSubFlowNode.value) {
    // 如果是子工作流节点，使用LoopNode的保存方法
    saveSubFlowNode(nodeData, nodeId);
  } else {
    // 外部节点，使用原有逻辑
    const updateNodeParameter = {
      id: nodeId,
      ...nodeData,
    };
    
    // 调用保存接口
    saveFlow(updateNodeParameter);
    
    // 关闭抽屉
    closeDirectReplyDrawer();
    
    ElMessage.success('直接回复节点保存成功');
  }
};

// 关闭条件分支节点抽屉
const closeChoiceBranchDrawer = () => {
  isEditChoiceBranchNode.value = false;
  selectedNodeId.value = '';
  currentChoiceBranchNodeData.value = {};
  // 清除子工作流节点标识
  isEditingSubFlowNode.value = false;
  currentLoopNodeId.value = '';
};

// 关闭变量赋值节点抽屉
const closeVariableAssignDrawer = () => {
  isEditVariableAssignNode.value = false;
  selectedNodeId.value = '';
  currentVariableAssignNodeData.value = {};
  // 清除子工作流节点标识
  isEditingSubFlowNode.value = false;
  currentLoopNodeId.value = '';
};

// 关闭文件提取器节点抽屉
const closeFileExtractorDrawer = () => {
  isEditFileExtractorNode.value = false;
  selectedNodeId.value = '';
  currentFileExtractorNodeData.value = {};
  // 清除子工作流节点标识
  isEditingSubFlowNode.value = false;
  currentLoopNodeId.value = '';
};

// 保存条件分支节点
const saveChoiceBranchNode = (nodeData, nodeId) => {
  if (isEditingSubFlowNode.value) {
    // 如果是子工作流节点，使用LoopNode的保存方法
    saveSubFlowNode(nodeData, nodeId);
  } else {
    // 外部节点，使用原有逻辑
    const updateNodeParameter = {
      id: nodeId,
      ...nodeData,
    };
    
    // 调用保存接口
    saveFlow(updateNodeParameter);
    
    // 关闭抽屉
    closeChoiceBranchDrawer();
    
    ElMessage.success('条件分支节点保存成功');
  }
};

// 保存变量赋值节点
const saveVariableAssignNode = (nodeData, nodeId) => {
  if (isEditingSubFlowNode.value) {
    // 如果是子工作流节点，使用LoopNode的保存方法
    saveSubFlowNode(nodeData, nodeId);
  } else {
    // 外部节点，使用原有逻辑
    const updateNodeParameter = {
      id: nodeId,
      ...nodeData,
    };
    
    // 调用保存接口
    saveFlow(updateNodeParameter);
    
    // 关闭抽屉
    closeVariableAssignDrawer();
    
    ElMessage.success('变量赋值节点保存成功');
  }
};

// 保存文件提取器节点
const saveFileExtractorNode = (nodeData, nodeId) => {
  if (isEditingSubFlowNode.value) {
    // 如果是子工作流节点，使用LoopNode的保存方法
    saveSubFlowNode(nodeData, nodeId);
  } else {
    // 外部节点，使用原有逻辑
    const updateNodeParameter = {
      id: nodeId,
      ...nodeData,
    };
    
    // 调用保存接口
    saveFlow(updateNodeParameter);
    
    // 关闭抽屉
    closeFileExtractorDrawer();
    
    ElMessage.success('文件提取器节点保存成功');
  }
};

// 编辑Loop节点
const editLoopNode = (name, desc, parameters, nodeId) => {
  // 查找当前节点
  const currentNode = findNode(nodeId);
  
  if (currentNode && currentNode.data.callId === 'Loop') {
    // 打开Loop节点编辑器
    currentLoopNodeData.value = {
      name: currentNode.data.name,
      description: currentNode.data.description,
      callId: currentNode.data.callId,
      parameters: currentNode.data.parameters || {
        input_parameters: {
          variables: {},
          stop_condition: {
            logic: 'and',
            conditions: []
          },
          max_iteration: 10,
          sub_flow_id: ''
        },
        output_parameters: {
          iteration_count: {
            type: 'number',
            description: '实际执行的循环次数'
          },
          stop_reason: {
            type: 'string',
            description: '停止原因'
          },
          variables: {
            type: 'object',
            description: '循环后的变量状态'
          }
        }
      }
    };
    nodeYamlId.value = nodeId;
    selectedNodeId.value = nodeId;
    isEditLoopNode.value = true;
  }
};

// 关闭Loop节点抽屉
const closeLoopNodeDrawer = () => {
  isEditLoopNode.value = false;
  selectedNodeId.value = '';
  currentLoopNodeData.value = {};
  // 清除子工作流节点标识
  isEditingSubFlowNode.value = false;
  currentLoopNodeId.value = '';
};

// 保存Loop节点
const saveLoopNode = (nodeData) => {
  if (isEditingSubFlowNode.value) {
    // 如果是子工作流节点，使用LoopNode的保存方法
    saveSubFlowNode(nodeData, nodeYamlId.value);
  } else {
    // 外部节点，使用原有逻辑
    const updateNodeParameter = {
      id: nodeYamlId.value,
      ...nodeData,
    };
    
    // 调用保存接口
    saveFlow(updateNodeParameter);
    
    // 关闭抽屉
    closeLoopNodeDrawer();
    
    ElMessage.success('循环节点保存成功');
  }
};

// 用于标识当前编辑的是否为LoopNode内部的子节点
const isEditingSubFlowNode = ref(false);
const currentLoopNodeId = ref('');

// 保存子工作流节点（LoopNode内部节点）
const saveSubFlowNode = async (nodeData, nodeId) => {
  try {
    // 通过LoopNode组件引用调用保存方法
    const loopComponentKey = `loopNode_${currentLoopNodeId.value}`;
    const loopRef = (window as any).loopNodeRefs?.[loopComponentKey];
    
    if (loopRef && typeof loopRef.updateSubFlowNode === 'function') {
      await loopRef.updateSubFlowNode(nodeId, nodeData);
      ElMessage.success('子工作流节点保存成功');
      
      // 关闭对应的抽屉
      if (isEditCodeNode.value) {
        closeCodeNodeDrawer();
      } else if (isEditDirectReplyNode.value) {
        closeDirectReplyDrawer();
      } else if (isEditChoiceBranchNode.value) {
        closeChoiceBranchDrawer();
      } else if (isEditVariableAssignNode.value) {
        closeVariableAssignDrawer();
      } else if (isEditFileExtractorNode.value) {
        closeFileExtractorDrawer();
      } else if (isEditLoopNode.value) {
        closeLoopNodeDrawer();
      } else if (isEditYaml.value) {
        closeDrawer(nodeId);
      }
    } else {
      throw new Error('未找到LoopNode组件引用或updateSubFlowNode方法');
    }
  } catch (error) {
    console.error('保存子工作流节点失败:', error);
    ElMessage.error('保存子工作流节点失败');
  }
};

// 编辑子工作流节点 - 处理来自LoopNode的子节点编辑事件
const editSubFlowNode = (nodeName, nodeDesc, nodeParameters, nodeId, loopNodeId) => {
  // 根据nodeParameters中的callId来确定节点类型并打开对应的drawer
  const callId = nodeParameters?.callId;
  
  // 设置子工作流节点编辑标识
  isEditingSubFlowNode.value = true;
  currentLoopNodeId.value = loopNodeId;
  
  // 先重置所有抽屉状态
  isEditYaml.value = false;
  isEditCodeNode.value = false;
  isEditDirectReplyNode.value = false;
  isEditChoiceBranchNode.value = false;
  isEditVariableAssignNode.value = false;
  isEditFileExtractorNode.value = false;
  isEditLoopNode.value = false;
  
  switch (callId) {
    case 'API':
      isEditApiCall.value = true;
      break;
    case 'LLM':
      isEditLLMNode.value = true;
      break;
    case 'RAG':
      isEditRAGNode.value = true;
      break;
    case 'MCP':
      isEditMCPNode.value = true;
      break;
    case 'Code':
      // 打开代码节点编辑器
      currentCodeNodeData.value = {
        name: nodeName,
        description: nodeDesc,
        callId: callId,
        
        // 代码节点特有属性
        code: nodeParameters?.code || '',
        codeType: nodeParameters?.codeType || 'python',
        securityLevel: nodeParameters?.securityLevel || 'low',
        timeoutSeconds: nodeParameters?.timeoutSeconds || 30,
        memoryLimitMb: nodeParameters?.memoryLimitMb || 128,
        cpuLimit: nodeParameters?.cpuLimit || 0.5,
        
        // 用户定义的输入输出参数
        input_parameters: nodeParameters?.input_parameters || {},
        output_parameters: nodeParameters?.output_parameters || {},
      };
      nodeYamlId.value = nodeId;
      selectedNodeId.value = nodeId;
      isEditCodeNode.value = true;
      break;
      
    case 'DirectReply':
      // 打开直接回复节点编辑器
      currentDirectReplyNodeData.value = {
        name: nodeName,
        description: nodeDesc,
        callId: callId,
        parameters: {
          input_parameters: {
            answer: nodeParameters?.input_parameters?.answer || '',
            attachment: nodeParameters?.input_parameters?.attachment || {}
          },
          output_parameters: nodeParameters?.output_parameters || {}
        }
      };
      nodeYamlId.value = nodeId;
      selectedNodeId.value = nodeId;
      isEditDirectReplyNode.value = true;
      break;
      
          case 'Choice':
        // 打开条件分支节点编辑器
        currentChoiceBranchNodeData.value = {
          name: nodeName,
          description: nodeDesc,
          callId: callId,
          parameters: nodeParameters || {
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
        break;
        
      case 'VariableAssign':
        // 打开变量赋值节点编辑器
        currentVariableAssignNodeData.value = {
          name: nodeName,
          description: nodeDesc,
          callId: callId,
          parameters: {
            input_parameters: nodeParameters?.input_parameters || { operations: [] },
            output_parameters: nodeParameters?.output_parameters || {}
          }
        };
        nodeYamlId.value = nodeId;
        selectedNodeId.value = nodeId;
        isEditVariableAssignNode.value = true;
        break;
      
      case 'FileExtract':
        // 打开文件提取器节点编辑器
        currentFileExtractorNodeData.value = {
          name: nodeName,
          description: nodeDesc,
          callId: callId,
          parameters: {
            input_parameters: nodeParameters?.input_parameters || { 
              parse_method: '',
              input_file: '' 
            },
            output_parameters: nodeParameters?.output_parameters || {
              text: {
                type: 'string',
                description: '提取的文本内容'
              }
            }
          }
        };
        nodeYamlId.value = nodeId;
        selectedNodeId.value = nodeId;
        isEditFileExtractorNode.value = true;
        break;
      
    case 'Loop':
      // 打开循环节点编辑器
      currentLoopNodeData.value = {
        name: nodeName,
        description: nodeDesc,
        callId: callId,
        parameters: nodeParameters || {
          input_parameters: {
            variables: {},
            stop_condition: {
              logic: 'and',
              conditions: []
            },
            max_iteration: 10,
            sub_flow_id: ''
          },
          output_parameters: {
            iteration_count: {
              type: 'number',
              description: '实际执行的循环次数'
            },
            stop_reason: {
              type: 'string',
              description: '停止原因'
            },
            variables: {
              type: 'object',
              description: '循环后的变量状态'
            }
          }
        }
      };
      nodeYamlId.value = nodeId;
      selectedNodeId.value = nodeId;
      isEditLoopNode.value = true;
      break;
      
    default:
      // 其他节点类型使用YAML编辑器
      editYamlDrawer(nodeName, nodeDesc, nodeParameters, nodeId);
      return;
  }
  
  // 编辑时，需要debug 后才可发布
  emits('updateFlowsDebug', false);
};

// 处理来自LoopNode的InsertNodeMenu显示请求
const handleShowLoopInsertNodeMenu = (insertMenuData) => {
  // 保存菜单数据
  loopInsertMenuData.value = insertMenuData;
  
  // 显示菜单
  isLoopInsertNodeMenuVisible.value = true;
};


// 关闭LoopNode InsertNodeMenu
const closeLoopInsertNodeMenu = () => {
  isLoopInsertNodeMenuVisible.value = false;
  loopInsertMenuData.value = null;
};

// 处理LoopNode的subFlowId更新
const handleUpdateSubFlowId = (nodeId: string, subFlowId: string) => {
  // 查找并更新对应的Loop节点
  const loopNode = nodes.value.find(node => node.id === nodeId);
  if (loopNode && loopNode.data) {
    if (!loopNode.data.parameters) {
      loopNode.data.parameters = {};
    }
    if (!loopNode.data.parameters.input_parameters) {
      loopNode.data.parameters.input_parameters = {};
    }
    loopNode.data.parameters.input_parameters.sub_flow_id = subFlowId;
    
  }
};

// 处理LoopNode InsertNodeMenu选择节点
const handleLoopInsertNodeSelect = (nodeData) => {
  
  if (!loopInsertMenuData.value) {
    return;
  }
  
  // 通过LoopNode组件引用调用节点插入方法
  const loopComponentKey = `loopNode_${loopInsertMenuData.value.loopNodeId}`;
  const loopRef = (window as any).loopNodeRefs?.[loopComponentKey];
  
  if (loopRef && loopRef.insertNodeIntoSubFlow) {
    loopRef.insertNodeIntoSubFlow(nodeData, loopInsertMenuData.value.edgeInfo);
  } else {
    console.error('[workFlow] 未找到LoopNode引用或insertNodeIntoSubFlow方法');
  }
  
  // 关闭菜单
  closeLoopInsertNodeMenu();
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
  // 清除子工作流节点标识
  isEditingSubFlowNode.value = false;
  currentLoopNodeId.value = '';
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
  const newZoom = Number(zoomObj.zoom.toFixed(2));
  
  flowZoom.value = newZoom;
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

// LoopNode滚轮事件处理函数
const handleLoopNodeZoomUpdate = (event: CustomEvent) => {
  // 手动调用handleZommOnScroll来更新zoom值
  handleZommOnScroll();
};

// 查询所有流服务的函数
const queryAllFlowServices = () => {
  apiLoading.value = true;
  api
    .queryAllFlowService({
      page: 1,
      pageSize: 10,
      language: langStore.language,
    })
    .then((res) => {
      const services = res[1]?.result.services || [];
      apiServiceList.value = services;
      allApiServiceList.value = services;
      apiLoading.value = false;
    });
};

onMounted(() => {
  queryAllFlowServices();
  handleChangeZoom(DefaultViewPortZoom);
  
  // 添加LoopNode事件监听器作为备用方案
  document.addEventListener('loopNodeZoomUpdate', handleLoopNodeZoomUpdate);
  
  // 添加全局点击事件监听器，用于关闭右键菜单
  document.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  // 组件销毁时，清空sessionStorage的veiwport位置
  sessionStorage.setItem('workflowViewPortX', '');
  sessionStorage.setItem('workflowViewPortY', '');
  
  // 清理LoopNode事件监听器
  document.removeEventListener('loopNodeZoomUpdate', handleLoopNodeZoomUpdate);
  
  // 清理全局点击事件监听器
  document.removeEventListener('click', handleGlobalClick);
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
    // TODO 为什么0.10.0删除了delNode？
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
const getCreatedFlow = async (createdFlowObj) => {
  if (flowObj.value) {
    flowObj.value = { ...createdFlowObj };
    workFlowItemName.value = createdFlowObj.name;
    // 回显工作流节点和边
    redrageFlow(createdFlowObj?.nodes, createdFlowObj?.edges, createdFlowObj?.notes || []);
    
    // 重新加载对话变量，确保显示当前flow的正确变量状态
    await loadConversationVariablesForDisplay();
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
      redrageFlow(flowObj.value.nodes || [], flowObj.value.edges || [], flowObj.value.notes || []);
      
      // 加载对话变量用于开始节点展示
      await loadConversationVariablesForDisplay();
    }
  } catch (error) {
    // 处理加载错误
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

// 监听语言变化，重新查询所有流服务
watch(
  () => langStore.language,
  () => {
    queryAllFlowServices();
  }
);

// 回显工作流节点和边
const redrageFlow = (nodesList, edgesList, notesList = []) => {
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
      
      // 使用统一的sanitizeNodeData处理Choice节点，确保branch_id生成逻辑一致
      const choiceNodeData = {
        callId: 'Choice',
        parameters: node.parameters
      };
      
      // 调用sanitizeNodeData进行标准化处理
      const sanitizedChoice = sanitizeNodeData(choiceNodeData, node.stepId);
      
      newNode.data = {
        ...newNode.data,
        parameters: sanitizedChoice.parameters
              };
      } else if (node.callId === 'VariableAssign') {
        // VariableAssign节点特殊处理
        newNode.type = 'VariableAssign';
        newNode.data = {
          ...newNode.data,
          nodeId: 'VariableAssign',
          callId: 'VariableAssign',
        };
      } else if (node.callId === 'Loop') {
        // Loop节点特殊处理
        newNode.type = 'Loop';
        newNode.data = {
          ...newNode.data,
          nodeId: 'Loop',
          callId: 'Loop',
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
    } else if (node.callId === 'VariableAssign') {
      // VariableAssign节点特殊处理
      newNode.type = 'VariableAssign';
      newNode.data = {
        ...newNode.data,
        nodeId: 'VariableAssign',
        callId: 'VariableAssign',
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
  
  // 处理notes数据，创建注释节点
  const newNotesList = (notesList || []).map((note: any) => {
    return {
      id: note.noteId,
      type: 'comment',
      position: note.position,
      data: {
        name: '注释',
        description: note.text,
        nodeId: 'Comment',
        callId: 'Comment',
        serviceId: 'comment',
        isComment: true,
        width: note.width || 200, // 从后端读取宽度或使用默认值
        height: note.height || 120, // 从后端读取高度或使用默认值
        parameters: {
          input_parameters: {},
          output_parameters: {}
        }
      },
      deletable: true
    };
  });
  
  // 合并所有节点（包括工作流节点和注释节点）
  setNodes([...newNodeList, ...newNotesList]);
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
  insertMenuData.value.handleInfo = null;
  insertMenuData.value.contextMenuInfo = undefined;
  insertMenuData.value.position = { x: 0, y: 0 };
};

// 处理画布右键菜单
const handleContextMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  
  // 检查是否点击在LoopNode的子画布区域
  const isInLoopNodeSubCanvas = target.closest('.embeddedFlowCanvas') || target.closest('.vue-flow-like-canvas');
  
  // 如果在LoopNode子画布内，不处理（让LoopNode自己处理）
  if (isInLoopNodeSubCanvas) {
    return;
  }
  
  // 检查是否点击在节点上，如果是则不显示右键菜单
  if (target.closest('.vue-flow__node') || target.closest('[data-id]')) {
    return;
  }
  
  // 检查是否在有效的画布区域
  const isValidTarget = target.classList.contains('vue-flow__pane') || 
                       target.classList.contains('vue-flow__viewport') ||
                       target.classList.contains('vue-flow__background') ||
                       target.closest('.vue-flow__background') ||
                       target.closest('.vue-flow__pane') ||
                       target.closest('.vue-flow') ||
                       target.classList.contains('workFlowContainerRight') ||
                       target.closest('.workFlowContainerRight');
  
  // 排除不应该显示菜单的区域
  const isExcludedArea = target.closest('.copilot-aside-new') ||
                        target.closest('.workFlowOps') ||
                        target.closest('.noWorkFlow') ||
                        target.closest('.context-menu-dropdown');
  
  if (!isValidTarget || isExcludedArea) {
    return;
  }
  
  if (debugDialogVisible.value) {
    return; // 调试模式下不显示右键菜单
  }
  
  if (!flowObj.value?.flowId) {
    return; // 没有选择工作流时不显示右键菜单
  }
  
  event.preventDefault();
  
  // 获取鼠标相对于页面的位置
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  
  contextMenuVisible.value = true;
};

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false;
};

// 全局点击事件处理，关闭右键菜单
const handleGlobalClick = (event: MouseEvent) => {
  // 检查点击是否在右键菜单外部
  const target = event.target as HTMLElement;
  if (!target.closest('.context-menu-dropdown')) {
    closeContextMenu();
  }
};

// 右键菜单选项处理
const handleAddNode = () => {
  // 获取Vue Flow画布的viewport信息
  const viewport = getViewport();
  
  // 将页面坐标转换为画布坐标
  const vueFlowElement = document.querySelector('.vue-flow__viewport');
  const containerRect = vueFlowElement?.getBoundingClientRect();
  
  if (!containerRect) {
    closeContextMenu();
    return;
  }
  
  // 计算相对于Vue Flow容器的坐标（用于菜单显示）
  const containerX = contextMenuPosition.value.x - containerRect.left;
  const containerY = contextMenuPosition.value.y - containerRect.top;
  
  // 计算实际的画布坐标（用于节点插入）
  const canvasX = (contextMenuPosition.value.x - containerRect.left - viewport.x) / viewport.zoom;
  const canvasY = (contextMenuPosition.value.y - containerRect.top - viewport.y) / viewport.zoom;
  
  // 更新插入菜单数据，在右键点击位置显示节点选择菜单
  insertMenuData.value = {
    visible: true,
    position: {
      x: containerX,
      y: containerY
    },
    edgeInfo: null,
    handleInfo: undefined,
    direction: 'right',
    // 添加右键菜单特有的画布位置信息
    contextMenuInfo: {
      canvasPosition: { x: canvasX, y: canvasY },
      originalPosition: contextMenuPosition.value
    }
  };
  
  closeContextMenu();
};

const handleAddComment = () => {
  // 直接创建注释节点，不再使用输入框
  // 获取Vue Flow画布的viewport信息
  const viewport = getViewport();
  const vueFlowElement = document.querySelector('.vue-flow__viewport');
  const containerRect = vueFlowElement?.getBoundingClientRect();
  
  if (!containerRect) {
    ElMessage.error('无法获取画布位置信息');
    closeContextMenu();
    return;
  }
  
  // 将页面坐标转换为画布坐标
  const canvasX = (contextMenuPosition.value.x - containerRect.left - viewport.x) / viewport.zoom;
  const canvasY = (contextMenuPosition.value.y - containerRect.top - viewport.y) / viewport.zoom;
  
  // 创建注释节点
  const commentNodeId = getId();
  const commentNode = {
    id: commentNodeId,
    type: 'comment',
    position: { x: canvasX - 100, y: canvasY - 30 }, // 调整位置使其居中
    data: {
      name: '注释',
      description: '', // 空描述，用户需要点击编辑
      nodeId: 'Comment',
      callId: 'Comment',
      serviceId: 'comment',
      isComment: true, // 标识为注释节点
      width: 200, // 默认宽度
      height: 120, // 默认高度
      parameters: {
        input_parameters: {},
        output_parameters: {}
      }
    },
    deletable: true
  };
  
  // 添加注释节点到画布
  setNodes([...getNodes.value, commentNode]);
  
  // 触发工作流状态更新
  emits('updateFlowsDebug', false);
  updateFlowsDebugStatus.value = false;
  
  closeContextMenu();
  ElMessage.success('注释添加成功，点击注释可编辑内容');
};

const handleDebugWorkflow = () => {
  // 调用现有的调试功能
  handleDebugDialogOps(true);
  closeContextMenu();
};

const handleExportYAML = async () => {
  try {
    if (!flowObj.value?.flowId) {
      ElMessage.warning('请先选择工作流');
      return;
    }
    
    // 先保存当前工作流
    await saveFlow();
    
    // 获取当前工作流的完整数据
    const response = await api.querySingleFlowTopology({
      appId: route.query?.appId,
      flowId: flowObj.value.flowId,
    });
    
    if (response[1]?.result?.flow) {
      const flowData = response[1].result.flow;
      
      // 转换为YAML格式的数据结构
      const yamlData = {
        name: flowData.name,
        description: flowData.description || '',
        nodes: flowData.nodes?.map(node => ({
          stepId: node.stepId,
          name: node.name,
          description: node.description,
          callId: node.callId,
          nodeId: node.nodeId,
          serviceId: node.serviceId,
          position: node.position,
          parameters: node.parameters
        })) || [],
        edges: flowData.edges?.map(edge => ({
          edgeId: edge.edgeId,
          sourceNode: edge.sourceNode,
          targetNode: edge.targetNode,
          branchId: edge.branchId
        })) || [],
        notes: flowData.notes?.map(note => ({
          noteId: note.noteId,
          text: note.text,
          position: note.position,
          width: note.width || 200,
          height: note.height || 120
        })) || []
      };
      
      // 转换为YAML字符串
      const yamlString = JSON.stringify(yamlData, null, 2);
      
      // 创建下载链接
      const blob = new Blob([yamlString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = yamlExportFileName.value || `${flowData.name || 'workflow'}.yaml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      ElMessage.success('工作流YAML导出成功');
    }
  } catch (error) {
    ElMessage.error('导出YAML失败');
  }
  closeContextMenu();
};

const handleImportYAML = () => {
  // 触发文件选择
  if (yamlFileInputRef.value) {
    yamlFileInputRef.value.click();
  }
  closeContextMenu();
};

// 处理YAML文件导入
const handleYAMLFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) {
    return;
  }
  
  try {
    const text = await file.text();
    let yamlData;
    
    try {
      yamlData = JSON.parse(text);
    } catch (parseError) {
      ElMessage.error('YAML文件格式错误，请确保是有效的JSON格式');
      return;
    }
    
    // 验证YAML数据结构
    if (!yamlData.nodes || !Array.isArray(yamlData.nodes)) {
      ElMessage.error('YAML文件格式错误：缺少nodes数组');
      return;
    }
    
    if (!yamlData.edges || !Array.isArray(yamlData.edges)) {
      ElMessage.error('YAML文件格式错误：缺少edges数组');
      return;
    }
    
    // 清空当前画布
    setNodes([]);
    setEdges([]);
    
    // 导入节点和边
    redrageFlow(yamlData.nodes, yamlData.edges, yamlData.notes || []);
    
    // 更新工作流名称（如果提供）
    if (yamlData.name && flowObj.value) {
      flowObj.value.name = yamlData.name;
      workFlowItemName.value = yamlData.name;
    }
    
    // 触发保存
    await saveFlow();
    
    ElMessage.success('工作流YAML导入成功');
    
  } catch (error) {
    ElMessage.error('导入YAML失败');
  } finally {
    // 清空文件输入
    target.value = '';
  }
};

// 注释相关函数已简化，现在直接在CommentNode中编辑

// 更新注释节点数据
const updateCommentNodeData = (nodeId: string, newData: any) => {
  const currentNodes = getNodes.value;
  const nodeIndex = currentNodes.findIndex(node => node.id === nodeId);
  
  if (nodeIndex !== -1) {
    // 创建新的节点数组，更新指定节点的数据
    const updatedNodes = [...currentNodes];
    updatedNodes[nodeIndex] = {
      ...updatedNodes[nodeIndex],
      data: newData
    };
    
    // 更新节点列表
    setNodes(updatedNodes);
    
    // 触发工作流状态更新
    emits('updateFlowsDebug', false);
    updateFlowsDebugStatus.value = false;
  }
};

// 处理来自Handle位置的插入节点事件
const handleInsertNodeFromHandle = (handleInfo) => {
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
  
  // 根据Handle类型计算插入位置
  let insertX, insertY;
  const baseX = handleInfo.nodePosition.x;
  const baseY = handleInfo.nodePosition.y;
  
  if (handleInfo.handleType === 'source') {
    // Source handle: 在节点右侧插入新节点（线性连接）
    insertX = baseX + 250; // 节点间距
    insertY = baseY;
  } else {
    // Target handle: 在节点上方插入新节点（并行分支）
    insertX = baseX;
    insertY = baseY - 150; // 节点间距
  }
  
  // 将画布坐标转换为相对于Vue Flow容器的坐标
  const containerX = insertX * viewport.zoom + viewport.x;
  const containerY = insertY * viewport.zoom + viewport.y;
  
  // 计算建议的菜单方向
  const menuWidth = 400;
  let direction: 'left' | 'right' = 'right';
  
  if (containerX + menuWidth + 20 > containerRect.width) {
    direction = 'left';
  } else {
    direction = 'right';
  }
  
  // 更新插入菜单数据，使用handleInfo而不是edgeInfo
  insertMenuData.value = {
    visible: true,
    position: {
      x: containerX,
      y: containerY
    },
    handleInfo, // 使用handleInfo代替edgeInfo
    direction
  };
};

// 执行插入节点操作
const executeInsertNode = (nodeMetaData) => {
  
  try {
    // 支持从边插入、从Handle插入和从右键菜单插入三种模式
    if (!insertMenuData.value.edgeInfo && !insertMenuData.value.handleInfo && !insertMenuData.value.contextMenuInfo) {
      return;
    }
    
    // 生成新节点ID
    const newNodeId = getId();
    
    let newNodePosition;
    let newEdges = [];
    const currentNodes = getNodes.value;
    const currentEdges = getEdges.value;
    
    // 根据插入模式确定节点位置和连接逻辑
    if (insertMenuData.value.edgeInfo) {
      // 从边插入模式（原有逻辑）
      const edgeInfo = insertMenuData.value.edgeInfo;
      const sourceEdge = currentEdges.find(edge => edge.id === edgeInfo.edgeId);
      if (!sourceEdge) {
        return;
      }
      
      newNodePosition = {
        x: edgeInfo.midX - 100, // 节点宽度的一半
        y: edgeInfo.midY - 40   // 节点高度的一半
      };
      
      // 删除原边，创建新的边：源节点 -> 新节点 -> 目标节点
      const filteredEdges = currentEdges.filter(edge => edge.id !== edgeInfo.edgeId);
      
      // 检查源节点是否是Choice节点，如果是则需要使用默认分支的handle
      const sourceNode = currentNodes.find(node => node.id === sourceEdge.source);
      let newSourceHandle = sourceEdge.sourceHandle;
      
      if (sourceNode && sourceNode.type === 'Choice') {
        // 对于Choice节点，找到默认分支(ELSE分支)的handle
        const choices = sourceNode.data?.parameters?.input_parameters?.choices || [];
        const defaultBranch = choices.find(choice => choice.is_default === true);
        if (defaultBranch) {
          newSourceHandle = defaultBranch.branch_id;
        }
      }
      
      // 检查新插入的节点是否是Choice节点，如果是则确定其输出连接的sourceHandle
      let newNodeSourceHandle = undefined;
      if (nodeMetaData.callId === 'Choice') {
        // 对于新创建的Choice节点，使用ELSE分支的ID
        newNodeSourceHandle = `else_${newNodeId}`;
      }
      
      newEdges = [
        ...filteredEdges,
        {
          id: `edge_${Date.now()}_1`,
          source: sourceEdge.source,
          target: newNodeId,
          sourceHandle: newSourceHandle, // 使用修正后的sourceHandle
          type: 'normal',
          data: { sourceStatus: 'default', targetStatus: 'default' }
        },
        {
          id: `edge_${Date.now()}_2`, 
          source: newNodeId,
          target: sourceEdge.target,
          targetHandle: sourceEdge.targetHandle,
          sourceHandle: newNodeSourceHandle, // 使用新节点的默认分支handle
          type: 'normal',
          data: { sourceStatus: 'default', targetStatus: 'default' }
        }
      ];
    } else if (insertMenuData.value.handleInfo) {
      // 从Handle插入模式
      const handleInfo = insertMenuData.value.handleInfo;
      
      if (handleInfo.handleType === 'source') {
        // Source handle: 创建新分支，保留原有连接并添加新的连接
        const sourceNodeEdges = currentEdges.filter(edge => edge.source === handleInfo.nodeId);
        
        // 检查源节点是否是Choice节点，如果是则需要使用指定分支的handle
        const sourceNode = currentNodes.find(node => node.id === handleInfo.nodeId);
        let sourceHandle = undefined; // 默认不指定sourceHandle
        
        if (sourceNode && sourceNode.type === 'Choice') {
          // 优先使用传递过来的特定分支ID
          if (handleInfo.branchId && handleInfo.branchId !== 'default') {
            sourceHandle = handleInfo.branchId;
          } else {
            // 如果没有指定分支ID，才使用默认分支(ELSE分支)的handle
            const choices = sourceNode.data?.parameters?.input_parameters?.choices || [];
            const defaultBranch = choices.find(choice => choice.is_default === true);
            if (defaultBranch) {
              sourceHandle = defaultBranch.branch_id;
            }
          }
        }
        
        if (sourceNodeEdges.length > 0) {
          // 如果已有输出连接，创建并行分支：保留原连接，添加新分支
          const firstTargetNode = getNodes.value.find(node => node.id === sourceNodeEdges[0].target);
          
          // 计算新节点位置：在第一个目标节点下方
          newNodePosition = {
            x: firstTargetNode ? firstTargetNode.position.x : handleInfo.nodePosition.x + 350,
            y: firstTargetNode ? firstTargetNode.position.y + 120 : handleInfo.nodePosition.y + 120
          };
          
          // 保留所有原有边，只添加新的分支边
          newEdges = [
            ...currentEdges, // 保留所有现有连接
            {
              id: `edge_${Date.now()}`,
              source: handleInfo.nodeId,
              target: newNodeId,
              sourceHandle: sourceHandle, // 使用默认分支handle（如果是Choice节点）
              type: 'normal',
              data: { sourceStatus: 'default', targetStatus: 'default' }
            }
          ];
        } else {
          // 如果没有输出连接，创建线性连接
          newNodePosition = {
            x: handleInfo.nodePosition.x + 350, // 增加偏移距离，避免重叠
            y: handleInfo.nodePosition.y
          };
          
          // 创建从原节点到新节点的边
          newEdges = [
            ...currentEdges,
            {
              id: `edge_${Date.now()}`,
              source: handleInfo.nodeId,
              target: newNodeId,
              sourceHandle: sourceHandle, // 使用默认分支handle（如果是Choice节点）
              type: 'normal',
              data: { sourceStatus: 'default', targetStatus: 'default' }
            }
          ];
        }
      } else {
        // Target handle: 并行分支，在当前节点前创建新的分支
        newNodePosition = {
          x: handleInfo.nodePosition.x,
          y: handleInfo.nodePosition.y - 150
        };
        
        // 查找指向当前节点的边的源节点，为新节点创建分支连接
        const targetNodeEdges = currentEdges.filter(edge => edge.target === handleInfo.nodeId);
        const newBranchEdges = targetNodeEdges.map(edge => ({
          id: `edge_${Date.now()}_branch_${edge.id}`,
          source: edge.source,
          target: newNodeId,
          type: 'normal',
          data: { sourceStatus: 'default', targetStatus: 'default' }
        }));
        
        newEdges = [...currentEdges, ...newBranchEdges];
      }
    } else if (insertMenuData.value.contextMenuInfo) {
      // 从右键菜单插入模式（新增逻辑）
      const contextMenuInfo = insertMenuData.value.contextMenuInfo;
      
      // 直接使用计算好的画布坐标
      newNodePosition = {
        x: contextMenuInfo.canvasPosition.x - 100, // 节点宽度的一半，使节点中心对准点击位置
        y: contextMenuInfo.canvasPosition.y - 40   // 节点高度的一半
      };
      
      // 右键菜单插入是独立的节点，不需要连接到现有的边
      newEdges = [...currentEdges];
    }
    
    // 使用公共函数创建新节点
    const newNode = createNewNode(nodeMetaData, newNodePosition, newNodeId);
    
    
    // 添加新节点和更新边
    setNodes([...currentNodes, newNode]);
    setEdges(newEdges);
    
    // 触发工作流状态更新
    emits('updateFlowsDebug', false);
    updateFlowsDebugStatus.value = false;
    nodeAndLineConnection();
    
    // 关闭菜单
    closeInsertNodeMenu();
    
    ElMessage.success(`${nodeMetaData.name} 节点插入成功`);
    
  } catch (error) {
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

const saveFlow = async (updateNodeParameter?, debug?) => {
  loading.value = true;
  const appId = route.query?.appId;
  if (!flowObj.value.flowId) {
    return;
  }

  try {
    // 第一步：保存所有Loop节点的子工作流
    const loopNodes = getNodes.value.filter(node => node.data.callId === 'Loop');
    
    for (const loopNode of loopNodes) {
      // 通过全局变量访问LoopNode组件实例（需要在LoopNode中设置）
      const loopComponentKey = `loopNode_${loopNode.id}`;
      const loopRef = (window as any).loopNodeRefs?.[loopComponentKey];
      
      if (loopRef && typeof loopRef.hasUnsavedSubFlowChanges === 'function') {
        const hasChanges = loopRef.hasUnsavedSubFlowChanges();
        const currentSubFlowId = loopRef.getSubFlowId();
        
        // 如果有未保存的变更，或者还没有subFlowId，则需要保存
        if (hasChanges || !currentSubFlowId) {
          try {
            const savedSubFlowId = await loopRef.saveSubFlow();
            
            // 确保Loop节点的参数中的sub_flow_id被正确更新
            if (savedSubFlowId) {
              loopNode.data.parameters = loopNode.data.parameters || {};
              loopNode.data.parameters.input_parameters = loopNode.data.parameters.input_parameters || {};
              loopNode.data.parameters.input_parameters.sub_flow_id = savedSubFlowId;
            }
          } catch (error) {
            console.error('[workFlow] 保存Loop子工作流失败:', error);
            ElMessage.error(`保存Loop节点 ${loopNode.data.name} 的子工作流失败`);
            throw error; // 阻止主工作流保存
          }
        } else {
          // 即使没有变更，也要确保sub_flow_id正确设置
          if (currentSubFlowId) {
            loopNode.data.parameters = loopNode.data.parameters || {};
            loopNode.data.parameters.input_parameters = loopNode.data.parameters.input_parameters || {};
            loopNode.data.parameters.input_parameters.sub_flow_id = currentSubFlowId;
          }
        }
      }
    }

    // 第二步：保存主工作流（原有逻辑）
    // 将对应的节点和边存储格式改造，过滤掉注释节点
    let updateNodes = getNodes.value
      .filter(item => item.type !== 'comment' && !item.data?.isComment)
      .map((item) => {
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
      
      // 其余逻辑保持不变...
      if (item.type === 'end' || item.type === 'start') {
        newItem = {
          ...newItem,
          serviceId: item.type,
          nodeId: 'Empty',
          callId: item.type,
          type: 'startAndEnd',
        };
      } else if (item.type === 'branch') {
        // 对于branch节点，处理choice数据
        let choices = [];
        // 根据该节点在edge中作为source时的edge
        const branchEdges = getEdges.value.filter((edge) => edge.source === item.id);
        
        // 如果有边连接，根据边的branchId创建choice
        if (branchEdges.length > 0) {
          choices = branchEdges.map((edge, index) => ({
            branch_id: edge.branchId,
            name: edge.branchId || `choice_${index + 1}`,
            is_default: edge.branchId === 'else',
            conditions: [], 
            logic: 'and'
          }));
        } else {
          // 如果没有边连接，使用现有的choices数据或创建默认的
          choices = item.data.parameters?.input_parameters?.choices || [
            {
              branch_id: `else_${item.id}`,
              name: 'ELSE',
              is_default: true,
              conditions: [],
              logic: 'and'
            }
          ];
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
        // 处理条件分支节点 - 使用统一的sanitizeNodeData逻辑
        // 先获取现有的choices数据
        const originalChoices = item.data.parameters?.input_parameters?.choices || [];
        
        // 使用sanitizeNodeData生成标准化的Choice数据
        const choiceNodeData = {
          callId: 'Choice',
          parameters: {
            input_parameters: { choices: originalChoices },
            output_parameters: item.data.parameters?.output_parameters
          }
        };
        
        // 调用sanitizeNodeData进行标准化处理，确保branch_id正确生成
        const sanitizedChoice = sanitizeNodeData(choiceNodeData, item.id);
        
        newItem = {
          ...newItem,
          callId: 'Choice',
          parameters: sanitizedChoice.parameters,
        };
      } else if (item.type === 'Loop') {
        // 处理循环节点
        newItem = {
          ...newItem,
          callId: 'Loop',
          parameters: {
            input_parameters: item.data.parameters?.input_parameters || {},
            output_parameters: item.data.parameters?.output_parameters || {
              iteration_count: {
                type: 'number',
                description: '实际执行的循环次数'
              },
              stop_reason: {
                type: 'string',
                description: '停止原因'
              },
              variables: {
                type: 'object',
                description: '循环后的变量状态'
              }
            }
          },
        };
      }
      
      return newItem;
    });

    // 处理边
    const updateEdges = getEdges.value.map((item) => {
      let branchId = item.sourceHandle;
      
      // 如果没有sourceHandle，根据源节点类型生成默认的branchId
      if (!branchId) {
        const sourceNode = getNodes.value.find(node => node.id === item.source);
        if (sourceNode) {
          if (sourceNode.type === 'Choice') {
            // Choice节点应该有默认分支
            const choices = sourceNode.data?.parameters?.input_parameters?.choices || [];
            const defaultBranch = choices.find(choice => choice.is_default === true);
            branchId = defaultBranch ? defaultBranch.branch_id : `else_${item.source}`;
          } else {
            // 所有非Choice节点都使用空字符串作为branchId
            branchId = '';
          }
        } else {
          branchId = '';
        }
      }
      
      return {
        edgeId: item.id,
        sourceNode: item.source,
        targetNode: item.target,
        branchId: branchId,
      };
    });

    // 处理notes数据，收集注释节点
    const updateNotes = getNodes.value
      .filter(node => node.type === 'comment' && node.data?.isComment)
      .map(commentNode => ({
        noteId: commentNode.id,
        text: commentNode.data.description || '',
        position: commentNode.position,
        width: commentNode.data.width || 200,
        height: commentNode.data.height || 120
      }));

    // 处理节点参数更新
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
          } else if (item.callId === 'VariableAssign') {
            // 变量赋值节点
            if (!item.parameters) {
              item.parameters = {};
            }
            item.parameters.input_parameters = updateNodeParameter.parameters.input_parameters;
            item.parameters.output_parameters = updateNodeParameter.parameters.output_parameters || {};
          } else if (item.callId === 'FileExtract') {
            // 文件提取器节点
            if (!item.parameters) {
              item.parameters = {};
            }
            item.parameters.input_parameters = updateNodeParameter.parameters.input_parameters;
            item.parameters.output_parameters = updateNodeParameter.parameters.output_parameters;
          } else if (item.type === 'start') {
            item.variables == updateNodeParameter.variables;
          } else if (item.type === 'Loop') {
            if (!item.parameters) {
              item.parameters = {};
            }
            item.parameters.input_parameters = updateNodeParameter.parameters.input_parameters;
            item.parameters.output_parameters = updateNodeParameter.parameters.output_parameters;
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
    const response = await api.createOrUpdateFlowTopology(
      {
        appId: appId,
        flowId: flowObj.value.flowId,
      },
      {
        flow: {
          ...flowObj.value,
          nodes: updateNodes,
          edges: updateEdges,
          notes: updateNotes,
          focusPoint: {
            x: 800,
            y: 800,
          },
        },
      },
    );

    if (response[1]?.result) {
      queryFlow('update');
      const updatedCurFlow = response[1].result.flow;
      isNodeConnect.value = updatedCurFlow.connectivity;
      if (!isNodeConnect.value) {
        ElMessage.error(i18n.global.t('semantic.check_connect'));
      }
      redrageFlow(updatedCurFlow?.nodes, updatedCurFlow?.edges, updatedCurFlow?.notes || []);
    }

  } catch (error) {
    ElMessage.error('保存工作流失败');
  } finally {
    loading.value = false;
  }
};

// TODO saveNode -> saveNodeYaml，仅当以yaml形式保存时才调用
const saveNode = (yamlCode, nodeId, name, description) => {
  if (isEditingSubFlowNode.value) {
    // 如果是子工作流节点，使用LoopNode的保存方法
    const nodeData = {
      name,
      description,
      inputStream: yamlCode,
    };
    saveSubFlowNode(nodeData, nodeId);
  } else {
    // 外部节点，使用原有逻辑
    const updateNodeParameter = {
      id: nodeId,
      inputStream: yamlCode,
      name,
      description,
    };
    saveFlow(updateNodeParameter);
  }
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
          
          <div class="aside-content">
            <NodeSelector
              :api-service-list="apiServiceList"
              :search-placeholder="$t('semantic.interface_search')"
              :enable-drag="true"
              :on-drag-start="handleNodeDragStart"
              :extra-node-types="extraNodeTypes"
              @drag-start="handleNodeDragStart"
            />
          </div>
        </div>
      </transition>
    </aside>
    <div class="workFlowContainerRight" @contextmenu="handleContextMenu">
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
        @pane-context-menu="handleContextMenu"
      >
        <Background
          :color="themeStore.theme === 'dark' ? '#3e4551' : '#dfe5ef'"
          :size="2"
          :gap="8"
          @contextmenu="handleContextMenu"
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
            @insertNodeFromHandle="handleInsertNodeFromHandle"
          ></CustomNode>
        </template>
        
        <!-- 注释节点 -->
        <template #node-comment="commentNodeProps">
          <CommentNode
            v-bind="commentNodeProps"
            :disabled="debugDialogVisible"
            :selected="selectedNodeId === commentNodeProps.id"
            @delNode="delNode"
            @updateNodeData="updateCommentNodeData"
          ></CommentNode>
        </template>
        
        <!-- 插件节点 -->
        <template #node-plugin-node="pluginNodeProps">
          <PluginNode
            v-bind="pluginNodeProps"
            :disabled="debugDialogVisible"
            :selected="selectedNodeId === pluginNodeProps.id"
            @viewDetails="() => showPluginDetails(pluginNodeProps.data)"
            @deleteNode="() => delNode(pluginNodeProps.id)"
            @insertNodeFromHandle="handleInsertNodeFromHandle"
          ></PluginNode>
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
            @insertNodeFromHandle="handleInsertNodeFromHandle"
          ></ChoiceBranchNode>
        </template>

        <!-- 循环节点 -->
        <template #node-Loop="loopNodeProps">
          <LoopNode
            v-bind="loopNodeProps"
            :appId="route.query.appId"
            :flowId="flowObj?.flowId"
            :disabled="debugDialogVisible"
            :selected="selectedNodeId === loopNodeProps.id"
            :api-service-list="apiServiceList"
            @delNode="delNode"
            @editYamlDrawer="editYamlDrawer"
            @editLoopNode="editLoopNode"
            @editSubFlowNode="editSubFlowNode"
            @showInsertNodeMenu="handleShowLoopInsertNodeMenu"
            @updateConnectHandle="updateConnectHandle"
            @insertNodeFromHandle="handleInsertNodeFromHandle"
            @updateSubFlowId="handleUpdateSubFlowId"
          ></LoopNode>
        </template>

        <!-- 变量赋值节点 -->
        <template #node-VariableAssign="variableAssignNodeProps">
          <VariableAssignNode
            v-bind="variableAssignNodeProps"
            :disabled="debugDialogVisible"
            :selected="selectedNodeId === variableAssignNodeProps.id"
            @delNode="delNode"
            @editYamlDrawer="editYamlDrawer"
            @updateConnectHandle="updateConnectHandle"
            @insertNodeFromHandle="handleInsertNodeFromHandle"
          ></VariableAssignNode>
        </template>

        <!-- 开始结束节点 -->
        <template #node-start="nodeStartProps">
          <CustomSaENode
            @updateConnectHandle="updateConnectHandle"
            @editYamlDrawer="editYamlDrawer"
            @editStartNodeDrawer="editStartNodeDrawer"
            @insertNodeFromHandle="handleInsertNodeFromHandle"
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
            @insertNodeFromHandle="handleInsertNodeFromHandle"
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
            :isConnection="false"
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
              <path fill="currentColor" d="M20 18a1 1 0 0 1-1 1h-4a3 3 0 0 0-3 3a3 3 0 0 0-3-3H5a1 1 0 0 0-1-1H2a3 3 0 0 0 3 3h4a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2h4a3 3 0 0 0 3-3Zm0-12a1 1 0 0 0-1-1h-4a3 3 0 0 1-3-3a3 3 0 0 1-3 3H5a1 1 0 0 0-1 1H2a3 3 0 0 1 3-3h4a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2h4a3 3 0 0 1 3 3Zm-8 6L9 8H7v8h2v-4l3 4h2V8h-2zm9-4l-2 5.27L17 8h-2l3 8h2l3-8zM1 8v8h5v-2H3v-1h2v-2H3v-1h3V8z" />
            </svg>
          </div>
        </el-tooltip>
        <el-tooltip
          v-if="!isNodeAndLineConnect && !isNodeConnect"
          effect="dark"
          :content="$t('semantic.check_connect')"
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
          <div class="resultText">
            {{ $t(`flow.${StatusInfoTitle[debugStatus]}`) }}
          </div>
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
    :isSubFlowNode="isEditingSubFlowNode"
    :loopNodeId="currentLoopNodeId"
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
  
  <!-- 自定义api调用抽屉 -->
  <ApiCallDrawer
    v-if="isEditApiCall"
    :appId="route.query?.appId"
    :flowId="flowObj?.flowId"
    :yamlContent="yamlContent"
    :nodeName="nodeName"
    :nodeDesc="nodeDesc"
    :nodeYamlId="nodeYamlId"
    @closeDrawer="closeDrawer(NodeType.API)"
    @saveNode="saveNode"
  ></ApiCallDrawer>

  <!-- 自定义大模型抽屉 -->
  <LLMNodeDrawer
    v-if="isEditLLMNode"
    :appId="route.query?.appId"
    :flowId="flowObj?.flowId"
    :yamlContent="yamlContent"
    :nodeName="nodeName"
    :nodeDesc="nodeDesc"
    :nodeYamlId="nodeYamlId"
    @closeDrawer="closeDrawer(NodeType.LLM)"
    @saveNode="saveNode"
  ></LLMNodeDrawer>

  <!-- 自定义知识库抽屉 -->
  <RAGNodeDrawer
    v-if="isEditRAGNode"
    :appId="route.query?.appId"
    :flowId="flowObj?.flowId"
    :yamlContent="yamlContent"
    :nodeName="nodeName"
    :nodeDesc="nodeDesc"
    :nodeYamlId="nodeYamlId"
    @closeDrawer="closeDrawer(NodeType.RAG)"
    @saveNode="saveNode"
  ></RAGNodeDrawer>

  <!-- 自定义知识库抽屉 -->
  <MCPNodeDrawer
    v-if="isEditMCPNode"
    :appId="route.query?.appId"
    :flowId="flowObj?.flowId"
    :yamlContent="yamlContent"
    :nodeName="nodeName"
    :nodeDesc="nodeDesc"
    :nodeYamlId="nodeYamlId"
    @closeDrawer="closeDrawer(NodeType.MCP)"
    @saveNode="saveNode"
  ></MCPNodeDrawer>

  <!-- 代码节点编辑器 - 基于变量逻辑 -->
  <CodeNodeDrawer
    :visible="isEditCodeNode"
    :nodeData="currentCodeNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    :isSubFlowNode="isEditingSubFlowNode"
    :loopNodeId="currentLoopNodeId"
    @update:visible="closeCodeNodeDrawer"
    @saveNode="saveCodeNode"
  />
  
  <!-- 直接回复节点编辑器 -->
  <DirectReplyDrawer
    :visible="isEditDirectReplyNode"
    :nodeData="currentDirectReplyNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    :isSubFlowNode="isEditingSubFlowNode"
    :loopNodeId="currentLoopNodeId"
    @update:visible="closeDirectReplyDrawer"
    @saveNode="saveDirectReplyNode"
  />
  
  <!-- 条件分支节点编辑器 -->
  <ChoiceBranchDrawer
    :visible="isEditChoiceBranchNode"
    :nodeData="currentChoiceBranchNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    :conversationId="conversationId"
    :currentStepId="nodeYamlId"
    :isSubFlowNode="isEditingSubFlowNode"
    :loopNodeId="currentLoopNodeId"
    @update:visible="closeChoiceBranchDrawer"
    @saveNode="saveChoiceBranchNode"
  />
  
  <!-- 变量赋值节点编辑器 -->
  <VariableAssignNodeDrawer
    :visible="isEditVariableAssignNode"
    :nodeData="currentVariableAssignNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    :isSubFlowNode="isEditingSubFlowNode"
    :loopNodeId="currentLoopNodeId"
    @update:visible="closeVariableAssignDrawer"
    @saveNode="saveVariableAssignNode"
  />
  
  <!-- 文件提取器节点编辑器 -->
  <FileExtractorDrawer
    :visible="isEditFileExtractorNode"
    :nodeData="currentFileExtractorNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    :conversationId="conversationId"
    :isSubFlowNode="isEditingSubFlowNode"
    :loopNodeId="currentLoopNodeId"
    @update:visible="closeFileExtractorDrawer"
    @saveNode="saveFileExtractorNode"
  />
  
  <!-- 循环节点编辑器 -->
  <LoopNodeDrawer
    :visible="isEditLoopNode"
    :nodeData="currentLoopNodeData"
    :nodeId="nodeYamlId"
    :flowId="flowObj?.flowId"
    :currentStepId="nodeYamlId"
    :isSubFlowNode="isEditingSubFlowNode"
    :loopNodeId="currentLoopNodeId"
    @update:visible="closeLoopNodeDrawer"
    @save="saveLoopNode"
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
  
  <!-- LoopNode子工作流插入节点菜单 -->
  <InsertNodeMenu
    v-if="loopInsertMenuData"
    :visible="isLoopInsertNodeMenuVisible"
    :position="loopInsertMenuData.position"
    :menu-direction="loopInsertMenuData.direction"
    :api-service-list="apiServiceList"
    :exclude-node-types="['Loop']"
    :extra-node-types="loopInsertMenuData.extraNodeTypes || []"
    @close="closeLoopInsertNodeMenu"
    @selectNode="handleLoopInsertNodeSelect"
  />
  
  <!-- 环境变量配置抽屉 -->
  <EnvironmentVariableDrawer
    v-if="isEditEnvironmentVariables"
    :flowId="flowObj?.flowId"
    @closeDrawer="closeEnvironmentVariables"
  />
  
  <!-- 语义接口详情抽屉 -->
  <el-drawer
    v-if="pluginDetailType === 'semantic_interface'"
    v-model="pluginDetailDrawerVisible"
    :title="getPluginDrawerTitle()"
    :show-close="false"
    header-class="drawerHeader"
    destroy-on-close
    direction="rtl"
    :before-close="closePluginDetailDrawer"
  >
    <div class="drawerContent">
      <div style="height: 100%">
        <Upload
          type="get"
          @closeDrawer="closePluginDetailDrawer"
          :serviceId="selectedPluginServiceId"
          :getServiceJson="getServiceJson"
          :getServiceName="getServiceName"
        />
      </div>
    </div>
  </el-drawer>
  
  <!-- MCP服务详情抽屉 -->
  <McpServiceDetailDrawer
    v-if="pluginDetailType === 'mcp'"
    v-model:visible="pluginDetailDrawerVisible"
    :service-id="selectedPluginServiceId"
  />
  
  <!-- 画布右键菜单 -->
  <div
    v-if="contextMenuVisible"
    :style="{
      position: 'fixed',
      left: contextMenuPosition.x + 'px',
      top: contextMenuPosition.y + 'px',
      zIndex: 9999
    }"
    class="context-menu-dropdown"
  >
    <div class="custom-context-menu">
      <div class="context-menu-item" @click="handleAddNode">
        <el-icon><IconPlusCircle /></el-icon>
        <span>{{ t('contextMenu.add_node') }}</span>
      </div>
      <div class="context-menu-item" @click="handleAddComment">
        <el-icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 22a1 1 0 0 1-1-1v-3H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.1l-3.7 3.71c-.2.19-.45.29-.7.29H9z"/></svg></el-icon>
        <span>{{ t('contextMenu.add_comment') }}</span>
      </div>
      <div class="context-menu-item" @click="handleDebugWorkflow">
        <el-icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a9 9 0 0 0-9 9v1a1 1 0 0 0 2 0v-1a7 7 0 0 1 14 0v1a1 1 0 0 0 2 0v-1a9 9 0 0 0-9-9Z"/><path fill="currentColor" d="M8 10a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1Zm8 0a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1Z"/><path fill="currentColor" d="M12 15a3 3 0 0 1-3-3H7a5 5 0 0 0 10 0h-2a3 3 0 0 1-3 3Z"/></svg></el-icon>
        <span>{{ t('contextMenu.debug_workflow') }}</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleExportYAML">
        <el-icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 7V3.5L18.5 9z"/></svg></el-icon>
        <span>{{ t('contextMenu.export_yaml') }}</span>
      </div>
      <div class="context-menu-item" @click="handleImportYAML">
        <el-icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 7V3.5L18.5 9z"/><path fill="currentColor" d="M12 11.5L9.5 14H11v4h2v-4h1.5z"/></svg></el-icon>
        <span>{{ t('contextMenu.import_yaml') }}</span>
      </div>
    </div>
  </div>
  
  <!-- 注释输入框已移除，现在直接在CommentNode中编辑 -->
  
  <!-- 隐藏的文件输入元素，用于YAML导入 -->
  <input
    ref="yamlFileInputRef"
    type="file"
    accept=".yaml,.yml,.json"
    style="display: none;"
    @change="handleYAMLFileImport"
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
    width: 20px;
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
  
  
  .aside-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

// 环境变量按钮样式 - 使用专门的环境变量CSS变量
.envBtn {
  width: 32px;
  height: 32px;
  background: var(--flow-env-default);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0277ff;
  border: 1px solid #e1e4e8;
  
  &:hover {
    background: var(--flow-env-hover);
    color: #0277ff;
    border-color: #0277ff;
  }
  &:active {
    background: var(--flow-env-active);
    color: #0277ff;
  }
  
  &.isEnvDis {
    background: var(--flow-env-dis);
    cursor: not-allowed;
    color: #9ca3af;
    border-color: #e1e4e8;
  }
}

// 深色主题支持
.dark {
  .node-panel-toggle {
    background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
    border-color: #4a5568;
    box-shadow: 0 4px 12px rgba(45, 55, 72, 0.3);
    
    &.collapsed {
      &:hover {
        box-shadow: 0 6px 20px rgba(45, 55, 72, 0.4);
      }
    }
    
    &.expanded {
      &:hover {
        background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
      }
    }
    

  }
  
  .copilot-aside-new {
    background: #2d3748;
    border-color: #4a5568;
    
  }
  
  // 环境变量按钮在深色主题下的样式调整
  .envBtn {
    color: #0277ff;
    border-color: rgba(255, 255, 255, 0.1);
    
    &:hover {
      color: #0277ff;
      border-color: #0277ff;
    }
    
    &:active {
      color: #0277ff;
    }
    
    &.isEnvDis {
      color: #6b7280;
      border-color: rgba(255, 255, 255, 0.1);
    }
  }
}

/* 插件详情抽屉样式 */
.drawerHeader {
  color: pink;
  background-color: #5481de !important;
  margin-bottom: 0px !important;
  .header {
    background-color: pink;
  }
}

.drawerContent {
  overflow-y: scroll;
  height: calc(100% - 40px);
}

:deep(.el-drawer__header) {
  .drawerHeader {
    width: 100%;
    height: 24px;
    line-height: 24px;
    color: var(--o-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .el-drawer__title {
    color: var(--o-text-color-primary) !important;
  }
}

:deep(.el-drawer__body) {
  .drawerBody {
    height: 100%;
    textarea {
      width: 100%;
      height: 100%;
    }
  }
}

/* 右键菜单样式 */
.context-menu-dropdown {
  pointer-events: auto;
}

.custom-context-menu {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 4px 0;
  min-width: 160px;
}

.context-menu-item {
  padding: 8px 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f5f7fa;
    color: #409eff;
  }
  
  .el-icon {
    font-size: 16px;
  }
  
  span {
    font-size: 14px;
  }
}

.context-menu-divider {
  height: 1px;
  background-color: #e4e7ed;
  margin: 4px 0;
}

/* 注释输入框样式已移除，现在直接在CommentNode中编辑 */

/* 深色主题支持 */
.dark {
  .custom-context-menu {
    background-color: #2d3748;
    border-color: #4a5568;
  }
  
  .context-menu-item {
    color: #e2e8f0;
    
    &:hover {
      background-color: #4a5568;
      color: #409eff;
    }
  }
  
  .context-menu-divider {
    background-color: #4a5568;
  }
  
  /* 注释输入框深色样式已移除 */
}
</style>