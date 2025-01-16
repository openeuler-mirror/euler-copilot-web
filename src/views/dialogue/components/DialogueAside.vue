<script setup lang="ts">
import {
  ElButton,
  ElInput,
  ElCheckbox,
  ElMessage,
  ElDivider,
  ElDialog,
  ElCollapse,
  ElCollapseItem,
  ElTooltip,
} from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import SessionCard from '@/components/sessionCard/SessionCard.vue';
import { useHistorySessionStore, useSessionStore } from '@/store';
import { storeToRefs } from 'pinia';
import { api } from '@/apis';
import { useI18n } from 'vue-i18n';
import { successMsg } from 'src/components/Message';
import i18n from 'src/i18n';
import { apiKeyApi } from 'srcapis/paths';

interface HistorySession {
  conversation_id: string;
  title: string;
  createdTime: string | Date;
}

const props = withDefaults(
  defineProps<{
    theme?: 'dark' | 'light';
  }>(),
  {
    theme: 'dark',
  },
);
const { t } = useI18n();
const { historySession, selectedSessionIds, isSelectedAll, currentSelectedSession } =
  storeToRefs(useHistorySessionStore());
const { app, appList } = storeToRefs(useSessionStore());
const { getHistorySession, createNewSession } = useHistorySessionStore();
const deleteType = ref(true);
// 搜索的关键词
const searchKey = ref<string>('');
const activeNames = ref(['today', 'week', 'month', 'other']);
const isCollapsed = ref(false);
const selectedAppId = ref(null);
//
const apps = ref([
  { id: 1, name: '应用 1' },
  { id: 2, name: '应用 2' },
  { id: 3, name: '应用 3' },
  { id: 4, name: '应用 4' },
  { id: 5, name: '应用 5' },
]);

const filteredHistorySessions = computed(() => {
  // filter by searchKey
  const filtered = searchKey.value
    ? historySession.value.filter(session => session.title.includes(searchKey.value))
    : historySession.value;
  const template: { key: string; title: string; list: HistorySession[] }[] = [
    {
      key: 'today',
      title: t('history.time_filter_today'),
      list: [],
    },
    {
      key: 'week',
      title: t('history.time_filter_last_7_days'),
      list: [],
    },
    {
      key: 'month',
      title: t('history.time_filter_last_30_days'),
      list: [],
    },
  ];
  filtered.forEach(session => {
    const key = checkDate(session.createdTime);
    template.find(item => item.key == key)?.list.push(session);
  });
  return template;
});

/**
 * Opens a new window with the specified URL.
 *
 * @return {void} This function does not return anything.
 */
function openUrl(): void {
  window.open('https://hiss.shixizhi.huawei.com/portal/1643780836745113602?sxz-lang=zh_CN&pageId=1643780840505217026');
}

/**
 * Checks the given date and returns a string indicating the time period it belongs to.
 *
 * @param {string | Date} date - The date to check.
 * @return {string} The time period the date belongs to. Possible values are "today", "week", "month", or "else".
 */
function checkDate(date: string | Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateTimestamp = new Date(date).getTime();
  if (dateTimestamp > today.getTime()) {
    return 'today';
  } else if (dateTimestamp > today.getTime() - 86400000 * 7) {
    return 'week';
  } else if (dateTimestamp > today.getTime() - 86400000 * 30) {
    return 'month';
  }
  return 'else';
}

const deletedSessionName = ref('');
const sessionList = ref();
/**
 * Deletes a session from the list and updates the UI.
 *
 * @param {string} sessionName - The name of the session to be deleted.
 * @param {string[]} list - The list of sessions.
 * @return {void} This function does not return anything.
 */
function deleteSessionList(): void {
  deleteType.value = true;
  dialogVisible.value = true;
  isSelectedAll.value = false;
}

/**
 * Deletes a session from the list and updates the UI.
 *
 * @param {string} sessionName - The name of the session to be deleted.
 * @param {string[]} list - The list of sessions.
 * @return {void} This function does not return anything.
 */
