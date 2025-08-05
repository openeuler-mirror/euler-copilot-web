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

    const nodeId = getId();

    // 清洗节点数据，确保不同节点类型有正确的parameters结构
    let cleanNodeData = { ...nodeData.value };
    
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
      // 如果是Choice节点，确保parameters结构正确，包含一个默认的IF分支和ELSE分支
      cleanNodeData.parameters = {
        input_parameters: { 
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
        output_parameters: {}
      };
    } else {
      // 对于所有其他节点类型（LLM、RAG、API、SQL等），保留API返回的原始parameters或使用空结构
      cleanNodeData.parameters = cleanNodeData.parameters || {
        input_parameters: {},
        output_parameters: {}
      };
    }

    const newNode = {
      id: nodeId,
      type: draggedType.value,
      position,
      class: 'round-start',
      data: cleanNodeData,
    };

    /**
     * Align node position after drop, so it's centered to the mouse
     *
     * We can hook into events even in a callback, and we can remove the event listener after it's been called.
     */
    const { off } = onNodesInitialized(() => {
      const vueFlowContainer = document.querySelector('.my-diagram-class');
      updateNode(nodeId, (node) => ({
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
