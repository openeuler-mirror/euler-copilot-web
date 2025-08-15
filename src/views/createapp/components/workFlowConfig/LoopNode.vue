<script lang="ts" setup>
import { Position, Handle } from '@vue-flow/core';
import { ref, computed, watch, onMounted, nextTick, readonly, onUnmounted } from 'vue';
import { Delete, WarnTriangleFilled, CopyDocument, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getSrcIcon, getNodeClass, nodeTypeToIcon } from '../types';
import StopFilled from '@/assets/svgs/StopFilled.svg';
import Refresh from '@/assets/svgs/Refresh.svg';
import { querySingleSubFlowTopology, createOrUpdateSubFlowTopology } from 'src/apis/workFlow/workFlowService';
import CustomEdge from './CustomEdge.vue';
import NodeMirrorText from '../codeMirror/nodeMirrorText.vue';
import { v4 as uuidv4 } from 'uuid';
import { getId, sanitizeNodeData, createNewNode } from './useDnD';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
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
  selected: {
    type: Boolean,
    default: false,
  },
  appId: {
    type: String,
    required: true,
  },
  flowId: {
    type: String,
    required: true,
  },
  apiServiceList: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(['delNode', 'editYamlDrawer', 'updateConnectHandle', 'editLoopNode', 'editSubFlowNode', 'showInsertNodeMenu', 'insertNodeFromHandle', 'updateSubFlowId']);

const { t } = useI18n();

// Loop节点专用的额外节点类型定义
const extraLoopNodeTypes = ref([
  {
    nodeId: 'continue',
    callId: 'continue',
    name: '跳过本轮',
    description: '跳过当前循环轮次，继续下一轮',
    type: 'logic',
    icon: nodeTypeToIcon.continue,
    nodeType: 'continue'
  },
  {
    nodeId: 'break',
    callId: 'break', 
    name: '退出循环',
    description: '跳出整个循环，结束循环执行',
    type: 'logic',
    icon: nodeTypeToIcon.break,
    nodeType: 'break'
  }
]);

// 节点状态管理
const statusList = ref(['running', 'success', 'error']);
const curStatus = ref('default');
const costTime = ref('');

// 定义传给mirror展示输入输出的存储量
const inputAndOutput = ref({
  input_parameters: {},
  output_parameters: {},
});

// Handle连接状态
const handleTargetConnecting = ref(false);
const handleSourceConnecting = ref(false);

// Handle位置插入按钮的悬停状态
const sourceHandleHovered = ref(false);

// 子节点的+按钮悬停状态映射
const subNodeSourceHandleHovered = ref(new Map());

// Choice节点相关逻辑
// 解析Choice节点的分支数据
const getChoiceBranches = (choiceData: any) => {
  const choices = choiceData?.parameters?.input_parameters?.choices || [];
  return choices.map((choice, index) => {
    return {
      id: choice.branch_id || `branch_${index}`,
      name: choice.name || `分支 ${index + 1}`,
      isDefault: choice.is_default || false,
      conditions: choice.conditions || [],
      logic: choice.logic || 'and'
    };
  });
};

// 获取条件分支（非默认分支）
const getConditionalBranches = (branches: any[]) => {
  return branches.filter(branch => !branch.isDefault);
};

// 获取默认分支
const getDefaultBranch = (branches: any[]) => {
  return branches.find(branch => branch.isDefault);
};

// 操作符中文映射
const operatorLabels = {
  'string_equal': '等于',
  'string_not_equal': '不等于',
  'string_contains': '包含',
  'string_not_contains': '不包含',
  'string_starts_with': '开始于',
  'string_ends_with': '结束于',
  'string_length_equal': '长度等于',
  'string_length_greater_than': '长度大于',
  'string_length_greater_than_or_equal': '长度大于等于',
  'string_length_less_than': '长度小于',
  'string_length_less_than_or_equal': '长度小于等于',
  'string_regex_match': '正则匹配',
  'number_equal': '等于',
  'number_not_equal': '不等于',
  'number_greater_than': '大于',
  'number_greater_than_or_equal': '大于等于',
  'number_less_than': '小于',
  'number_less_than_or_equal': '小于等于',
  'bool_equal': '等于',
  'bool_not_equal': '不等于',
  'dict_equal': '等于',
  'dict_not_equal': '不等于',
  'dict_contains_key': '包含键',
  'dict_not_contains_key': '不包含键',
};

// VariableAssign 操作类型中文映射
const variableOperationLabels = {
  'overwrite': '覆盖',
  'clear': '清空',
  'add': '加法',
  'subtract': '减法',
  'multiply': '乘法',
  'divide': '除法',
  'modulo': '求余',
  'power': '乘幂',
  'sqrt': '开方',
  'append': '追加',
  'extend': '扩展',
  'pop_first': '移除首项',
  'pop_last': '移除尾项'
};

// 获取VariableAssign节点的变量操作列表
const getVariableOperations = (nodeData: any) => {
  const operations = nodeData?.parameters?.input_parameters?.operations || [];
  return operations.filter(op => op.variable_name && op.operation);
};

// 获取操作类型的显示名称
const getOperationDisplayName = (operation: string): string => {
  return variableOperationLabels[operation] || operation;
};

// 提取变量名的最后一部分（后缀）
const getVariableDisplayName = (variableName: string): string => {
  if (!variableName || typeof variableName !== 'string') {
    return '?';
  }
  
  // 按点分割变量名，返回最后一部分
  const parts = variableName.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  
  return variableName;
};

// 解析变量引用，提取变量名
const parseVariableReference = (variableRef: any) => {
  if (!variableRef || typeof variableRef !== 'string') {
    return '?';
  }
  
  // 先清理可能的 {{ }} 包装
  let cleanRef = variableRef.replace(/^\{\{(.*)\}\}$/, '$1').trim();
  
  // 格式: conversation.step_id.variable_name 或 scope.variable_name
  const parts = cleanRef.split('.');
  if (parts.length >= 2) {
    // 返回最后一部分作为变量名，并清理可能残留的 }}
    let variableName = parts[parts.length - 1];
    return variableName.replace(/\}\}$/, '');
  }
  
  return cleanRef.replace(/\}\}$/, '');
};

// 根据数据类型格式化值
const formatValueByType = (value: any, dataType: string, isReference = false) => {
  if (isReference) {
    return parseVariableReference(value);
  }
  
  if (!value && value !== 0 && value !== false) {
    return '?';
  }
  
  switch (dataType) {
    case 'string':
      return `"${value}"`;
    case 'number':
      return String(value);
    case 'bool':
      return String(value);
    case 'list':
      return Array.isArray(value) ? `[${value.join(', ')}]` : `[${value}]`;
    case 'dict':
      return typeof value === 'object' ? JSON.stringify(value) : `{${value}}`;
    default:
      return String(value);
  }
};

// 格式化条件显示为HTML（带标签样式）
const formatConditionsHtml = (conditions: any[], logic: string) => {
  if (!conditions || conditions.length === 0) {
    return '<span class="no-condition">条件未设置</span>';
  }
  
  // 过滤掉无效条件（left.value为null的条件）
  const validConditions = conditions.filter(condition => {
    return condition.left?.value && 
           condition.left.value !== '' && 
           condition.left.value !== null && 
           condition.left.value !== undefined;
  });
  
  if (validConditions.length === 0) {
    return '<span class="no-condition">条件未设置</span>';
  }
  
  const conditionTexts = validConditions.map(condition => {
    // 解析左值（变量）- 添加标签样式
    const leftValue = parseVariableReference(condition.left?.value);
    const leftHtml = `<span class="variable-tag">${leftValue}</span>`;
    
    // 获取操作符中文 - 添加操作符样式
    const operatorKey = condition.operator || condition.operate;
    let operatorLabel = operatorLabels[operatorKey];
    
    // 如果没有找到映射，提供简单的后备显示
    if (!operatorLabel) {
      console.warn(`[Loop显示] 未找到操作符映射: ${operatorKey}`);
      switch(operatorKey) {
        case 'number_less_than_or_equal':
          operatorLabel = '<=';
          break;
        case 'number_greater_than_or_equal':
          operatorLabel = '>=';
          break;
        case 'number_less_than':
          operatorLabel = '<';
          break;
        case 'number_greater_than':
          operatorLabel = '>';
          break;
        case 'number_equal':
          operatorLabel = '==';
          break;
        default:
          operatorLabel = operatorKey || '==';
      }
    }
    const operatorHtml = `<span class="operator-text">${operatorLabel}</span>`;
    
    // 解析右值 - 根据类型添加不同样式
    const isRightReference = condition.right?.type === 'reference';
    const rightValue = formatValueByType(
      condition.right?.value, 
      condition.dataType || 'string',
      isRightReference
    );
    
    let rightHtml;
    if (isRightReference) {
      rightHtml = `<span class="variable-tag">${rightValue}</span>`;
    } else {
      rightHtml = `<span class="value-text ${condition.dataType || 'string'}-value">${rightValue}</span>`;
    }
    
    return `${leftHtml} ${operatorHtml} ${rightHtml}`;
  });
  
  const logicText = logic === 'and' ? ' <span class="logic-text">且</span> ' : ' <span class="logic-text">或</span> ';
  return conditionTexts.join(logicText);
};

// Choice节点Handle悬停状态
// Choice节点Handle处理 - 悬停状态现在通过CSS控制

// 处理Choice节点的+按钮插入节点
const handleChoiceSourceInsertNode = (event: MouseEvent, nodeId: string, branchId: string) => {
  event.stopPropagation();
  if (props.disabled) {
    return;
  }
  
  // 获取分支名称用于调试
  const node = subFlowNodes.value.find(n => n.id === nodeId);
  const choices = node?.data?.parameters?.input_parameters?.choices || [];
  const branch = choices.find(choice => choice.branch_id === branchId);
  const branchName = branch ? (branch.is_default ? 'ELSE' : `Case${choices.filter(c => !c.is_default).indexOf(branch) + 1}`) : 'Unknown';

  // 发射插入节点事件，传递节点信息和handle类型，并携带branchId
  handleSubNodeSourceInsertNode(event, nodeId, branchId);
};

// 控制删除按钮文字显示
const showDeleteText = ref(false);

// 添加初始化状态管理，避免重复初始化
const isInitialized = ref(false);
const isLoading = ref(false);

// 循环节点内嵌画布大小控制 - 1:1比例，无缩放
const canvasWidth = ref(600);
const canvasHeight = ref(300);
const minWidth = ref(500);
const minHeight = ref(250);
// 移除最大宽度和最大高度限制，允许无限制调整大小

// 拖拽调整大小相关
const isResizing = ref(false);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const resizeStartWidth = ref(0);
const resizeStartHeight = ref(0);

// 子flow数据 - 直接管理内嵌VueFlow的数据，不使用useVueFlow()
const subFlowNodes = ref<any[]>([]);
const subFlowEdges = ref<any[]>([]);
const subFlowLoading = ref(false);

// Loop节点的子工作流管理
const loopSubFlow = ref({
  name: '',
  description: '',
  nodes: [] as any[],
  edges: [] as any[],
  flowId: '', // 用于存储已保存的子工作流ID
  hasUnsavedChanges: false, // 标记是否有未保存的更改
});

// 内嵌画布的viewport配置 - 1:1比例
const subFlowViewport = ref({ zoom: 1.0, x: 10, y: 10 });

// 循环参数计算属性
const loopVariables = computed(() => {
  return props.data?.parameters?.input_parameters?.variables || {};
});

const stopCondition = computed(() => {
  return props.data?.parameters?.input_parameters?.stop_condition || {};
});

const maxIteration = computed(() => {
  return props.data?.parameters?.input_parameters?.max_iteration || 10;
});

const subFlowId = computed(() => {
  return props.data?.parameters?.input_parameters?.sub_flow_id || '';
});

// 强制重新计算边路径的触发器
const edgeUpdateTrigger = ref(0);

// 更新边的状态数据，基于源节点和目标节点的状态
const updateEdgeStatus = () => {
  subFlowEdges.value = subFlowEdges.value.map(edge => {
    const sourceNode = subFlowNodes.value.find(n => n.id === edge.source);
    const targetNode = subFlowNodes.value.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      return {
        ...edge,
        data: {
          ...edge.data,
          sourceStatus: sourceNode.data?.status,
          targetStatus: targetNode.data?.status,
        }
      };
    }
    
    return edge;
  });
};

// 获取外部VueFlow的缩放倍率 - 改进版本
const getVueFlowZoom = (): number => {
  let vueFlowZoom = 1.0;
  
  // 优先级方法: 直接从VueFlow实例获取（如果可能）
  try {
    const vueFlowContainer = document.querySelector('.my-diagram-class');
    if (vueFlowContainer) {
      // 查找具体的缩放容器
      const viewport = vueFlowContainer.querySelector('.vue-flow__viewport');
      const transformations = vueFlowContainer.querySelector('.vue-flow__transformations');
      
      if (viewport) {
        const transform = window.getComputedStyle(viewport).transform;
        if (transform && transform !== 'none') {
          const matrix = transform.match(/matrix\(([^)]+)\)/);
          if (matrix) {
            const values = matrix[1].split(',');
            vueFlowZoom = parseFloat(values[0]);
            if (vueFlowZoom !== 1.0) return vueFlowZoom;
          }
        }
      }
      
      if (transformations) {
        const transform = window.getComputedStyle(transformations).transform;
        if (transform && transform !== 'none') {
          const matrix = transform.match(/matrix\(([^)]+)\)/);
          if (matrix) {
            const values = matrix[1].split(',');
            const scaleX = parseFloat(values[0]);
            if (scaleX !== 1.0) {
              vueFlowZoom = scaleX;
              return vueFlowZoom;
            }
          }
        }
      }
    }
  } catch (error) {
    
  }
  
  // 方法1: 尝试从Vue Flow的viewport元素获取
  const vueFlowViewport = document.querySelector('.vue-flow__viewport');
  if (vueFlowViewport) {
    const transform = window.getComputedStyle(vueFlowViewport).transform;
    if (transform && transform !== 'none') {
      const matrix = transform.match(/matrix\(([^)]+)\)/);
      if (matrix) {
        const values = matrix[1].split(',');
        vueFlowZoom = parseFloat(values[0]);
        if (vueFlowZoom !== 1.0) return vueFlowZoom;
      }
    }
  }
  
  // 方法2: 如果方法1没有获取到，尝试从transformations元素获取
  const transformationsElement = document.querySelector('.vue-flow__transformations');
  if (transformationsElement) {
    const transform = window.getComputedStyle(transformationsElement).transform;
    if (transform && transform !== 'none') {
      const matrix = transform.match(/matrix\(([^)]+)\)/);
      if (matrix) {
        const values = matrix[1].split(',');
        const scaleX = parseFloat(values[0]);
        if (scaleX !== 1.0) {
          vueFlowZoom = scaleX;
          return vueFlowZoom;
        }
      }
    }
  }
  
  // 方法3: 从CustomControl组件的缩放显示文本获取
  const scaleNumberElement = document.querySelector('.controlScaleNumber');
  if (scaleNumberElement && scaleNumberElement.textContent) {
    const zoomMatch = scaleNumberElement.textContent.match(/(\d+)%/);
    if (zoomMatch) {
      vueFlowZoom = parseFloat(zoomMatch[1]) / 100;
    }
  }
  return vueFlowZoom;
};

