<template>
  <div class="variable-insert-dropdown">
    <div class="dropdown-header">
      <span class="dropdown-title">选择要插入的变量</span>
      <el-input 
        v-model="searchText"
        placeholder="搜索变量..."
        size="small"
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><IconSearch /></el-icon>
        </template>
      </el-input>
    </div>
    
    <div class="dropdown-content">
      <div 
        v-for="group in groupedVariables" 
        :key="group.scope"
        class="variable-group"
        v-loading="loading"
      >
        <div class="group-header">
          <span class="group-title">{{ getScopeLabel(group.scope) }}</span>
          <span class="group-count">{{ group.variables.length }}</span>
        </div>
        
        <div class="group-variables">
          <div 
            v-for="variable in group.variables" 
            :key="`${group.scope}-${variable.name}`"
            class="variable-item"
            @mousedown.prevent
            @click.stop="() => $emit('variable-selected', variable)"
          >
            <div class="variable-info">
              <div class="variable-name">{{ getVariableDisplayName(variable) }}</div>
              <div class="variable-description" v-if="variable.description">
                {{ variable.description }}
              </div>
            </div>
            <div class="variable-type-tag">
              {{ getVariableTypeDisplay(variable.var_type) }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="groupedVariables.length === 0 && !loading" class="empty-state">
        <div class="empty-text">{{ searchText ? '未找到匹配的变量' : '暂无可用变量' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { ElInput, ElIcon } from 'element-plus'
import { IconSearch } from '@computing/opendesign-icons'
import { useVariables, type Variable } from '@/components/useVariables'

interface Props {
  supportedScopes?: string[]
  flowId?: string
  conversationId?: string
}

const props = withDefaults(defineProps<Props>(), {
  supportedScopes: () => ['conversation', 'system', 'env', 'user']
})

const emit = defineEmits<{
  'variable-selected': [variable: Variable]
  'variables-loaded': [variables: Variable[]]
}>()

// 使用变量管理composable
const {
  loading,
  searchText,
  variables,
  groupedVariables,
  getVariableDisplayName,
  getVariableTypeDisplay,
  getScopeLabel,
  loadVariables
} = useVariables(props.supportedScopes, props.flowId, props.conversationId)

// 生命周期
onMounted(() => {
  loadVariables()
})

// 监听属性变化
watch([() => props.flowId, () => props.conversationId], () => {
  loadVariables()
})

// 监听变量列表变化，通过事件传递给父组件
watch(variables, (newVariables) => {
  emit('variables-loaded', newVariables)
}, { deep: true, immediate: true })
</script>

<style scoped lang="scss">
.variable-insert-dropdown {
  width: 320px;
  max-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border: 1px solid #e1e6f0;

  .dropdown-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    background-color: #fafbfc;

    .dropdown-title {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .search-input {
      width: 100%;
    }
  }

  .dropdown-content {
    max-height: 300px;
    overflow-y: auto;

    .variable-group {
      &:not(:last-child) {
        border-bottom: 1px solid #f5f5f5;
      }

      .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px 8px 16px;
        background-color: #f8f9fa;

        .group-title {
          font-size: 12px;
          font-weight: 500;
          color: #606266;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .group-count {
          font-size: 11px;
          color: #909399;
          background-color: #e9ecef;
          padding: 2px 6px;
          border-radius: 10px;
        }
      }

      .group-variables {
        padding: 0 8px 8px 8px;

        .variable-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          margin: 4px 0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background-color: #f0f9ff;
            border-color: #409eff;
          }

          .variable-info {
            flex: 1;
            min-width: 0;

            .variable-name {
              font-size: 13px;
              font-weight: 500;
              color: #303133;
              margin-bottom: 2px;
            }

            .variable-description {
              font-size: 11px;
              color: #909399;
              line-height: 1.4;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .variable-type-tag {
            font-size: 11px;
            color: #666;
            background-color: #f0f0f0;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            margin-left: 8px;
          }
        }
      }
    }

    .empty-state {
      padding: 32px 16px;
      text-align: center;

      .empty-text {
        font-size: 13px;
        color: #909399;
      }
    }
  }
}
</style> 