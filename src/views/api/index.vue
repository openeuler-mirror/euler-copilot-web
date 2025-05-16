<template>
  <div>
    <CustomLoading :loading="loading"></CustomLoading>
    <div class="apiCenterBox">
      <div class="apiCenterMain">
        <div class="apiCenterTitle">
          {{ $t('menu.plugin_center') }}
        </div>
        <div class="apiCenterSearch">
          <el-input
            style="max-width: 400px"
            v-model="apiSearchValue"
            :placeholder="$t('semantic.interface_search')"
            :suffix-icon="IconSearch"
          >
            <template #prepend>
              <el-select
                v-model="apiSearchType"
                style="width: 115px"
                :suffix-icon="IconCaretDown"
              >
                <el-option :label="$t('semantic.all_select')" value="all" />
                <el-option label="插件名称" value="name" />
                <el-option label="创建人" value="author" />
              </el-select>
            </template>
          </el-input>

          <el-popover
            placement="bottom"
            width="102"
            :popper-style="{
              minWidth: '100px',
              transform: 'translateY(-10px)',
              padding: '4px 0px',
            }"
            trigger="click"
            :show-arrow="false"
          >
            <template #reference>
              <el-button type="primary" class="createApi">
                {{ $t('semantic.create_plugin') }}
                <el-icon><IconCaretDown /></el-icon>
              </el-button>
            </template>
            <div class="pluginOptions">
              <div
                class="pluginOptionsItem"
                @click="openSidebar('upload', '', 'semantic_interface')"
              >
                {{ $t('semantic.semantic_interface') }}
              </div>
              <div
                v-if="userinfo.is_admin"
                class="pluginOptionsItem"
                @click="onOpenMcpDrawer()"
              >
                {{ $t('semantic.mcp_service') }}
              </div>
            </div>
          </el-popover>
        </div>

        <div class="apiCenterType">
          <div
            class="apiCenterBtn"
            :class="{ apiCenterBtnActive: pluginType === 'semantic_interface' }"
            @click="onPluginTypeClick('semantic_interface')"
          >
            {{ $t('semantic.semantic_interface') }}
          </div>
          <div
            class="apiCenterBtn"
            :class="{ apiCenterBtnActive: pluginType === 'mcp' }"
            @click="onPluginTypeClick('mcp')"
          >
            {{ $t('semantic.mcp_service') }}
          </div>
        </div>

        <div class="apiCenterCardContainer">
          <el-tabs
            v-if="pluginType === 'semantic_interface'"
            v-model="apiType"
            class="plugin-tabs"
            @tab-click="(tab) => handleSearchApiList(tab.props.name)"
          >
            <el-tab-pane
              :label="$t('semantic.all_select')"
              name="my"
              :lazy="true"
            ></el-tab-pane>
            <el-tab-pane
              :label="$t('semantic.my_upload')"
              name="createdByMe"
              :lazy="true"
            ></el-tab-pane>
            <el-tab-pane
              :label="$t('semantic.my_favorite')"
              name="favorited"
              :lazy="true"
            ></el-tab-pane>
          </el-tabs>
          <div class="apiCenterCardBox" v-if="pluginLists.length">
            <div v-for="item in pluginLists" class="apiCenterCardSingle">
              <div @click="openSidebar('get', item.serviceId, pluginType)">
                <PluginCard
                  :name="item.name"
                  :description="item.description"
                  :icon="item.icon"
                >
                  <template
                    #topRight
                    v-if="pluginType === 'semantic_interface'"
                  >
                    <div
                      class="apiCenterCardContentCollect"
                      :class="
                        !item.published && apiType === 'createdByMe'
                          ? 'noClick'
                          : ''
                      "
                      @click.stop="handleFavorite($event, item)"
                    >
                      <IconFavorite v-if="item.favorited" class="apiFavorite" />
                      <IconUnfavorite v-else />
                    </div>
                  </template>
                  <template #footer>
                    <div class="apiCenterCardBottom">
                      <div class="apiCenterCardUser">@{{ item.author }}</div>
                      <div
                        class="apiCenterCardOps"
                        v-if="
                          userinfo.user_sub === item.author ||
                          pluginType === 'mcp'
                        "
                      >
                        <div v-if="userinfo.is_admin">
                          <el-button
                            text
                            @click.stop="onOpenMcpDrawer(item.serviceId)"
                          >
                            {{ $t('semantic.interface_edit') }}
                          </el-button>
                          <el-button
                            text
                            @click.stop="handleDelApi(item.serviceId)"
                          >
                            {{ $t('semantic.interface_delete') }}
                          </el-button>
                        </div>

                        <el-button
                          v-else
                          text
                          @click.stop="
                            onActiveService(item.serviceId, item.isActive)
                          "
                        >
                          {{ item.isActive ? '取消激活' : '激活' }}
                        </el-button>
                      </div>
                    </div>
                  </template>
                </PluginCard>
              </div>
            </div>
          </div>
          <div class="appCenterNoData" v-else>
            <div class="noDataIcon"></div>
            <div class="desc">{{ $t('semantic.no_data') }}</div>
          </div>
        </div>
      </div>
      <el-drawer
        class="el-drawer"
        v-model="drawer"
        :title="actionName"
        :show-close="false"
        header-class="drawerHeader"
        destory-on-close="true"
        :direction="direction"
        :before-close="handleClose"
      >
        <div class="drawerContent">
          <div v-if="actions === 'upload'" style="height: 100%;">
            <Upload
              type="upload"
              @closeDrawer="handleClose"
              :serviceId="selectedServiceId"
            />
          </div>
          <div v-if="actions === 'get'">
            <Upload
              type="get"
              @closeDrawer="handleClose"
              :serviceId="selectedServiceId"
              :getServiceJson="getServiceJson"
              :getServiceName="getServiceName"
            />
          </div>
          <div v-if="actions === 'edit'">
            <Upload
              type="edit"
              @closeDrawer="handleClose"
              :serviceId="selectedServiceId"
              :getServiceYaml="getServiceYaml"
              :getServiceName="getServiceName"
            />
          </div>
        </div>
      </el-drawer>
      <McpDrawer
        v-model:visible="mcpDrawerVisible"
        :service-id="selectedServiceId"
        @success="onCreateOrUpdateMcpServiceSuccess"
      />
      <McpServiceDetailDrawer
        v-model:visible="mcpDetailDrawerVisible"
        :service-id="selectedServiceId"
      />
    </div>
    <el-pagination
      class="pagination"
      v-if="totalCount >= 16"
      v-model:current-page="currentPage"
      v-model:page-size="currentPageSize"
      :page-sizes="pagination.pageSizes"
      :layout="pagination.layout"
      :total="totalCount"
      popper-class="appPagination"
      @change="handleChangePage"
    />
  </div>
