<template>
  <div class="plugin-list-panel">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="searchKeyword"
        type="text" 
        :placeholder="$t('common.search')"
        class="search-input"
        @input="handleSearch"
      />
      <div 
        v-if="searchKeyword.trim()"
        class="clear-icon"
        @click="resetSearch"
        title="清空搜索"
      >
        ✕
      </div>
      <div class="search-icon">🔍</div>
    </div>
    
    <!-- Tabs组件 -->
    <div class="plugin-tabs">
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'api' }"
        @click="onTabChange('api')"
      >
        API
      </div>
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'mcp' }"
        @click="onTabChange('mcp')"
      >
        MCP
      </div>
    </div>
    
    <!-- 插件列表 -->
    <div class="plugins-list">
      <div 
        v-if="filteredPlugins.length > 0"
        class="plugin-cards"
      >
        <div
          v-for="plugin in paginatedPlugins"
          :key="plugin.serviceId"
          class="plugin-item"
          @click="handlePluginClick(plugin)"
        >
          <div class="plugin-card">
            <div class="plugin-icon">
              <img 
                :src="plugin.icon || defaultIcon" 
                :alt="plugin.name"
                @error="handleImageError"
              />
            </div>
            <div class="plugin-info">
              <div class="plugin-header">
                <div class="plugin-name">{{ plugin.name }}</div>
                <div class="plugin-status">
                  <!-- 收藏状态 -->
                  <div 
                    v-if="activeTab === 'api' && plugin.type === 'semantic_interface'"
                    class="favorite-icon"
                    :class="{ 'noClick': !plugin.published }"
                    :title="!plugin.published ? '未发布不可收藏' : (plugin.favorited ? '已收藏' : '未收藏')"
                    @click.stop="handleFavorite($event, plugin)"
                  >
                    <IconFavorite v-if="plugin.favorited" class="apiFavorite" />
                    <IconUnfavorite v-else />
                  </div>
                  <!-- 发布状态 -->
                  <div 
                    v-if="!plugin.published && activeTab === 'api'"
                    class="publish-status unpublished"
                    title="未发布"
                  >
                    草稿
                  </div>
                  <!-- MCP状态 -->
                  <div 
                    v-if="activeTab === 'mcp' && plugin.status"
                    class="mcp-status"
                    :class="plugin.status"
                  >
                    <span v-if="plugin.status === 'ready'">已安装</span>
                    <span v-else-if="plugin.status === 'installing'">安装中</span>
                    <span v-else-if="plugin.status === 'failed'">安装失败</span>
                    <span v-else>未安装</span>
                  </div>
                  <!-- 激活状态 -->
                  <div 
                    v-if="activeTab === 'mcp' && plugin.isActive !== undefined"
                    class="active-status"
                    :class="{ active: plugin.isActive }"
                  >
                    {{ plugin.isActive ? '已激活' : '未激活' }}
                  </div>
                </div>
              </div>
              <div class="plugin-desc">{{ plugin.description }}</div>
              <div class="plugin-footer">
                <div class="plugin-author">@{{ plugin.author }}</div>
                <div v-if="plugin.published !== undefined && plugin.type === 'semantic_interface'" class="plugin-meta">
                  {{ formatDate(plugin.published) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="appCenterNoData">
        <div class="noDataIcon"></div>
        <div class="desc">{{ $t('common.no_data') }}</div>
      </div>
    </div>
    
    <!-- 分页组件 -->
    <div class="pagination-container" v-if="totalCount > 0">
      <div class="pagination">
        <button 
          class="page-btn"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="page-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页，共 {{ totalCount }} 条
        </span>
        <button 
          class="page-btn"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { api } from 'src/apis';
import { IconFavorite, IconUnfavorite } from '@computing/opendesign-icons';
import DefaultIcon from '@/assets/svgs/defaultIcon.webp';

// Props
interface Props {
  searchPlaceholder?: string;
}

// Emits
interface Emits {
  (e: 'pluginClick', plugin: any): void;
}

const emit = defineEmits<Emits>();

// 响应式数据
const searchKeyword = ref('');
const activeTab = ref<'api' | 'mcp'>('api'); // 默认显示API tab
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const loading = ref(false);

// 插件数据
const pluginLists = ref<{
  serviceId: string;
  description: string;
  favorited?: boolean;
  icon: string;
  author: string;
  name: string;
  published?: boolean;
  isActive?: boolean;
  status?: 'init' | 'installing' | 'cancelled' | 'ready' | 'failed';
  type: 'semantic_interface' | 'mcp';
}[]>([]);

const defaultIcon = DefaultIcon;

// 计算属性：根据当前tab和搜索关键词过滤插件
const filteredPlugins = computed(() => {
  let plugins = [...pluginLists.value];
  
  // 根据tab过滤（现在只有api和mcp两种类型）
  if (activeTab.value === 'api') {
    plugins = plugins.filter(plugin => plugin.type === 'semantic_interface');
  } else if (activeTab.value === 'mcp') {
    plugins = plugins.filter(plugin => plugin.type === 'mcp');
  }
  
  // 根据搜索关键词过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim();
    plugins = plugins.filter(plugin => 
      plugin.name?.toLowerCase().includes(keyword) ||
      plugin.description?.toLowerCase().includes(keyword) ||
      plugin.author?.toLowerCase().includes(keyword)
    );
  }
  
  return plugins;
});

// 计算属性：显示的插件数据（后端分页，直接显示）
const paginatedPlugins = computed(() => {
  return filteredPlugins.value;
});

// 计算属性：总页数
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / pageSize.value);
});