// 处理边连接线，为CustomEdge组件生成props
const processedEdges = computed(() => {
  // 依赖于触发器，确保在需要时重新计算
  edgeUpdateTrigger.value;
  return subFlowEdges.value.map(edge => {
    const sourceNode = subFlowNodes.value.find(n => n.id === edge.source);
    const targetNode = subFlowNodes.value.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) {
      return { 
        ...edge, 
        sourceX: 0, 
        sourceY: 0, 
        targetX: 0, 
        targetY: 0,
        sourcePosition: 'right',
        targetPosition: 'left'
      };
    }
    
    // 获取外部VueFlow的缩放倍率
    const vueFlowZoom = getVueFlowZoom();
    
    // 计算节点尺寸（原始尺寸，内嵌画布是1:1比例）
    const sourceNodeWidth = (sourceNode.data?.callId === 'start' || sourceNode.data?.callId === 'end') ? 160 : 320;
    const sourceNodeHeight = (sourceNode.data?.callId === 'start' || sourceNode.data?.callId === 'end') ? 60 : 80; // 更准确的高度估计
    const targetNodeWidth = (targetNode.data?.callId === 'start' || targetNode.data?.callId === 'end') ? 160 : 320;
    const targetNodeHeight = (targetNode.data?.callId === 'start' || targetNode.data?.callId === 'end') ? 60 : 80; // 更准确的高度估计
    
    // 优先使用实际DOM位置，计算位置仅作为后备
    let sourceX, sourceY, targetX, targetY;
    let useCalculatedPosition = false;
    
    // 使用智能坐标计算：优先DOM坐标，回退到计算坐标
    useCalculatedPosition = true;
    
    // 尝试从DOM获取实际节点高度以提高精度
    let actualSourceHeight = sourceNodeHeight;
    let actualTargetHeight = targetNodeHeight;
    let domSourceX, domSourceY, domTargetX, domTargetY;
    
    try {
      const sourceElement = document.querySelector(`#loop-${props.id} [data-node-id="${edge.source}"]`);
      const targetElement = document.querySelector(`#loop-${props.id} [data-node-id="${edge.target}"]`);
      const canvasElement = document.querySelector(`#loop-${props.id}`);
      
      if (sourceElement && canvasElement) {
        const sourceRect = sourceElement.getBoundingClientRect();
        actualSourceHeight = sourceRect.height / vueFlowZoom;
        
        // 获取实际Handle位置 - 根据edge的sourceHandle选择正确的handle
        let sourceHandle;
        if (edge.sourceHandle && edge.sourceHandle !== 'default') {
          // 如果有特定的sourceHandle ID，查找对应的handle
          sourceHandle = sourceElement.querySelector(`#${CSS.escape(edge.sourceHandle)}.vue-flow__handle-right`);
        }
        
        // 如果没找到特定handle，回退到查找第一个右侧handle
        if (!sourceHandle) {
          sourceHandle = sourceElement.querySelector('.vue-flow__handle-right');
        }
        
        if (sourceHandle) {
          const canvasRect = canvasElement.getBoundingClientRect();
          const sourceHandleRect = sourceHandle.getBoundingClientRect();
          
          // 确保Handle有有效的尺寸（已渲染）
          if (sourceHandleRect.width > 0 && sourceHandleRect.height > 0) {
            domSourceX = (sourceHandleRect.left + sourceHandleRect.width / 2 - canvasRect.left) / vueFlowZoom;
            domSourceY = (sourceHandleRect.top + sourceHandleRect.height / 2 - canvasRect.top) / vueFlowZoom;
          }
        }
      }
      
      if (targetElement && canvasElement) {
        const targetRect = targetElement.getBoundingClientRect();
        actualTargetHeight = targetRect.height / vueFlowZoom;
        
        // 获取实际Handle位置 - 根据edge的targetHandle选择正确的handle
        let targetHandle;
        if (edge.targetHandle && edge.targetHandle !== 'default') {
          // 如果有特定的targetHandle ID，查找对应的handle
          targetHandle = targetElement.querySelector(`#${CSS.escape(edge.targetHandle)}.vue-flow__handle-left`);
        }
        
        // 如果没找到特定handle，回退到查找第一个左侧handle
        if (!targetHandle) {
          targetHandle = targetElement.querySelector('.vue-flow__handle-left');
        }
        
        if (targetHandle) {
          const canvasRect = canvasElement.getBoundingClientRect();
          const targetHandleRect = targetHandle.getBoundingClientRect();
          
          // 确保Handle有有效的尺寸（已渲染）
          if (targetHandleRect.width > 0 && targetHandleRect.height > 0) {
            domTargetX = (targetHandleRect.left + targetHandleRect.width / 2 - canvasRect.left) / vueFlowZoom;
            domTargetY = (targetHandleRect.top + targetHandleRect.height / 2 - canvasRect.top) / vueFlowZoom;
          }
        }
      }
    } catch (error) {
      // 如果无法获取DOM尺寸，使用默认值
    }
    
    // 优先使用DOM坐标（最准确），回退到计算坐标
    if (domSourceX !== undefined && domSourceY !== undefined) {
      sourceX = domSourceX;
      sourceY = domSourceY;
    } else {
      // 后备计算：基于节点位置和尺寸估算Handle位置
      sourceX = sourceNode.position.x + sourceNodeWidth + 7; 
      sourceY = sourceNode.position.y + actualSourceHeight / 2;
    }
    
    if (domTargetX !== undefined && domTargetY !== undefined) {
      targetX = domTargetX;
      targetY = domTargetY;
    } else {
      // 后备计算：基于节点位置和尺寸估算Handle位置
      targetX = targetNode.position.x - 7; 
      targetY = targetNode.position.y + actualTargetHeight / 2;
    }
    

    
    return { 
      ...edge, 
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: 'right',
      targetPosition: 'left'
    };
  });
});

// 加载子flow数据
const loadSubFlowData = async () => {
  // 避免重复加载
  if (isLoading.value) {
    return;
  }
  
  if (!subFlowId.value) {
    // 当没有sub_flow_id时，只在未初始化时才创建空的子工作流
    if (!isInitialized.value) {
      initializeEmptySubFlow();
      isInitialized.value = true;
    } 
    return;
  }

  isLoading.value = true;
  subFlowLoading.value = true;
  try {
    const appId = props.appId;
    
    const [error, response] = await querySingleSubFlowTopology({
      appId: appId,
      flowId: props.flowId, // 父工作流ID
      subFlowId: subFlowId.value,
    });

    if (response && response.result && (response.result as any).flow) {
      const flowData = (response.result as any).flow;
      
      // 更新loopSubFlow状态
      loopSubFlow.value = {
        name: flowData.name || '循环子工作流',
        description: flowData.description || '',
        nodes: (flowData.nodes || []).filter((node: any) => node.callId !== 'Loop' && node.callId !== 'end'), // 过滤掉Loop节点和结束节点
        edges: flowData.edges || [],
        flowId: subFlowId.value,
        hasUnsavedChanges: false,
      };
      
      // 转换节点数据为显示格式
      const nodes = (flowData.nodes || []).map((node: any) => {
        // 安全检查：如果子工作流数据中包含Loop节点或结束节点，则跳过
        if (node.callId === 'Loop') {
          ElMessage.warning('检测到循环节点内部的嵌套循环节点，已自动移除');
          return null; // 返回null表示跳过此节点
        }
        
        if (node.callId === 'end') {
          return null; // 返回null表示跳过此节点
        }

        let newNode: any = {
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
          position: {
            x: node.position?.x || 0, // 1:1比例，无缩放
            y: node.position?.y || 0,
          },
          deletable: false, // 子flow中的节点暂时不可删除
        };

        // 根据节点类型设置相应的type和额外属性
        if (node.callId === 'start' || node.callId === 'end') {
          newNode.data = {
            ...newNode.data,
            target: node.callId === 'start' ? 'source' : 'target',
            nodePosition: node.callId === 'start' ? 'Right' : 'Left',
          };
        } else if (node.callId === 'Choice') {
          newNode.type = 'Choice';
        } else if (node.callId === 'Loop') {
          newNode.type = 'Loop';
        } else if (node.callId === 'VariableAssign') {
          newNode.type = 'VariableAssign';
        } else if (node.callId === 'Code') {
          newNode.type = 'custom';
          // Code节点需要将配置属性直接添加到 data 中，以便编辑器读取
          const codeParams = node.parameters?.input_parameters || {};
          newNode.data = {
            ...newNode.data,
            code: codeParams.code || '',
            codeType: codeParams.code_type || 'python',
            securityLevel: codeParams.security_level || 'low',
            timeoutSeconds: codeParams.timeout_seconds || 30,
            memoryLimitMb: codeParams.memory_limit_mb || 128,
            cpuLimit: codeParams.cpu_limit || 0.5,
          };
        } else {
          newNode.type = 'custom';
        }

        return newNode;
      });

      // 过滤掉null值（被安全检查排除的Loop节点）
      const filteredNodes = nodes.filter(node => node !== null);

      // 转换边数据，添加CustomEdge所需的完整数据结构
      const edges = (flowData.edges || []).map((edge: any) => ({
        id: edge.edgeId,
        source: edge.sourceNode,
        target: edge.targetNode,
        branchId: edge.branchId,
        type: 'normal', // 使用normal类型以匹配外部VueFlow的edge-normal模板
        sourceHandle: edge.branchId,
        data: {
          sourceStatus: undefined, // 将由节点状态更新
          targetStatus: undefined,
        },
      }));

      // 直接设置数据，不调用setNodes/setEdges等方法
      subFlowNodes.value = filteredNodes;
      subFlowEdges.value = edges;
      isInitialized.value = true;
      
              // 在DOM更新后触发边路径重新计算和状态更新
        nextTick(() => {
          updateEdgeStatus();
          edgeUpdateTrigger.value++;
          
          // 额外等待一些时间确保DOM完全渲染后再次计算
          setTimeout(() => {
            edgeUpdateTrigger.value++;
          }, 100);
        });
    }
  } catch (error) {
    console.error('加载子flow失败:', error);
    ElMessage.error('加载循环子流程失败');
  } finally {
    subFlowLoading.value = false;
    isLoading.value = false;
  }
};

// 初始化空的子工作流
const initializeEmptySubFlow = () => {
  // 检查是否已经有节点存在，避免重复初始化
  if (subFlowNodes.value.length > 0) {
    return;
  }
  
  // 创建默认的开始节点，循环子工作流不需要结束节点
  const defaultNodes = [
    {
      stepId: 'start',
      name: '开始',
      description: '循环开始节点',
      callId: 'start',
      nodeId: 'Empty',
      serviceId: 'start',
      position: { x: 50, y: 100 }, // 调整Y坐标，确保在画布中心
      enable: true,
      editable: false,
    }
  ];

  loopSubFlow.value = {
    name: '循环子工作流',
    description: '描述循环内部的处理逻辑',
    nodes: defaultNodes,
    edges: [],
    flowId: '',
    hasUnsavedChanges: true, // 新建的需要保存
  };

  // 转换为显示格式
  const displayNodes = defaultNodes.map((node: any) => ({
    id: node.stepId,
    type: node.callId,
    data: {
      name: node.name,
      description: node.description,
      nodeId: node.nodeId,
      callId: node.callId,
      serviceId: node.serviceId,
      target: node.callId === 'start' ? 'source' : 'target',
      nodePosition: node.callId === 'start' ? 'Right' : 'Left',
    },
    position: {
      x: node.position.x,
      y: node.position.y,
    },
    deletable: false,
  }));

  subFlowNodes.value = displayNodes;
  subFlowEdges.value = [];
  
  // 在DOM更新后触发边路径重新计算和状态更新
  nextTick(() => {
    updateEdgeStatus();
    edgeUpdateTrigger.value++;
  });
};

// 保存子工作流到后端
const saveSubFlow = async (): Promise<string> => {
  try {
    subFlowLoading.value = true;
    
    const currentSubFlowId = loopSubFlow.value.flowId;
    const isNewFlow = !currentSubFlowId;

    let finalSubFlowId: string;

    if (isNewFlow) {
      // 创建新的子工作流 - 使用UUID生成flowId，与主工作流保持一致
      finalSubFlowId = uuidv4();
    } else {
      // 更新已有的子工作流
      finalSubFlowId = currentSubFlowId;
    }

    // 构造与主工作流保存相同的数据结构
    // 由于类型定义与实际使用不匹配，使用any类型绕过检查
    const saveData: any = {
      flow: {
        ...loopSubFlow.value,
        flowId: finalSubFlowId,
        name: loopSubFlow.value.name || '循环子工作流',
        description: loopSubFlow.value.description || '',
        enable: true,
        editable: true,
        nodes: loopSubFlow.value.nodes,
        edges: loopSubFlow.value.edges,
        focusPoint: { x: 400, y: 300 },
        connectivity: false,
        debug: false,
        createdAt: Date.now()
      }
    };

    // 使用子工作流专用的PUT接口
    const [error, response] = await (createOrUpdateSubFlowTopology as any)(
      {
        appId: props.appId,
        flowId: props.flowId, // 父工作流ID
        subFlowId: finalSubFlowId,
      },
      saveData
    );

    if (response && response.result) {
      // 更新本地状态
      loopSubFlow.value.flowId = finalSubFlowId;
      loopSubFlow.value.hasUnsavedChanges = false;
      
      // 通过emit通知父组件更新节点的parameters中的sub_flow_id
      emits('updateSubFlowId', props.id, finalSubFlowId);
      
      return finalSubFlowId;
    } else {
      throw new Error(`保存响应无效: ${error ? error.message : '未知错误'}`);
    }
  } catch (error) {
    console.error('[LoopNode] 保存子工作流失败:', error);
    ElMessage.error('保存循环子工作流失败');
    throw error;
  } finally {
    subFlowLoading.value = false;
  }
};

// 向子工作流添加节点
const addNodeToSubFlow = (nodeData: any, position: { x: number, y: number }) => {
  // 安全检查：禁止在LoopNode内部添加Loop节点
  if (nodeData.callId === 'Loop') {
    ElMessage.error('禁止在循环节点内部添加嵌套循环节点');
    return;
  }

  // 使用公共函数创建节点
  const newNodeId = nodeData.id || getId();
  const standardizedNodeData = sanitizeNodeData(nodeData, newNodeId);
  
  const newNode = {
    stepId: newNodeId,
    name: standardizedNodeData.name || standardizedNodeData.callId,
    description: standardizedNodeData.description || '',
    callId: standardizedNodeData.callId,
    nodeId: standardizedNodeData.nodeId,
    serviceId: standardizedNodeData.serviceId,
    position: {
      x: position.x, // 1:1比例，无需转换
      y: position.y,
    },
    enable: true,
    editable: true,
    parameters: standardizedNodeData.parameters,
  };

  loopSubFlow.value.nodes.push(newNode);
  loopSubFlow.value.hasUnsavedChanges = true;
  
  // 直接更新显示，避免重新加载导致位置重置 - 使用标准化数据
  const displayNode = {
    id: newNode.stepId,
    type: newNode.callId === 'Choice' ? 'Choice' : 
          newNode.callId === 'Loop' ? 'Loop' :
          newNode.callId === 'break' ? 'break' :
          newNode.callId === 'continue' ? 'continue' :
          newNode.callId === 'VariableAssign' ? 'VariableAssign' : 'custom',
    data: {
      name: standardizedNodeData.name,
      description: standardizedNodeData.description,
      parameters: standardizedNodeData.parameters,
      nodeId: standardizedNodeData.nodeId,
      callId: standardizedNodeData.callId,
      serviceId: standardizedNodeData.serviceId,
      // 对于Code节点，需要额外的字段
      ...(standardizedNodeData.callId === 'Code' && {
        code: standardizedNodeData.code,
        codeType: standardizedNodeData.codeType,
        securityLevel: standardizedNodeData.securityLevel,
        timeoutSeconds: standardizedNodeData.timeoutSeconds,
        memoryLimitMb: standardizedNodeData.memoryLimitMb,
        cpuLimit: standardizedNodeData.cpuLimit
      })
    },
    position: {
      x: newNode.position.x,
      y: newNode.position.y,
    },
    deletable: false,
  };
  
  subFlowNodes.value.push(displayNode);
};

// 从子工作流删除节点
const removeNodeFromSubFlow = (nodeId: string) => {
  loopSubFlow.value.nodes = loopSubFlow.value.nodes.filter(node => node.stepId !== nodeId);
  loopSubFlow.value.edges = loopSubFlow.value.edges.filter(edge => 
    edge.sourceNode !== nodeId && edge.targetNode !== nodeId
  );
  loopSubFlow.value.hasUnsavedChanges = true;
  
  // 直接更新显示，避免重新加载
  subFlowNodes.value = subFlowNodes.value.filter(node => node.id !== nodeId);
  subFlowEdges.value = subFlowEdges.value.filter(edge => 
    edge.source !== nodeId && edge.target !== nodeId
  );
};

// 获取子工作流ID（用于父工作流保存）
const getSubFlowId = (): string => {
  return loopSubFlow.value.flowId;
};

// 检查是否有未保存的更改
const hasUnsavedSubFlowChanges = (): boolean => {
  return loopSubFlow.value.hasUnsavedChanges;
};

// 更新子工作流中的节点
const updateSubFlowNode = (nodeId: string, nodeData: any) => {
  const nodeIndex = loopSubFlow.value.nodes.findIndex(node => node.stepId === nodeId);
  if (nodeIndex === -1) {
    console.error('[LoopNode] 未找到要更新的节点:', nodeId);
    return;
  }
  
  // 更新节点数据
  const existingNode = loopSubFlow.value.nodes[nodeIndex];
  const updatedNode = {
    ...existingNode,
    name: nodeData.name || existingNode.name,
    description: nodeData.description || existingNode.description,
  };
  
  // 根据节点类型更新特定的参数
  if (nodeData.callId === 'Code' || existingNode.callId === 'Code') {
    // Code节点：更新代码相关参数
    updatedNode.parameters = {
      ...existingNode.parameters,
      input_parameters: nodeData.input_parameters || nodeData.parameters?.input_parameters || {},
      output_parameters: nodeData.output_parameters || nodeData.parameters?.output_parameters || {},
      code: nodeData.code || nodeData.parameters?.code || '',
      codeType: nodeData.codeType || nodeData.parameters?.codeType || 'python',
      securityLevel: nodeData.securityLevel || nodeData.parameters?.securityLevel || 'low',
      timeoutSeconds: nodeData.timeoutSeconds || nodeData.parameters?.timeoutSeconds || 30,
      memoryLimitMb: nodeData.memoryLimitMb || nodeData.parameters?.memoryLimitMb || 128,
      cpuLimit: nodeData.cpuLimit || nodeData.parameters?.cpuLimit || 0.5,
    };
  } else if (nodeData.callId === 'DirectReply' || existingNode.callId === 'DirectReply') {
    // DirectReply节点：更新回复内容
    updatedNode.parameters = {
      ...existingNode.parameters,
      input_parameters: nodeData.parameters?.input_parameters || {},
      output_parameters: nodeData.parameters?.output_parameters || {},
    };
  } else if (nodeData.callId === 'Choice' || existingNode.callId === 'Choice') {
    // Choice节点：更新分支条件
    updatedNode.parameters = {
      ...existingNode.parameters,
      input_parameters: nodeData.parameters?.input_parameters || {},
      output_parameters: nodeData.parameters?.output_parameters || {},
    };
  } else if (nodeData.callId === 'VariableAssign' || existingNode.callId === 'VariableAssign') {
    // VariableAssign节点：更新变量操作
    updatedNode.parameters = {
      ...existingNode.parameters,
      input_parameters: nodeData.parameters?.input_parameters || {},
      output_parameters: nodeData.parameters?.output_parameters || {},
    };
  } else if (nodeData.inputStream) {
    // YAML编辑器：更新inputStream数据
    updatedNode.parameters = {
      ...existingNode.parameters,
      ...(nodeData.inputStream.input_parameters !== undefined && 
          nodeData.inputStream.output_parameters !== undefined ? {
        input_parameters: nodeData.inputStream.input_parameters,
        output_parameters: nodeData.inputStream.output_parameters,
      } : {
        input_parameters: nodeData.inputStream,
      }),
    };
  } else {
    // 其他节点类型
    updatedNode.parameters = {
      ...existingNode.parameters,
      input_parameters: nodeData.parameters?.input_parameters || {},
      output_parameters: nodeData.parameters?.output_parameters || {},
    };
  }
  
  // 更新节点数组
  loopSubFlow.value.nodes[nodeIndex] = updatedNode;
  loopSubFlow.value.hasUnsavedChanges = true;
  
  // 更新显示节点
  const displayNodeIndex = subFlowNodes.value.findIndex(node => node.id === nodeId);
  if (displayNodeIndex !== -1) {
    const displayNode = { ...subFlowNodes.value[displayNodeIndex] };
    displayNode.data = {
      ...displayNode.data,
      name: updatedNode.name,
      description: updatedNode.description,
      parameters: updatedNode.parameters,
    };
    
    // 对于Code节点，也需要更新显示节点的特有属性
    if (updatedNode.callId === 'Code') {
      displayNode.data = {
        ...displayNode.data,
        code: updatedNode.parameters?.code || '',
        codeType: updatedNode.parameters?.codeType || 'python',
        securityLevel: updatedNode.parameters?.securityLevel || 'low',
        timeoutSeconds: updatedNode.parameters?.timeoutSeconds || 30,
        memoryLimitMb: updatedNode.parameters?.memoryLimitMb || 128,
        cpuLimit: updatedNode.parameters?.cpuLimit || 0.5,
      };
    }
    
    subFlowNodes.value[displayNodeIndex] = displayNode;
  }
};

