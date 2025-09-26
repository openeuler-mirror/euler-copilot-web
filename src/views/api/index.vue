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
                <el-option
                  :label="$t('plugin_center.plugin_name')"
                  value="name"
                />
                <el-option :label="$t('plugin_center.author')" value="author" />
              </el-select>
            </template>
          </el-input>

          <el-popover
            ref="createPopover"
            :popper-style="{
              transform: 'translateY(-10px)',
              padding: '4px 0px',
            }"
            trigger="click"
            placement="bottom-start"
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
          <el-tabs
            v-if="pluginType === 'mcp'"
            v-model="mcpType"
            class="plugin-tabs"
            @tab-click="(tab) => handleSearchMcpList(tab.props.name)"
          >
            <el-tab-pane
              :label="$t('plugin_center.mcp.all_select')"
              name="all_select"
              :lazy="true"
            ></el-tab-pane>
            <el-tab-pane
              :label="$t('plugin_center.mcp.installed')"
              name="installed"
              :lazy="true"
              v-if="userinfo.is_admin"
            ></el-tab-pane>
            <el-tab-pane
              :label="$t('plugin_center.mcp.not_installed')"
              name="not_installed"
              :lazy="true"
              v-if="userinfo.is_admin"
            ></el-tab-pane>
          </el-tabs>
          <div class="apiCenterCardBox" v-if="pluginLists.length">
            <div
              v-for="item in pluginLists"
              :key="item.serviceId"
              class="apiCenterCardSingle"
            >
              <div @click="openSidebar('get', item.serviceId!, pluginType)">
                <PluginCard
                  :name="item.name"
                  :description="item.description"
                  :icon="item.icon"
                >
                  <template #topRight>
                    <div
                      v-if="pluginType === 'semantic_interface'"
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
                    <div v-else-if="pluginType === 'mcp'">
                      <!-- 安装中 -->
                      <div v-if="item.status === 'installing'" class="loading">
                        <img
                          src="@/assets/images/loading.png"
                          alt=""
                          class="loading-anime-icon"
                        />
                        <div class="loading-text">
                          {{ t('plugin_center.mcp.installing') }}
                        </div>
                      </div>
                      <!-- 安装失败 -->
                      <div
                        v-else-if="item.status === 'failed'"
                        class="statusDiv"
                      >
                        <img src="@/assets/svgs/error.svg" alt="" />
                        <div class="failed-text">
                          {{ t('plugin_center.mcp.install_failed') }}
                        </div>
                      </div>
                      <!-- 安装成功 -->
                      <div
                        v-else-if="['ready'].includes(item.status)"
                        class="statusDiv"
                      >
                        <img src="@/assets/svgs/success.svg" alt="" />
                        <div class="failed-text">
                          {{ t('plugin_center.mcp.install_success') }}
                        </div>
                      </div>
                      <!-- 未安装 -->
                      <div
                        v-else-if="['init', 'cancelled'].includes(item.status)"
                        class="statusDiv"
                      >
                        <img src="@/assets/svgs/warning.svg" alt="" />
                        <div class="failed-text">
                          {{ t('plugin_center.mcp.not_installed') }}
                        </div>
                      </div>
                    </div>
                  </template>
                  <template #footer>
                    <div class="apiCenterCardBottom">
                      <div class="apiCenterCardFooter">
                        <div class="apiCenterCardUser">@{{ item.author }}</div>
                        <div
                          class="apiCenterCardId"
                          v-if="pluginType === 'mcp'"
                        >
                          <span style="font-weight: 700 !important">ID:</span>
                          <span>{{ item.serviceId! }}</span>
                          <el-tooltip
                            effect="dark"
                            :content="$t('common.copy')"
                            placement="top"
                          >
                            <el-icon
                              @click.stop="onCopyServiceId(item.serviceId!)"
                            >
                              <CopyDocument />
                            </el-icon>
                          </el-tooltip>
                        </div>
                        <div
                          v-if="
                            (userinfo.user_sub === item.author &&
                              pluginType === 'semantic_interface') ||
                            pluginType === 'mcp'
                          "
                          class="deleteAndEdit"
                        >
                          <!-- 未安装、安装失败：安装 -->
                          <el-button
                            v-if="
                              userinfo.is_admin &&
                              pluginType === 'mcp' &&
                              ['init', 'cancelled', 'failed'].includes(
                                item.status,
                              )
                            "
                            text
                            @click.stop="
                              onInstallService(item.serviceId!)
                            "
                          >
                            {{ t('plugin_center.mcp.install') }}
                          </el-button>
                          <!-- 安装成功：激活 -->
                          <el-button
                            v-if="
                              pluginType === 'mcp' &&
                              ['ready'].includes(item.status)
                            "
                            text
                            @click.stop="showActive(item)"
                          >
                            {{
                              item.isActive
                                ? t('plugin_center.mcp.deactivate')
                                : t('plugin_center.mcp.activate')
                            }}
                          </el-button>
                          <!-- 未安装、安装成功、安装失败：编辑 -->
                          <el-button
                            text
                            v-if="
                              userinfo.is_admin &&
                              !['installing'].includes(item.status)
                            "
                            @click.stop="
                              openSidebar('edit', item.serviceId!, pluginType)
                            "
                          >
                            {{ $t('semantic.interface_edit') }}
                          </el-button>
                          <!-- 安装中：取消 -->
                          <el-button
                            text
                            v-if="
                              userinfo.is_admin &&
                              ['installing'].includes(item.status)
                            "
                            @click.stop="onActiveService(item.serviceId!, true)"
                          >
                            {{ $t('semantic.cancel') }}
                          </el-button>
                          <!-- 删除 -->
                          <el-button
                            v-if="userinfo.is_admin"
                            text
                            @click.stop="handleDelPlugin(item.serviceId!)"
                          >
                            {{ $t('semantic.interface_delete') }}
                          </el-button>
                        </div>
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
          <!-- 分页组件 -->
          <div class="pagination-container" v-if="totalCount > 0">
            <el-pagination
              class="pagination"
              v-model:current-page="currentPage"
              v-model:page-size="currentPageSize"
              :page-sizes="pagination.pageSizes"
              :layout="pagination.layout"
              :total="totalCount"
              popper-class="appPagination"
              @change="handleChangePage"
            />
          </div>
        </div>
      </div>
      <el-drawer
        class="el-drawer"
        v-model="drawer"
        :title="actionName"
        :show-close="false"
        header-class="drawerHeader"
        destroy-on-close
        :direction="direction"
        :before-close="handleClose"
      >
        <div class="drawerContent">
          <div style="height: 100%">
            <Upload
              v-if="actions === 'upload'"
              type="upload"
              @closeDrawer="handleClose"
              serviceId=""
            />
            <Upload
              v-if="actions === 'get'"
              type="get"
              @closeDrawer="handleClose"
              :serviceId="selectedServiceId"
              :getServiceJson="getServiceJson"
              :getServiceName="getServiceName"
            />
            <Upload
              v-if="actions === 'edit'"
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
  </div>
  <ActiveModel
    v-model:visible="activeModelVisible"
    :item="activeModelItem"
    type="edit"
    :title="$t('plugin_center.mcp.active_mcp_service')"
    @do-active="doActive"
  />
