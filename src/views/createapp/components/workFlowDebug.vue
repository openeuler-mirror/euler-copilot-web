<template>
  <div class="workFlowDebug" :class="{ 'minimized': isMinimized }">
    <div class="workFlowDebugClose">
      <div class="title">{{ $t('flow.debug') }}</div>
      <div class="controlButtons">
        <!-- 最小化按钮 -->
        <div v-if="!isMinimized" class="minimizeBtn" @click="handleMinimize">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M14,8v1H2V8H14z"/>
          </svg>
        </div>
        <!-- 还原按钮 -->
        <div v-if="isMinimized" class="restoreBtn" @click="handleRestore">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M3,5v8h8V5H3z M10,11H4V6h6V11z"/>
          </svg>
        </div>
        <!-- 关闭按钮 -->
        <div class="closeBtn" @click="handleCloseDebugDialog">
          <IconX />
        </div>
      </div>
    </div>
    <div v-show="!isMinimized" class="debugContent">
      <!-- 变量配置面板 -->
      <DebugVariablePanel
        ref="debugVariablePanelRef"
        v-if="shouldShowVariablePanel"
        :visible="variablePanelVisible"
        :conversation-variables="conversationVariables"
        :variables-loading="variablesLoading"
        :flow-id="props.flowId"
        :conversation-id="tmpConversationId"
        @toggle-visibility="toggleVariablePanel"
        @variable-updated="handleVariableUpdated"
      />
      
      <div class="debugCheckArea" v-if="testFlag">
        <DialoguePanel
          v-for="(item, index) in conversationList"
          :cid="item.cid"
          :key="index"
          :groupId="item.groupId"
          :type="item.belong"
          :inputParams="item.params"
          :content="item.message"
          :is-finish="getItem(item, 'isFinish')"
          :is-support="getItem(item, 'isSupport')"
          :is-against="getItem(item, 'isAgainst')"
          :metadata="getItem(item, 'metadata')"
          :flowdata="getItem(item, 'flowdata')"
          :files="getItem(item, 'files')"
          :created-at="item.createdAt"
          :current-selected="item.currentInd"
          :user-selected-app="user_selected_app"
          :search_suggestions="getItem(item, 'search_suggestions')"
          :paramsList="getItem(item, 'paramsList')"
          :modeOptions="{}"
          :isWorkFlowDebug="true"
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
            src="@/assets/svgs/send_disabled.svg"
            alt=""
          />
          <div
            v-else
            @click="handleSendMessage(undefined, dialogueInput)"
            class="ableSend"
          >
            <img src="@/assets/svgs/send_enabled.svg" alt="" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import '../../styles/workFlowDebug.scss';
import { onMounted, ref, computed, onBeforeUnmount } from 'vue';
import { IconX } from '@computing/opendesign-icons';
import DialoguePanel from 'src/components/dialoguePanel/DialoguePanel.vue';
import DebugVariablePanel from './workFlowConfig/DebugVariablePanel.vue';
import type {
  ConversationItem,
  RobotConversationItem,
} from 'src/views/dialogue/types';
import { useSessionStore, useChangeThemeStore } from 'src/store';
import { useHistorySessionStore } from 'src/store/historySession';
import { storeToRefs } from 'pinia';
import { api } from '@/apis';
import { onBeforeRouteLeave } from 'vue-router';
import { listVariables } from '@/api/variable';
import { ElMessage } from 'element-plus';

interface ConversationVariable {
  name: string;
  var_type: string;
  scope: string;
  value?: any;
  description?: string;
}

// 对话列表
const { sendQuestion, stopDebug } = useSessionStore();
const testFlag = ref(true);
const { conversationList, isAnswerGenerating } = storeToRefs(useSessionStore());
const { user_selected_app } = storeToRefs(useHistorySessionStore());
const { generateSessionDebug } = useHistorySessionStore();
const { historySession, currentSelectedSession, selectedSessionIds } =
  storeToRefs(useHistorySessionStore());
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

// 最小化状态
const isMinimized = ref(false);

// 最小化和还原方法
const handleMinimize = () => {
  isMinimized.value = true;
};

const handleRestore = () => {
  isMinimized.value = false;
};

// 变量面板相关状态
const debugVariablePanelRef = ref<InstanceType<typeof DebugVariablePanel> | null>(null);
const variablePanelVisible = ref(true);
const conversationVariables = ref<ConversationVariable[]>([]);
const variablesLoading = ref(false);

// 计算属性：是否应该显示变量面板
const shouldShowVariablePanel = computed(() => {
  // 总是显示变量面板，即使暂时没有变量数据
  return true;
});

// 切换变量面板显示/隐藏
const toggleVariablePanel = () => {
  variablePanelVisible.value = !variablePanelVisible.value;
};

// 处理变量更新
const handleVariableUpdated = () => {
  loadConversationVariables();
};

