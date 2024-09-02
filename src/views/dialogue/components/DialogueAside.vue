<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { api } from 'src/apis';
import { useHistorySessionStore, useSessionStore, useChangeThemeStore } from 'src/store';
import SessionCard from 'src/components/sessionCard/SessionCard.vue';
import { errorMsg, successMsg } from 'src/components/Message';

const { isAnswerGenerating } = storeToRefs(useSessionStore());
const { historySession, isSelectedAll, selectedSessionIds } = storeToRefs(useHistorySessionStore());
const { conversationList } = storeToRefs(useSessionStore());
const { selectAllSession, getHistorySession, createNewSession, initSessionList } =
  useHistorySessionStore();
const { currentSelectedSession,disable } = storeToRefs(useHistorySessionStore());
const themeStore = useChangeThemeStore();

const dialogVisible = ref(false);
// 搜索的关键词
const searchKey = ref<string>('');
// 关键词过滤后的列表
const filteredHistorySession = computed(() =>
  searchKey.value
    ? historySession.value.filter((session) => session.title.includes(searchKey.value))
    : historySession.value
);

// 批量删除
const isBatchDeletion = ref<boolean>(false);

/**
 * 删除会话记录
 */
const deleteSession = async () => {
  dialogVisible.value = false;
  const session_id_list = deleteType.value?selectedSessionIds.value:sessionList.value;
  const [, res] = await api.deleteSession({session_id_list});
  if (res) {
    selectedSessionIds.value = [];
    currentSelectedSession.value = '';
    successMsg('删除成功');
    if (isSelectedAll.value == true) {
      historySession.value = [];
      isBatchDeletion.value = false;
      selectedSessionIds.value = [];
    } else {
      getHistorySession();
      isBatchDeletion.value = false;
      selectedSessionIds.value = [];
    }
  } else {
    errorMsg('删除失败');
  }
  // 全删除
  if (isSelectedAll) {
    selectedSessionIds.value = []
    conversationList.value = [];
  }
};
const selectedIdLen = computed(() => selectedSessionIds.value.length);

const cancelDeleteSession = () => {
  isBatchDeletion.value = false;
  isSelectedAll.value = false;
  initSessionList();
};

const deleteSessionList = () => {

  deleteType.value = true;
  dialogVisible.value = true;
  isSelectedAll.value = false;
};

const activeNames = ref(['today','week','month','other']);

const checkDate = (x:string|Date) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const oneDay = 24*60*60*1000;
  const oneWeek = oneDay * 7;
  // const oneMonth = oneWeek * 7;
  const xDateOnly = new Date(x);
  const todayDateOnly = new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const sign = (xDateOnly - todayDateOnly) > 0 ? 1 : 0;
  const diff = Math.abs(xDateOnly - todayDateOnly);
  if((diff < oneDay && sign)||diff === 0){
    return "one";
  }else if (diff < oneWeek){
    return "seven";
  }else {
    return "else";
  }
};

const name = ref('');
const sessionList = ref();
const deleteType = ref(true);
const deleteOne = (deleteName:string,list:string[]) => {
  deleteType.value = false;
  sessionList.value = list;
  name.value = deleteName;
  dialogVisible.value = true;
}

const a = ref(document.getElementsByClassName('dialogue-history'));

onMounted(() => {
  getHistorySession();
})

const openNav = () => {
  if(document.getElementById('dialogue-history').style.width === '0px'){
    document.getElementById('dialogue-history').style.width = '312px';
    // document.getElementById('dialogue-history').style.minWidth = '289px';
    document.getElementById('dialogue-history').style.left = '';
    document.getElementById('nav-button').style.left = '312px';
  }else{
    document.getElementById('dialogue-history').style.width = '0px';
    document.getElementById('dialogue-history').style.left = '-400px';
    document.getElementById('nav-button').style.left = '400px';
  }
}