function deleteOne(sessionName: string, list: string[]): void {
  deleteType.value = false;
  deletedSessionName.value = sessionName;
  sessionList.value = list;
  dialogVisible.value = true;
}

const dialogVisible = ref(false);
// 批量删除
const isBatchDeletion = ref<boolean>(false);

/**
 * 删除会话记录
 */
const deleteSession = async () => {
  dialogVisible.value = false;
  const conversation_list = deleteType.value ? selectedSessionIds.value : sessionList.value;
  const [, res] = await api.deleteSession({ conversation_list });
  if (res) {
    selectedSessionIds.value = [];
    currentSelectedSession.value = '';
    successMsg(i18n.global.t('history.delete_successfully'));
    if (isSelectedAll.value == true) {
      historySession.value = [];
      isBatchDeletion.value = false;
    } else {
      getHistorySession();
      isBatchDeletion.value = false;
    }
  } else {
    ElMessage.error(i18n.global.t('history.delete_failed'));
  }
  if (isBatchDeletion.value) {
    isBatchDeletion.value = false;
    selectedSessionIds.value.length = 0;
  }
  dialogVisible.value = false;
};

/**
 * Cancels the deletion of sessions by setting the `isBatchDeletion` ref to `false`.
 *
 * @return {void} This function does not return anything.
 */
function cancelDeleteSession(): void {
  isBatchDeletion.value = false;
}

/**
 * Selects all session IDs in the `selectedSessionIds` array if `isSelectedAll` is true,
 * otherwise clears the `selectedSessionIds` array.
 *
 * @return {void} This function does not return anything.
 */
function selectAllSession(): void {
  isSelectedAll.value
    ? (selectedSessionIds.value = historySession.value.map(item => item.conversation_id))
    : (selectedSessionIds.value = []);
}

const copilotAside = ref<HTMLElement>();
const isCopilotAsideVisible = ref(true);

/**
 * Toggles the visibility of the CopilotAside component.
 *
 * @return {void} This function does not return anything.
 */
function hanleAsideVisible(): void {
  if (!copilotAside.value) return;
  if (isCopilotAsideVisible.value) {
    isCopilotAsideVisible.value = false;
  } else {
    isCopilotAsideVisible.value = true;
  }
}

const displayedApps = computed(() => {
  return apps.value.slice(0, 5);
});

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const selectApp = id => {
  selectedAppId.value = id;
};
function ensureAppAtFirstPosition() {
  if(!app.value.id){
    return;
  }
  const newApp = app.value;
  const index = apps.value.findIndex(app => app.id === newApp.id);
  selectApp(newApp.id);
  if (index !== -1 && index !== 0) {
    const [item] = apps.value.splice(index, 1);
    apps.value.unshift(item);
  } else if (index === -1) {
    apps.value.unshift(newApp);
  }
}

