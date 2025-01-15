<template>
  <div class="appCenterBox">
    <div class="appCenterMain">
      <div class="appCenterTitle">语义接口中心</div>
      <div class="appCenterSearch">
        <el-input style="max-width: 400px" placeholder="搜索" :suffix-icon="IconSearch">
          <template #prepend>
            <el-select placeholder="全部" style="width: 115px" :suffix-icon="IconCaretDown">
              <el-option label="Restaurant" value="1" />
              <el-option label="Order No." value="2" />
              <el-option label="Tel" value="3" />
            </el-select>
          </template>
        </el-input>
        <el-button type="primary" class="createApp" @click="openSidebar"> 上传 </el-button>
      </div>
      <div class="appCenterType">
        <div class="appCenterBtn appCenterBtnActive">全部接口</div>
        <div class="appCenterBtn">我的上传</div>
        <div class="appCenterBtn">我的收藏</div>
      </div>
      <div class="appCenterCardContainer">
        <div class="appCenterCardBox">
          <div v-for="appItem in appList" class="appCenterCardSingle">
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
    </div>
    <el-drawer
      v-model="drawer"
      title="上传语义接口"
      :direction="direction"
      :before-close="handleClose"
    >
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import TextMoreTootip from '@/components/textMoreTootip/index.vue';
import { IconCaretDown, IconSearch, IconFavorite, IconUnfavorite } from '@computing/opendesign-icons';
import './style.scss';
import { reactive, ref } from 'vue';
const appList = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const drawer = ref(false)
const direction = ref('rtl')
const form = reactive({
  name: '',
  description: ''
})

const openSidebar = () => {
  drawer.value = true
}

const handleClose = (done) => {
  done();
}

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