const openUrl = function () {
  window.open('https://hiss.shixizhi.huawei.com/portal/1643780836745113602?sxz-lang=zh_CN&pageId=1643780840505217026')
}
</script>

<template>
  <aside class="dialogue-history" id="dialogue-history">
    <div class="nav-button" @click='openNav()' id='nav-button'></div>
    <el-button
      class="create-button"
      :disabled="isAnswerGenerating||disable"
      @click="createNewSession"
    >
      <img class="create-button__icon" src="src/assets/svgs/create.svg" />
      <span>新建对话</span></el-button
    >
    <!-- 历史记录 -->
    <div class="history-record">
      <div class="history-record-title">
        <h4>历史记录</h4>
        <span v-if="!isBatchDeletion" @click="isBatchDeletion = true" class="batch-delete" >批量删除</span>
        <span v-else>
          <span @click="deleteSessionList()">删除</span>
          <span @click="cancelDeleteSession()">取消</span>
        </span>
      </div>
      <div>
        <el-input v-model="searchKey" placeholder="搜索历史记录" class="search-input" clearable=''>
          <template #suffix>
            <img class="search-input__icon" src="src/assets/svgs/search.svg" />
          </template>
        </el-input>
        <p class="history-record-tips">仅展示最近200条对话</p>
      </div>
      
      <div v-if="isBatchDeletion" class="history-record-delete">
        <el-checkbox
          class="checkbox"
          v-model="isSelectedAll"
          label="全选"
          size="large"
          @change="selectAllSession"
        />
      </div>
      <ul class="history-record-list demo-collapse demo-Foundations-collapse" v-if="filteredHistorySession.length">
        <el-collapse v-model="activeNames" class='o-hpc-collapse' :prefix-icon='Icon'>
          <el-collapse-item title="今天" name="today">
        <template v-for="item in filteredHistorySession" :key="item.sessionId">
          <SessionCard 
          v-if="checkDate(item.createdTime) == 'one'"  
          :session="item" 
          :deletion="isBatchDeletion"
          @deleteOne = "deleteOne"/>
        </template>
      </el-collapse-item>
      <el-collapse-item title="最近7天" name="week">
        <template v-for="item in filteredHistorySession" :key="item.sessionId">
          <SessionCard 
          v-if="checkDate(item.createdTime) == 'seven'" 
          :session="item" 
          :deletion="isBatchDeletion"
          @deleteOne = "deleteOne" />
        </template>
      </el-collapse-item>
      <el-collapse-item title="最近30天" name="month">
        <template v-for="item in filteredHistorySession" :key="item.sessionId">
          <SessionCard 
          v-if="checkDate(item.createdTime) == 'else'" 
          :session="item" 
          :deletion="isBatchDeletion"
          @deleteOne = "deleteOne" />
        </template>
      </el-collapse-item>
    </el-collapse>
      </ul>
      <div v-else class="history-record-null">
        <img v-if="themeStore.theme === 'dark'" src="src/assets/svgs/dark_null.svg"/>
        <img v-else src="src/assets/svgs/light_null.svg" alt="">
        <span>暂无历史会话</span>
      </div>
    </div>
    <div class='history-record-blogroll'>
      <el-divider/>
      <h>友情链接</h>
      <p @click='openUrl'>基础软件服务能力平台</p>
    </div>
    <el-dialog 
    class="dialog" 
    v-model="dialogVisible" 
    title="提示" 
    width="450px"
    align-center
    >
      <div class="dialog-delete_all">
        <img class="dialog-delete_all_svg" src="src/assets/svgs/alarm.svg" />
        <span class="dialog-delete_all_text" v-if="deleteType">确定删除已选中的共计
          <span>{{ selectedIdLen }}</span>条对话吗
          </span>
        <span class="dialog-delete_all_text" v-else>确定删除【{{ name }}】吗?
        </span>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" class='primary-button' @click="deleteSession"> 确定 </el-button>
          <el-button @click="dialogVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </aside>