// 加载对话变量
const loadConversationVariables = async () => {
  variablesLoading.value = true;
  try {
    let queryParams: any = { 
      scope: 'conversation',
      exclude_pattern: 'step_id' // 过滤掉包含step和step_id的变量
    };
    
    // 优先使用对话ID，如果没有则使用flowId
    if (tmpConversationId.value) {
      queryParams.conversation_id = tmpConversationId.value;
    } else if (props.flowId) {
      queryParams.flow_id = props.flowId;
    } else {
      return;
    }
    
    const response = await listVariables(queryParams);
        
    // 处理API响应
    let variables: ConversationVariable[] = [];
    if (response?.result?.variables) {
      variables = response.result.variables;
    } else if ((response as any)?.variables) {
      variables = (response as any).variables;
    } else if (Array.isArray(response)) {
      variables = response as ConversationVariable[];
    }
    
    conversationVariables.value = variables || [];
    
  } catch (error) {
    console.error('❌ 加载变量失败:', error);
    conversationVariables.value = [];
  } finally {
    variablesLoading.value = false;
  }
};

// 批量更新所有变量到后端
const updateAllVariablesToBackend = async (conversationId: string) => {
  if (debugVariablePanelRef.value && 'batchUpdateVariables' in debugVariablePanelRef.value) {
    return await (debugVariablePanelRef.value as any).batchUpdateVariables(conversationId);
  }
  return true;
};
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

// 举报函数
const handleReport = async (qaRecordId: string, reason?: string) => {
  // 处理举报逻辑
  console.log('举报记录:', qaRecordId, reason);
};

onMounted(() => {
  // 删除成功
  conversationList.value = [];
  selectedSessionIds.value = [];
  currentSelectedSession.value = '';
  historySession.value = [];
  
  // 尝试加载变量配置（基于flowId）
  loadConversationVariables();
});

/**
 * 发送消息
 */
// 防止循环卡住的定时器
let debugTimeoutId: NodeJS.Timeout | null = null;

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
  
  // 生成对话ID（如果还没有）
  if (!tmpConversationId.value) {
    const res = await generateSessionDebug({ debug: true });
    tmpConversationId.value = res || 1;
  }
  
  // 🔑 设置全局对话ID，供其他组件使用
  (window as any).currentConversationId = tmpConversationId.value;
  sessionStorage.setItem('currentConversationId', tmpConversationId.value);

  // 先更新所有变量到后端（使用用户在面板中输入的值），再发送消息
  if (tmpConversationId.value) {
    const updateSuccess = await updateAllVariablesToBackend(tmpConversationId.value);
    
        if (!updateSuccess) {
      // 变量更新失败（特别是文件上传失败），不继续发送消息
      // 注意：具体的错误信息已经在变量更新过程中显示了，这里不重复显示
      
      // 清理可能已创建的无效会话
      if (tmpConversationId.value) {
        try {
          await api.deleteSession({ conversationList: [tmpConversationId.value] });
          tmpConversationId.value = '';
        } catch (cleanupError) {
          // 清理失败，静默处理
        }
      }
      return;
    }
    
    // 🔑 重要修复：移除重新加载逻辑，避免覆盖前端本地状态
    // 前端变量面板应该保持用户输入的状态，不应该被后端数据覆盖
    // await loadConversationVariables();
    
    // 🔑 新增：自动折叠变量配置面板，让用户专注于对话内容
    if (variablePanelVisible.value) {
      variablePanelVisible.value = false;
    }
  }

  // 设置安全超时：如果30秒后还在生成状态，强制停止
  if (debugTimeoutId) {
    clearTimeout(debugTimeoutId);
  }
  debugTimeoutId = setTimeout(() => {
    if (isAnswerGenerating.value) {
      console.warn('⚠️ 检测到调试超时，强制停止生成状态');
      isAnswerGenerating.value = false;
      // 尝试停止正在进行的对话
      if (conversationList.value.length > 0) {
        const lastConversation = conversationList.value[conversationList.value.length - 1] as RobotConversationItem;
        lastConversation.isFinish = true;
      }
    }
  }, 30000); // 30秒超时

  props.handleDebugDialogOps!();
  await sendQuestion(
    groupId,
    question,
    props.appId,
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
  
  // 强制停止生成状态，确保循环停止
  isAnswerGenerating.value = false;
  
  // 只有在有对话时才调用 stopDebug，避免访问空数组
  if (conversationList.value.length > 0) {
    stopDebug();
  }
  
  delChat();
  // 清理变量状态
  conversationVariables.value = [];
  tmpConversationId.value = '';
  
  // 🔑 清理所有附件收集器
  if ((window as any).currentConversationAttachments) {
    (window as any).currentConversationAttachments.value = [];
  }
  if ((window as any).flowCodeAttachments) {
    (window as any).flowCodeAttachments = [];
  }
  
  // 🔑 清理按DialoguePanel分组的附件收集器
  if ((window as any).flowCodeAttachmentsByPanel) {
    (window as any).flowCodeAttachmentsByPanel = {};
  }
  
  // 🔑 移除保护标记，允许下次清理
  (window as any).flowCodeAttachmentsProtected = false;
  
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
  // 清理定时器
  if (debugTimeoutId) {
    clearTimeout(debugTimeoutId);
    debugTimeoutId = null;
  }
  handleCloseDebugDialog();
  next();
});

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  if (debugTimeoutId) {
    clearTimeout(debugTimeoutId);
    debugTimeoutId = null;
  }
});
</script>
