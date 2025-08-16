<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ElDrawer, ElButton, ElInput, ElForm, ElFormItem, ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { v4 as uuidv4 } from 'uuid';
import VariableAssignCard from './VariableAssignCard.vue';

// 类型定义
interface VariableOperation {
  id: string;
  variable_name: string;
  operation: string;
  value: any;
  variable_type: string;
  is_value_reference: boolean;
}

interface NodeData {
  name: string;
  description: string;
  callId: string;
  parameters: {
    input_parameters: {
      operations: VariableOperation[];
    };
    output_parameters?: Record<string, any>;
  };
}

interface Props {
  visible: boolean;
  nodeData: NodeData;
  nodeId: string;
  flowId: string;
  isSubFlowNode?: boolean;
  loopNodeId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isSubFlowNode: false,
  loopNodeId: '',
});

const emit = defineEmits(['update:visible', 'saveNode']);

// 本地数据
const localNodeData = ref<NodeData>({
  name: '',
  description: '',
  callId: 'VariableAssign',
  parameters: {
    input_parameters: {
      operations: []
    },
    output_parameters: {}
  }
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入节点名称', trigger: 'blur' }
  ]
};

// 初始化默认操作
const createDefaultOperation = (): VariableOperation => ({
  id: uuidv4(),
  variable_name: '',
  operation: 'overwrite',
  value: '',
  variable_type: 'string',
  is_value_reference: false
});

// 监听props变化，初始化本地数据
watch(
  () => [props.visible, props.nodeData],
  ([visible, nodeData]) => {
    if (visible && nodeData && typeof nodeData === 'object') {
      localNodeData.value = {
        name: nodeData.name || '变量赋值',
        description: nodeData.description || '',
        callId: nodeData.callId || 'VariableAssign',
        parameters: {
          input_parameters: {
            operations: nodeData.parameters?.input_parameters?.operations || []
          },
          output_parameters: nodeData.parameters?.output_parameters || {}
        }
      };
      
      // 如果没有操作，添加一个默认操作
      if (localNodeData.value.parameters.input_parameters.operations.length === 0) {
        addOperation();
      }
    }
  },
  { immediate: true, deep: true }
);

// 获取操作列表
const operations = computed(() => {
  return localNodeData.value.parameters.input_parameters.operations;
});

// 添加操作
const addOperation = () => {
  const newOperation = createDefaultOperation();
  localNodeData.value.parameters.input_parameters.operations.push(newOperation);
};

// 删除操作
const removeOperation = (operationIndex: number) => {
  if (operations.value.length <= 1) {
    ElMessage.warning('至少需要保留一个变量操作');
    return;
  }
  
  localNodeData.value.parameters.input_parameters.operations.splice(operationIndex, 1);
};

// 更新操作
const updateOperation = (operationIndex: number, updatedOperation: VariableOperation) => {
  localNodeData.value.parameters.input_parameters.operations[operationIndex] = updatedOperation;
};

// 验证数据
const validateData = (): boolean => {
  // 检查节点名称
  if (!localNodeData.value.name.trim()) {
    ElMessage.error('请输入节点名称');
    return false;
  }
  
  // 检查操作配置
  for (let i = 0; i < operations.value.length; i++) {
    const operation = operations.value[i];
    
    if (!operation.variable_name.trim()) {
      ElMessage.error(`第 ${i + 1} 个操作：请选择变量`);
      return false;
    }
    
    if (!operation.operation) {
      ElMessage.error(`第 ${i + 1} 个操作：请选择操作类型`);
      return false;
    }
    
    // 检查需要值的操作是否提供了值
    const operationsWithoutValue = ['clear', 'sqrt', 'pop_first', 'pop_last'];
    if (!operationsWithoutValue.includes(operation.operation) && !operation.value) {
      ElMessage.error(`第 ${i + 1} 个操作：请输入操作值`);
      return false;
    }
  }
  
  return true;
};

// 保存节点
const saveNode = () => {
  if (!validateData()) {
    return;
  }
  
  // 构建保存的数据结构
  const saveData = {
    name: localNodeData.value.name,
    description: localNodeData.value.description,
    callId: 'VariableAssign',
    parameters: {
      input_parameters: {
        operations: localNodeData.value.parameters.input_parameters.operations.map(op => ({
          variable_name: op.variable_name,
          operation: op.operation,
          value: op.value,
          variable_type: op.variable_type,
          is_value_reference: op.is_value_reference
        }))
      },
      output_parameters: {} // 变量赋值节点不需要输出参数
    }
  };
  
  emit('saveNode', saveData, props.nodeId);
};

// 关闭抽屉
const closeDrawer = () => {
  emit('update:visible', false);
};

// 计算conversationId（简化处理）
const conversationId = computed(() => {
  return ''; // 在实际项目中应该从适当的地方获取
});
</script>

<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="closeDrawer"
    title="变量赋值节点配置"
    :size="800"
    :before-close="closeDrawer"
  >
    <div class="variable-assign-drawer">
      <!-- 基本信息 -->
      <el-form
        :model="localNodeData"
        :rules="rules"
        label-width="80px"
        class="node-form"
      >
        <el-form-item label="节点名称" prop="name">
          <el-input
            v-model="localNodeData.name"
            placeholder="请输入节点名称"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="节点描述">
          <el-input
            v-model="localNodeData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入节点描述（可选）"
            clearable
          />
        </el-form-item>
      </el-form>

      <!-- 变量操作配置 -->
      <div class="operations-section">
        <div class="section-header">
          <h3 class="section-title">变量操作</h3>
          <el-button
            type="primary"
            size="small"
            :icon="Plus"
            @click="addOperation"
          >
            添加操作
          </el-button>
        </div>

        <div class="operations-list">
          <VariableAssignCard
            v-for="(operation, index) in operations"
            :key="operation.id"
            :operation="operation"
            :operation-index="index"
            :flow-id="flowId"
            :conversation-id="conversationId"
            :current-step-id="nodeId"
            :show-operation-delete="operations.length > 1"
            :self-variables="[]"
            self-scope-label=""
            @remove-operation="removeOperation"
            @update-operation="updateOperation"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="drawer-footer">
        <el-button @click="closeDrawer">取消</el-button>
        <el-button type="primary" @click="saveNode">保存</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.variable-assign-drawer {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .node-form {
    margin-bottom: 24px;
    
    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #303133;
    }
  }
  
  .operations-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e4e7ed;
      
      .section-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }
    
    .operations-list {
      flex: 1;
      overflow-y: auto;
      padding-right: 4px;
      
      // 自定义滚动条
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
        
        &:hover {
          background: #a8a8a8;
        }
      }
    }
  }
  
  .drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
    margin-top: 20px;
  }
}

// 深色主题支持
.dark {
  .variable-assign-drawer {
    .node-form {
      :deep(.el-form-item__label) {
        color: #e5e7eb;
      }
    }
    
    .operations-section {
      .section-header {
        border-bottom-color: #4b5563;
        
        .section-title {
          color: #e5e7eb;
        }
      }
      
      .operations-list {
        &::-webkit-scrollbar-track {
          background: #374151;
        }
        
        &::-webkit-scrollbar-thumb {
          background: #6b7280;
          
          &:hover {
            background: #9ca3af;
          }
        }
      }
    }
    
    .drawer-footer {
      border-top-color: #4b5563;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .variable-assign-drawer {
    padding: 16px;
    
    .operations-section {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        
        .section-title {
          font-size: 14px;
        }
      }
    }
    
    .drawer-footer {
      flex-direction: column;
      
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