</template>

<style lang="scss" scoped>


:deep(.el-dialog__footer .el-button){
  margin: 0px 0px 0px 8px;
}

:deep(.el-dialog:focus){

  width: 432px !important;

}
:deep(.el-dialog){

width: 432px !important;

}
.nav-button{
  background-image: var(--o-sider);
  position: absolute ;
  left: 312px;
  top: 50%;
  background-size:auto;
  width: 16px;
  height: 58px;
  z-index:5;
  &:hover{
    background-image: var(--o-sider-hover);
  }
  &:active{
    background-image: var(--o-sider-active);
  }
}

:deep(.el-collapse-item__content){
  border-bottom: none;
  padding-bottom: 0px;
  margin: 1px;
}
:deep(.el-collapse-item__header){
  height: 24px;
  margin-bottom: 8px;
  color:#8D98AA;
  font-size:12px;
  border-top:none;
  border-bottom:none;
  padding: 0px;
}

:deep(.el-collapse-item__arrow ){
  margin: 1px 0px 0px 0px;
}
:deep(.el-collapse){
  border-top:none;
  border-bottom:none;
}
:deep(.el-collapse-item__wrap){
  border-bottom:none;
}

button[disabled] {
  color: white;
  background: #b8d9ff;
  border-color: #b8d9ff;
}
button[disabled]:hover {
  color: white;
  background: #b8d9ff;
  border-color: #b8d9ff;
}
:deep(.dialog .el-dialog__body) {
  padding: 24px 24px 32px 24px;
}
:deep(.dialog .el-dialog__footer) {
  padding: 0px 24px 24px 24px;
}
:deep(.el-input__wrapper) {
  box-shadow: none;
}
:deep(.dialog .el-dialog__header .el-dialog__headerbtn) {
  top: 18px !important;
}
.dialogue-history {
  // min-width: 312px;
  // min-width: 298px !important;
  transition: 0.5s color 0s;
  @media screen and (max-width: 1368px) and (max-height: 768px) {
    width: 260px;
    margin-right: 0px;
  }
  background-color: var(--o-bg-color-base);
  height: 100%;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 24px 0px 24px 24px;
  position: relative;
  .create-button {
    position: relative;
    width: calc(100% - 18px);
    height: 40px;
    font-size: 16px;
    background-image: linear-gradient(to right, #6d75fa, #5ab3ff);
    border-radius: 8px;
    border-color: #5ab3ff !important;
    padding-top: 8px;
    span {
      font-size: 16px;
      color: var(--o-color-white);
      line-height: 24px;
      vertical-align: inherit;
    }
    &__icon {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }

    &:hover{
      opacity:0.8;
      background-color: pink;
    }

    &:active{
      background-color: pink;
    }
  }
  :deep(.el-checkbox .el-checkbox__label) {
    color: var(--o-text-color-secondary) !important;
  }
  .history-record-delete {
    height: 16px;
    margin-bottom: 8px;
  }
  .history-record {
    margin-top: 15px;
    flex: 1;
    display: flex;
    height: calc(100% - 55px - 80px);
    flex-direction: column;
    /* 滚动条轨道样式 */
    ::-webkit-scrollbar-track {
      background-color: transparent !important;
    }
    ::-webkit-scrollbar {
      background-color: transparent !important;
      left: 12px;
      width: 3px;
      height: 3px;
    }
    /* 滚动条的滑块 */
    ::-webkit-scrollbar-thumb {
      background-color: #d3dce9 !important;
      border-radius: 3px;
    }

    &-blogroll{
      display: block;
      width: 265px;
      padding-right: 24px;

      .el-divider{
        margin: 16px 0px 16px 0px;
      }
      h{
        display: block;
        color: var(--o-text-color-primary);
        font-size: 12px;
        line-height: 16px;
        margin-bottom: 8px;
      }
      p{
        color: var(--o-text-color-secondary);
        font-size: 12px;
        line-height: 16px;
        &:hover{
          color: #5ab3ff;
        }
        &:active{
          color:#7aa5ff;
        }
      }

    }

    /* 滚动条滑块hover样式 */
  ::-webkit-scrollbar-thumb:hover {
     background-color: #d3dce9 !important; /* 鼠标悬停时的滚动条按钮颜色 */
  }


    &-tips {
      font-size: 12px;
      color: #8d98aa;
      margin: 5px 0;
    }
    &-delete {
      font-size: 12px;
      color: #4e5865;
      display: flex;
      align-items: center;
      margin-top: 3px;
      :deep(.el-checkbox__label) {
        font-size: 12px;
        color: #000;
      }
    }
    &-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-right: 18px;
      h4 {
        font-size: 16px;
        color: var(--o-text-color-primary);
        line-height: 24px;
        font-weight: 500;
      }
      span {
        font-size: 14px;
        cursor: pointer;
        margin-left: 8px;
        line-height: 16px;
        color:#6395fd;
        &:hover{
          color:#7aa5ff;
        }
        &:active{
          color:#6395fd;
        }
      }

    }
    .search-input {
      margin-top: 8px;
      width: calc(100% - 18px);
      font-size: 12px;
      border-radius: 4px;
      border: 1px solid var(--o-border-color-lighter);
      &__icon {
        width: 16px;
        height: 16px;
      }
    }
    &-list {
      width: 100%;
      height: 100%;
      overflow-y: auto;
    }
    &-null {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      img {
        width: 140px;
        height: 90px;
      }
      span {
        text-align: center;
        display: block;
        font-size: 12px;
        color: #4e5865;
      }
    }
    .history-record-tips {
      color: var(--o-text-color-secondary);
      margin-top: 8px;
      margin-bottom: 8px;
    }
  }
}
.tool-list {
  margin-top: 15px;
  &__item {
    position: relative;
    background-color: #f4f6fa;
    margin-bottom: 6px;
    padding: 10px 6px;
    font-size: 12px;
    border-radius: 4px;
    height: 60px;
    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    span {
      display: inline-block;
      text-align: center;
      vertical-align: middle;
    }
    img {
      width: 24px;
      height: 24px;
      top: 12px;
      position: relative;
      margin-right: 8px;
    }
  }
}
.tool-list {
  margin-top: 15px;
  &__item {
    position: relative;
    background-color: #f4f6fa;
    margin-bottom: 6px;
    padding: 10px 6px;
    font-size: 12px;
    border-radius: 4px;
    height: 60px;
    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    span {
      display: inline-block;
      text-align: center;
      vertical-align: middle;
    }
    img {
      width: 24px;
      height: 24px;
      top: 12px;
      position: relative;
      margin-right: 8px;
    }
  }
}
.dialog-delete_all {
  font-size: 12px;
  color: var(--o-text-color-secondary);
  display: flex;
  &_svg {
    margin-right: 16px;
  }
  &_text {
    align-self: center;
    font-size: 12px;
    color: var(--o-text-color-secondary);
    bottom: 5px;
    span {
      font-size: 16px;
      margin: 3px;
      font-weight: 500;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  button {
    width: 64px;
    height: 24px;
    border-radius: 1;
    font-size: 12px;
  }
}

primary-button {
  color: var(--o-button-color);
  background-color: var(--o-bg-color-light);

}
//强制修改dialog顶部样式信息
:deep(.dialog .el-dialog__header) {
  margin-right: 0px;
  border-radius: 4px 4px 0 0;
  padding: 15px 20px 15px 20px;
  .el-dialog__title {
    font-size: 16px;
    line-height: 25px;
    font-weight: 1000;
  }
  .el-dialog__headerbtn {
    top: 0px;
  }
}
:deep(.dialog .el-dialog__body) {
  padding: 24px 24px 32px 24px;
}
</style>