watch(
  () => app,
  () => {
    ensureAppAtFirstPosition();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <aside class="aside-wrapper" ref="copilotAside">
    <ElTooltip placement="right" :content="isCopilotAsideVisible ? t('history.collapse') : t('history.expand')">
      <div class="trapezoid" @click="hanleAsideVisible" />
    </ElTooltip>
    <transition name="transition-fade">
      <div class="copilot-aside" v-if="isCopilotAsideVisible">
        <div class="collapsible-apps">
          <div class="collapsible-header" @click="toggleCollapse">
            <div class="header-content">
              <AppWindowIcon :size="20" />
              <span>我的应用</span>
            </div>
            <ChevronDownIcon :size="20" :class="{ rotate: !isCollapsed }" />
          </div>
          <transition name="collapse">
            <ul v-if="!isCollapsed" class="app-list">
              <li
                v-for="app in displayedApps"
                :key="app.id"
                @click="selectApp(app.id)"
                :class="{ selected: selectedAppId === app.id }"
              >
                <span>{{ app.name }}</span>
              </li>
            </ul>
          </transition>
          <!-- 缺少空白切图 ；； 缺少空 appList 判断-->
        </div>
        <!-- <ElButton class="create-button" @click="createNewSession">
          <img class="create-button__icon" src="@/assets/svgs/create.svg" />
          <span>{{ $t('history.new_chat') }}</span>
        </ElButton> -->
        <!-- 历史记录 -->
        <div class="history-record">
          <div class="history-record-title">
            <h4>{{ $t('history.recent_chats') }}</h4>
            <span v-if="!isBatchDeletion" @click="isBatchDeletion = true" class="batch-delete">{{
              $t('history.delete_chats')
            }}</span>
            <span v-else>
              <span @click="deleteSessionList()">{{ $t('history.delete') }}</span>
              <span @click="cancelDeleteSession()">{{ $t('history.cancel') }}</span>
            </span>
          </div>

          <!-- search -->
          <div>
            <ElInput v-model="searchKey" :placeholder="$t('history.find_recent_chats')" class="search-input">
              <template #suffix>
                <img class="search-input__icon" src="@/assets/svgs/search.svg" />
              </template>
            </ElInput>
            <p class="history-record-tips">{{ $t('history.chat_history_limit') }}</p>
          </div>

          <div v-if="isBatchDeletion" class="history-record-delete">
            <ElCheckbox
              class="checkbox"
              v-model="isSelectedAll"
              :label="$t('history.select_all')"
              size="large"
              @change="selectAllSession"
            />
          </div>

          <ul class="history-record-list" v-if="filteredHistorySessions.length">
            <ElCollapse v-model="activeNames">
              <template v-for="item in filteredHistorySessions" :key="item.key">
                <ElCollapseItem :title="item.title" :name="item.key">
                  <template v-for="session in item.list" :key="session.conversation_id">
                    <SessionCard :conversation="session" :deletion="isBatchDeletion" @deleteOne="deleteOne" />
                  </template>
                </ElCollapseItem>
              </template>
            </ElCollapse>
          </ul>

          <div v-else class="history-record-null">
            <img v-if="props.theme === 'dark'" src="@/assets/svgs/dark_null.svg" />
            <img v-else src="@/assets/svgs/light_null.svg" alt="" />
            <span>{{ $t('history.no_chat_history') }}</span>
          </div>
        </div>

        <div class="history-record-blogroll">
          <ElDivider />
          <h5>{{ $t('history.links') }}</h5>
          <p @click="openUrl">{{ $t('history.hiss_basic_software_service_capability_platform') }}</p>
        </div>

        <ElDialog
          class="dialog"
          v-model="dialogVisible"
          :title="$t('history.confirmation_message')"
          width="450px"
          align-center
        >
          <div class="dialog-delete_all">
            <img class="dialog-delete_all_svg" src="@/assets/svgs/alarm.svg" />
            <span class="dialog-delete_all_text" v-if="isBatchDeletion"
              >{{ $t('history.confirmation_content1') }} <span>{{ selectedSessionIds.length }}</span
              >{{ $t('history.confirmation_content2') }}
            </span>
            <span class="dialog-delete_all_text" v-else
              >{{ $t('history.delete_content1') }}【{{ deletedSessionName }}】{{ $t('history.delete_content2') }}
            </span>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <ElButton type="primary" class="primary-button" @click="deleteSession"> {{ $t('history.ok') }} </ElButton>
              <ElButton @click="dialogVisible = false">{{ $t('history.cancel') }}</ElButton>
            </span>
          </template>
        </ElDialog>
      </div>
    </transition>
  </aside>
</template>
<style lang="scss" scoped>
:deep(.el-collapse-item__content) {
  border-bottom: none;
  padding-bottom: 0px;
  margin: 1px;
}

:deep(.el-collapse-item__header) {
  height: 24px;
  margin-bottom: 8px;
  color: #8d98aa;
  font-size: 12px;
  border-top: none;
  border-bottom: none;
  padding: 0px;
}

:deep(.el-collapse-item__arrow) {
  margin: 1px 0px 0px 0px;
}

:deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
}

:deep(.el-collapse-item__wrap) {
  border-bottom: 5px;
}

.collapsible-apps {
  width: 17rem;
  // background-color: rgb(244, 246, 250);
  border-radius: 8px;
  overflow: hidden;
  .collapsible-header {
    background-color: rgb(244, 246, 250);
    padding: 1rem;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    // margin-bottom: 12px;
    cursor: pointer;
    .header-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      :deep(svg) {
        color: #3b82f6;
      }
      span {
        font-weight: 600;
        color: #374151;
      }
    }

    :deep(svg.rotate) {
      transform: rotate(180deg);
    }

    :deep(svg) {
      color: #6b7280;
      transition: transform 0.3s ease;
    }
  }

  .app-list {
    list-style-type: none;
    padding: 0;
    margin: 0;

    li {
      height: 32px;
      display: flex;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      align-items: center;
      border: 8px;
      border-radius: 8px;
      span {
        display: block;
        margin-left: 24px;
        align-items: center;
      }
      &:hover {
        background-color: #f3f4f6;
      }

      &.selected {
        background: linear-gradient(127.6deg, rgba(109, 117, 250, 0.2) -1.725%, rgba(90, 179, 255, 0.2) 98.22%);
        color: white;
      }
    }
  }
}