// 方法
const handleSearch = () => {
  currentPage.value = 1; // 搜索时重置到第一页
  loadPlugins(); // 重新加载数据
};

const resetSearch = () => {
  searchKeyword.value = '';
  currentPage.value = 1;
  loadPlugins(); // 重新加载数据
};

const onTabChange = (tab: 'api' | 'mcp') => {
  activeTab.value = tab;
  currentPage.value = 1;
  loadPlugins(); // 重新加载数据
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadPlugins(); // 重新加载数据
  }
};

const handlePluginClick = (plugin: any) => {
  // 创建PluginNode节点数据结构
  const nodeData = {
    // 基础节点信息
    nodeId: `plugin-${plugin.serviceId}`,
    callId: plugin.serviceId,
    type: 'plugin-node', // 标识为PluginNode类型
    
    // PluginNode专用数据
    data: {
      serviceId: plugin.serviceId,
      name: plugin.name,
      description: plugin.description,
      icon: plugin.icon,
      author: plugin.author,
      pluginType: plugin.type, // 'semantic_interface' 或 'mcp'
      type: 'plugin',
      isActive: plugin.isActive,
      status: plugin.status,
      published: plugin.published,
      parameters: {} // 插件节点的默认参数
    }
  };
  
  emit('pluginClick', nodeData);
};

const handleFavorite = async (e: Event, item: any) => {
  e.stopPropagation();
  // 未发布的不可收藏
  if (!item.published) {
    return;
  }
  
  const [, res] = await api.changeSingleApiCollect({
    serviceId: item.serviceId,
    favorited: !item.favorited,
  });
  
  if (res) {
    // 更新本地状态
    const index = pluginLists.value.findIndex(p => p.serviceId === item.serviceId);
    if (index !== -1) {
      pluginLists.value[index].favorited = !item.favorited;
    }
  }
};

const handleImageError = (e: Event) => {
  // 图片加载失败时，使用默认图标
  const imgElement = e.target as HTMLImageElement;
  imgElement.src = defaultIcon;
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '--';
  if (typeof timestamp === 'boolean') return timestamp ? '已发布' : '未发布';
  return new Date(timestamp).toLocaleDateString();
};