</template>
<script setup lang="ts">
import { IconError, IconSearch, IconCaretDown, IconFavorite, IconUnfavorite } from '@computing/opendesign-icons';
import './style.scss';
import PluginCard from './components/PluginCard.vue';
import { ref, onMounted, watch, markRaw, onBeforeUnmount } from 'vue';
import { api } from 'src/apis';
import { ElMessageBox } from 'element-plus';
import { IconAlarm } from '@computing/opendesign-icons';
import { CopyDocument } from '@element-plus/icons-vue';
import Upload from '@/components/Upload/index.vue';
import { successMsg } from 'src/components/Message';
import { useAccountStore } from 'src/store';
import { storeToRefs } from 'pinia';
import * as jsYaml from 'js-yaml';
import i18n from 'src/i18n';
import CustomLoading from '../customLoading/index.vue';
import McpDrawer from './components/McpDrawer.vue';
import McpServiceDetailDrawer from './components/McpServiceDetail.vue';
import { writeText } from '@/utils';
import ActiveModel from './components/ActiveModel.vue';
import { ElMessage } from 'element-plus';

const { t } = i18n.global;

const createPopover = ref();

const mcpDrawerVisible = ref(false);
const mcpDetailDrawerVisible = ref(false);

const activeModelVisible = ref(false);
const activeModelItem = ref<any>({});

