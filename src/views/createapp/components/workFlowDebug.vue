<template>
  <div class="workFlowDebug">
    <div class="workFlowDebugClose">
      <div class="title">调试</div>
      <div class="closeBtn" @click="handleCloseDebugDialog"><IconX /></div>
    </div>
    <div class="divider"></div>
    <div class="debugContent">
      <div class="debugCheckArea">
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
          <img v-if="isAnswerGenerating || dialogueInput.length <= 0" src="@/assets/images/send_disable.png" alt="" />
          <div v-else @click="handleSendMessage(undefined, dialogueInput)">
            <img v-if="themeStore.theme === 'dark'" src="@/assets/images/dark_send.png" alt="" />
            <img v-else src="@/assets/images/light_send.png" alt="" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import '../../styles/workFlowDebug.scss';
import { computed, watch, ref } from 'vue';
import { IconX } from '@computing/opendesign-icons';
import DialoguePanel from 'src/components/dialoguePanel/DialoguePanel.vue';
import type { ConversationItem, RobotConversationItem } from 'src/views/dialogue/types';
import { useSessionStore, useChangeThemeStore } from 'src/store';
import { useHistorySessionStore } from 'src/store/historySession';
import { successMsg, errorMsg } from 'src/components/Message';
import { storeToRefs } from 'pinia';
import { api } from 'src/apis';
// 对话列表
const { sendQuestion } = useSessionStore();
const { conversationList, isAnswerGenerating } = storeToRefs(useSessionStore());
const { user_selected_app } = storeToRefs(useHistorySessionStore());
const { generateSession, generateSessionDebug } = useHistorySessionStore();
const { currentSelectedSession } = storeToRefs(useHistorySessionStore());
const themeStore = useChangeThemeStore();
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
interface DebugProps {
  handleDebugDialogOps: any;
}

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

/**
 * 发送消息
 */
const handleSendMessage = async (groupId: string | undefined, question: string, user_selected_flow?: string[]) => {
  if (isAnswerGenerating.value) return;
  const language = localStorage.getItem('localeLang') === 'CN' ? 'zh' : 'en';
  const len = conversationList.value.length;
  if (len > 0 && !(conversationList.value[len - 1] as RobotConversationItem).isFinish) return;
  dialogueInput.value = '';
  if (!currentSelectedSession.value) {
    await generateSessionDebug({ debug: true });
  }
  await sendQuestion(groupId, question, [props.appId], undefined, undefined, props.flowId, undefined);
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
  props.handleDebugDialogOps(false);
};
</script>
