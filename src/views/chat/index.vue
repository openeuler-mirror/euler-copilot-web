<script lang="ts" setup>
import Operations from './Operations.vue';
import CommonFooter from '@/components/commonFooter/CommonFooter.vue';
import Bubble from '@/components/bubble/index.vue';
import Sender from './Sender.vue';
import Welcome from './Welcome.vue';
import userAvatar from '@/assets/svgs/dark_user.svg';
import robotAvatar from '@/assets/svgs/robot.svg';
import {
  computed,
  ref,
  onBeforeMount,
  onBeforeUnmount,
  h,
  watch,
  onMounted,
} from 'vue';
import { fetchStream } from '@/utils/fetchStream';
import marked from '@/utils/marked';
import { useHistorySessionStore, useLangStore } from '@/store';
import { storeToRefs } from 'pinia';
import { getCookie } from '@/apis/tools';
import { useScrollBottom } from '@/hooks/useScrollBottom';
import { api } from 'src/apis';
import { ElMessage } from 'element-plus';

onMounted(() => {
  if (window.eulercopilot?.chat?.onCleanStorage) {
    window.eulercopilot.chat.onCleanStorage(() => {
      //恢复初始状态
      conversations.value = [];
      isStreaming.value = false;
    });
  } else {
    console.error('Electron IPC not available');
  }
});

const headerStyles = computed(() => {
  if (window.eulercopilot.process.platform === 'win32') {
    return { paddingRight: '145px' };
  } else if (window.eulercopilot.process.platform === 'linux') {
    return { paddingRight: '120px' };
  } else if (window.eulercopilot.process.platform === 'darwin') {
    return { paddingLeft: 'calc(50% - 60px)' };
  } else {
    return {};
  }
});

function storageListener(e: StorageEvent) {
  if (e.key === 'theme') {
    document.body.setAttribute('theme', e.newValue || 'light');
  }
}

const { currentSelectedSession } = storeToRefs(useHistorySessionStore());
const { language } = storeToRefs(useLangStore());

const { conversations, setConversations } = useConversations();

const { isStreaming, queryStream } = useStream();

const chatContainerRef = ref<HTMLElement | null>(null);

const { scrollToBottom } = useScrollBottom(chatContainerRef, {
  threshold: 15,
});

function newChat() {
  //恢复初始状态
  localStorage.removeItem('conversationId');
  conversations.value = [];
  isStreaming.value = false;
}

function useStream() {
  const isStreaming = ref(false);

  const queryStream = async (
    q: string,
    cId: string,
    lang: 'zh' | 'en' = 'zh',
  ) => {
    const localEc = window.localStorage?.getItem('ECSESSION');
    const headers = {
      user: JSON.stringify({ userName: 'openEuler' }),
      'Content-Type': 'application/json; charset=UTF-8',
      'X-CSRF-Token': getCookie('_csrf_tk') || '',
      // 从 localStorage 获取 ECSESSION 并设置 Authorization
      ...(localEc ? { Authorization: `Bearer ${localEc}` } : {}),
    };
    const body = {
      question: q,
      conversationId: cId,
      app: {
        appId: '',
        flowId: '',
        params: {},
        auth: {},
      },
      language: lang,
      features: {
        context_num: 2,
        max_tokens: 2048,
      },
    };
    
    // 🔑 重要修复：添加AbortController来支持主动中断请求
    const abortController = new AbortController();
    
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
        signal: abortController.signal, // 添加signal支持中断
      });
      
      for await (const chunk of fetchStream({
        readableStream: resp.body!,
      })) {
        // 检查停止状态
        if (!isStreaming.value) {
          abortController.abort()
          break
        }
        
        if (chunk.data.trim() === '[DONE]') {
          isStreaming.value = false
          break
        }

        // 🔑 重要修复：检查是否是ERROR消息（支持带详细信息的错误）
        if (chunk.data.trim().startsWith('[ERROR]')) {
          isStreaming.value = false
          const conversation = conversations.value[conversations.value.length - 1]
          
          if (conversation) {
            // 提取错误信息并显示
            const errorMsg = chunk.data.trim().replace('[ERROR]', '').trim()
            conversation.content = errorMsg || '系统错误，请稍后再试'
            
            // 🔑 重要：显示错误提示给用户
            ElMessage.error(conversation.content)
          } else {
            // 如果没有对话记录，直接显示错误
            const errorMsg = chunk.data.trim().replace('[ERROR]', '').trim()
            ElMessage.error(errorMsg || '系统错误，请稍后再试')
          }
          
          // 🔑 重要：按正确顺序停止对话
          // 1. 首先中断前端fetchEventSource连接
          abortController.abort()
          
          // 2. 然后调用后端停止接口，清理后端连接
          try {
            const [, res] = await api.stopGeneration()
            if (res && res.code === 200) {
              // 后端停止成功
            }
          } catch (stopError) {
            console.error('调用停止接口失败:', stopError)
          }
          
          break
        }
        setConversations(chunk.data, q);
      }
    } catch (error: any) {
      // 🔑 处理中断的情况
      if (error.name === 'AbortError') {
        console.log('✅ Stream已被成功中断');
      } else {
        console.error('❌ Stream处理出错:', error);
        ElMessage.error('连接错误，请稍后重试');
      }
      isStreaming.value = false;
    }
  };

  return { isStreaming, queryStream };
}

