<script lang="ts" setup>
import CommonFooter from '@/components/commonFooter/CommonFooter.vue';
import Bubble from '@/components/bubble/index.vue';
import {
  useHistorySessionStore,
  useLangStore,
  useSessionStore,
  useChangeThemeStore,
} from '@/store';
import { storeToRefs } from 'pinia';
import { computed, h, ref, watch } from 'vue';
import { api } from '@/apis';
import marked from '@/utils/marked';
import userAvatar from '@/assets/svgs/dark_user.svg';
import robotAvatar from '@/assets/svgs/robot.svg';
import DefaultAgentIcon from '@/assets/svgs/defaultIcon.webp';
import SendDisabledIcon from '@/assets/svgs/send_disabled.svg';
import SendEnableIcon from '@/assets/svgs/send_enabled.svg';
import { fetchStream } from '@/utils/fetchStream';
import { useScrollBottom } from '@/hooks/useScrollBottom';
import dayjs from 'dayjs';
import { useRoute } from 'vue-router';
import i18n from 'src/i18n';
import DialoguePanel from 'src/components/dialoguePanel/DialoguePanel.vue';
import type {
  ConversationItem,
  RobotConversationItem,
} from 'src/views/dialogue/types';

const { t } = i18n.global;
let isDebugSuccess = false;

interface DebugConfig {
  name: string;
  description: string;
  icon: string;
  mcps: {
    mcpserviceId: string;
    name: string;
    description: string;
    icon: string;
    author: string;
    isActive?: boolean;
  }[];
  author?: string;
  model?: string;
}

const props = defineProps<{
  visible: boolean;
  config: DebugConfig;
}>();

const emits = defineEmits<{
  (e: 'update:visible', status: boolean): void;
  (e: 'success', status: boolean): void;
}>();

const route = useRoute();
const { language } = storeToRefs(useLangStore());
const { theme } = storeToRefs(useChangeThemeStore());
const { currentSelectedSession, historySession } = storeToRefs(
  useHistorySessionStore(),
);

const { generateSession, getHistorySession } = useHistorySessionStore();

async function initDebugSession() {
  await generateSession(true);
  await getHistorySession();
  currentSelectedSession.value = historySession.value[0].conversationId;
}

/**
 * 删除会话
 */
async function toDeleteSession(id: string) {
  // 先停止生成
  stopStream();
  const [, res] = await api.deleteSession({ conversationList: [id] });
  if (res) {
    currentSelectedSession.value = '';
  }
}

const dialogueInput = ref('');

const markedContent = computed(
  () => (text: string) => marked.parse(text) as string,
);

function renderMarkdown(text: string) {
  return h('div', {
    id: 'markdown-preview',
    innerHTML: text,
  });
}

const chatContainerRef = ref<HTMLElement | null>(null);
const { scrollToBottom } = useScrollBottom(chatContainerRef, {
  threshold: 15,
});
const { pausedStream } = useSessionStore();
const isStreaming = ref(false);
const stopStream = async () => {
  pausedStream(Number(conversationList.value.length));
};
// 对话列表
const { sendQuestion } = useSessionStore();
const { conversationList, isAnswerGenerating, dialogueRef } = storeToRefs(
  useSessionStore(),
);

/**
 * 获取指定字段值
 * @param item
 */
const getItem = <T>(item: ConversationItem, field: string): T | undefined => {
  if (field in item) {
    return (item as RobotConversationItem)[field] as T;
  }
  return undefined;
};

/**
 * @description 处理并过滤文件列表，将文件列表中的字段名统一为指定格式
 * @param {ConversationItem} ConversationItem - 对话项对象
 * @param {string} str - 字段名
 * @returns {Array} 格式化后的文件列表
 */
const getFormatFileList = (ConversationItem, str) => {
  let fileList: any = getItem(ConversationItem, str);
  if (!fileList || fileList?.length === 0) return;
  let newFileList: any = [];
  fileList?.forEach((file) => {
    if (file.associated === 'answer') {
      newFileList.push({
        documentId: file._id,
        documentName: file.name,
        documentAbstract: file.abstract,
        documentType: file.type,
        documentSize: file.size,
        sourceUrl: file.sourceUrl,
        documentOrder: file.order,
        createdAt: file.created_at,
        documentAuthor: file.author,
      });
    }
  });
  return newFileList;
};

const clearSuggestion = (index: number): void => {
  if ('search_suggestions' in conversationList.value[index]) {
    conversationList.value[index].search_suggestions = undefined;
  }
};

const showFileSource = ref(false);
const curFileList = ref<Array<any>>([]);
const closeShowFileSource = () => {
  showFileSource.value = false;
};
const openShowFileSource = (fileList: Array<any>) => {
  showFileSource.value = true;
  curFileList.value = fileList;
};

/**
 * 发送消息
 */
