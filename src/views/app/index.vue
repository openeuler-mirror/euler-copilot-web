<template>
  <div class="appCenterBox">
    <div class="appCenterMain">
      <CustomLoading :loading="loading"></CustomLoading>
      <div class="appCenterTitle">{{ $t('app.app_center') }}</div>
      <div class="appCenterSearch">
        <el-input
          style="max-width: 400px"
          v-model="appSearchValue"
          :placeholder="$t('app.app_search')"
          :suffix-icon="IconSearch"
        >
          <template #prepend>
            <el-select
              v-model="appSearchType"
              style="width: 115px"
              :suffix-icon="IconCaretDown"
            >
              <el-option :label="$t('app.all_select')" value="all" />
              <el-option :label="$t('app.flow')" value="flow" />
              <el-option :label="$t('app.agent')" value="agent" />
            </el-select>
          </template>
        </el-input>
        <el-button
          type="primary"
          class="createApp"
          @click="isSelectAppTypeDialogVisible = true"
        >
          {{ $t('app.app_create') }}
        </el-button>
      </div>
      <div class="appCenterCardContainer">
        <el-tabs
          v-model="pluginType"
          class="app-tabs"
          @tab-click="(tab) => handleSearchAppList(tab.props.name)"
        >
          <el-tab-pane
            :label="$t('semantic.all_select')"
            name="my"
            :lazy="true"
          ></el-tab-pane>
          <el-tab-pane
            :label="$t('app.my_created')"
            name="createdByMe"
            :lazy="true"
          ></el-tab-pane>
          <el-tab-pane
            :label="$t('semantic.my_favorite')"
            name="favorited"
            :lazy="true"
          ></el-tab-pane>
        </el-tabs>

        <div class="appCenterCardBox" v-if="appList?.length">
          <div
            v-for="(appItem, index) in appList"
            :key="index"
            class="appCenterCardSingle"
            @click="routerToDetail(appItem)"
          >
            <div class="appCenterCardTop">
              <div class="appCenterCardIcon">
                <el-icon class="menu-icon">
                  <img class="create-button__icon" :src="getImgBg(appItem)" />
                </el-icon>
              </div>
              <div class="appCenterCardContent">
                <div class="appCenterCardContentTop">
                  <div class="appCenterCardContentTitle">
                    {{ appItem.name }}
                  </div>
                  <div
                    class="appCenterCardContentCollect"
                    :class="
                      !appItem.published && appType === 'createdByMe'
                        ? 'noClick'
                        : ''
                    "
                    @click.stop="handleFavorite($event, appItem)"
                  >
                    <IconFavorite
                      v-if="appItem.favorited"
                      class="appFavorite"
                    />
                    <IconUnfavorite v-else="appItem.favorited" />
                  </div>
                </div>
                <div class="appType">
                  <span
                    class="appTypeName"
                    :class="
                      appItem.appType === 'flow'
                        ? 'appTypeName__flow'
                        : 'appTypeName__agent'
                    "
                  >
                    {{
                      appItem.appType === 'flow'
                        ? $t('app.flow')
                        : $t('app.agent')
                    }}
                  </span>
                </div>
                <div class="appCenterCardContentDes">
                  <TextMoreTootip :value="appItem.description" :row="2" />
                </div>
              </div>
            </div>
            <div class="appCenterCardBottom">
              <div class="appCenterCardUser">@{{ appItem.author }}</div>
              <div
                class="appCenterCardOps"
                v-if="appItem.author === userinfo.user_sub"
              >
                <el-button text @click="handleEditApp($event, appItem)">
                  {{ $t('app.app_edit') }}
                </el-button>
                <el-button text @click="handleDelApp($event, appItem)">
                  {{ $t('app.app_delete') }}
                </el-button>
              </div>
            </div>
            <div
              class="unPublishSymbol"
              v-if="!appItem.published && appType === 'createdByMe'"
            >
              <div class="coverIcon"></div>
              <div class="textDesc">{{ $t('app.unpublished') }}</div>
            </div>
          </div>
        </div>
        <div class="appCenterNoData" v-else>
          <div class="noDataIcon"></div>
          <div class="desc">{{ $t('app.no_data') }}</div>
        </div>
      </div>
      <el-pagination
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
    <SelectAppTypeDialog
      v-model:visible="isSelectAppTypeDialogVisible"
      :title="$t('app.create_app')"
      @select-type="handleCreateApp"
    />
  </div>
</template>
<script setup lang="ts">
import {
  IconCaretDown,
  IconSearch,
  IconFavorite,
  IconUnfavorite,
  IconSuccess,
} from '@computing/opendesign-icons';
import './style.scss';
import { ref, watch, markRaw } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { IconAlarm } from '@computing/opendesign-icons';
import { api } from '@/apis';
import { useAccountStore, useHistorySessionStore } from '@/store';
import DefaultAppIcon from '../../assets/svgs/defaultIcon.webp';
import CustomLoading from '../customLoading/index.vue';
import SelectAppTypeDialog from './components/SelectAppTypeDialog.vue';
import TextMoreTootip from '@/components/textMoreTootip/index.vue';
import { useI18n } from 'vue-i18n';