// 加载插件数据
const loadPlugins = async () => {
  loading.value = true;
  pluginLists.value = []; // 清空当前数据
  totalCount.value = 0;
  
  try {
    if (activeTab.value === 'api') {
      // 加载语义接口数据
      await loadSemanticInterfaces();
    } else if (activeTab.value === 'mcp') {
      // 加载MCP数据
      await loadMcpServices();
    }
  } catch (error) {
    console.error('加载插件数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 加载语义接口数据 - 使用/api/service接口，只显示已发布的数据
const loadSemanticInterfaces = async () => {
  const searchParams: any = {
    page: currentPage.value,
    pageSize: Math.min(pageSize.value, 100), // 确保不超过100
    searchType: 'all',
    my: true, // 显示所有已发布的数据（不仅仅是我上传的）
    published: true // 只显示已发布的数据
  };
  
  // 如果有搜索关键词，添加到参数中
  if (searchKeyword.value?.trim()) {
    searchParams.keyword = searchKeyword.value.trim();
  }
  
  const [, res] = await api.queryApiList(searchParams);
  
  if (res) {
    const semanticInterfaces = res.result.services.map(item => ({
      ...item,
      type: 'semantic_interface' as const
    }));
    
    pluginLists.value = semanticInterfaces;
    totalCount.value = res.result.totalCount;
  }
};

// 加载MCP服务数据 - 使用/api/mcp接口，只显示已安装且已激活的数据
const loadMcpServices = async () => {
  const searchParams: any = {
    page: currentPage.value,
    pageSize: Math.min(pageSize.value, 100), // 确保不超过100
    searchType: 'all',
    isInstall: true, // 只显示已安装的
    isActive: true   // 只显示已激活的
  };
  
  // 如果有搜索关键词，添加到参数中
  if (searchKeyword.value?.trim()) {
    searchParams.keyword = searchKeyword.value.trim();
  }
  
  const [, res] = await api.getMcpList(searchParams);
  
  if (res) {
    const mcpServices = res.result.services.map(item => ({
      serviceId: item.mcpserviceId,
      description: item.description,
      icon: item.icon,
      author: item.author,
      name: item.name,
      isActive: item.isActive,
      status: item.status,
      type: 'mcp' as const
    }));
    
    pluginLists.value = mcpServices;
    totalCount.value = res.result.totalCount;
  }
};

// 监听搜索关键词变化，实时搜索（使用防抖优化）
let searchTimeout: NodeJS.Timeout | null = null;
watch(searchKeyword, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    handleSearch();
  }, 300); // 300ms防抖
});


// 组件挂载时加载数据
onMounted(() => {
  loadPlugins(); // 加载真实数据
});

// 暴露方法给父组件
defineExpose({
  resetSearch,
  loadPlugins
});
</script>

