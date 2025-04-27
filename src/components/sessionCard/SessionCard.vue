<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import {
  useHistorySessionStore,
  useSessionStore,
  useChangeThemeStore,
} from 'src/store';
import type { SessionItem } from './type';
import { ref, computed } from 'vue';
import { dayjs } from 'element-plus';
import i18n from 'src/i18n';
import { errorMsg, successMsg } from 'src/components/Message';
import { api } from 'src/apis';
import SessionDropDown from './SessionDropDown.vue';
const { currentSelectedSession, selectedSessionIds } = storeToRefs(
  useHistorySessionStore(),
);
const { changeSession, selectSession, getHistorySession, updateSessionTitle } =
  useHistorySessionStore();
const { isAnswerGenerating } = storeToRefs(useSessionStore());
interface SessionCardProps {
  conversation: SessionItem;
  // 是否批量删除
  deletion: boolean;
}
const emits = defineEmits<{
  (e: 'deleteOne', name: string, sessionlist: string[]): void;
}>();
const props = defineProps<SessionCardProps>();
const inputValue = ref(props.conversation.title);
// 是否是重命名状态
const isResetTitle = ref(false);
// input框实例
const inputRef = ref<HTMLInputElement | null>(null);

const themeStore = useChangeThemeStore();

const documentCount = computed(() => {
  return props.conversation?.docCount || 0;
});

const iconRef = ref<HTMLInputElement | null>();

const dropdownPosition = ref();

const hoverFiles = ref([]);

const isFileVisible = ref<boolean>(false);

const isImageVisible = computed(() => {
  return props.conversation.docCount && props.conversation.docCount > 0;
});

const handleHover = async () => {
  // 接口获取列表数据
  const [_, response] = await api.getUploadFiles(
    props.conversation.conversationId,
    true,
    false,
  );
  if (!_ && response) {
    hoverFiles.value = response.result.documents;
    hoverFiles.value.sort((pre, cur) => pre.created_at - cur.created_at);
    isFileVisible.value = true;
    const rect = iconRef.value?.getBoundingClientRect();
    dropdownPosition.value = {
      x: rect?.x,
      y: rect?.y,
    };
  }
};

const handleLeave = () => {
  const timeout = setTimeout(() => {
    isFileVisible.value = false;
    clearTimeout(timeout);
  }, 100);
};

const handleResetName = async (): Promise<void> => {
  isResetTitle.value = true;
  setTimeout(() => {
    inputRef.value?.focus();
  }, 100);
};

/**
 * 确认重命名
 */
const confirmChangeTitle = async (conversation: SessionItem): Promise<void> => {
  isResetTitle.value = false;
  conversation.title = inputValue.value;
  const res = await updateSessionTitle(conversation);
  if (res) {
    successMsg(i18n.global.t('feedback.edit_successful'));
  } else {
    errorMsg(i18n.global.t('feedback.edit_failed'));
  }
  getHistorySession();
};
/**
 * 取消重命名
 */
const cancelChangeTitle = (): void => {
  isResetTitle.value = false;
  inputValue.value = props.conversation.title;
};

const bool = ref(false);
const select = (conversationId: string) => {
  bool.value = selectedSessionIds.value.includes(conversationId);
  return selectedSessionIds.value.includes(conversationId);
};

const deleteOne = (name: string, list: string[]) => {
  emits('deleteOne', name, list);
};
</script>