</template>
<script setup lang="ts">
import {
  IconCaretDown,
  IconSearch,
  IconFavorite,
  IconUnfavorite,
} from '@computing/opendesign-icons';
import './style.scss';
import PluginCard from './components/PluginCard.vue';
import { ref, onMounted, watch, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/apis';
import { ElMessageBox } from 'element-plus';
import { IconAlarm } from '@computing/opendesign-icons';
import Upload from '@/components/Upload/index.vue';
import { successMsg } from 'src/components/Message';
import { useAccountStore } from 'src/store';
import { storeToRefs } from 'pinia';
import * as jsYaml from 'js-yaml';
import i18n from 'src/i18n';
import CustomLoading from '../customLoading/index.vue';
import McpDrawer from './components/McpDrawer.vue';
import McpServiceDetailDrawer from './components/McpServiceDetail.vue';

const mcpDrawerVisible = ref(false);
const mcpDetailDrawerVisible = ref(false);

function onOpenMcpDrawer(id?: string) {
  if (id) {
    selectedServiceId.value = id;
  }
  mcpDrawerVisible.value = true;
}

function onCreateOrUpdateMcpServiceSuccess() {
  mcpDrawerVisible.value = false;
  queryList(pluginType.value);
}

watch(
  () => mcpDrawerVisible.value,
  () => {
    if (!mcpDrawerVisible.value) {
      selectedServiceId.value = '';
    }
  },
);

const pluginLists = ref<
  {
    serviceId: string;
    description: string;
    favorited?: boolean;
    icon: string;
    author: string;
    name: string;
    published?: boolean;
    isActive?: boolean;
  }[]
>([]);

const apiList = ref();
const drawer = ref(false);
const direction = ref('rtl');
const actionName = ref('');
const router = useRouter();
const actions = ref();
const pluginType = ref<'semantic_interface' | 'mcp'>('semantic_interface');
const apiType = ref('my');
const apiSearchType = ref('all');
const selectedServiceId = ref('');
const getServiceJson = ref('');
const getServiceYaml = ref('');
const apiSearchValue = ref();
const getServiceName = ref('');
const { userinfo } = storeToRefs(useAccountStore());
const pagination = ref({
  pageSizes: [16, 32, 64],
  layout: 'total,sizes,prev,pager,next,jumper',
});
const currentPage = ref(1);
const totalCount = ref(0);
const currentPageSize = ref(pagination.value.pageSizes[0]);
const loading = ref(false);

const handleChangePage = (pageNum: number, pageSize: number) => {
  currentPage.value = pageNum;
  currentPageSize.value = pageSize;
  queryList(pluginType.value);
};

const getServiceYamlFun = async (id: string) => {
  const [, res] = await api.querySingleApiData({ serviceId: id, edit: true });
  if (res) {
    //res[1] res 取决于当前环境
    getServiceYaml.value = jsYaml.dump(res.result.data);
    getServiceName.value = res[1]?.result.name;
  }
};

const getServiceJsonFun = async (id: string) => {
  const [, res] = await api.querySingleApiData({ serviceId: id });
  if (res) {
    //res[1] res 取决于当前环境
    getServiceJson.value = res.result.apis;
    getServiceName.value = res.result.name;
  }
};

const openSidebar = (
  action: string,
  id: string,
  type: 'semantic_interface' | 'mcp',
) => {
  if (type === 'semantic_interface') {
    drawer.value = true;
    actions.value = action;
    if (action === 'upload') {
      // 展示上传的框架
      actionName.value = i18n.global.t('semantic.upload_semantic_interface');
    } else if (action === 'edit') {
      // 展示编辑的框架
      actionName.value = i18n.global.t('semantic.edit_semantic_interface');
      selectedServiceId.value = id;
      getServiceYamlFun(id);
    } else if (action === 'get') {
      // 展示查看的框架
      actionName.value = i18n.global.t('semantic.view_semantic_interface');
      selectedServiceId.value = id;
      getServiceJsonFun(id);
    }
  } else if (type === 'mcp') {
    selectedServiceId.value = id;
    if (action === 'edit') {
      mcpDrawerVisible.value = true;
    } else if (action === 'get') {
      mcpDetailDrawerVisible.value = true;
    }
  }
};

const handleClose = () => {
  actions.value = '';
  getServiceJson.value = '';
  getServiceYaml.value = '';
  drawer.value = false;
  queryList(pluginType.value);
};

const queryList = async (type: 'semantic_interface' | 'mcp') => {
  loading.value = true;
  const payload = {
    searchType: apiSearchType.value,
    keyword: apiSearchValue.value || undefined,
    [apiType.value]: true,
  };
  if (type === 'semantic_interface') {
    payload[apiType.value] = true;
    const [, res] = await api.queryApiList({
      page: currentPage.value,
      pageSize: currentPageSize.value,
      ...(payload as any),
    });
    if (res) {
      pluginLists.value = res.result.services;
      currentPage.value = res.result.currentPage;
      totalCount.value = res.result.totalCount;
      loading.value = false;
    }
  } else if (type === 'mcp') {
    const [_, res] = await api.getMcpList({
      page: currentPage.value,
      pageSize: currentPageSize.value,
      ...(payload as any),
    });
    if (res) {
      pluginLists.value = res.result.services.map((item) => ({
        serviceId: item.mcpserviceId,
        description: item.description,
        icon: item.icon,
        author: item.author,
        name: item.name,
        isActive: item.isActive,
      }));
    }
  }

  loading.value = false;
};

const handleFavorite = (e, item) => {
  // 未发布的不可收藏
  if (!item.published && apiType.value === 'createdByMe') {
    return;
  }
  e.stopPropagation();
  api
    .changeSingleApiCollect({
      serviceId: item.serviceId,
      favorited: !item.favorited,
    })
    .then((res) => {
      queryList(pluginType.value);
    });
};

const handleSearchApiList = (type: 'my' | 'createdByMe' | 'favorited') => {
  if (type === 'my') {
    queryList(pluginType.value);
  } else {
    currentPage.value = 1;
    currentPageSize.value = 16;
    queryList(pluginType.value);
  }
};

const handleDelApi = (id: string) => {
  if (pluginType.value === 'semantic_interface') {
    ElMessageBox.confirm('确定删除此接口吗？', '提示', {
      type: 'warning',
      icon: markRaw(IconAlarm),
    }).then(() => {
      api
        .deleteSingleApiData({
          serviceId: id,
        })
        .then((res) => {
          if (res[1]) {
            successMsg('删除成功');
            queryList(pluginType.value);
          }
        });
    });
  } else if (pluginType.value === 'mcp') {
    ElMessageBox.confirm('确定删除此服务吗？', '提示', {
      type: 'warning',
      icon: markRaw(IconAlarm),
    }).then(() => {
      api.deleteMcpService(id).then((res) => {
        if (res[1]) {
          successMsg('删除成功');
          queryList(pluginType.value);
        }
      });
    });
  }
};

async function onActiveService(serviceId: string, active: boolean = true) {
  const [_, res] = await api.activeMcpService(serviceId, !active);
  if (res) {
    queryList(pluginType.value);
  }
}

function onPluginTypeClick(type: 'semantic_interface' | 'mcp') {
  if (pluginType.value === type) {
    return;
  }
  pluginType.value = type;
  queryList(pluginType.value);
}

watch(
  () => [apiSearchValue, apiSearchType],
  () => {
    queryList(pluginType.value);
  },
  { deep: true },
);

onMounted(() => {
  queryList(pluginType.value);
});
</script>
<style lang="scss" scoped>
.create-button__icon {
  border-radius: 20px;
}
.pagination {
  display: flex !important;
  justify-self: center !important;
}
.drawerHeader {
  color: pink;
  margin-bottom: 0px !important;
}
.drawerContent {
  overflow-y: auto;
  height: calc(100% - 32px);
}
.el-drawer {
  margin: 0px;
  padding: 0px;
  &::v-deep(.el-drawer__header) {
    margin-bottom: 0px !important;
    color: var(--o-text-color-primary) !important;
  }
}
.apiCenterCardSingle {
  position: relative;
  .unPublishSymbol {
    position: absolute;
    width: 56px;
    height: 16px;
    display: flex;
    left: 8px;
    top: -4px;
    .coverIcon {
      width: 0px;
      height: 0px;
      border: 2px;
      border-color: #5481de #5481de transparent transparent;
      border-left: 2px solid transparent;
      border-top: 2px solid transparent;
      border-right: 2px solid #5481de;
      border-bottom: 2px solid #5481de;
    }
    .textDesc {
      flex: 1;
      line-height: 16px;
      color: #fff;
      text-align: center;
      font-size: 12px;
      border-top-right-radius: 4px;
      border-bottom-left-radius: 4px;
      background: #6395fd;
    }
  }
  .noClick {
    cursor: not-allowed;
  }
}

img {
  width: 100%;
  max-width: 430px;
}
.el-drawer__header {
  padding: 24px 24px 16px;
  margin-bottom: 0px;
  .drawerHeader {
    width: 100%;
    height: 24px;
    line-height: 24px;
    color: var(--o-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
:deep(.el-drawer__body) {
  padding: 8px 24px 16px !important;
  .drawerBody {
    height: 100%;
    textarea {
      width: 100%;
      height: 100%;
    }
  }
}

.pluginOptions {
  .pluginOptionsItem {
    padding: 8px 15px;
    cursor: pointer;
    &:hover {
      background-color: rgb(122, 165, 255);
      color: #fff;
    }
  }
}
</style>

<style>
.plugin-tabs {
  --o-tabs-font-size: 14px;
  --o-tabs-item-padding: 5px 16px 0 5px;
  --o-tabs-line-height: 32px;
  --o-tabs-color_active: rgb(99, 149, 253);
}
</style>
