<template>
  <div class="variable-insert-dropdown">
    <div class="dropdown-header">
      <span class="dropdown-title">{{ $t('variableInsertDropdown.select_variable_to_insert') }}</span>
      <el-input 
        v-model="searchText"
        :placeholder="$t('variableInsertDropdown.search_variables_placeholder')"
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
      <!-- 骨架屏：初始加载时显示 -->
      <div v-if="loading && groupedVariables.length === 0" class="skeleton-container">
        <div v-for="i in 3" :key="`skeleton-${i}`" class="skeleton-group">
          <div class="skeleton-header">
            <div class="skeleton-title"></div>
            <div class="skeleton-count"></div>
          </div>
          <div class="skeleton-items">
            <div v-for="j in 2" :key="`skeleton-item-${j}`" class="skeleton-item">
              <div class="skeleton-item-info">
                <div class="skeleton-name"></div>
                <div class="skeleton-desc"></div>
              </div>
              <div class="skeleton-tag"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索加载遮罩：仅在搜索时显示 -->
      <div v-if="searchLoading" class="search-loading-overlay">
        <el-icon class="loading-icon">
          <IconSearch />
        </el-icon>
        <span>{{ $t('variableInsertDropdown.searching') }}</span>
      </div>

      <!-- 变量列表内容 -->
      <div v-if="!loading || groupedVariables.length > 0">
        <div 
          v-for="group in groupedVariables" 
          :key="group.scope"
          class="variable-group"
        >
          <div class="group-header">
            <span class="group-title">{{ getScopeLabel(group.scope, group.nodeId, group.nodeName) }}</span>
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
        
        <!-- 空状态：区分加载中和无数据 -->
        <div v-if="!loading && !searchLoading && groupedVariables.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon size="32" color="#c0c4cc">
              <IconRemind v-if="!searchText" />
              <IconSearch v-else />
            </el-icon>
          </div>
          <div class="empty-text">
            {{ searchText ? $t('variableInsertDropdown.no_variables_found') : $t('variableInsertDropdown.no_available_variables') }}
          </div>
          <div class="empty-tip" v-if="!searchText">
            {{ $t('variableInsertDropdown.ensure_variables_defined') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElInput, ElIcon } from 'element-plus'
import { IconSearch, IconRemind } from '@computing/opendesign-icons'
import { useVariables, type Variable } from '@/components/useVariables'

interface Props {
  supportedScopes?: string[]
  flowId?: string
  conversationId?: string
  currentStepId?: string
}

const props = withDefaults(defineProps<Props>(), {
  supportedScopes: () => ['conversation', 'system', 'env', 'user']
})

const emit = defineEmits<{
  'variable-selected': [variable: Variable]
  'variables-loaded': [variables: Variable[]]
}>()

const { t } = useI18n()

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
} = useVariables(props.supportedScopes, props.flowId, props.conversationId, props.currentStepId)

// 搜索加载状态 
const searchLoading = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

// 生命周期
onMounted(() => {
  loadVariables()
})

// 监听属性变化
watch([() => props.flowId, () => props.conversationId, () => props.currentStepId], () => {
  loadVariables()
})

// 监听搜索文本变化，添加搜索loading效果
watch(searchText, (newValue, oldValue) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 只有在实际有内容变化时才显示搜索loading
  if (newValue && newValue !== oldValue) {
    searchLoading.value = true
    searchTimer = setTimeout(() => {
      searchLoading.value = false
    }, 200) // 200ms的搜索loading延迟
  } else {
    searchLoading.value = false
  }
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
    min-height: 200px; // 设置最小高度，避免初始高度为0
    max-height: 300px;
    overflow-y: auto;
    position: relative; // 为搜索遮罩定位

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

    // 骨架屏样式
    .skeleton-container {
      padding: 8px 0;
      
      .skeleton-group {
        &:not(:last-child) {
          border-bottom: 1px solid #f5f5f5;
        }
        
        .skeleton-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px 8px 16px;
          background-color: #f8f9fa;
          
          .skeleton-title {
            width: 80px;
            height: 12px;
            background-color: #f0f0f0;
            border-radius: 6px;
            animation: skeleton-loading 1.5s ease-in-out infinite;
          }
          
          .skeleton-count {
            width: 20px;
            height: 16px;
            background-color: #e9ecef;
            border-radius: 10px;
            animation: skeleton-loading 1.5s ease-in-out infinite;
          }
        }
        
        .skeleton-items {
          padding: 0 8px 8px 8px;
          
          .skeleton-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            margin: 4px 0;
            
            .skeleton-item-info {
              flex: 1;
              
              .skeleton-name {
                width: 120px;
                height: 13px;
                background-color: #f0f0f0;
                border-radius: 4px;
                margin-bottom: 6px;
                animation: skeleton-loading 1.5s ease-in-out infinite;
              }
              
              .skeleton-desc {
                width: 180px;
                height: 11px;
                background-color: #f5f5f5;
                border-radius: 4px;
                animation: skeleton-loading 1.5s ease-in-out infinite;
              }
            }
            
            .skeleton-tag {
              width: 50px;
              height: 20px;
              background-color: #f0f0f0;
              border-radius: 4px;
              margin-left: 8px;
              animation: skeleton-loading 1.5s ease-in-out infinite;
            }
          }
        }
      }
    }

    // 搜索加载遮罩
    .search-loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      
      .loading-icon {
        font-size: 24px;
        color: #409eff;
        margin-bottom: 8px;
        animation: rotate 1s linear infinite;
      }
      
      span {
        font-size: 13px;
        color: #606266;
      }
    }

    .empty-state {
      padding: 40px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .empty-icon {
        margin-bottom: 16px;
        opacity: 0.6;
      }

      .empty-text {
        font-size: 14px;
        color: #909399;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .empty-tip {
        font-size: 12px;
        color: #c0c4cc;
        line-height: 1.4;
      }
    }
  }
}

// 动画定义
@keyframes skeleton-loading {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 