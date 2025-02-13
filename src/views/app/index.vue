<template>
  <div class="appCenterBox">
    <div class="appCenterMain">
      <div class="appCenterTitle">应用中心</div>
      <div class="appCenterSearch">
        <el-input style="max-width: 400px" v-model="appSearchValue" placeholder="搜索" :suffix-icon="IconSearch">
          <template #prepend>
            <el-select v-model="appSearchType" style="width: 115px" :suffix-icon="IconCaretDown">
              <el-option label="全部" value="all" />
              <el-option label="应用名称" value="name" />
              <el-option label="应用简介" value="description" />
              <el-option label="用户名称" value="author" />
            </el-select>
          </template>
        </el-input>
        <el-button type="primary" class="createApp" @click="handleCreateApp">创建应用</el-button>
      </div>
      <div class="appCenterType">
        <div class="appCenterBtn" :class="{ appCenterBtnActive: appType === 'my' }" @click="handleSearchAppList('my')">
          全部应用
        </div>
        <div
          class="appCenterBtn"
          :class="{ appCenterBtnActive: appType === 'createdByMe' }"
          @click="handleSearchAppList('createdByMe')"
        >
          我的创建
        </div>
        <div
          class="appCenterBtn"
          :class="{ appCenterBtnActive: appType === 'favorited' }"
          @click="handleSearchAppList('favorited')"
        >
          我的收藏
        </div>
      </div>
      <div class="appCenterCardContainer">
        <div class="appCenterCardBox">
          <div
            v-for="(appItem, index) in appList"
            :key="index"
            class="appCenterCardSingle"
            @click="routerToDetail(appItem)"
          >
            <div class="appCenterCardTop">
              <div class="appCenterCardIcon">
                <el-icon class="menu-icon">
                  <img class="create-button__icon" src="@/assets/svgs/robot_icon.svg" />
                </el-icon>
              </div>
              <div class="appCenterCardContent">
                <div class="appCenterCardContentTop">
                  <div class="appCenterCardContentTitle">{{ appItem.name }}</div>
                  <div class="appCenterCardContentCollect" @click="handleFavorite($event, appItem)">
                    <IconFavorite v-if="appItem.favorited" class="appFavorite" />
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
              <div class="appCenterCardOps">
                <el-button text @click="handleEditApp($event, appItem)">编辑</el-button>
                <el-button text @click="handleDelApp($event, appItem)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <el-pagination
        v-if="true"
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

import { IconCaretDown, IconSearch, IconFavorite, IconUnfavorite, IconSuccess } from '@computing/opendesign-icons';
import './style.scss';
import { ref, onMounted, watch, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/apis';
import { ElMessage, ElMessageBox } from 'element-plus';
import { IconAlarm } from '@computing/opendesign-icons';
const router = useRouter();
const appType = ref('my');
const appSearchType = ref('all');
const appSearchValue = ref();
const appList = ref<any>([]);
const pagination = ref({
  pageSizes: [16, 32, 64],
  layout: 'total,sizes,prev,pager,next,jumper',
});
const currentPage = ref(1);
const totalCount = ref(0);
const currentPageSize = ref(pagination.value.pageSizes[0]);

const handleChangePage = (pageNum: number, pageSize: number) => {
  currentPage.value = pageNum;
  currentPageSize.value = pageSize;
  handleParmasQueryAppList();
};

const handleCreateApp = () => {
  api
    .createOrUpdateApp({
      name: '默认应用',
      description: '我的应用',
    })
    .then(res => {
      if (res[1]) {
        router.push(`/createApp?appId=${res?.[1]?.result.appId}`);
      }
    });
};

const routerToDetail = appItem => {
  //获取appItem.id & appItem.name
  router.push(`/copilot?appId=${appItem.appId}&name=${encodeURIComponent(encodeURI(appItem.name))}`);
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
  api
    .queryAppList({
      page: currentPage.value,
      pageSize: currentPageSize.value,
      ...payload,
    })
    .then(res => {
      appList.value = res[1]?.result.applications;
      currentPage.value = res[1]?.result.currentPage;
      totalCount.value = res[1]?.result.totalApps;
    });
};

const handleFavorite = (e, item) => {
  e.stopPropagation();
  api
    .changeSingleAppCollect({
      id: item.appId,
      favorited: !item.favorited,
    })
    .then(res => {
      handleParmasQueryAppList();
    });
};

const handleSearchAppList = type => {
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
      .then(res => {
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
    handleParmasQueryAppList();
  },
  { deep: true },
);

onMounted(() => {
  handleQueryAppList();
});
</script>
<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

img {
  width: 100%;
  max-width: 430px;
}
</style>
