<template>
  <div class="appCenterBox">
    <div class="appCenterMain">
      <div class="appCenterTitle">应用中心</div>
      <div class="appCenterSearch">
        <el-input style="max-width: 400px" placeholder="搜索" :suffix-icon="IconSearch">
          <template #prepend>
            <el-select v-model="appSearchType" style="width: 115px" :suffix-icon="IconCaretDown">
              <el-option label="全部" value="1" />
              <el-option label="应用名称" value="2" />
              <el-option label="应用简介" value="3" />
              <el-option label="用户名称" value="4" />
            </el-select>
          </template>
        </el-input>
        <el-button type="primary" class="createApp" @click="handleCreateApp"> 创建应用 </el-button>
      </div>
      <div class="appCenterType">
        <div class="appCenterBtn appCenterBtnActive">我的应用</div>
        <div class="appCenterBtn">我的创建</div>
        <div class="appCenterBtn">我的收藏</div>
      </div>
      <div class="appCenterCardContainer">
        <div class="appCenterCardBox">
          <div v-for="(appItem, index) in appList" :key="index" class="appCenterCardSingle" @click="routerToDetail(appItem)">
            <div class="appCenterCardTop">
              <div class="appCenterCardIcon">
                <el-icon class="menu-icon"
                  ><img class="create-button__icon" src="@/assets/svgs/robot_icon.svg"
                /></el-icon>
              </div>
              <div class="appCenterCardContent">
                <div class="appCenterCardContentTop">
                  <div class="appCenterCardContentTitle">智能助手</div>
                  <div class="appCenterCardContentCollect">
                    <IconUnfavorite />
                  </div>
                </div>
                <div class="appCenterCardContentDes">
                  <TextMoreTootip
                    value="测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试"
                    :row="2"
                  />
                </div>
              </div>
            </div>
            <div class="appCenterCardBottom">
              <div class="appCenterCardUser">@zhang</div>
              <div class="appCenterCardOps">
                <el-button text>编辑</el-button>
                <el-button text>删除</el-button>
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
        :total="appInfoList.length"
        popper-class="appPagination"
        @change="handleChangePage"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import TextMoreTootip from '@/components/textMoreTootip/index.vue';

import { IconCaretDown, IconSearch, IconFavorite, IconUnfavorite } from '@computing/opendesign-icons';
import './style.scss';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

const appInfoList = ref(new Array(36));
const appSearchType = ref('1')
const appList = ref<any>([]);
const pagination = ref({
  pageSizes: [16, 32, 64],
  layout: 'total,sizes,prev,pager,next,jumper',
});
const currentPage = ref(1);
const totalCount = ref(0);
const currentPageSize = ref(pagination.value.pageSizes[0]);


const handleChangePage = (pageNum: number, pageSize: number) => {
  appList.value = appInfoList.value.slice(((pageNum - 1) * 16) ,pageNum * 16)
};

const handleCreateApp = ()=>{
  router.push('/createApp');
}

const routerToDetail = (appItem) => {
  //获取appItem.id & appItem.name
  router.push(`/copilot?id=1213&name=ppp`);
}

onMounted(() => {
  appList.value = appInfoList.value.slice(0, 16);
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