// 监听数据变化
watch(
  () => props.data,
  async (newData, oldData) => {
    try {
      const isInclude = statusList.value.includes(newData?.status);
      curStatus.value = isInclude ? newData?.status : 'default';
      costTime.value = newData?.constTime || '';
      
      // 判断是否有调试的输入输出，有调试的输入输出，需要将其显示/否则显示默认的输出
      if (newData.content?.type === 'input') {
        inputAndOutput.value.input_parameters = newData.content.params;
      } else if (newData.content?.type === 'output') {
        inputAndOutput.value.output_parameters = newData.content.params;
      } else {
        inputAndOutput.value.input_parameters =
          newData?.parameters?.input_parameters || {};
        inputAndOutput.value.output_parameters =
          newData?.parameters?.output_parameters || {};
      }
      
      // 重置Handle连接状态
      handleTargetConnecting.value = false;
      handleSourceConnecting.value = false;
      
      // 只有在子工作流ID发生变化或首次加载时才重新加载数据
      const newSubFlowId = newData?.parameters?.input_parameters?.sub_flow_id || '';
      const oldSubFlowId = oldData?.parameters?.input_parameters?.sub_flow_id || '';
      
      if (!isInitialized.value || newSubFlowId !== oldSubFlowId) {
        await loadSubFlowData();
      } 

    } catch (error) {
      // 处理监听错误
    }
  },
  { deep: true, immediate: true },
);

// 监听loopSubFlow变化
watch(
  () => loopSubFlow.value,
  (newValue, oldValue) => {
    // loopSubFlow状态变化处理
  },
  { deep: true }
);

// 处理删除节点
const delNode = (id) => {
  emits('delNode', id);
};

// 处理编辑节点
const editYaml = (nodeName, nodeDesc, yamlCode) => {
  emits('editYamlDrawer', nodeName, nodeDesc, yamlCode, props.id);
};

// 设置连接状态
const setConnectStatus = (type) => {
  if (type === 'source') {
    handleSourceConnecting.value = true;
  } else {
    handleTargetConnecting.value = true;
  }
  emits('updateConnectHandle', props.id);
};

// 处理source handle插入节点事件
const handleSourceInsertNode = (event) => {
  event.stopPropagation();
  if (props.disabled) {
    return;
  }
  
  // 发射插入节点事件，传递节点信息和handle类型
  emits('insertNodeFromHandle', {
    nodeId: props.id,
    handleType: 'source',
    nodePosition: props.position
  });
};

// Handle悬停事件处理
const handleSourceHandleEnter = () => {
  if (!props.disabled) {
    sourceHandleHovered.value = true;
  }
};

const handleSourceHandleLeave = () => {
  sourceHandleHovered.value = false;
};

// 处理节点点击事件
const handleNodeClick = (event: MouseEvent) => {
  if (!props.disabled) {
    // 检查点击是否在子画布区域内
    const target = event.target as HTMLElement;
    const isInSubCanvas = target.closest('.embeddedFlowCanvas');
    
    // 如果点击在子画布内，则不触发编辑事件
    if (isInSubCanvas) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    
    emits('editLoopNode', props.data.name, props.data.description, props.data.parameters, props.id);
  }
};

// 拖拽调整大小相关方法
const startResize = (event: MouseEvent) => {
  if (props.disabled) return;
  
  isResizing.value = true;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
  resizeStartWidth.value = canvasWidth.value;
  resizeStartHeight.value = canvasHeight.value;
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', endResize);
  event.preventDefault();
  event.stopPropagation();
};

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return;
  
  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;
  
  // 获取外层Vue Flow的缩放比例进行补偿
  const vueFlowZoom = getVueFlowZoom();
  
  // 根据外层缩放调整鼠标移动距离
  const adjustedDeltaX = deltaX / vueFlowZoom;
  const adjustedDeltaY = deltaY / vueFlowZoom;
  
  // 只保留最小宽度和最小高度限制，移除最大值限制
  const newWidth = Math.max(minWidth.value, resizeStartWidth.value + adjustedDeltaX);
  const newHeight = Math.max(minHeight.value, resizeStartHeight.value + adjustedDeltaY);
  
  canvasWidth.value = newWidth;
  canvasHeight.value = newHeight;
};

const endResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
};

// 子节点拖拽相关状态
const draggingNode = ref<string | null>(null);
const dragStartPosition = ref<{ x: number, y: number } | null>(null);
const dragStartMousePosition = ref<{ x: number, y: number } | null>(null);
const dragThreshold = 5; // 拖拽阈值，避免误触

// 长按检测相关
const longPressTimer = ref<number | null>(null);
const isDragging = ref(false);
const clickedNodeId = ref<string | null>(null); // 记录被点击的节点ID
const hasActuallyDragged = ref(false); // 记录是否真正发生了拖拽移动
 // 记录是否正在处理拖拽结束，防止触发点击事件

// 性能优化：缓存节点索引，避免重复查找
const draggingNodeIndex = ref<number>(-1);

// 动画优化：使用requestAnimationFrame平滑拖拽
const animationFrameId = ref<number | null>(null);
const pendingPosition = ref<{ x: number, y: number } | null>(null);

// 边更新节流机制：避免拖拽时过于频繁地触发边路径计算
const edgeUpdateThrottleId = ref<number | null>(null);
const shouldUpdateEdges = ref(false);

// Handle连接相关状态
const connectingHandle = ref<{
  nodeId: string;
  handleType: 'source' | 'target';
  handlePosition: { x: number; y: number };
  branchId?: string;
} | null>(null);
const isConnecting = ref(false);
const tempConnectionPath = ref<string>('');
const currentMousePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });

// 插入节点边信息状态（保留用于外部调用的insertNodeIntoSubFlow方法）
const insertEdgeInfo = ref<{
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  midpoint: { x: number; y: number };
} | null>(null);



// 使用RAF更新节点位置，提供更平滑的拖拽体验
const updateNodePosition = () => {
  if (pendingPosition.value && draggingNodeIndex.value !== -1 && draggingNodeIndex.value < subFlowNodes.value.length) {
    const node = subFlowNodes.value[draggingNodeIndex.value];
    if (node) {
      node.position = { ...pendingPosition.value };
      
      // 标记需要更新边，但使用节流机制避免过于频繁的更新
      shouldUpdateEdges.value = true;
      
      // 如果没有正在进行的边更新，则启动节流更新
      if (!edgeUpdateThrottleId.value) {
        edgeUpdateThrottleId.value = requestAnimationFrame(() => {
          if (shouldUpdateEdges.value) {
            updateEdgeStatus();
            edgeUpdateTrigger.value++;
            shouldUpdateEdges.value = false;
          }
          edgeUpdateThrottleId.value = null;
        });
      }
    }
    pendingPosition.value = null;
  }
  animationFrameId.value = null;
};

/**
 * 处理子节点的鼠标按下事件（长按检测）
 * 实现逻辑：
 * 1. 短按（<500ms）：触发节点编辑
 * 2. 长按（≥500ms）：进入拖拽模式
 * @param event 鼠标事件
 * @param nodeId 节点ID
 */
const handleSubNodeMouseDown = (event: MouseEvent, nodeId: string) => {
  if (props.disabled || isConnecting.value) return;
  
  // 阻止事件冒泡到父级LoopNode
  event.stopPropagation();
  
  // 检查是否点击在Handle上，如果是则不处理节点拖拽
  const target = event.target as HTMLElement;
  if (target.classList.contains('vue-flow__handle')) {
    return;
  }
  
  const node = subFlowNodes.value.find(n => n.id === nodeId);
  if (!node) return;
  
  // 记录点击的节点ID
  clickedNodeId.value = nodeId;
  
  // 重置拖拽状态
  hasActuallyDragged.value = false;
  isDragging.value = false;
  
  // 记录初始位置和鼠标位置（统一使用浏览器视口坐标）
  dragStartPosition.value = { x: node.position.x, y: node.position.y };
  dragStartMousePosition.value = { x: event.clientX, y: event.clientY };
  
  // 开始长按检测 - 减少延迟时间以提升响应性
  longPressTimer.value = window.setTimeout(() => {
    draggingNode.value = nodeId;
    isDragging.value = true;
    
    // 缓存节点索引，避免重复查找
    draggingNodeIndex.value = subFlowNodes.value.findIndex(n => n.id === nodeId);
    
    // 移除短按监听器，因为现在确定是长按拖拽
    document.removeEventListener('mouseup', handleSubNodeMouseUpForClick);
    
    // 添加全局事件监听 - 使用capture模式确保优先处理
    // 注意：不能对mousemove使用passive:true，因为需要preventDefault
    document.addEventListener('mousemove', handleSubNodeDrag, { capture: true });
    document.addEventListener('mouseup', handleSubNodeMouseUpForDrag, { capture: true });
    
    // 添加拖拽样式（仅改变鼠标指针）
    const nodeElement = event.target as HTMLElement;
    const nodeContainer = nodeElement.closest('.vue-flow__node');
    if (nodeContainer) {
      nodeContainer.classList.add('dragging');
    }
  }, 100); // 进一步减少到100ms，更快响应
  
  // 监听鼠标松开事件（用于检测短按点击）
  document.addEventListener('mouseup', handleSubNodeMouseUpForClick, { once: true });
};

// 处理子节点拖拽 - 优化性能
const handleSubNodeDrag = (event: MouseEvent) => {
  if (!isDragging.value || draggingNodeIndex.value === -1 || !dragStartPosition.value || !dragStartMousePosition.value) return;
  
  // 阻止事件冒泡和默认行为
  event.stopPropagation();
  event.preventDefault();
  
  // 计算鼠标移动距离（统一使用浏览器视口坐标）
  const deltaX = event.clientX - dragStartMousePosition.value.x;
  const deltaY = event.clientY - dragStartMousePosition.value.y;
  
  // 检查是否超过拖拽阈值，如果是则标记为真正的拖拽
  const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  if (totalDistance > dragThreshold) {
    hasActuallyDragged.value = true;
  }
  
  // 获取外层Vue Flow的缩放比例
  const vueFlowZoom = getVueFlowZoom();
  
  // 内嵌画布是1:1比例，不应该受外部缩放影响
  // 直接使用原始的鼠标移动距离
  const adjustedDeltaX = deltaX / vueFlowZoom; // 但由于DOM位置受外部缩放影响，还是需要调整
  const adjustedDeltaY = deltaY / vueFlowZoom;
  
  // 动态计算边界，使用原始节点尺寸
  const node = subFlowNodes.value[draggingNodeIndex.value];
  const nodeWidth = (node?.data?.callId === 'start' || node?.data?.callId === 'end') ? 160 : 320;
  const nodeHeight = 100;
  
  const newX = Math.max(0, Math.min(canvasWidth.value - nodeWidth, dragStartPosition.value.x + adjustedDeltaX));
  const newY = Math.max(0, Math.min(canvasHeight.value - nodeHeight, dragStartPosition.value.y + adjustedDeltaY));
  
  // 使用requestAnimationFrame优化拖拽性能
  pendingPosition.value = { x: newX, y: newY };
  
  if (!animationFrameId.value) {
    animationFrameId.value = requestAnimationFrame(updateNodePosition);
  }
};

// 处理子节点鼠标松开事件（用于短按点击）
const handleSubNodeMouseUpForClick = (event: MouseEvent) => {
  // 清除长按计时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  
  // 短按点击，触发编辑
  if (clickedNodeId.value) {
    nextTick(() => {
      handleSubNodeClick(clickedNodeId.value!);
    });
  }
  
  // 清理状态
  clickedNodeId.value = null;
  hasActuallyDragged.value = false;
  dragStartPosition.value = null;
  dragStartMousePosition.value = null;
};

// 处理子节点鼠标松开事件（用于拖拽结束）
const handleSubNodeMouseUpForDrag = (event: MouseEvent) => {
  // 阻止事件冒泡到外部VueFlow，避免触发外部节点的点击事件
  event.stopPropagation();
  event.preventDefault();
  
  // 重要：清理clickedNodeId，防止后续的click事件触发编辑
  clickedNodeId.value = null;
  

  
  // 移除拖拽样式
  document.querySelectorAll('.vue-flow__node.dragging').forEach(el => {
    el.classList.remove('dragging');
  });
  
  // 拖拽结束，保存最终位置到loopSubFlow
  if (draggingNodeIndex.value !== -1 && draggingNodeIndex.value < subFlowNodes.value.length) {
    const finalPosition = subFlowNodes.value[draggingNodeIndex.value].position;
    
    // 同步更新loopSubFlow中的节点位置
    const subFlowNodeIndex = loopSubFlow.value.nodes.findIndex(n => n.stepId === draggingNode.value);
    if (subFlowNodeIndex !== -1) {
      loopSubFlow.value.nodes[subFlowNodeIndex].position = {
        x: finalPosition.x,
        y: finalPosition.y
      };
      loopSubFlow.value.hasUnsavedChanges = true;
      
              // 节点位置变化后，触发边路径重新计算和状态更新
        nextTick(() => {
          updateEdgeStatus();
          edgeUpdateTrigger.value++;
          
          // 额外等待一些时间确保DOM完全渲染后再次计算
          setTimeout(() => {
            edgeUpdateTrigger.value++;
          }, 100);
        });
    }
  }
  
  // 结束拖拽，清理状态
  document.removeEventListener('mousemove', handleSubNodeDrag, { capture: true } as any);
  document.removeEventListener('mouseup', handleSubNodeMouseUpForDrag, { capture: true } as any);
  
  // 取消未完成的动画帧
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
  
  // 取消未完成的边更新节流
  if (edgeUpdateThrottleId.value) {
    cancelAnimationFrame(edgeUpdateThrottleId.value);
    edgeUpdateThrottleId.value = null;
  }
  
  draggingNode.value = null;
  isDragging.value = false;
  draggingNodeIndex.value = -1;
  pendingPosition.value = null;
  dragStartPosition.value = null;
  dragStartMousePosition.value = null;
  
  // 延迟重置hasActuallyDragged，确保拖拽结束后的点击事件被阻止
  // 注意：不要在这里立即设置为false，而是延迟50ms后再重置
  setTimeout(() => {
    hasActuallyDragged.value = false;
  }, 50);
};


/**
 * 处理子节点容器的点击事件（统一入口）
 * @param event 点击事件
 * @param nodeId 节点ID
 */
const handleSubNodeContainerClick = (event: MouseEvent, nodeId: string) => {
  // 检查是否点击在Handle上，如果是则不处理
  const target = event.target as HTMLElement;
  if (target.classList.contains('vue-flow__handle')) {
    return;
  }
  
  // 检查是否点击在特殊按钮上（如复制按钮），这些按钮有自己的事件处理
  if (target.closest('.copydocument') || target.closest('.subNodeDeleteButton')) {
    return;
  }
  
  // 阻止事件进一步传播
  event.stopPropagation();
  
  // 如果正在拖拽、连接或组件被禁用，则不处理点击
  if (props.disabled || isDragging.value || isConnecting.value) {
    return;
  }
  
  // 检查是否刚刚完成拖拽（通过检查是否有拖拽相关状态）
  if (hasActuallyDragged.value || draggingNode.value) {
    // 刚完成拖拽或正在拖拽，不处理点击事件
    return;
  }
  handleSubNodeClick(nodeId);
};