function onOpenMcpDrawer(id?: string) {
  if (id) {
    selectedServiceId.value = id;
  }
  createPopover.value?.hide();
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
    status?: 'init' | 'installing' | 'cancelled' | 'ready' | 'failed';
  }[]
>([]);

const drawer = ref(false);
const direction = ref('rtl');
const actionName = ref('');
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
  pageSizes: [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
});
const currentPage = ref(1);
const totalCount = ref(0);
const currentPageSize = ref(20);
const loading = ref(false);

const mcpType = ref('all_select');
const mcpIsActive = ref(<boolean | null>null);
const mcpIsInstall = ref(
  <boolean | null>(userinfo.value.is_admin ? null : true),
);

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
  createPopover.value?.hide();
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
      if (id) {
        selectedServiceId.value = id;
      }
      createPopover.value?.hide();
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

let timer: NodeJS.Timeout | null = null;
let polling = false;

const queryList = async (type: 'semantic_interface' | 'mcp') => {
  loading.value = true;
  const payload = {
    searchType: apiSearchType.value,
    keyword: apiSearchValue.value || undefined,
    [apiType.value]: true,
  };
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  polling = false;
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
    polling = true;
    serialMcpPolling();
  }
};

const serialMcpPolling = async () => {
  if (!polling) return;
  await queryMcpServices();
  if (polling) {
    timer = setTimeout(() => {
      serialMcpPolling();
    }, 3000);
  }
};

