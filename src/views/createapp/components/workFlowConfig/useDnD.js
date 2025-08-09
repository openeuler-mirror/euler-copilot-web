import { useVueFlow } from '@vue-flow/core';
import { ref, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';

/**
 * @returns {string} - A unique id.
 */
function getId() {
  return uuidv4();
}

/**
 * 清洗和标准化节点数据，确保不同节点类型有正确的parameters结构
 * @param {Object} nodeData - 原始节点数据
 * @param {string} nodeId - 节点ID
 * @returns {Object} - 清洗后的节点数据
 */
function sanitizeNodeData(nodeData, nodeId) {
  let cleanNodeData = { ...nodeData };
  
  // 如果是Code节点，确保parameters结构正确
  if (cleanNodeData.callId === 'Code' || cleanNodeData.type === 'Code') {
    // 清洗parameters，只保留input_parameters和output_parameters
    cleanNodeData.parameters = {
      input_parameters: {},  // 默认为空对象
      output_parameters: {   // 修复：确保是正确的变量映射格式
        result: {
          type: 'string',
          description: ''
        }
      }
    };
    
    // 确保代码节点的其他配置属性在正确位置
    cleanNodeData = {
      ...cleanNodeData,
      nodeId: 'Code',  // 设置正确的nodeId
      // 确保这些字段在节点数据的根级别，而不是在parameters中
      code: cleanNodeData.code || '',
      codeType: cleanNodeData.codeType || 'python',
      securityLevel: cleanNodeData.securityLevel || 'low',
      timeoutSeconds: cleanNodeData.timeoutSeconds || 30,
      memoryLimitMb: cleanNodeData.memoryLimitMb || 128,
      cpuLimit: cleanNodeData.cpuLimit || 0.5,
    };
  } else if (cleanNodeData.callId === 'Choice') {
    // 如果是Choice节点，保留原有的分支结构但重新生成branch_id
    const originalChoices = cleanNodeData.parameters?.input_parameters?.choices || [];
    
    // 如果原始数据有choices，则基于原始数据重新生成branch_id
    if (originalChoices.length > 0) {
      // 检查是否已有默认分支
      let hasDefaultBranch = originalChoices.some(choice => choice.is_default === true);
      
      // 如果没有默认分支，将最后一个分支设为默认分支
      if (!hasDefaultBranch && originalChoices.length > 0) {
        console.warn('[Choice节点] 原始数据没有默认分支，将最后一个分支设为默认分支');
        originalChoices[originalChoices.length - 1].is_default = true;
        hasDefaultBranch = true;
      }
      
      const newChoices = originalChoices.map((choice, index) => {
        const newChoice = { ...choice };
        
        // 重新生成branch_id，避免使用后端的死数据
        if (choice.is_default) {
          newChoice.branch_id = `else_${nodeId}`;
          newChoice.name = newChoice.name || 'ELSE';
        } else {
          newChoice.branch_id = `if_${nodeId}_${index}`;
          newChoice.name = newChoice.name || (index === 0 ? 'IF' : `ELIF${index}`);
        }
        
        // 重新生成条件ID，避免冲突
        if (newChoice.conditions && Array.isArray(newChoice.conditions)) {
          newChoice.conditions = newChoice.conditions.map((condition, condIndex) => ({
            ...condition,
            id: condition.id || `condition_${nodeId}_${index}_${condIndex}`
          }));
        } else {
          // 如果条件为空，为非默认分支创建一个空条件
          if (!newChoice.is_default) {
            newChoice.conditions = [
              {
                id: `condition_${nodeId}_${index}_0`,
                left: {
                  type: 'reference',
                  value: '',
                },
                right: {
                  type: 'string',
                  value: '',
                },
                operate: 'string_equal',
                dataType: 'string',
                isRightReference: false,
              }
            ];
          } else {
            newChoice.conditions = [];
          }
        }
        
        return newChoice;
      });
      
      // 如果仍然没有默认分支，添加一个ELSE分支
      if (!newChoices.some(choice => choice.is_default === true)) {
        console.warn('[Choice节点] 处理后仍然没有默认分支，添加ELSE分支');
        newChoices.push({
          branch_id: `else_${nodeId}`,
          name: 'ELSE',
          is_default: true,
          conditions: [],
          logic: 'and'
        });
      }
      
      cleanNodeData.parameters = {
        input_parameters: { 
          to_user: cleanNodeData.parameters?.input_parameters?.to_user || false,
          enable_variable_resolution: cleanNodeData.parameters?.input_parameters?.enable_variable_resolution !== false,
          choices: newChoices
        },
        output_parameters: cleanNodeData.parameters?.output_parameters || {
          branch_id: {
            type: 'string',
            description: '选中的分支ID'
          }
        }
      };
    } else {
      // 如果没有原始choices数据，则创建默认的IF和ELSE分支
      cleanNodeData.parameters = {
        input_parameters: { 
          to_user: false,
          enable_variable_resolution: true,
          choices: [
            {
              branch_id: `if_${nodeId}`,
              name: 'IF',
              is_default: false,
              conditions: [
                {
                  id: `condition_${nodeId}`,
                  left: {
                    type: 'reference',
                    value: '',
                  },
                  right: {
                    type: 'string',
                    value: '',
                  },
                  operate: 'string_equal',
                  dataType: 'string',
                  isRightReference: false,
                }
              ],
              logic: 'and'
            },
            {
              branch_id: `else_${nodeId}`,
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
      };
    }
  } else if (cleanNodeData.callId === 'DirectReply') {
    // 如果是DirectReply节点，确保parameters结构正确且内容为空
    cleanNodeData.parameters = {
      input_parameters: {
        answer: ''  // 确保新建的DirectReply节点内容为空
      },
      output_parameters: {}
    };
  } else if (cleanNodeData.callId === 'Loop') {
    // 如果是Loop节点，确保parameters结构正确
    cleanNodeData.parameters = cleanNodeData.parameters || {
      input_parameters: {
        variables: {},
        stop_condition: {
          logic: 'and',
          conditions: []
        },
        max_iteration: 10,
        sub_flow_id: '' // 初始为空，保存时会被填充
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
    };
  } else if (cleanNodeData.callId === 'VariableAssign') {
    // 如果是VariableAssign节点，设置正确的parameters结构
    cleanNodeData.parameters = {
      input_parameters: {
        operations: [] // VariableAssign节点的operations数组
      },
      output_parameters: {} // VariableAssign节点不需要输出参数
    };
  } else {
    // 对于所有其他节点类型（LLM、RAG、API、SQL等），使用API返回的原始parameters
    cleanNodeData.parameters = cleanNodeData.parameters || {
      input_parameters: {},
      output_parameters: {}
    };
  }
  
  return cleanNodeData;
}

/**
 * 创建新节点的通用函数
 * @param {Object} nodeMetaData - 节点元数据
 * @param {Object} position - 节点位置
 * @param {string} customNodeId - 自定义节点ID（可选）
 * @returns {Object} - 新创建的节点对象
 */
function createNewNode(nodeMetaData, position, customNodeId = null) {
  const nodeId = customNodeId || getId();
  const cleanNodeData = sanitizeNodeData(nodeMetaData, nodeId);
  
  return {
    id: nodeId,
    type: nodeMetaData.callId === 'Choice' ? 'Choice' : 
          nodeMetaData.callId === 'Loop' ? 'Loop' :
          nodeMetaData.callId === 'VariableAssign' ? 'VariableAssign' : 'custom',
    position,
    data: {
      name: cleanNodeData.name,
      description: cleanNodeData.description,
      nodeId: cleanNodeData.nodeId,
      callId: cleanNodeData.callId,
      serviceId: cleanNodeData.serviceId || 'default',
      parameters: cleanNodeData.parameters,
      // 对于Code节点，需要额外的字段
      ...(cleanNodeData.callId === 'Code' && {
        code: cleanNodeData.code,
        codeType: cleanNodeData.codeType,
        securityLevel: cleanNodeData.securityLevel,
        timeoutSeconds: cleanNodeData.timeoutSeconds,
        memoryLimitMb: cleanNodeData.memoryLimitMb,
        cpuLimit: cleanNodeData.cpuLimit
      })
    },
    deletable: true
  };
}

/**
 * In a real world scenario you'd want to avoid creating refs in a global scope like this as they might not be cleaned up properly.
 * @type {{draggedType: Ref<string|null>, isDragOver: Ref<boolean>, isDragging: Ref<boolean>}}
 */
const state = {
  /**
   * The type of the node being dragged.
   */
  draggedType: ref(null),
  isDragOver: ref(false),
  isDragging: ref(false),
  nodeData: ref({}),
};

export default function useDragAndDrop() {
  const { draggedType, isDragOver, isDragging, nodeData } = state;

  const {
    addNodes,
    screenToFlowCoordinate,
    onNodesInitialized,
    updateNode,
    addEdges,
  } = useVueFlow();

  watch(isDragging, (dragging) => {
    document.body.style.userSelect = dragging ? 'none' : '';
  });

  function onDragStart(event, type, info) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/vueflow', type);
      event.dataTransfer.effectAllowed = 'move';
    }
    
    draggedType.value = info?.callId === 'Choice' ? 'Choice' : info?.callId === 'Loop' ? 'Loop' : 'custom';
    isDragging.value = true;
    nodeData.value = { ...info };

    document.addEventListener('drop', onDragEnd);
  }

  /**
   * Handles the drag over event.
   *
   * @param {DragEvent} event
   */
  function onDragOver(event) {
    event.preventDefault();

    if (draggedType.value) {
      isDragOver.value = true;

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }

  function onDragLeave() {
    isDragOver.value = false;
  }

  function onDragEnd() {
    isDragging.value = false;
    isDragOver.value = false;
    draggedType.value = null;
    document.removeEventListener('drop', onDragEnd);
  }

  /**
   * Handles the drop event.
   *
   * @param {DragEvent} event
   */
  function onDrop(event) {
    const position = screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode = createNewNode(nodeData.value, position);

    /**
     * Align node position after drop, so it's centered to the mouse
     *
     * We can hook into events even in a callback, and we can remove the event listener after it's been called.
     */
    const { off } = onNodesInitialized(() => {
      const vueFlowContainer = document.querySelector('.my-diagram-class');
      updateNode(newNode.id, (node) => ({
        position: {
          x: node.position.x - node.dimensions.width / 2,
          y: node.position.y - node.dimensions.height / 2,
        },
      }));

      off();
    });
    addNodes(newNode);
  }

  return {
    draggedType,
    isDragOver,
    isDragging,
    onDragStart,
    onDragLeave,
    onDragOver,
    onDrop,
  };
}

// 导出公共函数供其他文件使用
export { getId, sanitizeNodeData, createNewNode };