/**
 * 处理子节点点击编辑
 * 功能说明：
 * 1. 开始/结束节点不可编辑
 * 2. 普通节点发射editSubFlowNode事件给父组件处理
 * 3. 父组件需要实现子工作流节点的编辑逻辑
 * @param nodeId 要编辑的节点ID
 */
const handleSubNodeClick = (nodeId: string) => {
  const node = subFlowNodes.value.find(n => n.id === nodeId);
  if (!node) return;
  
  // 对于开始、结束、break、continue节点，不可编辑
  if (node.data.callId === 'start' || node.data.callId === 'end' || 
      node.data.callId === 'break' || node.data.callId === 'continue') {
    return;
  }
  
  // 发射子节点编辑事件，传递节点信息给父组件
  // 构造正确的参数对象结构
  const nodeParameters = {
    callId: node.data.callId,
    // 对于 Code 节点，需要将配置属性放在 parameters 顶层
    ...(node.data.callId === 'Code' ? {
      code: node.data.code || '',
      codeType: node.data.codeType || 'python',
      securityLevel: node.data.securityLevel || 'low',
      timeoutSeconds: node.data.timeoutSeconds || 30,
      memoryLimitMb: node.data.memoryLimitMb || 128,
      cpuLimit: node.data.cpuLimit || 0.5,
    } : {}),
    // 输入输出参数 - 对于 Code 节点，需要过滤掉内置配置字段
    input_parameters: node.data.callId === 'Code' ? 
      Object.fromEntries(
        Object.entries(node.data.parameters?.input_parameters || {}).filter(([key]) => 
          !['code', 'code_type', 'security_level', 'timeout_seconds', 'memory_limit_mb', 'cpu_limit', 'enable_variable_resolution', 'to_user', 'input_parameters', 'output_parameters'].includes(key)
        )
      ) : 
      (node.data.parameters?.input_parameters || {}),
    // 对于 Code 节点，如果 output_parameters 包含复杂结构，则使用简化版本
    output_parameters: node.data.callId === 'Code' ? 
      (node.data.parameters?.output_parameters?.result !== undefined ? 
        { result: node.data.parameters.output_parameters.result || '' } : 
        { result: '' }) : 
      (node.data.parameters?.output_parameters || {}),
  };
  

  
  // 参数说明：节点名称、描述、参数（正确结构）、节点ID、循环节点ID
  emits('editSubFlowNode', node.data.name, node.data.description, nodeParameters, nodeId, props.id);
};

/**
 * 处理子节点删除
 * @param nodeId 要删除的节点ID
 */
const handleSubNodeDelete = (nodeId: string) => {
  if (props.disabled) return;
  
  // 删除与该节点相关的所有边
  const nodesToDelete = [nodeId];
  const edgesToDelete = subFlowEdges.value.filter(edge => 
    edge.source === nodeId || edge.target === nodeId
  );
  
  // 从显示列表中删除节点和边
  subFlowNodes.value = subFlowNodes.value.filter(node => node.id !== nodeId);
  subFlowEdges.value = subFlowEdges.value.filter(edge => 
    edge.source !== nodeId && edge.target !== nodeId
  );
  
  // 从loopSubFlow状态中删除节点和边
  loopSubFlow.value.nodes = loopSubFlow.value.nodes.filter(node => node.stepId !== nodeId);
  loopSubFlow.value.edges = loopSubFlow.value.edges.filter(edge => 
    edge.sourceNode !== nodeId && edge.targetNode !== nodeId
  );
  
  loopSubFlow.value.hasUnsavedChanges = true;
  
  // 触发边路径重新计算和状态更新
  nextTick(() => {
    updateEdgeStatus();
    edgeUpdateTrigger.value++;
  });
  
  ElMessage.success(`节点已删除`);
};

/**
 * 处理子节点ID复制
 * @param nodeId 要复制的节点ID
 */
const handleSubNodeCopyId = (nodeId: string) => {
  const input = document.createElement('input');
  input.value = nodeId;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  ElMessage({
    showClose: true,
    message: '复制成功',
    type: 'success',
    duration: 2000,
  });
  document.body.removeChild(input);
};

/**
 * 处理子节点source handle插入节点事件
 * @param event 鼠标事件
 * @param nodeId 节点ID
 * @param branchId 分支ID（可选，用于Choice节点）
 */
const handleSubNodeSourceInsertNode = (event: MouseEvent, nodeId: string, branchId?: string) => {
  event.stopPropagation();
  if (props.disabled) {
    return;
  }
  
  const node = subFlowNodes.value.find(n => n.id === nodeId);
  if (!node) return;
  
  // 获取外部VueFlow的缩放倍率
  const vueFlowZoom = getVueFlowZoom();
  
  // 计算菜单显示位置，考虑外部缩放
  const canvasElement = document.querySelector(`#loop-${props.id}`);
  if (!canvasElement) return;
  
  const canvasRect = canvasElement.getBoundingClientRect();
  
  // 计算节点右侧Handle的位置作为菜单位置
  const nodeWidth = (node.data?.callId === 'start' || node.data?.callId === 'end') ? 160 : 320;
  const nodeRightX = node.position.x + nodeWidth;
  const nodeCenterY = node.position.y + 50; // 节点中心Y坐标
  
  // 将内嵌画布坐标转换为视口绝对坐标
  const absoluteX = canvasRect.left + nodeRightX * vueFlowZoom;
  const absoluteY = canvasRect.top + nodeCenterY * vueFlowZoom;

  // 构造传递给父组件的事件数据
  const insertMenuData = {
    // 使用edgeInfo字段保持与现有逻辑兼容，但设置特殊标记表明这是从节点Handle插入
    edgeInfo: {
      isFromNodeHandle: true, // 标记这是从节点Handle插入
      sourceNodeId: nodeId,
      handleType: 'source',
      sourceHandle: branchId || 'default', // 传递分支ID给插入逻辑
      insertPosition: { 
        // 检查是否已有连接来决定位置
        // 注意：这里的坐标是内嵌画布坐标系，在创建边时会被正确处理
        x: node.position.x + nodeWidth + 50, 
        y: node.position.y,
        // 添加源节点信息，供后续位置计算使用
        sourceNode: node
      }
    },
    // 菜单位置和方向
    position: { x: absoluteX, y: absoluteY },
    direction: absoluteX > window.innerWidth / 2 ? 'left' : 'right',
    // LoopNode相关信息
    loopNodeId: props.id,
    subFlowId: loopSubFlow.value.flowId,
    // 传递额外的节点类型
    extraNodeTypes: extraLoopNodeTypes.value
  };
  
  // 传递事件给父组件workFlow，让它在外部显示InsertNodeMenu
  emits('showInsertNodeMenu', insertMenuData);
};

/**
 * 处理子节点Handle悬停事件
 * @param nodeId 节点ID
 */
const handleSubNodeSourceHandleEnter = (nodeId: string) => {
  if (!props.disabled) {
    subNodeSourceHandleHovered.value.set(nodeId, true);
  }
};

/**
 * 处理子节点Handle离开事件
 * @param nodeId 节点ID
 */
const handleSubNodeSourceHandleLeave = (nodeId: string) => {
  subNodeSourceHandleHovered.value.set(nodeId, false);
};

// 注意：createNodeParameters 和 createDisplayNodeData 函数已被移除
// 现在使用 useDnD.js 中的公共函数 sanitizeNodeData 来处理节点数据标准化

/**
 * 处理从节点Handle插入节点的逻辑
 * @param nodeData 要插入的节点数据
 * @param handleInfo Handle信息
 */
const handleInsertNodeFromHandle = (nodeData: any, handleInfo: any) => {
  try {

    // 创建新节点ID
    const newNodeId = getId();
    const sourceNodeId = handleInfo.sourceNodeId;
    
    // 检查源节点是否已有输出连接来决定新节点位置
    const sourceNodeEdges = subFlowEdges.value.filter(edge => edge.source === sourceNodeId);
    let newNodePosition;
    
    if (sourceNodeEdges.length > 0) {
      // 如果已有连接，创建分支：在第一个目标节点下方
      const firstTargetNode = subFlowNodes.value.find(node => node.id === sourceNodeEdges[0].target);
      if (firstTargetNode) {
        newNodePosition = {
          x: firstTargetNode.position.x,
          y: firstTargetNode.position.y + 120
        };
      } else {
        // 如果找不到目标节点，使用默认位置
        newNodePosition = {
          x: handleInfo.insertPosition.x,
          y: handleInfo.insertPosition.y + 120
        };
      }
    } else {
      // 如果没有连接，使用原始位置（线性连接）
      newNodePosition = {
        x: handleInfo.insertPosition.x,
        y: handleInfo.insertPosition.y,
      };
    }

    // 创建新节点 - 使用标准化数据
    const standardizedNodeData = sanitizeNodeData(nodeData, newNodeId);
    
    const newNode = {
      stepId: newNodeId,
      name: standardizedNodeData.name || standardizedNodeData.callId,
      description: standardizedNodeData.description || '',
      callId: standardizedNodeData.callId,
      nodeId: standardizedNodeData.nodeId,
      serviceId: standardizedNodeData.serviceId,
      position: newNodePosition,
      enable: true,
      editable: true,
      parameters: standardizedNodeData.parameters,
    };

    // 添加到loopSubFlow
    loopSubFlow.value.nodes.push(newNode);
    loopSubFlow.value.hasUnsavedChanges = true;

    // 添加到显示列表 - Handle插入使用标准化数据
    const displayNode = {
      id: newNode.stepId,
      type: newNode.callId === 'Choice' ? 'Choice' : 
            newNode.callId === 'Loop' ? 'Loop' :
            newNode.callId === 'break' ? 'break' :
            newNode.callId === 'continue' ? 'continue' :
            newNode.callId === 'VariableAssign' ? 'VariableAssign' : 'custom',
      data: {
        name: standardizedNodeData.name,
        description: standardizedNodeData.description,
        parameters: standardizedNodeData.parameters,
        nodeId: standardizedNodeData.nodeId,
        callId: standardizedNodeData.callId,
        serviceId: standardizedNodeData.serviceId,
        // 对于Code节点，需要额外的字段
        ...(standardizedNodeData.callId === 'Code' && {
          code: standardizedNodeData.code,
          codeType: standardizedNodeData.codeType,
          securityLevel: standardizedNodeData.securityLevel,
          timeoutSeconds: standardizedNodeData.timeoutSeconds,
          memoryLimitMb: standardizedNodeData.memoryLimitMb,
          cpuLimit: standardizedNodeData.cpuLimit
        })
      },
      position: {
        x: newNode.position.x,
        y: newNode.position.y,
      },
      deletable: false,
    };

    subFlowNodes.value.push(displayNode);

    // 处理连接：创建新分支，保留原有连接并添加新的连接
    // (sourceNodeEdges已在上面计算过)
    
          if (sourceNodeEdges.length > 0) {
        // 如果已有输出连接，创建并行分支：保留原连接，添加新分支
        // (位置已在前面正确计算)
      
      // 检查源节点是否是Choice节点，确定正确的sourceHandle和branchId  
      const sourceNode = subFlowNodes.value.find(node => node.id === sourceNodeId);
      let sourceHandle = handleInfo.sourceHandle || 'default';
      let sourceBranchId = '';
      
      if (sourceNode && sourceNode.type === 'Choice') {
        // 使用传入的branchId作为sourceHandle和branchId
        if (handleInfo.sourceHandle && handleInfo.sourceHandle !== 'default') {
          // 使用指定的分支ID
          sourceHandle = handleInfo.sourceHandle;
          sourceBranchId = handleInfo.sourceHandle;
        } else {
          // 只有当没有指定分支时才使用默认分支
          const choices = sourceNode.data?.parameters?.input_parameters?.choices || [];
          const defaultBranch = choices.find(choice => choice.is_default === true);
          if (defaultBranch) {
            sourceHandle = defaultBranch.branch_id;
            sourceBranchId = defaultBranch.branch_id;
          }
        }
      }

      // 只添加新的分支边，保留所有原有连接
      const edgeId = `edge_${sourceNodeId}_${newNodeId}_${Date.now()}`;
      const newEdge = {
        id: edgeId,
        source: sourceNodeId,
        target: newNodeId,
        branchId: sourceBranchId, // 使用修正后的branchId
        type: 'normal',
        sourceHandle: sourceHandle, // 使用修正后的sourceHandle
        data: {
          sourceStatus: undefined,
          targetStatus: undefined,
        },
      };

      // 添加到显示列表
      subFlowEdges.value.push(newEdge);

      // 添加到loopSubFlow状态
      const backendEdge = {
        edgeId: edgeId,
        sourceNode: sourceNodeId,
        targetNode: newNodeId,
        branchId: sourceBranchId // 使用修正后的branchId
      };

      loopSubFlow.value.edges.push(backendEdge);
    } else {
      // 检查源节点是否是Choice节点，确定正确的sourceHandle和branchId
      const sourceNode = subFlowNodes.value.find(node => node.id === sourceNodeId);
      let sourceHandle = handleInfo.sourceHandle || 'default';
      let sourceBranchId = '';
      
      if (sourceNode && sourceNode.type === 'Choice') {
        // 使用传入的branchId作为sourceHandle和branchId
        if (handleInfo.sourceHandle && handleInfo.sourceHandle !== 'default') {
          // 使用指定的分支ID
          sourceHandle = handleInfo.sourceHandle;
          sourceBranchId = handleInfo.sourceHandle;
        } else {
          // 只有当没有指定分支时才使用默认分支
          const choices = sourceNode.data?.parameters?.input_parameters?.choices || [];
          const defaultBranch = choices.find(choice => choice.is_default === true);
          if (defaultBranch) {
            sourceHandle = defaultBranch.branch_id;
            sourceBranchId = defaultBranch.branch_id;
          }
        }
      }
      
      // 如果源节点没有出边，只创建从源节点到新节点的连接
      const edgeId = `edge_${sourceNodeId}_${newNodeId}_${Date.now()}`;
      const newEdge = {
        id: edgeId,
        source: sourceNodeId,
        target: newNodeId,
        branchId: sourceBranchId, // 使用修正后的branchId
        type: 'normal',
        sourceHandle: sourceHandle, // 使用修正后的sourceHandle
        data: {
          sourceStatus: undefined,
          targetStatus: undefined,
        },
      };

      // 添加到显示列表
      subFlowEdges.value.push(newEdge);

      // 添加到loopSubFlow状态
      const backendEdge = {
        edgeId: edgeId,
        sourceNode: sourceNodeId,
        targetNode: newNodeId,
        branchId: sourceBranchId // 使用修正后的branchId
      };

      loopSubFlow.value.edges.push(backendEdge);
    }

    // 触发边路径重新计算和状态更新
    nextTick(() => {
      updateEdgeStatus();
      edgeUpdateTrigger.value++;
      
      // 多重延迟确保DOM完全渲染后再次计算坐标
      setTimeout(() => {
        edgeUpdateTrigger.value++; // 第一次重算
      }, 50);
      
      setTimeout(() => {
        edgeUpdateTrigger.value++; // 第二次重算，确保DOM完全渲染
      }, 150);
      
      setTimeout(() => {
        edgeUpdateTrigger.value++; // 第三次重算，最终确保精确定位
      }, 300);
    });

    ElMessage.success(`节点 "${nodeData.name || nodeData.callId}" 插入成功`);

  } catch (error) {
    console.error('[LoopNode插入节点] 插入失败:', error);
    ElMessage.error('插入节点失败');
  }
};



/**
 * 处理Handle开始连接
 * @param event 鼠标事件
 * @param nodeId 节点ID
 * @param handleType Handle类型
 * @param branchId 分支ID（可选，用于Choice节点）
 */
const handleStartConnection = (event: MouseEvent, nodeId: string, handleType: 'source' | 'target', branchId?: string) => {
  if (props.disabled || isDragging.value) return;
  
  // 阻止事件冒泡，避免触发节点拖拽
  event.stopPropagation();
  event.preventDefault();
  
  const canvasRect = (event.target as HTMLElement).closest('.embeddedFlowCanvas')?.getBoundingClientRect();
  if (!canvasRect) return;
  
  const handleElement = event.target as HTMLElement;
  const handleRect = handleElement.getBoundingClientRect();
  
  // 获取外部VueFlow的缩放倍率
  const vueFlowZoom = getVueFlowZoom();
  
  // 计算Handle在画布内的相对位置，考虑外部缩放
  // Handle的DOM位置是经过外部缩放的，需要转换为内嵌画布的坐标系
  const rawHandleX = handleRect.left + handleRect.width / 2 - canvasRect.left;
  const rawHandleY = handleRect.top + handleRect.height / 2 - canvasRect.top;
  
  const handlePosition = {
    x: rawHandleX / vueFlowZoom,
    y: rawHandleY / vueFlowZoom
  };
  
  connectingHandle.value = {
    nodeId,
    handleType,
    handlePosition,
    branchId: branchId || '' // 保存分支ID
  };
  
  isConnecting.value = true;
  
  // 鼠标位置也需要考虑外部缩放，转换为内嵌画布坐标系
  const rawMouseX = event.clientX - canvasRect.left;
  const rawMouseY = event.clientY - canvasRect.top;
  currentMousePosition.value = { 
    x: rawMouseX / vueFlowZoom, 
    y: rawMouseY / vueFlowZoom 
  };
  
  // 更新临时连接路径
  updateTempConnectionPath();
  
  // 添加全局事件监听 - 使用capture模式确保优先处理
  document.addEventListener('mousemove', handleConnectionDrag, { capture: true });
  document.addEventListener('mouseup', handleConnectionEnd, { capture: true });
};