// Transition styles
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 20rem;
  opacity: 1;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-100%);
    overflow: hidden;
    min-width: 0;
    width: 0;
  }
  to {
    opacity: 1;
    transform: translateX(0);
    width: 312px;
    min-width: 256px;
  }
}

@keyframes slideOutToLeft {
  from {
    opacity: 1;
    transform: translateX(0);
    width: 312px;
    min-width: 256px;
  }
  to {
    opacity: 0;
    transform: translateX(-100%);
    min-width: 0;
    overflow: hidden;
    width: 0;
  }
}

.transition-fade-enter-active {
  animation: slideInFromLeft 0.2s ease-out;
}

.transition-fade-leave-active {
  animation: slideOutToLeft 0.2s ease-in;
}

.aside-wrapper {
  position: relative;
  height: 100%;

  .trapezoid {
    width: 56px;
    height: 15px;
    z-index: 1;
    background-color: var(--o-bg-color-base);
    position: absolute;
    left: calc(100% - 28px);
    top: 50%;
    border-top-left-radius: 20px 30px;
    border-top-right-radius: 20px 30px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    transform: perspective(100px) rotateX(50deg);
    transform-origin: bottom;
    overflow: hidden;
    transform: rotate(90deg);
    cursor: pointer;
    &::after {
      content: '';
      position: absolute;
      left: 25%;
      top: 45%;
      width: 30px;
      height: 3px;
      border-radius: 20px;
      background-color: #5cafff;
    }
  }
}

.copilot-aside {
  width: 312px;
  min-width: 256px;
  background-color: var(--o-bg-color-base);
  padding: 24px 0px 24px 24px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  height: 100%;

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
  }

  .history-record {
    margin-top: 15px;
    flex: 1;
    display: flex;
    height: calc(100% - 55px - 80px);
    flex-direction: column;
    position: relative;

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

    &-blogroll {
      display: block;
      padding-right: 24px;

      .el-divider {
        margin: 16px 0px 16px 0px;
      }

      h5 {
        display: block;
        color: var(--o-text-color-primary);
        font-size: 12px;
        line-height: 16px;
        margin-bottom: 8px;
      }

      p {
        color: var(--o-text-color-secondary);
        font-size: 12px;
        line-height: 16px;
        cursor: pointer;

        &:hover {
          color: #5ab3ff;
        }

        &:active {
          color: #7aa5ff;
        }
      }
    }

    /* 滚动条滑块hover样式 */
    ::-webkit-scrollbar-thumb:hover {
      background-color: #d3dce9 !important;
      /* 鼠标悬停时的滚动条按钮颜色 */
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
      }
    }

    &-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-right: 18px;
      cursor: pointer;
      user-select: none;

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
        color: #6395fd;

        &:hover {
          color: #7aa5ff;
        }

        &:active {
          color: #6395fd;
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
}
</style>