const handleSendMessage = async (
  groupId: string | undefined,
  question: string,
  user_selected_flow?: string,
) => {
  if (isAnswerGenerating.value) return;
  const len = conversationList.value.length;
  if (
    len > 0 &&
    !(conversationList.value[len - 1] as RobotConversationItem).isFinish
  )
    return;
  dialogueInput.value = '';
  if (!currentSelectedSession.value) {
    await generateSession();
  }

  await sendQuestion(
    undefined,
    question,
    route.query.appId as string,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  );
};

/**
 * 处理鼠标事件
 * @param event
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (dialogueInput.value !== '') {
      handleSendMessage(undefined, dialogueInput.value);
    }
  }
};

async function onRegenerateClick(id: string, question: string) {
  queryStream(
    question,
    currentSelectedSession.value,
    language.value as 'zh' | 'en',
    id,
  );
}

const bubbleStyles = computed(() => (role: 'user' | 'assistant') => {
  if (role === 'user') {
    return {
      content: {
        fontSize: '16px',
        maxWidth: '1000px',
        backgroundImage:
          'linear-gradient(to right, rgba(109, 117, 250, 0.2), rgba(90, 179, 255, 0.2))',
      },
    };
  } else if (role === 'assistant') {
    return {
      content: { width: '100%', maxWidth: '1000px', padding: '24px' },
    };
  }
});

watch(
  () => props.visible,
  () => {
    if (!props.visible) {
      toDeleteSession(currentSelectedSession.value);
      return;
    } else {
      conversationList.value = [];
    }
    initDebugSession();
  },
);
</script>
<template>
  <div class="debug-wrapper">
    <el-dialog
      class="mcp-debug-dialog"
      :visible="visible"
      :model-value="visible"
      :title="i18n.global.t('flow.debug')"
      @close="emits('update:visible', false)"
      align-center
      destroy-on-close
    >
      <div class="debug-container">
        <div class="debug-info">
          <div class="app">
            <img src="@/assets/svgs/myApp.svg" alt="" />
            <div class="app-name">{{ config.name }}</div>
          </div>

          <div class="mcp-info" v-if="config.mcps.length">
            <span>{{ $t('semantic.mcp_service') }}</span>
            <div class="mcp-list">
              <img
                v-for="mcp in config.mcps"
                :key="mcp.mcpserviceId"
                :src="mcp.icon"
                alt=""
              />
            </div>
          </div>
        </div>

        <div class="chat-container" ref="chatContainerRef">
          <div v-if="!conversationList.length">
            <Bubble
              class="bubble-item"
              :avatar="config.icon ? config.icon : DefaultAgentIcon"
              :styles="{
                content: {
                  width: '100%',
                  maxWidth: '1000px',
                  padding: '24px',
                },
              }"
            >
              <template #content>
                <div class="custom-content">
                  {{ $t('main.describe1') }}
                  <div class="gradient-text">{{ config.name }}</div>
                  {{ $t('main.describe2') }}
                </div>
              </template>
              <template #footer>
                <div class="description">{{ config.description }}</div>
              </template>
            </Bubble>
          </div>
          <DialoguePanel
            v-for="(item, index) in conversationList"
            :cid="item.cid"
            :key="index"
            :groupId="getItem(item, 'groupId')"
            :type="item.belong"
            :inputParams="item.params"
            :content="item.message"
            :echartsObj="getItem(item, 'echartsObj')"
            :recordList="
              item.belong === 'robot' ? item.messageList.getRecordIdList() : ''
            "
            :isCommentList="
              item.belong === 'robot' ? item.messageList.getCommentList() : ''
            "
            :messageArray="item.belong === 'robot' ? item.messageList : ''"
            :is-finish="getItem(item, 'isFinish')"
            :test="getItem(item, 'test')"
            :metadata="getItem(item, 'metadata')"
            :flowdata="getItem(item, 'flowdata')"
            :created-at="item.createdAt"
            :current-selected="item.currentInd"
            :need-regernerate="item.cid === conversationList.slice(-1)[0].cid"
            :user-selected-app="user_selected_app"
            :search_suggestions="getItem(item, 'search_suggestions')"
            :paramsList="getItem(item, 'paramsList')"
            :fileList="item.files ?? getFormatFileList(item, 'document')"
            @handleReport="handleReport"
            @handleSendMessage="handleSendMessage"
            @clearSuggestion="clearSuggestion(index)"
            @openShowFileSource="openShowFileSource"
          />
        </div>

        <div v-if="isStreaming" class="stop-button" @click="stopStream">
          <img src="@/assets/svgs/light_stop_answer.svg" alt="" />
          <div class="stop-button-answer">
            {{ $t('feedback.stop') }}
          </div>
        </div>
        <!-- 调试发送窗口 -->
        <div class="sender">
          <textarea
            ref="inputRef"
            v-model="dialogueInput"
            maxlength="2000"
            :placeholder="$t('main.ask_me_anything')"
            @keydown="handleKeydown"
          />
          <div class="send-button-group">
            <div class="upload-button">
              <img src="@/assets/svgs/upload_light.svg" alt="" />
            </div>
            <div class="send-button">
              <img
                v-if="dialogueInput.length <= 0"
                src="@/assets/svgs/send_disabled.svg"
                alt=""
              />
              <img
                v-else
                :src="isStreaming ? SendDisabledIcon : SendEnableIcon"
                alt=""
                @click="handleSendMessage(undefined, dialogueInput)"
              />
            </div>
          </div>
        </div>

        <footer class="copilot-footer">
          <CommonFooter />
        </footer>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="emits('update:visible', false)">
            {{ $t('common.close') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<style lang="scss" scoped>
.debug-wrapper {
  .debug-container {
    position: relative;
    height: 100%;
    background-image: var(--o-bg-image);
    overflow: auto;
    border-radius: 8px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 40px 0 32px;

    .debug-info {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;

      .app {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 40px;
        padding: 8px;
        border-radius: 20px;
        gap: 8px;
        background: linear-gradient(
          122.39deg,
          rgba(109, 117, 250, 0.2) -20.158%,
          rgba(90, 179, 255, 0.2) 112.459%
        );

        img {
          width: 32px;
          height: 32px;
        }

        .app-name {
          font-size: 16px;
          margin-right: 8px;
          line-height: 24px;
          color: var(--o-text-color-primary);
          font-weight: 700;
        }
      }

      .mcp-info {
        position: absolute;
        right: 80px;
        display: flex;
        align-items: center;

        .mcp-list {
          margin-left: 7px;
          display: flex;
          gap: 8px;

          img {
            width: 24px;
            height: 24px;
            border-radius: 50%;
          }
        }
      }
    }

    .chat-container {
      width: 100%;
      height: 76%;
      min-height: 340px;
      overflow: auto;

      .bubble-item {
        margin-top: 24px;

        .custom-content {
          font-size: 24px;
          line-height: 32px;
          font-weight: 700;
          display: flex;

          .gradient-text {
            background: linear-gradient(
              to right,
              rgb(108, 119, 250),
              rgb(90, 179, 255)
            );
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
        }

        .description {
          font-size: 16px;
          border-top: 1px solid var(--o-border-color-light);
          color: rgb(78, 88, 101);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0 0 0;
          margin-top: 20px;
        }

        .bubble-footer {
          margin-top: 20px;
          .action-toolbar {
            border-top: 1px dashed var(--o-border-color-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0 0 0;

            img {
              width: 24px;
              height: 24px;
            }

            .left {
              font-size: 12px;
              color: var(--o-text-color-tertiary);
              display: flex;
              gap: 8px;
              align-items: center;

              .regenerate {
                display: flex;
                align-items: center;
                cursor: pointer;
              }

              .pagination {
                display: flex;
                img {
                  width: 16px;
                  height: 16px;
                }

                &-arror {
                  margin: 0;
                  cursor: pointer;
                }
                .ml-8 {
                  margin-left: 8px;
                }
                .mr-8 {
                  margin-right: 8px;
                }
              }
            }

            .button-group {
              height: 24px;
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    .stop-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 128px;
      height: 40px;
      border-radius: 8px;
      border: 1px solid var(--o-text-color-primary);
      margin-top: 24px;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 16px;
      cursor: pointer;
      position: relative;
      img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
      }

      &-answer {
        display: block;
        font-size: 16px;
        color: var(--o-text-color-primary);
        line-height: 24px;
      }
    }

    .sender {
      position: absolute;
      bottom: 36px;
      width: 1000px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 16px;
      background-color: var(--o-bg-color-base);

      textarea {
        width: 100%;
        height: 100%;
        border: none;
        color: var(--o-text-color-primary);
        font-size: 16px;
        background-color: var(--o-bg-color-base);
        font-family: HarmonyOS_Sans_SC_Regular, system-ui, -apple-system,
          BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
          'Open Sans', 'Helvetica Neue', sans-serif;

        &:focus {
          outline: none;
        }

        &::placeholder {
          color: var(--o-text-color-tertiary);
        }
      }

      .send-button-group {
        display: flex;
        justify-content: space-between;
        align-items: end;

        img {
          cursor: pointer;
        }
      }
    }

    .copilot-footer {
      position: absolute;
      bottom: 10px;
    }
  }

  .el-button {
    width: 64px;
    height: 24px;
    border-radius: 4px;
  }
}
</style>
<style>
.mcp-debug-dialog {
  width: 1256px;
  height: 86%;
  .el-dialog__body {
    height: calc(100% - 110px);
    max-height: none;
  }
}
</style>