function useConversations() {
  interface Conversation {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    metadata?: StreamMetadata;
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

  const setConversations = (data: string, q: string) => {
    const conversation = conversations.value[conversations.value.length - 1];
    const { id, event, content, metadata } = JSON.parse(data) as StreamChunk;
    if (event === 'init') {
      conversation.id = id;
      conversations.value.push({
        id: '',
        content: '',
        role: 'assistant',
      });
    }
    if (event === 'text.add') {
      conversation.content += content.text;
      conversation.metadata = metadata;
    }
    scrollToBottom();
  };

  return { conversations, setConversations };
}

async function onSend(q: string) {
  conversations.value.push({
    id: `user-${conversations.value.length / 2 + 1}`,
    content: q,
    role: 'user',
  });
  isStreaming.value = true;
  scrollToBottom(true);
  console.log('onSend', currentSelectedSession.value);
  let p = {
    appId: '',
    debug: false,
    llm_id: '',
    kb_ids: [],
  };
  const conversationId = localStorage.getItem('conversationId') || '';
  if (!conversationId) {
    await api.createSession(p).then((res) => {
      localStorage.setItem('conversationId', res[1].result.conversationId);
      queryStream(
        q,
        res[1].result.conversationId,
        language.value as 'zh' | 'en',
      );
    });
  } else {
    queryStream(q, conversationId, language.value as 'zh' | 'en');
  }
}

const markedContent = computed(
  () => (text: string) => marked.parse(text) as string,
);

watch(
  () => currentSelectedSession,
  () => {
    console.log('onSend', currentSelectedSession.value);
  },
);

function renderMarkdown(text: string) {
  return h('div', {
    id: 'markdown-preview',
    innerHTML: text,
  });
}

onBeforeMount(() => {
  const theme =
    localStorage.getItem('theme') ||
    window.eulercopilot.process.env.EULERCOPILOT_THEME ||
    'light';
  // TODO 第二个窗口body属性会丢失，建议优化处理方式
  document.body.setAttribute('theme', theme);
  window.addEventListener('storage', storageListener);
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', storageListener);
});
</script>

<template>
  <div class="chat">
    <header class="chat-header" :style="headerStyles">
      <div class="chat-header-logo">
        <img
          src="@/assets/svgs/euler_copilot_logo.svg"
          alt="euler_copilot_logo"
        />
        <h4>openEuler Intelligence</h4>
      </div>
      <div class="chat-header-operation">
        <Operations></Operations>
      </div>
    </header>

    <div class="chat-container">
      <div class="chat-container-main">
        <div
          ref="chatContainerRef"
          class="chat-container-bubble"
          v-if="conversations.length"
        >
          <div
            v-for="({ id, role, content, metadata }, idx) in conversations"
            :key="id"
          >
            <Bubble
              :avatar="role === 'user' ? userAvatar : robotAvatar"
              :content="role === 'assistant' ? markedContent(content) : content"
              :content-render="
                role === 'assistant' ? renderMarkdown : undefined
              "
              :loading="
                role === 'assistant' &&
                !content &&
                idx === conversations.length - 1
              "
              :styles="{
                content:
                  role === 'user'
                    ? {
                        backgroundImage:
                          'linear-gradient(to right, rgba(109, 117, 250, 0.2), rgba(90, 179, 255, 0.2))',
                      }
                    : {
                        width: '100%',
                      },
              }"
            >
              <template v-if="role === 'assistant' && !isStreaming" #footer>
                <div class="bubble-footer">
                  <div class="action-toolbar">
                    <div class="left">
                      tokens:{{ metadata?.inputTokens || 0 }}↑|
                      {{ metadata?.outputTokens || 0 }}‌↓|
                      {{
                        metadata?.timeCost
                          ? Number(metadata?.timeCost).toFixed(2)
                          : '0.00'
                      }}
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
        </div>
        <Welcome class="welcome" v-else />

        <Sender
          :is-streaming="isStreaming"
          @newChat="newChat"
          @send="onSend"
          class="sender"
        />
      </div>

      <CommonFooter />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat {
  width: 100%;
  height: 100%;
  background-image: var(--o-bg-image);
  background-size: cover;
  background-position: center;
  color: var(--o-text-color-primary);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 24px;
  background-color: var(--o-bg-color-base);
  box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.1);
  -webkit-app-region: drag;

  &-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }
  &-operation {
    -webkit-app-region: no-drag;
  }
}

.chat-container {
  height: calc(100% - 50px);

  padding: 16px;
  &-main {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;

    .welcome {
      margin-top: 200px;
      flex: 1;
    }

    .chat-container-bubble {
      width: 100%;
      height: 30%;
      overflow: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      display: flex;
      flex-direction: column;
      gap: 24px;
      flex: 1;

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

  .sender {
    margin-top: 25px;
  }
}
</style>
