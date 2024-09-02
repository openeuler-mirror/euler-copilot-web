<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useHistorySessionStore, useSessionStore, useChangeThemeStore } from 'src/store';
import type { SessionItem } from './type';
import { ref } from 'vue';
import { dayjs } from 'element-plus';
import { errorMsg, successMsg } from 'src/components/Message';
const { currentSelectedSession, selectedSessionIds } = storeToRefs(useHistorySessionStore());
const { changeSession, selectSession, getHistorySession, updateSessionTitle } =
  useHistorySessionStore();
const { isAnswerGenerating } = storeToRefs(useSessionStore());
interface SessionCardProps {
  session: SessionItem;
  // 是否批量删除
  deletion: boolean;
}
const emits = defineEmits<{
  (e: 'deleteOne', name: string,sessionlist:string[]): void;
}>();
const props = defineProps<SessionCardProps>();
const inputValue = ref(props.session.title);
// 是否是重命名状态
const isResetTitle = ref(false);
// input框实例
const inputRef = ref<HTMLInputElement | null>(null);

const themeStore = useChangeThemeStore();

const handleResetName = async (): Promise<void> => {
  isResetTitle.value = true;
  setTimeout(() => {
    inputRef.value?.focus();
  }, 100);
};

/**
 * 确认重命名
 */
const confirmChangeTitle = async (session: SessionItem): Promise<void> => {
  isResetTitle.value = false;
  session.title = inputValue.value;
  const res = await updateSessionTitle(session);
  if (res) {
    successMsg('编辑成功');
  } else {
    errorMsg('编辑失败');
  }
  getHistorySession();
};
/**
 * 取消重命名
 */
const cancelChangeTitle = (): void => {
  isResetTitle.value = false;
  inputValue.value = props.session.title;
};

const bool = ref(false);
const select = (session_id: string) => {
  bool.value = selectedSessionIds.value.includes(session_id);
  return selectedSessionIds.value.includes(session_id);
};

const deleteOne = (name:string,list:string[]) => {
  emits('deleteOne',name,list);
};
</script>

<template>
  <div class="session-card" :style="isAnswerGenerating ? 'cursor: not-allowed' : 'cursor: pointer'">
    <div class="session-card-item">
      <el-checkbox
        class="checkbox"
        v-if="deletion"
        v-model="bool"
        @change="selectSession(session.sessionId)"
        :checked="select(session.sessionId)"
      />
      <div
        class="session-card-item__box"
        :class="{
          'session-card-item__box--selected': currentSelectedSession === session.sessionId,
        }"
        @click="changeSession(session.sessionId)"
      >
        <div class="session-title">
          <div class="session-title__text">
            <input
              ref="inputRef"
              class="session-title__text-input"
              v-if="isResetTitle && currentSelectedSession === session.sessionId"
              type="text"
              v-model="inputValue"
              @keyup.enter="confirmChangeTitle(session)"
            />
            <span class="session-title__text-span" v-else>{{ session.title }}</span>
          </div>
          <div class="session-title__button" v-if="!isResetTitle">
            <el-tooltip placement="top" content="重命名" effect="light">
              <img v-if="themeStore.theme === 'dark'" class="session-title__svg" src="src/assets/svgs/dark_editor.svg" @click="handleResetName" />
              <img v-else class="session-title__svg" src="src/assets/svgs/light_editor.svg" @click="handleResetName" />
            </el-tooltip>
            <el-tooltip placement="top" content="删除" effect="light">
              <img v-if="themeStore.theme === 'dark'" class="session-title__svg" src="src/assets/svgs/dark_delete.svg" @click="deleteOne(session.title,[session.sessionId])" />
              <img v-else class="session-title__svg" src="src/assets/svgs/light_delete.svg" @click="deleteOne(session.title,[session.sessionId])"/>
            </el-tooltip>
          </div>
          <div class="session-title__button" v-else>
            <el-tooltip placement="top" content="确认" effect="light">
              <img
                class="session-title__svg"
                src="src/assets/svgs/yes.svg"
                @click="confirmChangeTitle(session)"
              />
            </el-tooltip>
            <el-tooltip placement="top" content="取消" effect="light">
              <img
                class="session-title__svg"
                src="src/assets/svgs/wrong.svg"
                @click="cancelChangeTitle()"
              />
            </el-tooltip>
          </div>
        </div>
        <span class="session-time">{{
          dayjs(session.createdTime).format('YYYY-MM-DD HH:mm:ss')
        }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.session-title__svg:hover {
  filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg) brightness(100%) contrast(103%);
}

.rename:hover {
  filter: grayscale(0);
  opacity: 1;
}

.rename {
  filter: grayscale(100%);
}

.session-card {
  width: calc(100% - 18px);
  &-item {
    margin-bottom: 8px;
    display: flex;
    align-items: center;

    input {
      margin-right: 8px;
    }

    .checkbox {
      margin-right: 8px;
    }

    &__box {
      flex: 1;
      border-radius: 8px;
      // width: 100%;
      width: 202px;
      background-color: var(--o-bg-color-light);
      height: 66px;
      padding: 0px 5px 12px 15px;
      display: flex;
      justify-content: center;
      flex-direction: column;

      &:hover {
        background-image: linear-gradient(to right, rgba(109, 117, 250, 0.1), rgba(90, 179, 255, 0.1));
        outline: 1px solid #7AA5FF;
        // border: -1px solid transparent;
        .session-title__button {
          display: flex;

          img {
            width: 16px;
            height: 16px;

            &:last-child {
              margin-left: 4px;
            }
          }
        }
      }

      .session-title {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        &__text {
          display: flex;
          font-weight: 500;
          font-size: 14px;
          color: var(--o-text-color-primary);
          width: 100%;
          margin-right:8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          height: 22px;
          align-self: center;
          &-input {
            width:100%;
            height: 22px;
            background-color: transparent;
            border: none;
            outline: none;
            font-weight: bold;
            font-size: 14px;
            align-self: center;
            color:var(--o-text-color-primary);
          }
        }
        &__button {
          margin-right: 8px;
          align-self:center;
          display: none;
        }
      }

      &--selected {
        background-image: linear-gradient(to right, rgba(109, 117, 250, 0.2), rgba(90, 179, 255, 0.2));;
      }
    }

    .session-time {
      font-size: 12px;
      color: var(--o-text-color-secondary);
      margin-top: 4px;
    }
  }
}

//dialog 顶部样式强制修改
:deep(.el-dialog) {
  width: 432px;
  height: 184px;
}
:deep(.dialog .el-dialog__header) {
  margin-right: 0px;
  border-radius: 4px 4px 0 0;
  padding: 15px 20px 15px 20px;
  border-bottom: 1px solid var(--o-border-color-light) !important;


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

:deep(.dialog .el-dialog__footer) {
  padding: 0px 24px 24px 24px;
}

:deep(.dialog .el-dialog__header .el-dialog__headerbtn) {
  top: 18px !important;
}

.dialog-delete-one {
  font-size: 12px;
  color: #000;
  display: flex;

  &_svg {
    margin-right: 16px;
  }

  &_text {
    line-height: 16px;
    font-size: 12px;
    color: var(--o-text-color-secondary);
    vertical-align: bottom;
    padding-top: 2px;
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

  .el-button + .el-button {
    margin-left: 8px;
  }
}

.button-icon {
  width: 16px;
  height: 16px;
  margin-left: 16px;
}
</style>