<template>
  <div
    class="conversation-card"
    :style="isAnswerGenerating ? 'cursor: not-allowed' : 'cursor: pointer'"
    @mouseleave="handleLeave"
  >
    <div class="conversation-card-item">
      <el-checkbox
        class="checkbox"
        v-if="deletion"
        v-model="bool"
        @change="selectSession(conversation.conversationId)"
        :checked="select(conversation.conversationId)"
      />
      <div
        class="conversation-card-item__box"
        :class="{
          'conversation-card-item__box--selected':
            currentSelectedSession === conversation.conversationId,
        }"
        @click="changeSession(conversation.conversationId)"
      >
        <div class="conversation-title">
          <div class="conversation-title__text">
            <input
              ref="inputRef"
              class="conversation-title__text-input"
              v-if="
                isResetTitle &&
                currentSelectedSession === conversation.conversationId
              "
              type="text"
              v-model="inputValue"
              @keyup.enter="confirmChangeTitle(conversation)"
            />
            <span class="conversation-title__text-span" v-else>
              {{ conversation.title }}
            </span>
          </div>
          <div class="conversation-title__button" v-if="!isResetTitle">
            <el-tooltip
              placement="top"
              :content="$t('history.rename')"
              effect="light"
            >
              <img
                v-if="themeStore.theme === 'dark'"
                class="conversation-title__svg"
                src="@/assets/svgs/dark_editor.svg"
                @click="handleResetName"
              />
              <img
                v-else
                class="conversation-title__svg"
                src="@/assets/svgs/light_editor.svg"
                @click="handleResetName"
              />
            </el-tooltip>
            <el-tooltip
              placement="top"
              :content="$t('history.delete')"
              effect="light"
            >
              <img
                v-if="themeStore.theme === 'dark'"
                class="conversation-title__svg"
                src="@/assets/svgs/dark_delete.svg"
                @click="
                  deleteOne(conversation.title, [conversation.conversationId])
                "
              />
              <img
                v-else
                class="conversation-title__svg"
                src="@/assets/svgs/light_delete.svg"
                @click="
                  deleteOne(conversation.title, [conversation.conversationId])
                "
              />
            </el-tooltip>
          </div>
          <div class="conversation-title__button" v-else>
            <el-tooltip
              placement="top"
              :content="$t('history.ok')"
              effect="light"
            >
              <img
                class="conversation-title__svg"
                src="@/assets/svgs/yes.svg"
                @click="confirmChangeTitle(conversation)"
              />
            </el-tooltip>
            <el-tooltip
              placement="top"
              :content="$t('history.cancel')"
              effect="light"
            >
              <img
                class="conversation-title__svg"
                src="@/assets/svgs/wrong.svg"
                @click="cancelChangeTitle()"
              />
            </el-tooltip>
          </div>
        </div>
        <div class="ducments" v-if="isImageVisible">
          <div>
            <img
              ref="iconRef"
              @mouseover="handleHover"
              src="../../assets/svgs/files.svg"
              alt=""
            />
          </div>
          <div>
            {{ $t('upload.aside_session_file_count_front') }}
            <span>{{ documentCount }}</span>
            {{ $t('upload.aside_session_file_count_back') }}
          </div>
        </div>
        <span class="conversation-time">
          {{ dayjs(conversation.createdTime).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </div>
    </div>
  </div>
  <session-drop-down
    :file-list="hoverFiles"
    :drop-postion="dropdownPosition"
    :is-file-visible="isFileVisible"
  ></session-drop-down>
</template>

<style lang="scss" scoped>
.conversation-title__svg:hover {
  filter: invert(50%) sepia(66%) saturate(446%) hue-rotate(182deg)
    brightness(100%) contrast(103%);
}

.rename:hover {
  filter: grayscale(0);
  opacity: 1;
}

.rename {
  filter: grayscale(100%);
}

.conversation-card {
  width: calc(100% - 18px);
  &:last-child .conversation-card-item {
    margin-bottom: 0px;
  }
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
      padding: 0px 5px 12px 15px;
      display: flex;
      justify-content: center;
      flex-direction: column;

      &:hover {
        background-image: linear-gradient(
          to right,
          rgba(109, 117, 250, 0.1),
          rgba(90, 179, 255, 0.1)
        );
        outline: 1px solid #7aa5ff;
        // border: -1px solid transparent;
        .conversation-title__button {
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

      .conversation-title {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        &__text {
          display: flex;
          font-weight: 500;
          font-size: 14px;
          color: var(--o-text-color-primary);
          width: 100%;
          margin-right: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          height: 22px;
          align-self: center;
          &-input {
            width: 100%;
            height: 22px;
            background-color: transparent;
            border: none;
            outline: none;
            font-weight: bold;
            font-size: 14px;
            align-self: center;
            color: var(--o-text-color-primary);
          }
        }
        &__button {
          margin-right: 8px;
          align-self: center;
          display: none;
        }
      }

      &--selected {
        background-image: linear-gradient(
          to right,
          rgba(109, 117, 250, 0.2),
          rgba(90, 179, 255, 0.2)
        );
      }
    }

    .conversation-time {
      font-size: 12px;
      color: var(--o-text-color-tertiary);
      margin-top: 4px;
    }
  }
}
.ducments {
  display: flex;
  align-items: center;
  margin-top: 4px;
  img {
    width: 18px;
    height: 18px;
    margin-right: 4px;
    display: inline-block;
    cursor: pointer;
  }
  div {
    height: 18px;
    line-height: 18px;
    color: var(--o-text-color-secondary);
  }
  span {
    margin: 0 4px;
    color: var(--o-color-primary-secondary);
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
