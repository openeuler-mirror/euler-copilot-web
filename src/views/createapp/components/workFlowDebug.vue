<template>
  <div class="workFlowDebug">
    <div class="workFlowDebugClose">
      <div class="title">调试</div>
      <div class="closeBtn" @click="handleCloseDebugDialog"><IconX /></div>
    </div>
    <div class="divider"></div>
    <div class="debugContent">
      <div class="debugCheckArea" v-if="testFlag">
        <DialoguePanel
          v-for="(item, index) in conversationList"
          :cid="item.cid"
          :key="index"
          :type="item.belong"
          :inputParams="item.params"
          :content="item.message"
          :is-finish="getItem(item, 'isFinish')"
          :is-support="getItem(item, 'isSupport')"
          :is-against="getItem(item, 'isAgainst')"
          :metadata="getItem(item, 'metadata')"
          :flowdata="getItem(item, 'flowdata')"
          :created-at="item.createdAt"
          :current-selected="item.currentInd"
          :user-selected-app="user_selected_app"
          :search_suggestions="getItem(item, 'search_suggestions')"
          :paramsList="getItem(item, 'paramsList')"
          :isWorkFlowDebug="true"
          @commont="handleCommont"
          @report="handleReport"
          @handleSendMessage="handleSendMessage"
          @clearSuggestion="clearSuggestion(index)"
        />
      </div>
      <div class="inputDebugQuestion">
        <!-- 输入框 -->
        <div class="textareaInput">
          <textarea
            ref="inputRef"
            v-model="dialogueInput"
            maxlength="2000"
            :placeholder="$t('main.ask_me_anything')"
            @keydown="handleKeydown"
          />
        </div>
        <!-- 发送问题 -->
        <div class="sendIcon">
          <img
            v-if="isAnswerGenerating || dialogueInput.length <= 0"
            src="@/assets/images/send_disable.png"
            alt=""
          />
          <div
            v-else
            @click="handleSendMessage(undefined, dialogueInput)"
            class="ableSend"
          >
            <img
              v-if="themeStore.theme === 'dark'"
              src="@/assets/images/dark_send.png"
              alt=""
            />
            <img v-else src="@/assets/images/light_send.png" alt="" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import '../../styles/workFlowDebug.scss';
import { onMounted, ref } from 'vue';
import { IconX } from '@computing/opendesign-icons';
import DialoguePanel from 'src/components/dialoguePanel/DialoguePanel.vue';
import type {
  ConversationItem,
  RobotConversationItem,
} from 'src/views/dialogue/types';
import { useSessionStore, useChangeThemeStore } from 'src/store';
import { useHistorySessionStore } from 'src/store/historySession';
import { storeToRefs } from 'pinia';
import { api } from '@/apis';
import { onBeforeRouteLeave } from 'vue-router';
// 对话列表
const { sendQuestion, stopDebug } = useSessionStore();
const testFlag = ref(true);
const { conversationList, isAnswerGenerating } = storeToRefs(useSessionStore());
const { user_selected_app } = storeToRefs(useHistorySessionStore());
const { generateSessionDebug } = useHistorySessionStore();
const {
  historySession,
  currentSelectedSession,
  selectedSessionIds,
} = storeToRefs(useHistorySessionStore());
const themeStore = useChangeThemeStore();
const tmpConversationId = ref('');
const props = defineProps({
  flowId: {
    default: '',
  },
  appId: {
    default: '',
  },
  handleDebugDialogOps: {
    type: Function,
  },
});

// 对话输入内容
const dialogueInput = ref<string>('');
/**
 *
 * @param item
 */
const getItem = <T,>(item: ConversationItem, field: string): T | undefined => {
  if (field in item) {
    return (item as RobotConversationItem)[field] as T;
  }
  return undefined;
};

onMounted(() => {
  // 删除成功
  conversationList.value = [];
  selectedSessionIds.value = [];
  currentSelectedSession.value = '';
  historySession.value = [];
});

/**
 * 发送消息
 */
const handleSendMessage = async (
  groupId: string | undefined,
  question: string,
  user_selected_flow?: string[],
) => {
  if (isAnswerGenerating.value) return;
  const len = conversationList.value.length;
  if (
    len > 0 &&
    !(conversationList.value[len - 1] as RobotConversationItem).isFinish
  )
    return;
  dialogueInput.value = '';
  // console.log(!currentSelectedSession.value, 'currentSelectedSession')
  if (!tmpConversationId.value) {
    const res = await generateSessionDebug({ debug: true });
    tmpConversationId.value = res || 1;
  }

  props.handleDebugDialogOps!();
  await sendQuestion(
    groupId,
    question,
    [props.appId],
    undefined,
    undefined,
    props.flowId,
    undefined,
    true,
  );
};

const clearSuggestion = (index: number): void => {
  if ('search_suggestions' in conversationList.value[index]) {
    conversationList.value[index].search_suggestions = undefined;
  }
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

const handleCloseDebugDialog = () => {
  testFlag.value = false;
  stopDebug();
  delChat();
  props.handleDebugDialogOps!(false);
};

// 关闭或者跳转前需要将会话删除
const delChat = async () => {
  if (!currentSelectedSession.value) {
    // 如果还没生成会话Id, 无需调用接口删除
    return;
  } else {
    // 调用接口，删除当前对话
    const res = await api.deleteSession({
      conversationList: [currentSelectedSession.value],
    });
    if (res[1]?.result) {
      // 删除成功
      isAnswerGenerating.value = false;
      conversationList.value = [];
      selectedSessionIds.value = [];
      currentSelectedSession.value = '';
      historySession.value = [];
    }
  }
};

onBeforeRouteLeave((to, from, next) => {
  handleCloseDebugDialog();
  next();
});
</script>