/**
 * 处理连接拖拽
 * @param event 鼠标事件
 */
const handleConnectionDrag = (event: MouseEvent) => {
  if (!isConnecting.value || !connectingHandle.value) return;
  
  // 阻止事件冒泡和默认行为
  event.stopPropagation();
  event.preventDefault();
  
  const canvasElement = document.querySelector(`#loop-${props.id}`);
  if (!canvasElement) return;
  
  const canvasRect = canvasElement.getBoundingClientRect();
  const vueFlowZoom = getVueFlowZoom();
  
  // 鼠标位置需要考虑外部缩放，转换为内嵌画布坐标系
  const rawMouseX = event.clientX - canvasRect.left;
  const rawMouseY = event.clientY - canvasRect.top;
  currentMousePosition.value = {
    x: rawMouseX / vueFlowZoom,
    y: rawMouseY / vueFlowZoom
  };
  
  updateTempConnectionPath();
};

/**
 * 更新临时连接路径
 */
const updateTempConnectionPath = () => {
  if (!connectingHandle.value) return;
  
  const startPos = connectingHandle.value.handlePosition;
  const endPos = currentMousePosition.value;
  
  // 生成贝塞尔曲线路径，确保箭头始终指向鼠标位置
  const midX = (startPos.x + endPos.x) / 2;
  
  // 无论handle类型，路径都从handle位置指向鼠标位置，确保箭头尖端在鼠标位置
  tempConnectionPath.value = `M ${startPos.x} ${startPos.y} C ${midX} ${startPos.y}, ${midX} ${endPos.y}, ${endPos.x} ${endPos.y}`;
};

/**
 * 处理连接结束
 * @param event 鼠标事件
 */
const handleConnectionEnd = (event: MouseEvent) => {
  if (!isConnecting.value || !connectingHandle.value) return;
  
  // 检查是否松开在有效的Handle上
  const targetElement = document.elementFromPoint(event.clientX, event.clientY);
  const targetHandle = targetElement?.closest('.vue-flow__handle');
  
  if (targetHandle) {
    const targetNode = targetHandle.closest('.vue-flow__node');
    const targetNodeId = targetNode?.getAttribute('data-node-id');
    const targetHandleType = targetHandle.classList.contains('vue-flow__handle-left') ? 'target' : 'source';
    
    if (targetNodeId && targetNodeId !== connectingHandle.value.nodeId) {
      // 验证连接的有效性
      if ((connectingHandle.value.handleType === 'source' && targetHandleType === 'target') ||
          (connectingHandle.value.handleType === 'target' && targetHandleType === 'source')) {
        
        // 创建新的边连接，传递分支ID
        createSubFlowEdge(connectingHandle.value.nodeId, targetNodeId, connectingHandle.value.handleType, connectingHandle.value.branchId);
      }
    }
  }
  
  // 清理连接状态
  cleanupConnection();
};

/**
 * 创建子工作流边连接
 * @param sourceNodeId 源节点ID  
 * @param targetNodeId 目标节点ID
 * @param originHandleType 发起连接的Handle类型
 * @param branchId 分支ID（可选，用于Choice节点）
 */
const createSubFlowEdge = (sourceNodeId: string, targetNodeId: string, originHandleType: 'source' | 'target', branchId?: string) => {
  // 根据发起Handle类型确定实际的source和target
  const actualSourceId = originHandleType === 'source' ? sourceNodeId : targetNodeId;
  const actualTargetId = originHandleType === 'source' ? targetNodeId : sourceNodeId;
  
  // 检查边是否已存在
  const existingEdge = subFlowEdges.value.find(edge => 
    edge.source === actualSourceId && edge.target === actualTargetId
  );
  
  if (existingEdge) {
    ElMessage.warning('连接已存在');
    return;
  }
  
  // 检查源节点是否是Choice节点，确定正确的sourceHandle和branchId
  const sourceNode = subFlowNodes.value.find(node => node.id === actualSourceId);
  let sourceHandle = 'default';
  let sourceBranchId = '';
  
  if (sourceNode && sourceNode.type === 'Choice') {
    // 如果传入了特定的branchId，优先使用
    if (branchId && branchId !== 'default') {
      sourceHandle = branchId;
      sourceBranchId = branchId;
    } else {
      // 否则使用默认分支(ELSE分支)的handle
      const choices = sourceNode.data?.parameters?.input_parameters?.choices || [];
      const defaultBranch = choices.find(choice => choice.is_default === true);
      if (defaultBranch) {
        sourceHandle = defaultBranch.branch_id;
        sourceBranchId = defaultBranch.branch_id;
      } else {
      }
    }
  }

  // 生成新的边ID和完整数据结构
  const newEdge = {
    id: `edge_${actualSourceId}_${actualTargetId}_${Date.now()}`,
    source: actualSourceId,
    target: actualTargetId,
    branchId: sourceBranchId, // 使用修正后的branchId
    type: 'normal', // 使用normal类型
    sourceHandle: sourceHandle, // 使用修正后的sourceHandle
    data: {
      sourceStatus: undefined,
      targetStatus: undefined,
    },
  };
  
  // 添加到子工作流边列表
  subFlowEdges.value.push(newEdge);
  
  // 同步到loopSubFlow状态
  const backendEdge = {
    edgeId: newEdge.id,
    sourceNode: actualSourceId,
    targetNode: actualTargetId,
    branchId: sourceBranchId // 使用修正后的branchId
  };
  
  loopSubFlow.value.edges.push(backendEdge);
  loopSubFlow.value.hasUnsavedChanges = true;
  
  // 触发边路径重新计算和状态更新
  nextTick(() => {
    updateEdgeStatus();
    edgeUpdateTrigger.value++;
  });
  
  ElMessage.success('连接创建成功');
};

/**
 * 清理连接状态
 */
const cleanupConnection = () => {
  isConnecting.value = false;
  connectingHandle.value = null;
  tempConnectionPath.value = '';
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleConnectionDrag, { capture: true } as any);
  document.removeEventListener('mouseup', handleConnectionEnd, { capture: true } as any);
};





/**
 * 处理选择要插入的节点
 * @param nodeData 选择的节点数据
 */
const handleInsertNodeSelect = (nodeData: any) => {
  // 安全检查：禁止在LoopNode内部插入Loop节点
  if (nodeData.callId === 'Loop') {
    ElMessage.error('禁止在循环节点内部插入嵌套循环节点');
    return;
  }

  if (!insertEdgeInfo.value) {
    return;
  }

  try {
    // 1. 删除原来的边
    const originalEdgeId = insertEdgeInfo.value.edgeId;
    const sourceNodeId = insertEdgeInfo.value.sourceNodeId;
    const targetNodeId = insertEdgeInfo.value.targetNodeId;
    const insertPosition = insertEdgeInfo.value.midpoint;

    // 从显示列表中删除原边
    subFlowEdges.value = subFlowEdges.value.filter(edge => edge.id !== originalEdgeId);
    
    // 从loopSubFlow状态中删除原边
    loopSubFlow.value.edges = loopSubFlow.value.edges.filter(edge => edge.edgeId !== originalEdgeId);

    // 2. 在边的中点位置插入新节点
    const newNodeId = getId();
    
    // 使用公共函数创建标准化的节点数据
    const standardizedNodeData = sanitizeNodeData(nodeData, newNodeId);
    
    const newNode = {
      stepId: newNodeId,
      name: standardizedNodeData.name || standardizedNodeData.callId,
      description: standardizedNodeData.description || '',
      callId: standardizedNodeData.callId,
      nodeId: standardizedNodeData.nodeId,
      serviceId: standardizedNodeData.serviceId,
      position: {
        x: insertPosition.x,
        y: insertPosition.y,
      },
      enable: true,
      editable: true,
      parameters: standardizedNodeData.parameters,
    };


    
    // 添加到loopSubFlow
    loopSubFlow.value.nodes.push(newNode);
    loopSubFlow.value.hasUnsavedChanges = true;

    // 添加到显示列表 - 边中点插入使用标准化数据
    const displayNode = {
      id: newNode.stepId,
      type: newNode.callId === 'Choice' ? 'Choice' : 
            newNode.callId === 'Loop' ? 'Loop' :
            newNode.callId === 'break' ? 'break' :
            newNode.callId === 'continue' ? 'continue' :
            newNode.callId === 'VariableAssign' ? 'VariableAssign' : 'custom',
      data: {
        name: standardizedNodeData.name,
        description: standardizedNodeData.description,
        parameters: standardizedNodeData.parameters,
        nodeId: standardizedNodeData.nodeId,
        callId: standardizedNodeData.callId,
        serviceId: standardizedNodeData.serviceId,
        // 对于Code节点，需要额外的字段
        ...(standardizedNodeData.callId === 'Code' && {
          code: standardizedNodeData.code,
          codeType: standardizedNodeData.codeType,
          securityLevel: standardizedNodeData.securityLevel,
          timeoutSeconds: standardizedNodeData.timeoutSeconds,
          memoryLimitMb: standardizedNodeData.memoryLimitMb,
          cpuLimit: standardizedNodeData.cpuLimit
        })
      },
      position: {
        x: newNode.position.x,
        y: newNode.position.y,
      },
      deletable: false,
    };

    subFlowNodes.value.push(displayNode);

    // 3. 创建两条新边：source -> newNode -> target
    const edge1Id = `edge_${sourceNodeId}_${newNodeId}_${Date.now()}`;
    const edge2Id = `edge_${newNodeId}_${targetNodeId}_${Date.now() + 1}`;

        // 检查源节点是否是Choice节点，确定正确的sourceHandle和branchId
    const sourceNode = subFlowNodes.value.find(node => node.id === sourceNodeId);
    let sourceHandle = 'default';
    let sourceBranchId = '';
    
    if (sourceNode && sourceNode.type === 'Choice') {
      // 对于Choice节点，找到默认分支(ELSE分支)的handle
      const choices = sourceNode.data?.parameters?.input_parameters?.choices || [];
      const defaultBranch = choices.find(choice => choice.is_default === true);
      if (defaultBranch) {
        sourceHandle = defaultBranch.branch_id;
        sourceBranchId = defaultBranch.branch_id;
      } else {
        // 如果没有找到默认分支，尝试从原始边的sourceHandle中获取
        const originalEdgeId = insertEdgeInfo.value?.edgeId;
        const originalEdge = subFlowEdges.value.find(edge => edge.id === originalEdgeId);
        if (originalEdge && originalEdge.sourceHandle && originalEdge.sourceHandle !== 'default') {
          sourceHandle = originalEdge.sourceHandle;
          sourceBranchId = originalEdge.branchId || '';
        }
      }
    }

    // 第一条边：source -> newNode
    const newEdge1 = {
      id: edge1Id,
      source: sourceNodeId,
      target: newNodeId,
      branchId: sourceBranchId, // 使用修正后的branchId
      type: 'normal',
      sourceHandle: sourceHandle, // 使用修正后的sourceHandle
      data: {
        sourceStatus: undefined,
        targetStatus: undefined,
      },
    };

    // 添加到显示列表和loopSubFlow状态
    subFlowEdges.value.push(newEdge1);
    
    const backendEdge1 = {
      edgeId: edge1Id,
      sourceNode: sourceNodeId,
      targetNode: newNodeId,
      branchId: sourceBranchId // 使用修正后的branchId
    };
    
    loopSubFlow.value.edges.push(backendEdge1);

    // 对于break和continue节点，不创建出边，因为它们是终止节点
    if (nodeData.callId !== 'break' && nodeData.callId !== 'continue') {
      // 检查新插入的节点是否是Choice节点，确定其输出连接的sourceHandle和branchId
      let newNodeSourceHandle = 'default';
      let newNodeBranchId = '';
      if (nodeData.callId === 'Choice') {
        // 对于新创建的Choice节点，找到默认分支作为输出handle
        const choices = nodeData.parameters?.input_parameters?.choices || [];
        const defaultBranch = choices.find(choice => choice.is_default === true);
        if (defaultBranch) {
          newNodeSourceHandle = defaultBranch.branch_id;
          newNodeBranchId = defaultBranch.branch_id;
        } else {
          // 如果没有默认分支，使用第一个分支或生成默认ID
          newNodeSourceHandle = `else_${newNodeId}`;
          newNodeBranchId = `else_${newNodeId}`;
        }
      }
      
      // 第二条边：newNode -> target（只有非break/continue节点才创建）
      const newEdge2 = {
        id: edge2Id,
        source: newNodeId,
        target: targetNodeId,
        branchId: newNodeBranchId, // 使用修正后的branchId
        type: 'normal',
        sourceHandle: newNodeSourceHandle, // 使用修正后的sourceHandle
        data: {
          sourceStatus: undefined,
          targetStatus: undefined,
        },
      };

      subFlowEdges.value.push(newEdge2);

      const backendEdge2 = {
        edgeId: edge2Id,
        sourceNode: newNodeId,
        targetNode: targetNodeId,
        branchId: newNodeBranchId // 使用修正后的branchId
      };

      loopSubFlow.value.edges.push(backendEdge2);
    }

    // 4. 触发边路径重新计算和状态更新
    nextTick(() => {
      updateEdgeStatus();
      edgeUpdateTrigger.value++;
    });

    // 5. 菜单关闭由workFlow组件处理

    ElMessage.success(`节点 "${nodeData.name || nodeData.callId}" 插入成功`);

  } catch (error) {
    console.error('[LoopNode Handle插入] 插入失败:', error);
    ElMessage.error('插入节点失败');
  }
};

/**
 * 删除子工作流边连接(稳定后改成邮件dropdown菜单删除而非右键直接删除)
 * @param edgeId 边ID
 */
const deleteSubFlowEdge = (edgeId: string) => {
  // 从显示列表中删除
  subFlowEdges.value = subFlowEdges.value.filter(edge => edge.id !== edgeId);
  
  // 从loopSubFlow状态中删除
  loopSubFlow.value.edges = loopSubFlow.value.edges.filter(edge => edge.edgeId !== edgeId);
  loopSubFlow.value.hasUnsavedChanges = true;
  
  ElMessage.success('连接已删除');
};

/**
 * 处理子工作流的插入节点事件
 * @param edgeInfo 边信息和中点坐标
 */
const handleSubFlowInsertNode = (edgeInfo: any) => {
  if (props.disabled) return;
  
  // 验证edgeInfo结构
  if (!edgeInfo || typeof edgeInfo.midX !== 'number' || typeof edgeInfo.midY !== 'number') {
    return;
  }
  
  // 根据edgeId从边列表中查找完整的边信息
  const targetEdge = subFlowEdges.value.find(edge => edge.id === edgeInfo.edgeId);
  if (!targetEdge) {
    return;
  }
  
  // 获取外部VueFlow的缩放倍率
  const vueFlowZoom = getVueFlowZoom();
  
  // 计算菜单显示位置，考虑外部缩放
  const canvasElement = document.querySelector(`#loop-${props.id}`);
  if (!canvasElement) return;
  
  const canvasRect = canvasElement.getBoundingClientRect();
  
  // 将内嵌画布坐标转换为视口绝对坐标
  const absoluteX = canvasRect.left + edgeInfo.midX * vueFlowZoom;
  const absoluteY = canvasRect.top + edgeInfo.midY * vueFlowZoom;
  
  // 构造传递给父组件的事件数据
  const insertMenuData = {
    // 边信息，用于后续插入节点
    edgeInfo: {
      edgeId: edgeInfo.edgeId,
      sourceNodeId: targetEdge.source,
      targetNodeId: targetEdge.target,
      midpoint: { x: edgeInfo.midX, y: edgeInfo.midY }
    },
    // 菜单位置和方向
    position: { x: absoluteX, y: absoluteY },
    direction: absoluteX > window.innerWidth / 2 ? 'left' : 'right',
    // LoopNode相关信息
    loopNodeId: props.id,
    subFlowId: loopSubFlow.value.flowId,
    // 传递额外的节点类型
    extraNodeTypes: extraLoopNodeTypes.value
  };
  
  // 传递事件给父组件workFlow，让它在外部显示InsertNodeMenu
  emits('showInsertNodeMenu', insertMenuData);
};

// 获取子节点样式类，与外部节点保持一致
const getSubNodeClass = (data: any) => {
  // 所有节点都使用标准的样式类逻辑
  return getNodeClass(data);
};



onMounted(async () => {
  try {
    // 设置全局引用，供父组件调用
    if (typeof window !== 'undefined') {
      (window as any).loopNodeRefs = (window as any).loopNodeRefs || {};
      (window as any).loopNodeRefs[`loopNode_${props.id}`] = {
        saveSubFlow,
        getSubFlowId,
        hasUnsavedSubFlowChanges,
        addNodeToSubFlow,
        removeNodeFromSubFlow,
        insertNodeIntoSubFlow,
        updateSubFlowNode,
        loopSubFlow: readonly(loopSubFlow),
      };
    }
    
    // watch已经通过immediate: true处理了初始化，这里不需要重复调用
    if (!isInitialized.value) {
      await loadSubFlowData();
    } 
  } catch (error) {
    // 处理挂载错误
  }
});



