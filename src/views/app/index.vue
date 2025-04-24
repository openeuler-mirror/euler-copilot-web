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
              <el-option :label="$t('app.app_name')" value="name" />
              <el-option
                :label="$t('app.app_introduction')"
                value="description"
              />
              <el-option :label="$t('app.username')" value="author" />
            </el-select>
          </template>
        </el-input>
        <el-button type="primary" class="createApp" @click="handleCreateApp">
          {{ $t('app.app_create') }}
        </el-button>
      </div>
      <div class="appCenterType">
        <div
          class="appCenterBtn"
          :class="{ appCenterBtnActive: appType === 'my' }"
          @click="handleSearchAppList('my')"
        >
          {{ $t('app.all_app') }}
        </div>
        <div
          class="appCenterBtn"
          :class="{ appCenterBtnActive: appType === 'createdByMe' }"
          @click="handleSearchAppList('createdByMe')"
        >
          {{ $t('app.my_created') }}
        </div>
        <div
          class="appCenterBtn"
          :class="{ appCenterBtnActive: appType === 'favorited' }"
          @click="handleSearchAppList('favorited')"
        >
          {{ $t('app.my_favorite') }}
        </div>
      </div>
      <div class="appCenterCardContainer">
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
  </div>
</template>
<script setup lang="ts">
import TextMoreTootip from '@/components/textMoreTootip/index.vue';

import {
  IconCaretDown,
  IconSearch,
  IconFavorite,
  IconUnfavorite,
  IconSuccess,
} from '@computing/opendesign-icons';
import './style.scss';
import { ref, onMounted, watch, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/apis';
import { ElMessage, ElMessageBox } from 'element-plus';
import { IconAlarm } from '@computing/opendesign-icons';
import DefaultAppIcon from '../../assets/svgs/defaultIcon.webp';
import { storeToRefs } from 'pinia';
import { useAccountStore, useHistorySessionStore } from 'src/store';
import CustomLoading from '../customLoading/index.vue';
const { currentSelectedSession } = storeToRefs(useHistorySessionStore());
const publishStatus = ref('未发布');
const router = useRouter();
const appType = ref('my');
const appSearchType = ref('all');
const appSearchValue = ref();
const appList = ref<any>([]);
const pagination = ref({
  pageSizes: [16, 32, 64],
  layout: 'total,sizes,prev,pager,next,jumper',
});
const { userinfo } = storeToRefs(useAccountStore());
const currentPage = ref(1);
const totalCount = ref(0);
const loading = ref(false);
const currentPageSize = ref(pagination.value.pageSizes[0]);
const handleChangePage = (pageNum: number, pageSize: number) => {
  currentPage.value = pageNum;
  currentPageSize.value = pageSize;
  handleParmasQueryAppList();
};

const getImgBg = (appItem) => {
  return appItem.icon || DefaultAppIcon;
};

const handleCreateApp = () => {
  api
    .createOrUpdateApp({
      name: '默认应用',
      description: '我的应用',
    })
    .then((res) => {
      if (res[1]) {
        router.push(`/createApp?appId=${res?.[1]?.result.appId}`);
      }
    });
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

const handleParmasQueryAppList = (params?: any) => {
  let payload = {};
  if (appType.value !== 'my') {
    payload[appType.value] = true;
  }
  handleQueryAppList({
    searchType: appSearchType.value,
    keyword: appSearchValue.value,
    ...payload,
    ...params,
  });
};

const handleQueryAppList = (payload?: any) => {
  loading.value = true;
  api
    .queryAppList({
      page: currentPage.value,
      pageSize: currentPageSize.value,
      ...payload,
    })
    .then((res) => {
      appList.value = res[1]?.result.applications;
      currentPage.value = res[1]?.result.currentPage;
      totalCount.value = res[1]?.result.totalApps;
      loading.value = false;
    });
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
      handleParmasQueryAppList();
    });
};

const handleSearchAppList = (type) => {
  appType.value = type;
  if (type === 'my') {
    handleParmasQueryAppList();
  } else {
    currentPage.value = 1;
    currentPageSize.value = 16;
    handleParmasQueryAppList({
      [type]: true,
    });
  }
};

const handleDelApp = (e, item) => {
  e.stopPropagation();
  ElMessageBox.confirm('确定删除此应用吗？', '提示', {
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
            message: '删除成功',
            icon: IconSuccess,
            customClass: 'o-message--success',
            duration: 3000,
          });
          handleParmasQueryAppList();
        }
      });
  });
};

const handleEditApp = (e, item) => {
  e.stopPropagation();
  router.push(`/createApp?appId=${item.appId}`);
};

watch(
  () => [appSearchValue, appSearchType],
  () => {
    if (router.currentRoute.value.query.to === 'createdByMe') {
      handleSearchAppList('createdByMe');
    } else {
      handleParmasQueryAppList();
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