async function queryMcpServices() {
  const [, res] = await api.getMcpList({
    page: currentPage.value,
    pageSize: currentPageSize.value,
    searchType: apiSearchType.value,
    keyword: apiSearchValue.value || undefined,
    isInstall: mcpIsInstall.value,
    isActive: mcpIsActive.value,
  });
  if (res) {
    let installingCount = 0;
    pluginLists.value = res.result.services.map((item) => {
      if (item.status === 'installing') {
        installingCount++;
      }
      return {
        serviceId: item.mcpserviceId,
        description: item.description,
        icon: item.icon,
        author: item.author,
        name: item.name,
        isActive: item.isActive,
        status: item.status,
      };
    });
    // 更新分页信息
    currentPage.value = res.result.currentPage || currentPage.value;
    totalCount.value = res.result.totalCount || 0;
    
    if (installingCount === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
    loading.value = false;
  }
}

const handleFavorite = (e, item) => {
  // 未发布的不可收藏
  if (!item.published && apiType.value === 'createdByMe') {
    return;
  }
  e.stopPropagation();
  api
    .changeSingleApiCollect({
      serviceId: item.serviceId!,
      favorited: !item.favorited,
    })
    .then(() => {
      queryList(pluginType.value);
    });
};

const handleSearchApiList = (type: 'my' | 'createdByMe' | 'favorited') => {
  apiType.value = type;
  currentPage.value = 1;
  queryList(pluginType.value);
};

const handleSearchMcpList = (
  type: 'all_select' | 'installed' | 'not_installed',
) => {
  mcpType.value = type;
  currentPage.value = 1;
  
  if (type === 'all_select') {
    mcpIsActive.value = null;
    mcpIsInstall.value = null;
  } else if (type === 'installed') {
    mcpIsInstall.value = true;
  } else {
    mcpIsInstall.value = false;
  }
  
  queryList(pluginType.value);
};

function onCopyServiceId(id: string) {
  writeText(id);
  successMsg(t('feedback.copied_successfully'));
}

const handleDelPlugin = async (id: string) => {
  const message =
    pluginType.value === 'semantic_interface'
      ? t('plugin_center.confirm_delete_interface')
      : t('plugin_center.confirm_delete_server');
  ElMessageBox.confirm(message, t('common.tip'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
    icon: markRaw(IconAlarm),
  }).then(async () => {
    const [, res] =
      pluginType.value === 'semantic_interface'
        ? await api.deleteSingleApiData({
            serviceId: id,
          })
        : await api.deleteMcpService(id);
    if (res) {
      successMsg(t('common.delete_success'));
      queryList(pluginType.value);
    }
  });
};

async function showActive(item: any) {
  if (item.isActive) {
    onActiveService(item.serviceId!, item.isActive);
  } else {
    const [, res] = await api.getMcpServiceDetail(item.serviceId!, true);
    if (res) {
      activeModelVisible.value = true;
      activeModelItem.value = res.result;
    }
  }
}

function doActive(form: any) {
  if (activeModelItem.value?.serviceId) {
    onActiveService(activeModelItem.value.serviceId, false, form);
  }
}

async function onActiveService(
  serviceId: string,
  active: boolean = true,
  mcpEnv?: any,
) {
  loading.value = true;
  const [, res] = await api.activeMcpService(serviceId, !active, mcpEnv);
  if (res) {
    queryList(pluginType.value);
    ElMessage.success('Success');
    loading.value = false;
  }
}

async function onInstallService(serviceId: string) {
  const [, res] = await api.installMcpService(serviceId);
  if (res) {
    successMsg(t('plugin_center.mcp.install_success'));
    queryList(pluginType.value);
  }
}

function onPluginTypeClick(type: 'semantic_interface' | 'mcp') {
  if (pluginType.value === type) {
    return;
  }
  pluginType.value = type;
  currentPage.value = 1;
  queryList(pluginType.value);
}

watch(
  () => [apiSearchValue, apiSearchType],
  () => {
    currentPage.value = 1;
    queryList(pluginType.value);
  },
  { deep: true },
);

onMounted(() => {
  queryList(pluginType.value);
});

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>
<style lang="scss" scoped>
.create-button__icon {
  border-radius: 20px;
}
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid var(--o-border-color-light);
  flex-shrink: 0;
}
.pagination {
  display: flex !important;
  justify-self: center !important;
}
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
  .loading,
  .statusDiv {
    display: flex;
    height: auto;
    width: 100%;
    background-color: linear-gradient(
      127.95deg,
      rgba(109, 227, 250, 0.2) -1.967%,
      rgba(90, 179, 255, 0.2) 98.202%
    );
    border-radius: 8px;
    border-top-left-radius: 0px;
    margin-left: 8px;
    flex-wrap: nowrap;
    gap: 2px;
    @keyframes rotate-img {
      from {
        transform: rotate(0);
      }

      to {
        transform: rotate(360deg);
      }
    }

    img {
      width: 16px;
      height: 16px;
    }

    &-anime-icon {
      width: 16px;
      height: 16px;
      align-items: center;
      align-self: center;
      animation: rotate-img 1s infinite linear;
    }

    &-text {
      font-size: 12px;
      color: var(--o-text-color-primary);
      white-space: nowrap;
    }
  }
}

img {
  width: 100%;
  max-width: 430px;
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
  padding-right: 8px;
  flex-shrink: 0;
  --o-tabs-font-size: 14px;
  --o-tabs-item-padding: 5px 16px 0 5px;
  --o-tabs-line-height: 32px;
  --o-tabs-color_active: rgb(99, 149, 253);
}
</style>