// 组件卸载时清理全局引用和事件监听器
onUnmounted(() => {
  // 清理全局引用
  if (typeof window !== 'undefined' && (window as any).loopNodeRefs) {
    delete (window as any).loopNodeRefs[`loopNode_${props.id}`];
  }
  
  // 清理长按计时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  
  // 清理拖拽事件监听器
  document.removeEventListener('mousemove', handleSubNodeDrag, { capture: true } as any);
  document.removeEventListener('mouseup', handleSubNodeMouseUpForDrag, { capture: true } as any);
  document.removeEventListener('mouseup', handleSubNodeMouseUpForClick);
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
  
  // 清理连接事件监听器
  document.removeEventListener('mousemove', handleConnectionDrag, { capture: true } as any);
  document.removeEventListener('mouseup', handleConnectionEnd, { capture: true } as any);
  
  // 清理插入节点状态
  insertEdgeInfo.value = null;
  
  // 清理状态
  clickedNodeId.value = null;
  draggingNode.value = null;
  draggingNodeIndex.value = -1;
  pendingPosition.value = null;
  hasActuallyDragged.value = false;
  subNodeSourceHandleHovered.value.clear(); // 清理子节点悬停状态
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
  if (edgeUpdateThrottleId.value) {
    cancelAnimationFrame(edgeUpdateThrottleId.value);
    edgeUpdateThrottleId.value = null;
  }
  shouldUpdateEdges.value = false;
  isDragging.value = false;
});

// 向父组件暴露的方法
/**
 * 供外部调用的节点插入方法
 * @param nodeData 要插入的节点数据
 * @param edgeInfo 边信息
 */
const insertNodeIntoSubFlow = (nodeData: any, edgeInfo: any) => {
  // 安全检查：禁止在LoopNode内部插入Loop节点
  if (nodeData.callId === 'Loop') {
    ElMessage.error('禁止在循环节点内部插入嵌套循环节点');
    return;
  }

  // 检查是否为从节点Handle插入
  if (edgeInfo && edgeInfo.isFromNodeHandle) {
    // 从节点Handle插入的逻辑
    handleInsertNodeFromHandle(nodeData, edgeInfo);
  } else {
    // 设置insertEdgeInfo，然后调用现有的handleInsertNodeSelect（用于边中点插入）
    insertEdgeInfo.value = edgeInfo;
    handleInsertNodeSelect(nodeData);
  }
};

// insertNodeIntoSubFlow方法已在onMounted中设置到全局引用

defineExpose({
  saveSubFlow,
  getSubFlowId,
  hasUnsavedSubFlowChanges,
  addNodeToSubFlow,
  removeNodeFromSubFlow,
  insertNodeIntoSubFlow,
  loopSubFlow: readonly(loopSubFlow),
});

// 阻止子画布区域的点击事件冒泡
const handleSubCanvasClick = (event: MouseEvent) => {
  // 只阻止事件冒泡到父元素，防止触发节点点击事件
  // 不调用preventDefault()，确保滚轮事件可以正常穿透处理
  event.stopPropagation();
};

// 阻止调整大小控件点击事件冒泡
const handleResizeHandleClick = (event: MouseEvent) => {
  // 阻止事件冒泡到父元素，防止触发节点点击事件
  event.stopPropagation();
  event.preventDefault();
};

// 处理子画布的滚轮事件，允许穿透到外层VueFlow
const handleSubCanvasWheel = (event: WheelEvent) => {
  // 新策略：让原始事件自然传播，同时添加备用的强制更新
  
  // 添加备用机制：延迟触发自定义事件确保zoom值更新
  setTimeout(() => {
    const customEvent = new CustomEvent('loopNodeZoomUpdate', {
      detail: { deltaY: event.deltaY, reason: '确保zoom更新' },
      bubbles: true
    });
    
    const loopNodeElement = document.querySelector(`[data-id="${props.id}"]`);
    if (loopNodeElement) {
      loopNodeElement.dispatchEvent(customEvent);
    }
  }, 100);
  
  // 不阻止原始事件，让它自然传播到VueFlow
  // 这样VueFlow能接收到原始的事件进行处理
};
</script>

<!-- 注册组件 -->
<script lang="ts">
export default {
  components: {
    CustomEdge,
    NodeMirrorText
  }
};
</script>

