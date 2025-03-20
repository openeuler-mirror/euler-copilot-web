<template>
  <CustomLoading :loading="loading"></CustomLoading>
  <div class="apiCenterBox">
    <div class="apiCenterMain">
      <div class="apiCenterTitle">
        {{ $t('semantic.semantic_interface_center') }}
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
              <el-option :label="$t('semantic.interface_name')" value="name" />
              <el-option
                :label="$t('semantic.interface_introduction')"
                value="description"
              />
              <el-option :label="$t('semantic.username')" value="author" />
            </el-select>
          </template>
        </el-input>
        <el-button
          type="primary"
          class="createapi"
          @click="openSidebar('upload', '')"
        >
          {{ $t('semantic.interface_upload') }}
        </el-button>
      </div>
      <div class="apiCenterType">
        <div
          class="apiCenterBtn"
          :class="{ apiCenterBtnActive: apiType === 'my' }"
          @click="handleSearchapiList('my')"
        >
          {{ $t('semantic.all_interface') }}
        </div>
        <div
          class="apiCenterBtn"
          :class="{ apiCenterBtnActive: apiType === 'createdByMe' }"
          @click="handleSearchapiList('createdByMe')"
        >
          {{ $t('semantic.my_upload') }}
        </div>
        <div
          class="apiCenterBtn"
          :class="{ apiCenterBtnActive: apiType === 'favorited' }"
          @click="handleSearchapiList('favorited')"
        >
          {{ $t('semantic.my_favorite') }}
        </div>
      </div>
      <div class="apiCenterCardContainer">
        <div class="apiCenterCardBox" v-if="apiList?.length">
          <div v-for="apiItem in apiList" class="apiCenterCardSingle">
            <div
              class="apiCenterCardTop"
              @click="openSidebar('get', apiItem.serviceId)"
            >
              <div class="apiCenterCardIcon">
                <el-icon class="menu-icon">
                  <img
                    class="create-button__icon"
                    src="@/assets/svgs/robot_icon.svg"
                  />
                </el-icon>
              </div>
              <div class="apiCenterCardContent">
                <div class="apiCenterCardContentTop">
                  <div class="apiCenterCardContentTitle">
                    {{ apiItem.name }}
                  </div>
                  <div
                    class="apiCenterCardContentCollect"
                    :class="
                      !apiItem.published && apiType === 'createdByMe'
                        ? 'noClick'
                        : ''
                    "
                    @click.stop="handleFavorite($event, apiItem)"
                  >
                    <IconFavorite
                      v-if="apiItem.favorited"
                      class="apiFavorite"
                    />
                    <IconUnfavorite v-else="apiItem.favorited" />
                  </div>
                </div>
                <div class="apiCenterCardContentDes">
                  <TextMoreTootip :value="apiItem.description" :row="2" />
                </div>
              </div>
            </div>
            <div class="apiCenterCardBottom">
              <div class="apiCenterCardUser">@{{ apiItem.author }}</div>
              <div
                class="apiCenterCardOps"
                v-if="userinfo.user_sub === apiItem.author"
              >
                <el-button text @click="openSidebar('edit', apiItem.serviceId)">
                  {{ $t('semantic.interface_edit') }}
                </el-button>
                <el-button text @click="handleDelapi(apiItem)">
                  {{ $t('semantic.interface_delete') }}
                </el-button>
              </div>
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
      show-close="false"
      header-class="drawerHeader"
      destory-on-close="true"
      :direction="direction"
      :before-close="handleClose"
    >
      <div class="drawerContent">
        <div v-if="actions === 'upload'">
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
</template>
<script setup lang="ts">
import {
  IconCaretDown,
  IconSearch,
  IconFavorite,
  IconUnfavorite,
} from '@computing/opendesign-icons';
import './style.scss';
import TextMoreTootip from '@/components/textMoreTootip/index.vue';
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

const apiList = ref();
const drawer = ref(false);
const direction = ref('rtl');
const actionName = ref('');
const router = useRouter();
const actions = ref();
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
  handleParmasQueryapiList();
};

const getServiceYamlFun = async (id: string) => {
  await api.querySingleApiData({ serviceId: id, edit: true }).then((res) => {
    if (res) {
      //res[1] res 取决于当前环境
      getServiceYaml.value = jsYaml.dump(res[1]?.result.data);
      getServiceName.value = res[1]?.result.name;
    }
  });
};

const getServiceJsonFun = async (id: string) => {
  await api.querySingleApiData({ serviceId: id }).then((res) => {
    if (res) {
      //res[1] res 取决于当前环境
      getServiceJson.value = res[1]?.result.apis;
      getServiceName.value = res[1]?.result.name;
    }
  });
};

const openSidebar = (action: string, id: string) => {
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
};

const handleClose = () => {
  actions.value = '';
  getServiceJson.value = '';
  getServiceYaml.value = '';
  drawer.value = false;
  handleParmasQueryapiList();
};

const handleParmasQueryapiList = (params?: any) => {
  let payload = {};
  if (apiType.value !== 'my') {
    payload[apiType.value] = true;
  }
  handleQueryApiList({
    searchType: apiSearchType.value,
    keyword: apiSearchValue.value,
    ...payload,
    ...params,
  });
};

const handleQueryApiList = (payload?: any) => {
  loading.value = true;
  api
    .queryApiList({
      page: currentPage.value,
      pageSize: currentPageSize.value,
      ...payload,
    })
    .then((res) => {
      apiList.value = res[1]?.result.services;
      currentPage.value = res[1]?.result.currentPage;
      totalCount.value = res[1]?.result.totalCount;
      loading.value = false;
    });
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
      handleParmasQueryapiList();
    });
};

const handleSearchapiList = (type) => {
  apiType.value = type;
  if (type === 'my') {
    handleParmasQueryapiList();
  } else {
    currentPage.value = 1;
    currentPageSize.value = 16;
    handleParmasQueryapiList({
      [type]: true,
    });
  }
};

const handleDelapi = (item) => {
  ElMessageBox.confirm('确定删除此接口吗？', '提示', {
    type: 'warning',
    icon: markRaw(IconAlarm),
  }).then(() => {
    api
      .deleteSingleApiData({
        serviceId: item.serviceId,
      })
      .then((res) => {
        if (res[1]) {
          successMsg('删除成功');
          handleParmasQueryapiList();
        }
      });
  });
};

const handleEditapi = (e, item) => {
  e.stopPropagation();
  router.push(`/createapi?apiId=${item.apiId}`);
};

watch(
  () => [apiSearchValue, apiSearchType],
  () => {
    handleParmasQueryapiList();
  },
  { deep: true },
);

onMounted(() => {
  handleQueryApiList();
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
  }
  .el-drawer__header {
    color: pink;
    margin-bottom: 0px !important;
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
.el-drawer__body {
  padding: 0px 24px 16px;
  .drawerBody {
    height: 100%;
    textarea {
      width: 100%;
      height: 100%;
    }
  }
}
:deep(.el-drawer__header) {
  margin-bottom: 0px !important;
}
</style>