<style lang="scss" scoped>
.plugin-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .search-bar {
    display: flex;
    align-items: center;
    background: #f8f9fa;
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    margin: 16px 20px 12px;
    flex-shrink: 0;
    
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 12px 16px;
      font-size: 14px;
      color: #24292e;
      
      &::placeholder {
        color: #586069;
      }
    }
    
    .clear-icon {
      font-size: 16px;
      color: #586069;
      margin-right: 12px;
      cursor: pointer;
      transition: color 0.2s ease;
      
      &:hover {
        color: #24292e;
      }
    }
    
    .search-icon {
      font-size: 16px;
      color: #586069;
      margin-right: 12px;
    }
  }
  
  .plugin-tabs {
    display: flex;
    padding: 0 20px;
    border-bottom: 1px solid #e1e4e8;
    margin-bottom: 12px;
    flex-shrink: 0;
    
    .tab-item {
      padding: 8px 16px 12px;
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
      
      &:hover:not(.active) {
        color: #24292e;
      }
    }
  }
  
  .plugins-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0 20px;
    
    .plugin-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .plugin-item {
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        .plugin-card {
          background: #f6f8fa;
          border-color: #6395fd;
          
          .plugin-name {
            color: #6395fd;
          }
        }
      }
    }
    
    .plugin-card {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border: 1px solid #e1e4e8;
      border-radius: 8px;
      background: white;
      transition: all 0.2s ease;
      
      .plugin-icon {
        width: 48px;
        height: 48px;
        margin-right: 16px;
        flex-shrink: 0;
        
        img {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          object-fit: cover;
          background: #f8f9fa;
        }
      }
      
      .plugin-info {
        flex: 1;
        
        .plugin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          
          .plugin-name {
            font-size: 16px;
            font-weight: 600;
            color: #24292e;
            transition: color 0.2s ease;
            flex: 1;
            margin-right: 12px;
          }
          
          .plugin-status {
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: flex-end;
            
            .favorite-icon {
              width: 24px;
              height: 24px;
              background-color: var(--o-bg-color-light);
              border-radius: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              cursor: pointer;
              transition: all 0.2s ease;
              
              &:hover {
                transform: scale(1.1);
              }
              
              &.noClick {
                cursor: not-allowed;
              }
              
              svg {
                width: 16px;
                height: 16px;
                path {
                  fill: var(--o-text-color-tertiary);
                }
              }
              
              .apiFavorite {
                path {
                  fill: rgb(99, 149, 253);
                }
              }
            }
            
            .publish-status {
              font-size: 12px;
              padding: 2px 8px;
              border-radius: 4px;
              
              &.unpublished {
                background: #fef2e6;
                color: #d46b08;
              }
            }
            
            .mcp-status {
              font-size: 12px;
              padding: 2px 8px;
              border-radius: 4px;
              
              &.ready {
                background: #e6f7e6;
                color: #52c41a;
              }
              
              &.installing {
                background: #e6f3ff;
                color: #1890ff;
              }
              
              &.failed {
                background: #ffe6e6;
                color: #ff4d4f;
              }
              
              &.init,
              &.cancelled {
                background: #f5f5f5;
                color: #8c8c8c;
              }
            }
            
            .active-status {
              font-size: 12px;
              padding: 2px 8px;
              border-radius: 4px;
              background: #f5f5f5;
              color: #8c8c8c;
              
              &.active {
                background: #e6f7e6;
                color: #52c41a;
              }
            }
          }
        }
        
        .plugin-desc {
          font-size: 14px;
          color: #586069;
          line-height: 1.4;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .plugin-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .plugin-author {
            font-size: 12px;
            color: #586069;
            font-weight: 500;
          }
          
          .plugin-meta {
            font-size: 12px;
            color: #8c8c8c;
          }
        }
      }
    }
    
    .appCenterNoData {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 40px;
      
      .noDataIcon {
        width: 320px;
        height: 130px;
        background: var(--no-work-flow) center center no-repeat;
        background-size: contain;
      }
      
      .desc {
        height: 16px;
        font-size: 12px;
        color: var(--o-text-color-primary);
      }
    }
  }
  
  .pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px 0;
    border-top: 1px solid #e1e4e8;
    flex-shrink: 0;
    
    .pagination {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .page-btn {
        padding: 8px 16px;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        background: white;
        color: #24292e;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          background: #f6f8fa;
          border-color: #6395fd;
          color: #6395fd;
        }
        
        &:disabled {
          background: #f5f5f5;
          border-color: #e1e4e8;
          color: #c0c4cc;
          cursor: not-allowed;
        }
      }
      
      .page-info {
        font-size: 14px;
        color: #586069;
      }
    }
  }
}

// 深色主题支持
.dark .plugin-list-panel {
  .search-bar {
    background: #4a5568;
    border-color: #6b7280;
    
    .search-input {
      color: #e2e8f0;
      
      &::placeholder {
        color: #a0aec0;
      }
    }
    
    .clear-icon {
      color: #a0aec0;
      
      &:hover {
        color: #e2e8f0;
      }
    }
    
    .search-icon {
      color: #a0aec0;
    }
  }
  
  .plugin-tabs {
    border-bottom-color: #4a5568;
    
    .tab-item {
      color: #a0aec0;
      
      &.active {
        color: #6395fd;
        border-bottom-color: #6395fd;
      }
      
      &:hover:not(.active) {
        color: #e2e8f0;
      }
    }
  }
  
  .plugins-list {
    .plugin-card {
      background: #2d3748;
      border-color: #4a5568;
      
      .plugin-icon img {
        background: #374151;
      }
      
      .plugin-name {
        color: #e2e8f0;
      }
      
      .plugin-desc {
        color: #a0aec0;
      }
      
      .plugin-author {
        color: #a0aec0;
      }
      
      .plugin-meta {
        color: #718096;
      }
    }
    
    .plugin-item:hover .plugin-card {
      background: #374151;
      border-color: #6395fd;
    }
    
    .appCenterNoData {
      .desc {
        color: var(--o-text-color-primary);
      }
    }
  }
  
  .pagination-container {
    border-top-color: #4a5568;
    
    .page-btn {
      background: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
      
      &:hover:not(:disabled) {
        background: #374151;
        border-color: #6395fd;
        color: #6395fd;
      }
      
      &:disabled {
        background: #1a202c;
        border-color: #4a5568;
        color: #718096;
      }
    }
    
    .page-info {
      color: #a0aec0;
    }
  }
}
</style>