<template>
  <div class="loopNodeStyle" :class="[curStatus, { 'node-selected': selected }]">
    <!-- 左侧输入handle -->
    <Handle
      :class="{ isConnecting: handleTargetConnecting }"
      @mousedown="setConnectStatus('target')"
      type="target"
      :position="Position.Left"
    />
    


    <div class="nodeContainer">
      <!-- 节点主体 -->
      <div class="nodeBox" @click="handleNodeClick">
        <!-- 节点标题 -->
        <div class="title" v-if="props.data.name">
          <div class="iconLabel">
            <img
              class="iconStyle"
              v-if="props.data.nodeId"
              :src="getSrcIcon(props.data)"
            />
            <div class="iconStyle loopIcon" v-else>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 4V1l4 4-4 4V6c-3.31 0-6 2.69-6 6c0 1.01.25 1.97.7 2.8l-1.46 1.46C4.45 15.26 4 13.68 4 12c0-4.42 3.58-8 8-8zm7.7 9.2l1.46-1.46C21.55 12.74 22 14.32 22 16c0 4.42-3.58 8-8 8v3l-4-4l4-4v3c3.31 0 6-2.69 6-6c0-1.01-.25-1.97-.7-2.8z"/>
              </svg>
            </div>
            <div class="label">{{ props.data.name || '循环' }}</div>
          </div>
        </div>

        <!-- 内嵌的flow画布 -->
        <div 
          :id="`loop-${props.id}`"
          class="embeddedFlowCanvas" 
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
          @click="handleSubCanvasClick"
          @dblclick="handleSubCanvasClick"
          @wheel="handleSubCanvasWheel"
        >      
          <div class="flowCanvasWrapper" v-loading="subFlowLoading">
            <div class="vue-flow-like-canvas">
              <!-- 背景网格 -->
              <div class="vue-flow__background">
                <svg class="vue-flow__background-pattern" style="width: 100%; height: 100%;">
                  <defs>
                    <pattern 
                      :id="`pattern-dots-${props.id}`" 
                      x="0" 
                      y="0" 
                      width="10" 
                      height="10" 
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="1" cy="1" r="1" fill="#dfe5ef"/>
                    </pattern>
                  </defs>
                  <rect 
                    width="100%" 
                    height="100%" 
                    :fill="`url(#pattern-dots-${props.id})`"
                  />
                </svg>
              </div>
              
              <!-- 节点容器：始终渲染，不依赖节点数量 -->
              <div class="vue-flow__nodes">
                <div 
                  v-for="node in subFlowNodes" 
                  :key="node.id"
                  class="vue-flow__node embeddedCustomNodeStyle"
                  :class="[
                    `vue-flow__node-${node.type}`,
                    { 'node-selected': node.selected },
                    { 'dragging': draggingNode === node.id }
                  ]"
                  :style="{
                    position: 'absolute',
                    left: node.position.x + 'px',
                    top: node.position.y + 'px',
                  }"
                  :data-node-id="node.id"
                  @mousedown="handleSubNodeMouseDown($event, node.id)"
                  @click="handleSubNodeContainerClick($event, node.id)"
                >
                  <!-- 左侧连接handle -->
                  <div 
                    v-if="node.data.callId !== 'start'"
                    class="vue-flow__handle vue-flow__handle-left"
                    :class="{ 'connecting': isConnecting && connectingHandle?.handleType === 'target' }"
                    :title="'连接点'"
                    @mousedown="handleStartConnection($event, node.id, 'target')"
                  ></div>
                  
                  <!-- 开始/结束节点的特殊样式 -->
                  <div v-if="node.data.callId === 'start' || node.data.callId === 'end'" class="nodeSaEBorderBox">
                    <div class="saEContent">
                      <div class="saEHeader">
                        <div
                          v-if="node.data.callId === 'start'"
                          class="saEIcon startIcon"
                        ></div>
                        <div
                          v-else-if="node.data.callId === 'end'"
                          class="saEIcon endIcon"
                        ></div>
                        <div class="saEText">{{ node.data.name }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- break/continue节点的特殊样式 -->
                  <div v-else-if="node.data.callId === 'break' || node.data.callId === 'continue'" class="nodeSaEBorderBox">
                    <div class="saEContent">
                      <div class="saEHeader">
                        <div
                          v-if="node.data.callId === 'continue'"
                          class="saEIcon continueIcon"
                        >
                          <img :src="Refresh" alt="continue" />
                        </div>
                        <div
                          v-else-if="node.data.callId === 'break'"
                          class="saEIcon breakIcon"
                        >
                          <img :src="StopFilled" alt="break" />
                        </div>
                        <div class="saEText">{{ node.data.name }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Choice节点自实现 -->
                  <div v-else-if="node.data.callId === 'Choice'" class="choiceBranchNodeStyle nodeContainer">
                    <div class="nodeBox" :class="getSubNodeClass(node.data)" @click="handleSubNodeClick(node)">
                      <!-- 节点标题 -->
                      <div class="title" v-if="node.data.name">
                        <div class="iconLabel">
                          <img
                            class="iconStyle"
                            v-if="node.data.nodeId"
                            :src="getSrcIcon(node.data)"
                          />
                          <div class="iconStyle choiceIcon" v-else>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8z"/>
                              <path fill="currentColor" d="M12 7a1 1 0 0 0-1 1v4H8a1 1 0 0 0 0 2h3v3a1 1 0 0 0 2 0v-3h3a1 1 0 0 0 0-2h-3V8a1 1 0 0 0-1-1z"/>
                            </svg>
                          </div>
                          <div class="label">{{ node.data.name }}</div>
                        </div>
                      </div>

                      <!-- 分支列表 -->
                      <div class="branchList" v-if="getChoiceBranches(node.data).length > 0">
                        <!-- 条件分支 -->
                        <div 
                          class="branchItem" 
                          v-for="(branch, index) in getConditionalBranches(getChoiceBranches(node.data))" 
                          :key="branch.id"
                        >
                          <div class="branchHeader">
                            <span class="caseLabel">CASE {{ index + 1 }}</span>
                            <div class="branchTypeLabel if-label">{{ index === 0 ? 'IF' : 'ELIF' }}</div>
                          </div>
                          <div class="branchContent">
                            <div class="branchCondition">
                              <span v-html="formatConditionsHtml(branch.conditions, branch.logic)"></span>
                            </div>
                          </div>

                          <!-- 右侧输出handle -->
                          <div
                            :id="branch.id"
                            class="vue-flow__handle vue-flow__handle-right sourceHandle"
                            :class="{ 'connecting': isConnecting && connectingHandle?.handleType === 'source' }"
                            :title="`连接点: ${branch.name || 'IF分支'}`"
                            @mousedown="handleStartConnection($event, node.id, 'source', branch.id)"
                          ></div>

                          <!-- 每个分支的+按钮 -->
                          <div 
                            v-if="!props.disabled"
                            class="branch-plus-button"
                            @click="handleChoiceSourceInsertNode($event, node.id, branch.id)"
                          >
                            <el-icon class="plus-icon">
                              <Plus />
                            </el-icon>
                          </div>
                        </div>
                        
                        <!-- 默认分支 ELSE -->
                        <div 
                          class="branchItem"
                          v-if="getDefaultBranch(getChoiceBranches(node.data))"
                          :key="getDefaultBranch(getChoiceBranches(node.data)).id"
                        >
                          <div class="branchHeader">
                            <span class="caseLabel">ELSE</span>
                            <div class="branchTypeLabel else-label">ELSE</div>
                          </div>
                          <div class="branchContent">
                            <div class="branchCondition">
                              <span class="defaultText">其他所有情况</span>
                            </div>
                          </div>

                          <!-- 右侧输出handle -->
                          <div
                            :id="getDefaultBranch(getChoiceBranches(node.data)).id"
                            class="vue-flow__handle vue-flow__handle-right sourceHandle"
                            :class="{ 'connecting': isConnecting && connectingHandle?.handleType === 'source' }"
                            :title="'连接点: ELSE分支'"
                            @mousedown="handleStartConnection($event, node.id, 'source', getDefaultBranch(getChoiceBranches(node.data)).id)"
                          ></div>

                          <!-- ELSE分支的+按钮 -->
                          <div 
                            v-if="!props.disabled"
                            class="branch-plus-button"
                            @click="handleChoiceSourceInsertNode($event, node.id, getDefaultBranch(getChoiceBranches(node.data)).id)"
                          >
                            <el-icon class="plus-icon">
                              <Plus />
                            </el-icon>
                          </div>
                        </div>
                      </div>

                      <!-- 空状态 -->
                      <div class="emptyBranches" v-else>
                        <div class="emptyText">点击编辑添加分支条件</div>
                      </div>
                    </div>
                    
                    <!-- 节点底部信息 -->
                    <div class="nodeFooter" v-if="node.id">
                      <div class="nodeIdText">
                        <span>{{ node.id }}</span>
                      </div>
                      <el-icon
                        class="copydocument"
                        @click.stop="handleSubNodeCopyId(node.id)"
                        :title="'复制节点ID'"
                      >
                        <CopyDocument />
                      </el-icon>
                    </div>

                    <!-- 右上角删除按钮 -->
                    <div 
                      v-if="!props.disabled"
                      class="subNodeDeleteCardWrapper"
                    >
                      <div class="subNodeDeleteCard">
                        <button
                          class="subNodeDeleteButton"
                          @click.stop="handleSubNodeDelete(node.id)"
                          :title="'删除节点'"
                          @mouseenter="node.showDeleteText = true"
                          @mouseleave="node.showDeleteText = false"
                        >
                          <el-icon class="delete-icon">
                            <Delete />
                          </el-icon>
                          <span class="delete-text" v-show="node.showDeleteText">删除</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 普通节点主体内容 -->
                  <div v-else class="nodeContainer">
                    <div class="nodeBox" :class="getSubNodeClass(node.data)">
                      <div class="title" v-if="node.data.name">
                        <div class="iconLabel">
                          <img
                            class="iconStyle"
                            v-if="node.data.nodeId && node.data.nodeId !== 'Empty'"
                            :src="getSrcIcon(node.data)"
                          />
                          <el-icon v-else-if="!node.data.nodeId" class="warnTiangleIcon">
                            <WarnTriangleFilled />
                          </el-icon>
                          <div class="label" :title="node.data.name">{{ node.data.name }}</div>
                        </div>
                      </div>
                      
                      <!-- VariableAssign 节点的特殊内容 -->
                      <div v-if="node.data.callId === 'VariableAssign'">
                        <!-- 变量操作列表 -->
                        <div v-if="getVariableOperations(node.data).length > 0" class="operations-list">
                          <div 
                            v-for="(operation, index) in getVariableOperations(node.data)" 
                            :key="index" 
                            class="operation-item"
                          >
                            <div class="operation-content">
                              <span class="variable-name">{x} {{ getVariableDisplayName(operation.variable_name) }}</span>
                              <span class="operation-type">{{ getOperationDisplayName(operation.operation) }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- 无操作时的提示 -->
                        <div v-else class="no-operations">
                          <span class="placeholder-text">点击配置变量操作</span>
                        </div>
                      </div>
                      <!-- 移除description显示，与外部节点保持一致 -->
                    </div>
                    
                    <!-- 节点footer显示ID -->
                    <div class="nodeFooter" v-if="node.id">
                      <div class="nodeIdText">
                        <span>{{ node.id }}</span>
                      </div>
                      <el-icon
                        class="copydocument"
                        @click.stop="handleSubNodeCopyId(node.id)"
                        :title="'复制节点ID'"
                      >
                        <CopyDocument />
                      </el-icon>
                    </div>
                  </div>
                  
                  <!-- 右侧连接handle (非Choice、非end、非break、非continue节点) -->
                  <div 
                    v-if="node.data.callId !== 'end' && node.data.callId !== 'Choice' && node.data.callId !== 'break' && node.data.callId !== 'continue'"
                    class="vue-flow__handle vue-flow__handle-right"
                    :class="{ 'connecting': isConnecting && connectingHandle?.handleType === 'source' }"
                    :title="'连接点'"
                    @mousedown="handleStartConnection($event, node.id, 'source')"
                  ></div>
                  
                  <!-- 编辑提示 -->
                  <div 
                    v-if="node.data.callId !== 'start' && node.data.callId !== 'end'"
                    class="editHint"
                    :title="'点击编辑节点'"
                  >
                    ✏️
                  </div>
                  
                  <!-- 右上角删除按钮 - 仅普通节点显示 -->
                  <div 
                    v-if="node.data.callId !== 'start' && node.data.callId !== 'end' && !props.disabled"
                    class="subNodeDeleteCardWrapper"
                  >
                    <div class="subNodeDeleteCard">
                      <button
                        class="subNodeDeleteButton"
                        @click.stop="handleSubNodeDelete(node.id)"
                        :title="'删除节点'"
                        @mouseenter="node.showDeleteText = true"
                        @mouseleave="node.showDeleteText = false"
                      >
                        <el-icon class="delete-icon">
                          <Delete />
                        </el-icon>
                        <span class="delete-text" v-show="node.showDeleteText">删除</span>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Source +按钮 - 仅有右侧Handle的节点显示 -->
                  <div 
                    v-if="node.data.callId !== 'end' && node.data.callId !== 'Choice' && !props.disabled"
                    class="sub-handle-plus-button sub-source-plus"
                    @mouseenter="handleSubNodeSourceHandleEnter(node.id)"
                    @mouseleave="handleSubNodeSourceHandleLeave(node.id)"
                    @click="handleSubNodeSourceInsertNode($event, node.id)"
                  >
                    <el-icon v-if="subNodeSourceHandleHovered.get(node.id)" class="plus-icon">
                      <Plus />
                    </el-icon>
                  </div>
                </div>
              </div>
              
              <!-- 边连接线 - 使用CustomEdge组件 -->
              <svg class="vue-flow__edges">
                <defs>
                  <!-- 临时连接线箭头 -->
                  <marker :id="`temp-arrowhead-${props.id}`" markerWidth="10" markerHeight="7" 
                          refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1"/>
                  </marker>
                  
                  <!-- CustomEdge需要的梯度定义 -->
                  <linearGradient :id="`success_error_${props.id}`">
                    <stop offset="0" stop-color="#24ab36" />
                    <stop offset="100" stop-color="#e32020" />
                  </linearGradient>
                  <linearGradient :id="`error_success_${props.id}`">
                    <stop offset="0" stop-color="#e32020" />
                    <stop offset="100" stop-color="#24ab36" />
                  </linearGradient>
                </defs>
                
                <!-- 现有边连接 - 使用CustomEdge组件 -->
                <g @mousedown.stop @click.stop @contextmenu.stop>
                  <CustomEdge
                    v-for="edge in processedEdges" 
                    :key="edge.id"
                    :id="edge.id"
                    :sourceX="edge.sourceX"
                    :sourceY="edge.sourceY"
                    :targetX="edge.targetX"
                    :targetY="edge.targetY"
                    :sourcePosition="edge.sourcePosition"
                    :targetPosition="edge.targetPosition"
                    :data="{ ...edge.data, isEmbedded: true }"
                    :isConnection="false"
                    :disabled="props.disabled"
                    @insertNode="handleSubFlowInsertNode"
                    @contextmenu.prevent="deleteSubFlowEdge(edge.id)"
                  />
                </g>
                
                <!-- 临时连接线 -->
                <path 
                  v-if="isConnecting && tempConnectionPath"
                  :d="tempConnectionPath"
                  class="vue-flow__edge-path temp-connection"
                  stroke="#6366f1"
                  stroke-width="2"
                  fill="none"
                  stroke-dasharray="5,5"
                  :marker-end="`url(#temp-arrowhead-${props.id})`"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- 右下角拖拽调整大小的控制点 -->
        <div 
          class="resizeHandle"
          @click="handleResizeHandleClick"
          @mousedown="startResize"
          :class="{ disabled: props.disabled }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12" height="12">
            <!-- 三个对角线排列的小圆点 -->
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="7" r="1.5" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 右上角删除按钮 -->
    <div class="deleteCardWrapper" v-if="!props.disabled">
      <div class="deleteCard">
        <button
          class="deleteButton"
          @click="delNode(props.id)"
          :title="$t('semantic.interface_delete')"
          @mouseenter="showDeleteText = true"
          @mouseleave="showDeleteText = false"
        >
          <el-icon class="delete-icon">
            <Delete />
          </el-icon>
          <span class="delete-text" v-show="showDeleteText">{{ $t('semantic.interface_delete') }}</span>
        </button>
      </div>
    </div>

    <!-- 右侧输出handle -->
    <Handle
      type="source"
      :position="Position.Right"
      @mousedown="setConnectStatus('source')"
      :class="{ isConnecting: handleSourceConnecting }"
      :connectable="props.data?.isConnectSource"
    />
    
    <!-- Source +按钮 - 独立定位，远离Handle -->
    <div 
      v-if="!props.disabled"
      class="handle-plus-button source-plus"
      @mouseenter="handleSourceHandleEnter"
      @mouseleave="handleSourceHandleLeave"
      @click="handleSourceInsertNode"
    >
      <el-icon v-if="sourceHandleHovered" class="plus-icon">
        <Plus />
      </el-icon>
    </div>
    
    <!-- 调试时出现 - 显示输入输出数据 -->
    <NodeMirrorText
      v-if="curStatus !== 'default'"
      :status="curStatus"
      :costTime="costTime"
      :inputAndOutput="inputAndOutput"
      style="display: block"
    />
  </div>

</template>

<style scoped>
.loopNodeStyle {
  position: relative;
  background: #ffffff;
  border: 2px solid #e1e4e8;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 320px;
  transition: all 0.2s ease;
}

.loopNodeStyle.node-selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.loopNodeStyle.running {
  border-color: #f39c12;
  box-shadow: 0 0 0 4px rgba(243, 156, 18, 0.1);
}

.loopNodeStyle.success {
  border-color: #27ae60;
  box-shadow: 0 0 0 4px rgba(39, 174, 96, 0.1);
}

.loopNodeStyle.error {
  border-color: #e74c3c;
  box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.1);
}

.nodeContainer {
  position: relative;
  z-index: 1;
}

.nodeBox {
  padding: 16px;
  cursor: pointer;
}

.title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  .iconLabel {
    display: flex;
    align-items: center;
  }

  .iconStyle {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6366f1;
    
    &.loopIcon {
      background: rgba(99, 102, 241, 0.1);
      border-radius: 4px;
    }
  }

  .label {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #24292e;
  }
}

.loopInfo {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e1e4e8;
}

.infoItem {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.infoLabel {
  color: #6b7280;
  font-weight: 500;
}

.infoValue {
  color: #374151;
  font-weight: 600;
  background: #ffffff;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

.embeddedFlowCanvas {
  position: relative;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  min-height: 150px;
  margin-top: 8px;
}

.subflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #ffffff;
  border-bottom: 1px solid #e1e4e8;
  border-radius: 6px 6px 0 0;
}

.subflow-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subflow-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.subflow-status {
  font-size: 10px;
  color: #6b7280;
  transition: color 0.2s;
}

.subflow-status.has-changes {
  color: #f59e0b;
}

.subflow-actions {
  display: flex;
  gap: 4px;
}

.flowCanvasWrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 6px 6px;
  cursor: default;
}

/* 移除旧的embedded-node-content样式 */

.embedded-flow {
  width: 100%;
  height: 100%;
}

.embedded-flow-simple {
  width: 100%;
  height: 100%;
  padding: 12px;
  background: #fafafa;
  border-radius: 0 0 10px 10px;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-title {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.simple-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.simple-node:hover {
  border-color: #6366f1;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
}

.node-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-type {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

/* 移除空状态相关样式，保持样式简洁 */

/* 仿VueFlow样式的子画布 */
.vue-flow-like-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ebeff6;
  overflow: hidden;
  border-radius: 6px;
}

.vue-flow__background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.vue-flow__background-pattern {
  width: 100%;
  height: 100%;
  opacity: 1;
}

.vue-flow__nodes {
  position: relative;
  z-index: 3; /* 提高z-index，确保节点在边的上方 */
  width: 100%;
  height: 100%;
}

.vue-flow__node {
  position: absolute;
  z-index: 5; /* 进一步提高单个节点的z-index */
}

.vue-flow__edges {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  /* 默认禁用pointer-events，只对特定元素启用 */
  pointer-events: none;
}

.vue-flow__edge-path {
  fill: none;
  stroke-width: 2;
  stroke: #b1b1b7;
}

.vue-flow__edge-path.temp-connection {
  stroke: #6366f1;
  opacity: 0.8;
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

/* 嵌入环境中的CustomEdge样式 */
.vue-flow-like-canvas .vue-flow__edges .flowEdge {
  /* 整个flowEdge组启用pointer-events但阻止冒泡 */
  pointer-events: auto;
}

.vue-flow-like-canvas .vue-flow__edges .flowEdge:hover .edge-path {
  stroke: #6395fd !important;
}

.vue-flow-like-canvas .vue-flow__edges .flowEdge:hover .markEnd {
  fill: #6395fd !important;
}

/* 具体的交互元素 */
.vue-flow-like-canvas .vue-flow__edges .flowEdge .edge-interaction {
  cursor: pointer;
  pointer-events: auto;
}

.vue-flow-like-canvas .vue-flow__edges .flowEdge .insert-node-button {
  cursor: pointer;
  pointer-events: auto;
}

/* ============ Handle样式 - 使用超高优先级解决冲突 ============ */

/* Handle通用基础样式 - 超高优先级，覆盖外部样式 */
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle .vue-flow__handle {
  position: absolute !important;
  width: 8px !important;
  height: 8px !important;
  background: #c3cedf !important;
  border: 2px solid #fff !important;
  border-radius: 50% !important;
  z-index: 10 !important;
  cursor: crosshair !important;
  transition: all 0.2s ease !important;
  pointer-events: auto !important;
  transform-origin: center center !important;
}

/* Handle左侧位置 - 超高优先级，覆盖外部样式 */
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle .vue-flow__handle-left {
  left: -7px !important;
  right: auto !important; /* 重置right属性 */
  top: 50% !important;
  transform: translateY(-50%) !important;
}

/* Handle右侧位置 - 超高优先级，覆盖外部样式 */
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle .vue-flow__handle-right {
  right: -7px !important;
  left: auto !important; /* 重置left属性 */
  top: 50% !important;
  transform: translateY(-50%) !important;
}

/* 移除Handle独立hover效果，Handle只跟随节点状态 */

/* 开始/结束节点样式 */
.start-end-node {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  padding: 8px 16px;
  min-width: 80px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
}

.start-end-node .node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.start-end-node .node-icon {
  font-size: 12px;
}

.start-end-node .node-text {
  font-weight: 500;
}

/* 嵌入子画布的节点样式 - 与主工作流CustomNode完全一致，1:1比例 */
.embeddedCustomNodeStyle {
  width: 320px; /* 原始尺寸，无缩放 */
  height: fit-content;
  border-radius: 4px;
  background: white;
  border: 2px solid transparent;
  position: relative;
  border-radius: 10px;
  background-clip: padding-box;
  transition: border-color 0.2s ease; /* 只对边框颜色添加过渡，避免影响位置变化 */
  cursor: pointer;
}

/* 开始/结束节点的特殊容器样式 */
.embeddedCustomNodeStyle.vue-flow__node-start,
.embeddedCustomNodeStyle.vue-flow__node-end,
.embeddedCustomNodeStyle.vue-flow__node-break,
.embeddedCustomNodeStyle.vue-flow__node-continue {
  width: 160px !important; /* 原始尺寸，无缩放 */
  border: 2px solid transparent;
  min-height: 56px; /* 原始尺寸，无缩放 */
  max-height: none; /* 允许高度自适应 */
  background: var(--flow-bg-color, #ffffff);
  border-radius: 10px; /* 与外部CustomSaENode保持一致 */
  background-clip: padding-box;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: none;
}

/* 恢复开始/结束节点的hover效果，与外部节点保持一致 */
.embeddedCustomNodeStyle.vue-flow__node-start:hover,
.embeddedCustomNodeStyle.vue-flow__node-end:hover,
.embeddedCustomNodeStyle.vue-flow__node-break:hover,
.embeddedCustomNodeStyle.vue-flow__node-continue:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 开始节点的Handle样式 - 只有右侧Handle */
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle.vue-flow__node-start .vue-flow__handle {
  right: -7px !important;
  left: auto !important; /* 重置left属性 */
  top: 50% !important;
  transform: translateY(-50%) !important;
  transform-origin: center center !important;
}

.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle.vue-flow__node-start:hover .vue-flow__handle {
  background: #6366f1 !important;
  right: -7px !important;
  left: auto !important; /* 重置left属性 */
  top: 50% !important;
  transform: translateY(-50%) scale(1.2) !important; /* 恢复scale(1.2)效果 */
  transform-origin: center center !important;
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.2) !important;
}

/* 结束节点的Handle样式 - 只有左侧Handle */
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle.vue-flow__node-end .vue-flow__handle,
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle.vue-flow__node-break .vue-flow__handle,
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle.vue-flow__node-continue .vue-flow__handle {
  left: -7px !important;
  right: auto !important; /* 重置right属性 */
  top: 50% !important;
  transform: translateY(-50%) !important;
  transform-origin: center center !important;
}

.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle.vue-flow__node-end:hover .vue-flow__handle,
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle.vue-flow__node-break:hover .vue-flow__handle,
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle.vue-flow__node-continue:hover .vue-flow__handle {
  background: #6366f1 !important;
  left: -7px !important;
  right: auto !important; /* 重置right属性 */
  top: 50% !important;
  transform: translateY(-50%) scale(1.2) !important; /* 恢复scale(1.2)效果 */
  transform-origin: center center !important;
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.2) !important;
}

/* 恢复普通节点的hover效果，与外部节点保持一致 */
.embeddedCustomNodeStyle:hover {
  border: 2px solid #6395fd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 恢复节点hover时的Handle效果，与外部节点保持一致 */
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle:hover .vue-flow__handle {
  background: #6366f1 !important;
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.2) !important;
}

.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle:hover .vue-flow__handle-left {
  left: -7px !important;
  right: auto !important; /* 重置right属性 */
  top: 50% !important;
  transform: translateY(-50%) scale(1.2) !important; /* 恢复scale(1.2)效果 */
  transform-origin: center center !important;
}

.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle:hover .vue-flow__handle-right {
  right: -7px !important;
  left: auto !important; /* 重置left属性 */
  top: 50% !important;
  transform: translateY(-50%) scale(1.2) !important; /* 恢复scale(1.2)效果 */
  transform-origin: center center !important;
}

/* Handle连接状态 - 超高优先级，覆盖外部样式 */
.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle .vue-flow__handle.connecting {
  background: #6366f1 !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3) !important;
  z-index: 15 !important;
}

.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle .vue-flow__handle-left.connecting {
  left: -7px !important;
  right: auto !important; /* 重置right属性 */
  top: 50% !important;
  transform: translateY(-50%) scale(1.2) !important;
  transform-origin: center center !important;
}

.vue-flow-like-canvas .vue-flow__nodes .vue-flow__node.embeddedCustomNodeStyle .vue-flow__handle-right.connecting {
  right: -7px !important;
  left: auto !important; /* 重置left属性 */
  top: 50% !important;
  transform: translateY(-50%) scale(1.2) !important;
  transform-origin: center center !important;
}

.embeddedCustomNodeStyle.node-selected {
  border: 2px solid #6395fd;
}

.embeddedCustomNodeStyle.dragging {
  cursor: grabbing;
  z-index: 1000;
  /* 拖拽时禁用过渡效果，确保位置变化即时生效 */
  transition: none !important;
}

/* 添加拖拽游标支持 */
.embeddedCustomNodeStyle {
  cursor: grab;
}

.embeddedCustomNodeStyle:active {
  cursor: grabbing;
}

.embeddedCustomNodeStyle .nodeContainer {
  position: relative;
  z-index: 1;
}

.embeddedCustomNodeStyle .nodeBox {
  min-height: 80px; /* 原始尺寸 */
  padding: 16px; /* 原始尺寸 */
  display: flex;
  background: white;
  flex-direction: column;
  gap: 8px; /* 原始尺寸 */
  border-radius: 8px; /* 原始尺寸 */
  transition: all 0.2s ease; /* 添加过渡效果 */
}

/* 添加nodeBox的hover效果，与外部CustomNode保持一致 */
.embeddedCustomNodeStyle .nodeBox:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 开始/结束节点的样式 - 与CustomSaENode保持一致 */
.embeddedCustomNodeStyle .nodeSaEBorderBox {
  padding: 12px; /* 原始尺寸 */
  background: white;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 8px; /* 与外部一致 */
}

.embeddedCustomNodeStyle .saEContent .saEHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px; /* 原始尺寸 */
}

.embeddedCustomNodeStyle .saEIcon {
  width: 24px; /* 原始尺寸 */
  height: 24px; /* 原始尺寸 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.embeddedCustomNodeStyle .saEIcon.startIcon {
  background: url('@/assets/svgs/flowStartIcon.svg') 100% 100% no-repeat;
  background-size: contain;
}

.embeddedCustomNodeStyle .saEIcon.endIcon {
  background: url('@/assets/svgs/flowEndIcon.svg') 100% 100% no-repeat;
  background-size: contain;
}

/* continue节点样式：橙色背景，白色图标 */
.embeddedCustomNodeStyle .saEIcon.continueIcon {
  background-color: #f59e0b; /* 橙色背景 */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.embeddedCustomNodeStyle .saEIcon.continueIcon img {
  width: 16px;
  height: 16px;
  color: white;
  filter: brightness(0) invert(1); /* 将图标变为白色 */
}

/* break节点样式：橙色背景，白色图标 */
.embeddedCustomNodeStyle .saEIcon.breakIcon {
  background-color: #f59e0b; /* 橙色背景 */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.embeddedCustomNodeStyle .saEIcon.breakIcon img {
  width: 12px;
  height: 12px;
  color: white;
  filter: brightness(0) invert(1); /* 将图标变为白色 */
}

.embeddedCustomNodeStyle .saEText {
  font-size: 14px; /* 原始尺寸 */
  color: var(--o-text-color-primary);
  font-weight: 500;
}

/* LoopNode内部的所有节点都使用统一的白色背景样式，不应用外部工作流的渐变背景 */

/* 嵌入式Choice节点的样式适配 */
.vue-flow-like-canvas .embedded-choice-node {
  /* 确保Choice组件在嵌入环境中正常显示 */
  width: auto;
  height: auto;
  position: static;
  transform: none;
}

.embeddedCustomNodeStyle .title {
  display: flex;
  height: 24px; /* 原始尺寸 */
  font-size: 16px; /* 原始尺寸 */
  color: var(--o-text-color-primary);
  border: 2px solid transparent;
  align-items: center;
  gap: 8px; /* 原始尺寸 */
}

.embeddedCustomNodeStyle .iconLabel {
  display: flex;
  gap: 8px; /* 原始尺寸 */
  align-items: center;
}

.embeddedCustomNodeStyle .iconStyle {
  width: 24px; /* 原始尺寸 */
  height: 24px; /* 原始尺寸 */
  background: linear-gradient(
    120deg,
    rgba(109, 117, 250, 0.15),
    rgba(90, 179, 255, 0.15)
  );
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.embeddedCustomNodeStyle .label {
  max-width: 64px; /* 原始尺寸 */
  flex: 1;
  height: 24px; /* 原始尺寸 */
  line-height: 24px; /* 原始尺寸 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.embeddedCustomNodeStyle .nodeFooter {
  padding: 0 12px 8px; /* 原始尺寸 */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.embeddedCustomNodeStyle .nodeIdText {
  font-size: 10px; /* 原始尺寸 */
  color: #8d98aa;
}

/* 复制按钮样式 - 与外部CustomNode保持一致 */
.embeddedCustomNodeStyle .copydocument {
  font-size: 12px;
  color: #8d98aa;
  cursor: pointer;
  transition: color 0.2s ease;
  margin-left: 8px;
}

.embeddedCustomNodeStyle .copydocument:hover {
  color: #6395fd;
}

.embeddedCustomNodeStyle .nodeDesc {
  font-size: 12px; /* 原始尺寸 */
  color: var(--o-text-color-tertiary);
  line-height: 1.4;
  margin-top: 4px; /* 原始尺寸 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.embeddedCustomNodeStyle .editHint {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  padding: 2px;
  color: #6366f1;
}

.embeddedCustomNodeStyle:hover .editHint {
  opacity: 1;
}

/* 子节点删除按钮样式 - 与外部CustomNode删除按钮保持一致 */
.subNodeDeleteCardWrapper {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.embeddedCustomNodeStyle:hover .subNodeDeleteCardWrapper {
  opacity: 1;
}

.subNodeDeleteCard {
  display: flex;
  align-items: center;
  justify-content: center;
}

.subNodeDeleteButton {
  border: none;
  background-color: #f56c6c;
  color: #ffffff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  transition: 
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease;
  transform: scaleX(1) translateY(0);
  transform-origin: center;
  outline: none;
  text-decoration: none;
  box-sizing: border-box;
}

.subNodeDeleteButton:hover {
  background-color: #f56c6c;
  color: #ffffff;
  width: 88px;
  height: 32px;
  border-radius: 16px;
  padding: 0 12px;
  transform: scaleX(1.05) translateY(-1px);
  box-shadow: 0 6px 20px rgba(245, 108, 108, 0.5);
}

.subNodeDeleteButton .delete-icon {
  font-size: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.subNodeDeleteButton:hover .delete-icon {
  transform: scale(0.9);
}

.subNodeDeleteButton .delete-text {
  font-size: 12px;
  margin-left: 6px;
  opacity: 0;
  transform: translateX(-8px) scale(0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.subNodeDeleteButton:hover .delete-text {
  opacity: 1;
  transform: translateX(0) scale(1);
}

/* 警告图标样式 - 与外部工作流保持一致 */
.embeddedCustomNodeStyle .warnTiangleIcon {
  font-size: 20px; /* 原始尺寸 */
  width: 24px; /* 原始尺寸 */
  height: 24px; /* 原始尺寸 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.embeddedCustomNodeStyle .warnTiangleIcon svg path:first-child {
  fill: red;
}

/* 旧的Handle样式已移除，避免与新样式冲突 */

/* 移除旧的节点样式 */

.resizeHandle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  /* background: white; */
  /* color: white; */
  border-radius: 0 0 6px 0;
  cursor: se-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.resizeHandle:hover {
  opacity: 1;
  background: #5b5fc7;
}

.resizeHandle.disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.resizeHandle:active {
  background: #4c51bf;
}

/* 删除按钮样式 - 复用CustomNode的样式 */
.deleteCardWrapper {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
}

.deleteCard {
  display: flex;
  align-items: center;
  justify-content: center;
}

.deleteButton {
  border: none;
  background-color: #f56c6c;
  color: #ffffff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  transition: 
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease;
  transform: scaleX(1) translateY(0);
  transform-origin: center;
  outline: none;
  text-decoration: none;
  box-sizing: border-box;
}

.deleteButton:hover {
  background-color: #f56c6c;
  color: #ffffff;
  width: 88px;
  height: 32px;
  border-radius: 16px;
  padding: 0 12px;
  transform: scaleX(1.05) translateY(-1px);
  box-shadow: 0 6px 20px rgba(245, 108, 108, 0.5);
}

.delete-icon {
  font-size: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.deleteButton:hover .delete-icon {
  transform: scale(0.9);
}

.delete-text {
  font-size: 12px;
  margin-left: 6px;
  opacity: 0;
  transform: translateX(-8px) scale(0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.deleteButton:hover .delete-text {
  opacity: 1;
  transform: translateX(0) scale(1);
}

/* 只在hover整个节点时显示删除卡片 */
.loopNodeStyle .deleteCardWrapper {
  opacity: 0;
  transition: opacity 0.2s;
}

.loopNodeStyle:hover .deleteCardWrapper {
  opacity: 1;
}

/* Handle样式覆盖 - 与ChoiceBranchNode保持一致 */
.loopNodeStyle :deep(.vue-flow__handle-left) {
  background: #c3cedf;
  border: 2px solid #ffffff;
  width: 12px;
  height: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: all 0.2s ease;
}

.loopNodeStyle :deep(.vue-flow__handle-left.isConnecting) {
  background: #6395fd;
  width: 14px;
  height: 14px;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
}

.loopNodeStyle :deep(.vue-flow__handle-left:hover) {
  background: #6395fd;
  width: 14px;
  height: 14px;
  box-shadow: 0 2px 8px rgba(99, 149, 253, 0.3);
}

.loopNodeStyle :deep(.vue-flow__handle-right) {
  background: #c3cedf;
  border: 2px solid #ffffff;
  width: 12px;
  height: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: all 0.2s ease;
}

.loopNodeStyle :deep(.vue-flow__handle-right.isConnecting) {
  background: #6395fd;
  width: 14px;
  height: 14px;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
}

.loopNodeStyle :deep(.vue-flow__handle-right:hover) {
  background: #6395fd;
  width: 14px;
  height: 14px;
  box-shadow: 0 2px 8px rgba(99, 149, 253, 0.3);
}

/* 深色主题支持 */
.dark .loopNodeStyle {
  background: #1f2937;
  border-color: #374151;
}

.dark .title .label {
  color: #f3f4f6;
}

.dark .title .iconStyle {
  color: #a5b4fc;
}

.dark .loopInfo {
  background: #374151;
  border-color: #4b5563;
}

.dark .infoLabel {
  color: #9ca3af;
}

.dark .infoValue {
  background: #4b5563;
  border-color: #6b7280;
  color: #f3f4f6;
}

.dark .embeddedFlowCanvas {
  background: #374151;
  border-color: #4b5563;
}

/* 深色主题下的Handle样式 */
.dark .loopNodeStyle :deep(.vue-flow__handle-left),
.dark .loopNodeStyle :deep(.vue-flow__handle-right) {
  background: #6395fd;
  border-color: #374151;
}

.dark .loopNodeStyle :deep(.vue-flow__handle-left.isConnecting),
.dark .loopNodeStyle :deep(.vue-flow__handle-right.isConnecting) {
  background: #4f46e5;
  border-color: #374151;
}

/* 禁用Choice节点内部的nodeBox点击事件，让容器统一处理 */
.choice-node-no-click .nodeBox {
  pointer-events: none;
}

/* 但需要保留删除按钮的点击事件 */
.choice-node-no-click .subNodeDeleteButton {
  pointer-events: auto;
}

/* 保留Handle的事件，用于连接 */
.choice-node-no-click .vue-flow__handle {
  pointer-events: auto;
}

/* +按钮容器 - 独立定位，远离Handle */
.handle-plus-button {
  position: absolute;
  width: 40px; /* 扩大触发区域 */
  height: 40px; /* 扩大触发区域 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 15;
  pointer-events: auto;
  transition: all 0.2s ease;
  /* 调试时可以启用这个边框来查看触发区域 */
  /* border: 1px dashed rgba(99, 149, 253, 0.3); */
}



/* Source handle的+按钮位置 - 在节点右侧，触发区域延伸到节点边缘 */
.source-plus {
  right: -25px; /* 稍微靠近节点，扩大的触发区域会延伸到节点 */
  top: 50%;
  transform: translate(50%, -50%); /* 居中对齐，让触发区域更合理 */
}

/* +图标样式 */
.handle-plus-button .plus-icon {
  font-size: 11px;
  color: #6395fd;
  background: #ffffff;
  border: 1px solid #6395fd;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(99, 149, 253, 0.4);
  transition: all 0.2s ease;
  opacity: 0.9;
}

.handle-plus-button .plus-icon:hover {
  background: #6395fd;
  color: #ffffff;
  transform: scale(1.15);
  box-shadow: 0 5px 15px rgba(99, 149, 253, 0.6);
  opacity: 1;
}

/* 仅在节点悬停时显示+按钮 */
.loopNodeStyle .handle-plus-button {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0.5s; /* 延迟隐藏 */
}

.loopNodeStyle:hover .handle-plus-button,
.loopNodeStyle .handle-plus-button:hover {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0s; /* 立即显示 */
}

/* 保留分支卡片上的handle点击事件 */
.choice-node-no-click .branchHandleContainer {
  pointer-events: auto;
}

/* 子节点+按钮容器 - 与CustomNode保持一致的样式 */
.sub-handle-plus-button {
  position: absolute;
  width: 40px; /* 扩大触发区域 */
  height: 40px; /* 扩大触发区域 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 15;
  pointer-events: auto;
  transition: all 0.2s ease;
  /* 调试时可以启用这个边框来查看触发区域 */
  /* border: 1px dashed rgba(99, 149, 253, 0.3); */
}

/* 子节点Source handle的+按钮位置 - 在节点右侧，触发区域延伸到节点边缘 */
.sub-source-plus {
  right: -25px; /* 稍微靠近节点，扩大的触发区域会延伸到节点 */
  top: 50%;
  transform: translate(50%, -50%); /* 居中对齐，让触发区域更合理 */
}

/* 子节点+图标样式 - 与CustomNode保持一致 */
.sub-handle-plus-button .plus-icon {
  font-size: 11px;
  color: #6395fd;
  background: #ffffff;
  border: 1px solid #6395fd;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(99, 149, 253, 0.4);
  transition: all 0.2s ease;
  opacity: 0.9;
}

.sub-handle-plus-button .plus-icon:hover {
  background: #6395fd;
  color: #ffffff;
  transform: scale(1.15);
  box-shadow: 0 5px 15px rgba(99, 149, 253, 0.6);
  opacity: 1;
}

/* 仅在子节点悬停时显示+按钮 */
.embeddedCustomNodeStyle .sub-handle-plus-button {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0.5s; /* 延迟隐藏 */
}

.embeddedCustomNodeStyle:hover .sub-handle-plus-button,
.embeddedCustomNodeStyle .sub-handle-plus-button:hover {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.2s ease 0s, visibility 0s ease 0s; /* 立即显示 */
}

/* 确保Choice节点的+按钮事件可以正常工作 */
.choice-node-no-click .sub-handle-plus-button {
  pointer-events: auto;
}

/* Choice节点样式 - 在LoopNode内部使用 */
.choiceBranchNodeStyle {
  position: relative;
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 320px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #6395fd;
    box-shadow: 0 4px 12px rgba(99, 149, 253, 0.2);
  }

  &.node-selected {
    border-color: #6395fd;
    box-shadow: 0 0 0 2px rgba(99, 149, 253, 0.2);
  }

  .title {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    
    .iconLabel {
      display: flex;
      align-items: center;
    }

    .iconStyle {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6395fd;
      
      &.choiceIcon {
        background: rgba(99, 149, 253, 0.1);
        border-radius: 4px;
      }
    }

    .label {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: #24292e;
    }
  }

  .branchList {
    .branchItem {
      position: relative;
      margin-bottom: 2px;
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 6px;
      transition: all 0.2s ease;
      overflow: visible;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        border-color: #6395fd;
        box-shadow: 0 1px 4px rgba(99, 149, 253, 0.1);
      }

      .branchHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px 4px 12px;
        
        .caseLabel {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .branchTypeLabel {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          
          &.if-label {
            background: #3b82f6;
            color: #ffffff;
          }
          
          &.else-label {
            background: #f59e0b;
            color: #ffffff;
          }
        }
      }

      .branchContent {
        padding: 0 12px 8px 12px;
        margin-right: 20px;
      }

      .branchCondition {
        font-size: 12px;
        color: #374151;
        line-height: 1.4;
        word-break: break-word;
        
        /* 变量标签样式 */
        :deep(.variable-tag) {
          display: inline-block;
          padding: 2px 6px;
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: #1565c0;
          margin: 0 2px;
        }
        
        /* 操作符文本样式 */
        :deep(.operator-text) {
          display: inline-block;
          padding: 1px 4px;
          font-weight: 600;
          color: #5c6ac4;
          margin: 0 4px;
        }
        
        /* 逻辑连接符样式 */
        :deep(.logic-text) {
          display: inline-block;
          padding: 1px 4px;
          font-weight: 600;
          color: #ed6c02;
          margin: 0 4px;
        }
        
        /* 值文本样式 */
        :deep(.value-text) {
          display: inline-block;
          padding: 1px 4px;
          font-weight: 500;
          margin: 0 2px;
          
          &.string-value {
            color: #2e7d32;
            font-style: italic;
          }
          
          &.number-value {
            color: #d32f2f;
            font-weight: 600;
          }
          
          &.bool-value {
            color: #7b1fa2;
            font-weight: 600;
          }
          
          &.list-value,
          &.dict-value {
            color: #f57c00;
            font-family: monospace;
          }
        }
        
        /* 无条件状态样式 */
        :deep(.no-condition) {
          color: #9e9e9e;
          font-style: italic;
        }
        
        /* 默认分支文本样式 */
        .defaultText {
          color: #6b7280;
          font-style: italic;
        }
      }

      .sourceHandle {
        position: absolute;
        top: 50%;
        right: -6px;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        background: #c3cedf;
        border: 2px solid #ffffff;
        border-radius: 50%;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 10;
        cursor: pointer;
        
        &.connecting {
          background: #6395fd;
          width: 14px;
          height: 14px;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
          right: -7px;
        }

        &:hover {
          background: #6395fd;
          width: 14px;
          height: 14px;
          right: -7px;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
        }
      }

      /* 每个分支的+按钮 */
      .branch-plus-button {
        position: absolute;
        top: 50%;
        right: -25px;
        transform: translate(50%, -50%);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 15;
        pointer-events: auto;
        transition: all 0.2s ease;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease 0s, visibility 0s ease 0.5s;

        .plus-icon {
          font-size: 11px;
          color: #6395fd;
          background: #ffffff;
          border: 1px solid #6395fd;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(99, 149, 253, 0.4);
          transition: all 0.2s ease;
          opacity: 0.9;

          &:hover {
            background: #6395fd;
            color: #ffffff;
            transform: scale(1.15);
            box-shadow: 0 5px 15px rgba(99, 149, 253, 0.6);
            opacity: 1;
          }
        }
      }

      /* 仅在Choice节点悬停时显示+按钮 */
      &:hover .branch-plus-button,
      .branch-plus-button:hover {
        opacity: 1;
        visibility: visible;
        transition: opacity 0.2s ease 0s, visibility 0s ease 0s;
      }
    }
  }

  .emptyBranches {
    padding: 20px;
    text-align: center;
    border: 2px dashed #e1e4e8;
    border-radius: 6px;
    background: #f9fafb;
    
    .emptyText {
      color: #6b7280;
      font-size: 14px;
      font-style: italic;
    }
     }

   /* Choice节点的+按钮样式 */
   .choice-plus {
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
  }
}

/* VariableAssign 节点样式 - 与外部 VariableAssignNode 保持一致 */
.embeddedCustomNodeStyle .nodeBox .operations-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  
  .operation-item {
    background: rgba(64, 158, 255, 0.1);
    border: 1px solid rgba(64, 158, 255, 0.2);
    border-radius: 4px;
    padding: 6px 8px;
    
    .operation-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      
      .variable-name {
        font-size: 11px;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        color: #409eff;
        font-weight: 500;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .operation-type {
        font-size: 10px;
        color: #606266;
        background: rgba(255, 255, 255, 0.8);
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
        flex-shrink: 0;
      }
    }
  }
}

.embeddedCustomNodeStyle .nodeBox .no-operations {
  text-align: center;
  padding: 20px 0;
  margin-top: 12px;
  
  .placeholder-text {
    font-size: 12px;
    color: #909399;
    font-style: italic;
  }
}

/* VariableAssign 节点的特殊容器样式 */
.embeddedCustomNodeStyle.vue-flow__node-VariableAssign {
  /* 继承基本的嵌入式节点样式，确保与其他节点保持一致 */
  width: 320px;
  height: fit-content;
  border-radius: 4px;
  background: white;
  border: 2px solid transparent;
  position: relative;
  border-radius: 10px;
  background-clip: padding-box;
  transition: border-color 0.2s ease;
  cursor: pointer;
}
</style>
