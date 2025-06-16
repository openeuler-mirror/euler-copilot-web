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
  const { conversationList } = useSessionStore();
  if (conversationList.length === 0) return;
  await generateSession();
  await getHistorySession();
  currentSelectedSession.value = historySession.value[0].conversationId;
}

async function deleteSession(id: string) {
  const [, res] = await api.deleteSession({ conversationList: [id] });
  if (res) {
    conversations.value = [];
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

const { conversations, setConversations } = useConversations();

const { isStreaming, queryStream, stopStream } = useStream();

function useStream() {
  const isStreaming = ref(false);

  let controller: AbortController;

  const queryStream = async (
    q: string,
    sessionId: string,
    lang: 'zh' | 'en' = 'zh',
    cId?: string,
  ) => {
    isStreaming.value = true;

    const headers = {};
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    const token = localStorage.getItem('ECSESSION');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    controller = new AbortController();

    const body = {
      question: q,
      conversationId: sessionId,
      app: {
        appId: route.query.appId as string,
        flowId: '',
        params: {},
      },
      language: lang,
      features: {
        context_num: 2,
        max_tokens: 2048,
      },
    };
    try {
      const resp = await fetch('/api/chat', {
        signal: controller.signal,
        method: 'POST',
        body: JSON.stringify(body),
        headers,
      });
      if (!resp.ok) {
        isStreaming.value = false;
        conversations.value.push({
          id: '',
          question: q,
          answer: [
            {
              content: '系统错误，请稍后再试',
            },
          ],
          answerIndex: 0,
          role: 'assistant',
        });
        return;
      }

      for await (const chunk of fetchStream({
        readableStream: resp.body!,
      })) {
        if (!chunk.data) {
          break;
        }
        if (chunk.data.trim() === '[ERROR]') {
          isStreaming.value = false;
          const conversation =
            conversations.value[conversations.value.length - 1];
          conversation.answer[conversation.answerIndex].content =
            '系统错误，请稍后再试';
          break;
        }
        if (chunk.data.trim() === '[DONE]') {
          isStreaming.value = false;
          setTimeout(() => {
            scrollToBottom(true);
          }, 100);
          break;
        }

        let conversation = conversations.value.find((item) => item.id === cId);

        setConversations(chunk.data, q, conversation);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const stopStream = async () => {
    const [, res] = await api.stopGeneration();
    if (res) {
      isStreaming.value = false;
      controller.abort();
      const conversation = conversations.value[conversations.value.length - 1];
      if (conversation.answer[conversation.answerIndex].content === '') {
        conversation.answer[conversation.answerIndex].content = '对话已终止';
        return;
      }
      scrollToBottom(true);
    }
  };

  return { isStreaming, queryStream, stopStream };
}

function useConversations() {
  interface Conversation {
    id: string;
    question: string;
    answer: {
      content: string;
      metadata?: StreamMetadata;
    }[];
    answerIndex: number;
    role: 'user' | 'assistant';
    createdAt?: Date | number;
  }

  type StreamEvent = 'text.add' | 'init' | 'input';
  interface StreamMetadata {
    inputTokens: number;

    outputTokens: number;

    timeCost: number;
  }

  interface StreamChunk {
    content: {
      text: string;
    };
    conversationId: string;
    event: StreamEvent;
    groupId: string;
    id: string;
    metadata: StreamMetadata;
    taskId: string;
  }

  const conversations = ref<Conversation[]>([]);

  const setConversations = (
    data: string,
    question: string,
    conversation?: Conversation,
  ) => {
    const { id, event, content, metadata } = JSON.parse(data) as StreamChunk;

    if (event === 'init') {
      if (conversation) {
        conversation.answer.push({
          content: '',
        });
        conversation.answerIndex = conversation.answer.length - 1;
      } else {
        conversations.value.push({
          id: id,
          question,
          answer: [
            {
              content: '',
            },
          ],
          answerIndex: 0,
          role: 'assistant',
        });
      }
    }
    if (event === 'text.add') {
      if (!isDebugSuccess) {
        isDebugSuccess = true;
        emits('success', true);
      }
      const c = conversations.value[conversations.value.length - 1];
      c.answer[c.answerIndex].content += content.text;
      c.answer[c.answerIndex].metadata = metadata;
    }
    scrollToBottom();
  };

  return { conversations, setConversations };
}

function onSend(q: string) {
  if (isStreaming.value) return;
  conversations.value.push({
    id: `user-${(conversations.value.length % 2) + 1}`,
    question: q,
    answer: [],
    answerIndex: 0,
    role: 'user',
  });
  scrollToBottom(true);
  queryStream(q, currentSelectedSession.value, language.value as 'zh' | 'en');
  dialogueInput.value = '';
}

/**
 * 处理鼠标事件
 * @param event
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (dialogueInput.value !== '') {
      onSend(dialogueInput.value);
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
      deleteSession(currentSelectedSession.value);
      return;
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
      title="调试"
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
            <span>MCP 服务</span>
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
          <div v-if="!conversations.length">
            <Bubble
              class="bubble-item"
              :avatar="DefaultAgentIcon"
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
                  你好，我是
                  <div class="gradient-text">{{ config.name }}</div>
                  ，很高兴为您服务
                </div>
              </template>
              <template #footer>
                <div class="description">{{ config.description }}</div>
              </template>
            </Bubble>
          </div>
          <Bubble
            v-else
            v-for="(
              { id, role, question, answer, answerIndex, createdAt }, idx
            ) in conversations"
            :key="id"
            :avatar="role === 'user' ? userAvatar : robotAvatar"
            :content="
              role === 'assistant'
                ? markedContent(answer[answerIndex].content)
                : question
            "
            :content-render="role === 'assistant' ? renderMarkdown : undefined"
            :date="
              role === 'user'
                ? dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')
                : undefined
            "
            :loading="
              role === 'assistant' &&
              answer[answerIndex].content.length === 0 &&
              idx === conversations.length - 1
            "
            class="bubble-item"
            :styles="bubbleStyles(role)"
          >
            <template
              v-if="
                (role === 'assistant' && !isStreaming) ||
                (role === 'assistant' && idx !== conversations.length - 1)
              "
              #footer
            >
              <div class="bubble-footer">
                <div class="action-toolbar">
                  <div class="left">
                    <div>
                      tokens:
                      {{ answer[answerIndex].metadata?.inputTokens || 0 }}↑ |
                      {{ answer[answerIndex].metadata?.outputTokens || 0 }}↓ |
                      {{
                        answer[answerIndex].metadata?.timeCost
                          ? Number(
                              answer[answerIndex].metadata?.timeCost,
                            ).toFixed(2)
                          : '0.00'
                      }}
                    </div>

                    <!-- <div class="pagination">
                      <img
                        class="pagination-arror mr-8"
                        src="@/assets/svgs/arror_left.svg"
                      />
                      <span class="pagination-cur">{{ answerIndex + 1 }}</span>
                      <span class="pagination-total">
                        {{ `/${answer.length}` }}
                      </span>
                      <img
                        class="pagination-arror ml-8"
                        src="@/assets/svgs/arror_right.svg"
                      />
                    </div> -->

                    <div
                      class="regenerate"
                      v-if="idx == conversations.length - 1"
                      @click="onRegenerateClick(id, question)"
                    >
                      <img
                        v-if="theme === 'dark'"
                        src="@/assets/svgs/dark_regenerate.svg"
                        alt=""
                      />
                      <img
                        v-else
                        src="@/assets/svgs/light_regenerate.svg"
                        alt=""
                      />
                      <span>重新生成</span>
                    </div>
                  </div>
                  <div class="button-group">
                    <el-tooltip
                      placement="top"
                      :content="$t('feedback.copy')"
                      effect="light"
                    >
                      <img src="@/assets/svgs/dark_copy.svg" />
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </template>
          </Bubble>
        </div>

        <div v-if="isStreaming" class="stop-button" @click="stopStream">
          <img src="@/assets/svgs/light_stop_answer.svg" alt="" />
          <div class="stop-button-answer">
            {{ $t('feedback.stop') }}
          </div>
        </div>

        <div class="sender">
          <textarea
            ref="inputRef"
            v-model="dialogueInput"
            maxlength="2000"
            :placeholder="$t('main.ask_me_anything')"
            @keydown="handleKeydown"
          />
          <div class="sender-button-group">
            <div class="upload-button">
              <img src="@/assets/svgs/upload_light.svg" alt="" />
            </div>
            <div class="sender-button">
              <img
                :src="isStreaming ? SendDisabledIcon : SendEnableIcon"
                alt=""
                @click="onSend(dialogueInput)"
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
            关闭
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
      height: 57%;
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
        font-family:
          HarmonyOS_Sans_SC_Regular,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          Roboto,
          Oxygen,
          Ubuntu,
          Cantarell,
          'Open Sans',
          'Helvetica Neue',
          sans-serif;

        &:focus {
          outline: none;
        }

        &::placeholder {
          color: var(--o-text-color-tertiary);
        }
      }

      .sender-button-group {
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