interface App {
  appId: string;
  author: string;
  description: string;
  favorited: boolean;
  appType: 'flow' | 'agent';
  icon: string;
  name: string;
  published: boolean;
}
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const { currentSelectedSession } = storeToRefs(useHistorySessionStore());
const publishStatus = ref('未发布');
const appType = ref('my');
const appSearchValue = ref();
const appList = ref<App[]>([]);
const pagination = ref({
  pageSizes: [16, 32, 64],
  layout: 'total,sizes,prev,pager,next,jumper',
});
const { userinfo } = storeToRefs(useAccountStore());
const currentPage = ref<number>(1);
const totalCount = ref<number>(0);
const loading = ref(false);
const currentPageSize = ref(pagination.value.pageSizes[0]);
const handleChangePage = (pageNum: number, pageSize: number) => {
  currentPage.value = pageNum;
  currentPageSize.value = pageSize;
  handleParamsQueryAppList();
};

type AppFilter = 'my' | 'createdByMe' | 'favorited';
type AppType = 'flow' | 'agent' | 'all';
const pluginType = ref<AppFilter>((route.query.to as AppFilter) || 'my');
const appSearchType = ref<AppType>('all');

const isSelectAppTypeDialogVisible = ref(false);

const getImgBg = (appItem) => {
  return appItem.icon || DefaultAppIcon;
};

/**
 * 创建默认的应用
 * @param appType
 */
const handleCreateApp = async (appType: 'flow' | 'agent') => {
  const [, res] = await api.createOrUpdateApp({
    appType,
    name: '默认应用',
    description: '我的应用',
  });

  if (res) {
    router.push(`/createApp?appId=${res.result.appId}&type=${appType}`);
  }
};

const routerToDetail = (appItem) => {
  if (!appItem.published) {
    //未发布应用不允许跳转
    return;
  }
  //获取appItem.id & appItem.name
  router.push(`/?appId=${appItem.appId}&name=${appItem.name}`);
  //保证跳转后一定是一条选中的新会话
  currentSelectedSession.value = '';
};

const handleParamsQueryAppList = (params?: any) => {
  let payload = {};
  if (appType.value !== 'my') {
    payload[appType.value] = true;
  }
  handleQueryAppList({
    appType: appSearchType.value !== 'all' ? appSearchType.value : undefined,
    keyword: appSearchValue.value,
    ...payload,
    ...params,
  });
};

const handleQueryAppList = async (payload?: any) => {
  loading.value = true;
  const [, res] = await api.queryAppList({
    page: currentPage.value,
    pageSize: currentPageSize.value,
    ...payload,
  });

  if (res) {
    appList.value = res.result.applications;
    currentPage.value = res.result.currentPage;
    totalCount.value = res.result.totalApps;
  }
  loading.value = false;
};

const handleFavorite = (e, item) => {
  // 未发布的不可收藏
  if (!item.published && appType.value === 'createdByMe') {
    return;
  }
  e.stopPropagation();
  api
    .changeSingleAppCollect({
      id: item.appId,
      favorited: !item.favorited,
    })
    .then((res) => {
      handleParamsQueryAppList();
    });
};

const handleSearchAppList = (type) => {
  appType.value = type;
  if (type === 'my') {
    handleParamsQueryAppList();
  } else {
    currentPage.value = 1;
    currentPageSize.value = 16;
    handleParamsQueryAppList({
      [type]: true,
    });
  }
};

const handleDelApp = (e, item) => {
  e.stopPropagation();
  ElMessageBox.confirm(t('app.confirm_delete_app'), t('common.tip'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
    icon: markRaw(IconAlarm),
  }).then(() => {
    api
      .deleteSingleAppData({
        id: item.appId,
      })
      .then((res) => {
        if (res[1]) {
          ElMessage({
            showClose: true,
            message: t('common.delete_success'),
            icon: IconSuccess,
            customClass: 'o-message--success',
            duration: 3000,
          });
          handleParamsQueryAppList();
        }
      });
  });
};

const handleEditApp = (e: MouseEvent, item: App) => {
  e.stopPropagation();
  router.push(`/createApp?appId=${item.appId}&type=${item.appType || 'agent'}`);
};

watch(
  () => [appSearchValue, appSearchType],
  () => {
    if (router.currentRoute.value.query.to === 'createdByMe') {
      handleSearchAppList('createdByMe');
    } else {
      handleParamsQueryAppList();
    }
  },
  { deep: true, immediate: true },
);
</script>
<style lang="scss" scoped>
.create-button__icon {
  border-radius: 20px;
}
.appCenterCardSingle {
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
</style>

<style>
.app-tabs {
  --o-tabs-font-size: 14px;
  --o-tabs-item-padding: 5px 16px 0 5px;
  --o-tabs-line-height: 32px;
  --o-tabs-color_active: rgb(99, 149, 253);
}
</style>
