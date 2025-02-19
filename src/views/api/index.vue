<template>
  <div class="apiCenterBox">
    <div class="apiCenterMain">
      <div class="apiCenterTitle">语义接口中心</div>
      <div class="apiCenterSearch">
        <el-input style="max-width: 400px" placeholder="搜索" :suffix-icon="IconSearch">
          <template #prepend>
            <el-select placeholder="全部" style="width: 115px" :suffix-icon="IconCaretDown">
              <el-option label="Restaurant" value="1" />
              <el-option label="Order No." value="2" />
              <el-option label="Tel" value="3" />
            </el-select>
          </template>
        </el-input>
        <el-button type="primary" class="createapi" @click="openSidebar('upload')">上传</el-button>
      </div>
      <div class="apiCenterType">
        <div class="apiCenterBtn" :class="{ apiCenterBtnActive: apiType === 'my' }" @click="handleSearchapiList('my')">
          全部接口
        </div>
        <div
          class="apiCenterBtn"
          :class="{ apiCenterBtnActive: apiType === 'createdByMe' }"
          @click="handleSearchapiList('createdByMe')"
        >
        我的上传
        </div>
        <div
          class="apiCenterBtn"
          :class="{ apiCenterBtnActive: apiType === 'favorited' }"
          @click="handleSearchapiList('favorited')"
        >
          我的收藏
        </div>
      </div>
      <div class="apiCenterCardContainer">
        <div class="apiCenterCardBox">
          <div v-for="apiItem in apiList" class="apiCenterCardSingle">
            <div class="apiCenterCardTop" @click="openSidebar('get')">
              <div class="apiCenterCardIcon">
                <el-icon class="menu-icon"
                  ><img class="create-button__icon" src="@/assets/svgs/robot_icon.svg"
                /></el-icon>
              </div>
              <div class="apiCenterCardContent">
                <div class="apiCenterCardContentTop">
                  <div class="apiCenterCardContentTitle">智能助手</div>
                  <div
                    class="apiCenterCardContentCollect"
                    :class="!apiItem.published && apiType === 'createdByMe' ? 'noClick' : ''"
                    @click.stop="handleFavorite($event, apiItem)"
                  >
                    <IconFavorite v-if="apiItem.favorited" class="apiFavorite" />
                    <IconUnfavorite v-else="apiItem.favorited" />
                  </div>
                </div>
                <div class="apiCenterCardContentDes">
                  <TextMoreTootip
                    value="测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试"
                    :row="2"
                  />
                </div>
              </div>
            </div>
            <div class="apiCenterCardBottom">
              <div class="apiCenterCardUser">@zhang</div>
              <div class="apiCenterCardOps">
                <el-button text @click="openSidebar('edit')">编辑</el-button>
                <el-button text>删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-drawer v-model="drawer" :title="actionName" :direction="direction" :before-close="handleClose">
      <h1>{{ action }}</h1>
      <Upload />
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { IconCaretDown, IconSearch, IconFavorite, IconUnfavorite } from '@computing/opendesign-icons';
import './style.scss';
import TextMoreTootip from '@/components/textMoreTootip/index.vue';
import { ref, onMounted, watch, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/apis';
import { ElMessage, ElMessageBox } from 'element-plus';
import { IconAlarm } from '@computing/opendesign-icons';
import Upload from "@/components/Upload/index.vue";
import UploadProgress from "@/components/Upload/uploadProgress.vue";
const apiList = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const drawer = ref(false);
const direction = ref('rtl');
const action = ref('');
const actionName = ref('');
const router = useRouter();
const apiType = ref('my');
const apiSearchType = ref('all');
const apiSearchValue = ref();
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
  handleParmasQueryapiList();
};

const openSidebar = (actions: string) => {
  drawer.value = true;
  action.value = actions;
  if( actions === 'upload') {
    // 展示上传的框架
    actionName.value = '上传语义接口';
  }else if( actions === 'edit') {
    // 展示编辑的框架
    actionName.value = '编辑语义接口';
  }else if( actions === 'get'){
    // 展示查看的框架
    
  }else{
    // 展示xx的框架
  }
  console.log('actions', actions);
};

const handleClose = done => {
  done();
};

const handleCreateapi = () => {
  api
    .createOrUpdateapi({
      name: '默认应用',
      description: '我的应用',
    })
    .then(res => {
      if (res[1]) {
        router.push(`/createapi?apiId=${res?.[1]?.result.apiId}`);
      }
    });
};

const routerToDetail = apiItem => {
  //获取apiItem.id & apiItem.name
  router.push(`/copilot?apiId=${apiItem.apiId}&name=${encodeURIComponent(encodeURI(apiItem.name))}`);
};

const handleParmasQueryapiList = (params?: any) => {
  let payload = {};
  if (apiType.value !== 'my') {
    payload[apiType.value] = true;
  }
  handleQueryapiList({
    searchType: apiSearchType.value,
    keyword: apiSearchValue.value,
    ...payload,
    ...params,
  });
};

const handleQueryapiList = (payload?: any) => {
  api
    .queryapiList({
      page: currentPage.value,
      pageSize: currentPageSize.value,
      ...payload,
    })
    .then(res => {
      apiList.value = res[1]?.result.apilications;
      currentPage.value = res[1]?.result.currentPage;
      totalCount.value = res[1]?.result.totalapis;
    });
};

const handleFavorite = (e, item) => {
  // 未发布的不可收藏
  if (!item.published && apiType.value === 'createdByMe') {
    return;
  }
  e.stopPropagation();
  api
    .changeSingleapiCollect({
      id: item.apiId,
      favorited: !item.favorited,
    })
    .then(res => {
      handleParmasQueryapiList();
    });
};

const handleSearchapiList = type => {
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

const handleDelapi = (e, item) => {
  e.stopPropagation();
  ElMessageBox.confirm('确定删除此应用吗？', '提示', {
    type: 'warning',
    icon: markRaw(IconAlarm),
  }).then(() => {
    api
      .deleteSingleapiData({
        id: item.apiId,
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
          handleParmasQueryapiList();
        }
      });
  });
};

const handleEditapi = (e, item) => {
  e.stopPropagation();
  router.push(`/createapi?apiId=${item.apiId}`);
};

// watch(
//   () => [apiSearchValue, apiSearchType],
//   () => {
//     handleParmasQueryapiList();
//   },
//   { deep: true },
// );

// onMounted(() => {
//   handleQueryapiList();
// });
</script>
<style lang="scss" scoped>
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
</style>
