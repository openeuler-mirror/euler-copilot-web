<script lang="ts" setup>
import CommonFooter from '@/components/commonFooter/CommonFooter.vue';
import Bubble from '@/components/bubble/index.vue';
import DialogueFlow from '@/components/dialoguePanel/DialogueFlow.vue';
import FileAttachment from '@/components/dialoguePanel/FileAttachment.vue';
import {
  useHistorySessionStore,
  useLangStore,
  useSessionStore,
  useChangeThemeStore,
} from '@/store';
import { storeToRefs } from 'pinia';
import { computed, h, ref, watch, onMounted } from 'vue';
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
import { ElMessage } from 'element-plus';


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
        // 检查停止状态
        if (!isStreaming.value) {
          controller.abort()
          break
        }
        
        if (chunk.data.trim() === '[DONE]') {
          isStreaming.value = false
          setTimeout(() => {
            scrollToBottom(true)
          }, 100)
          break
        }
        
        // 🔑 重要修复：检查是否是ERROR消息（支持带详细信息的错误）
        if (chunk.data.trim().startsWith('[ERROR]')) {
          isStreaming.value = false
          const conversation = conversations.value[conversations.value.length - 1]
          
          if (conversation && conversation.answer && conversation.answer[conversation.answerIndex]) {
            // 提取错误信息并显示
            const errorMsg = chunk.data.trim().replace('[ERROR]', '').trim()
            conversation.answer[conversation.answerIndex].content = errorMsg || '系统错误，请稍后再试'
            
            // 🔑 重要：显示错误提示给用户
            ElMessage.error(conversation.answer[conversation.answerIndex].content)
          } else {
            // 如果没有对话记录，直接显示错误
            const errorMsg = chunk.data.trim().replace('[ERROR]', '').trim()
            ElMessage.error(errorMsg || '系统错误，请稍后再试')
          }
          
          // 🔑 重要：按正确顺序停止对话
          // 1. 首先中断前端fetch连接
          controller.abort()
          
          // 2. 然后调用后端停止接口，清理后端连接
          try {
            const [, res] = await api.stopGeneration()
            if (res) {
              // 后端停止成功
            }
          } catch (stopError) {
            console.error('调用停止接口失败:', stopError)
          }
          
          break
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
    flowdata?: {
      id: string;
      title: string;
      status: string;
      display: boolean;
      data: any[][];
      progress?: string;
    };
  }

  type StreamEvent = 'text.add' | 'init' | 'input' | 'flow.start' | 'step.input' | 'step.output' | 'flow.stop' | 'progress';
  interface StreamMetadata {
    inputTokens: number;

    outputTokens: number;

    timeCost: number;
  }

  interface StreamChunk {
    content: any;
    conversationId: string;
    event: StreamEvent;
    groupId: string;
    id: string;
    metadata: StreamMetadata;
    taskId: string;
    flow?: {
      stepId: string;
      stepName: string;
      stepStatus: string;
      stepProgress: string;
    };
  }

  const conversations = ref<Conversation[]>([]);
  
  // 🔑 新增：当前对话的附件收集器
  const currentConversationAttachments = ref<{
    file_id: string;
    filename: string;
    file_type: string;
    file_size: number;
    variable_name: string;
    content: string;
    step_name: string;
  }[]>([]);
  
  // 🔑 立即导出到全局，以便DialoguePanel可以访问
  (window as any).currentConversationAttachments = currentConversationAttachments;
  
  // 🔑 在组件挂载时确保全局收集器可用
  onMounted(() => {
    // 再次确保全局收集器设置正确
    (window as any).currentConversationAttachments = currentConversationAttachments;
  });
  
  // 添加消息防抖机制
  let messageQueue: StreamChunk[] = [];
  let processingTimer: NodeJS.Timeout | null = null;
  let lastScrollTime = 0;
  let memoryCheckTimer: NodeJS.Timeout | null = null;
  const SCROLL_THROTTLE_INTERVAL = 100; // 滚动节流间隔(ms)
  const MESSAGE_BATCH_SIZE = 5; // 批处理消息数量
  const MESSAGE_BATCH_INTERVAL = 50; // 批处理间隔(ms)
  const MEMORY_CHECK_INTERVAL = 10000; // 内存检查间隔(ms)
  const MAX_CONVERSATIONS = 50; // 最大对话数量
  const MAX_FLOW_DATA_SIZE = 100; // 最大工作流数据量

  // 内存监控和清理
  const startMemoryMonitoring = () => {
    memoryCheckTimer = setInterval(() => {
      // 检查对话数量
      if (conversations.value.length > MAX_CONVERSATIONS) {
        conversations.value = conversations.value.slice(-MAX_CONVERSATIONS / 2);
      }
      
      // 检查工作流数据大小
      conversations.value.forEach(conv => {
        if (conv.flowdata && conv.flowdata.data[0]?.length > MAX_FLOW_DATA_SIZE) {
          conv.flowdata.data[0] = conv.flowdata.data[0].slice(-MAX_FLOW_DATA_SIZE / 2);
        }
      });
      
      // 清理消息队列
      if (messageQueue.length > 200) {
        messageQueue = messageQueue.slice(-50);
      }
      
      // 检查内存使用情况（如果浏览器支持）
      if ('memory' in performance && process.env.NODE_ENV === 'development') {
        const memInfo = (performance as any).memory;
        const usedMemory = memInfo.usedJSHeapSize / 1024 / 1024; // MB
        if (usedMemory > 200) { // 超过200MB时警告
          console.warn(`内存使用过高: ${usedMemory.toFixed(2)}MB`);
        }
      }
    }, MEMORY_CHECK_INTERVAL);
  };

  const stopMemoryMonitoring = () => {
    if (memoryCheckTimer) {
      clearInterval(memoryCheckTimer);
      memoryCheckTimer = null;
    }
  };

  // 启动内存监控
  startMemoryMonitoring();

  // 节流版本的scrollToBottom
  const throttledScrollToBottom = () => {
    const now = Date.now();
    if (now - lastScrollTime > SCROLL_THROTTLE_INTERVAL) {
      scrollToBottom();
      lastScrollTime = now;
    }
  };

  // 批处理消息处理函数
  const processBatchedMessages = () => {
    if (messageQueue.length === 0) return;
    
    const batch = messageQueue.splice(0, MESSAGE_BATCH_SIZE);
    let shouldScroll = false;
    
    batch.forEach(parsedData => {
      const result = processMessage(parsedData);
      if (result.shouldScroll) shouldScroll = true;
    });
    
    // 批量处理后只滚动一次
    if (shouldScroll) {
      throttledScrollToBottom();
    }
    
    // 如果还有待处理消息，继续处理
    if (messageQueue.length > 0) {
      processingTimer = setTimeout(processBatchedMessages, MESSAGE_BATCH_INTERVAL);
    } else {
      processingTimer = null;
    }
  };

  // 单个消息处理逻辑
  const processMessage = (parsedData: StreamChunk): { shouldScroll: boolean } => {
    const { id, event, content, metadata, flow } = parsedData;
    let shouldScroll = false;

    if (event === 'init') {
      // 🔑 重置所有附件收集器（开始新对话时）
      currentConversationAttachments.value = [];
      
      // 🔑 重要：强制重新创建flowCodeAttachments数组，确保完全清空
      const oldBackupCount = (window as any).flowCodeAttachments?.length || 0;
      const isProtected = (window as any).flowCodeAttachmentsProtected;
      
      if (!isProtected || oldBackupCount === 0) {
        (window as any).flowCodeAttachments = [];
      }
      
      const conversation = conversations.value.find(c => c.id === id);
      if (conversation) {
        conversation.answer.push({
          content: '',
        });
        conversation.answerIndex = conversation.answer.length - 1;
      } else {
        conversations.value.push({
          id: id,
          question: '',
          answer: [
            {
              content: '',
            },
          ],
          answerIndex: 0,
          role: 'assistant',
        });
      }
      shouldScroll = true;
    }
    
    // 🔑 移除全局事件监控中的文件收集逻辑，避免重复添加
    // 文件收集统一在step.output事件中处理
    
    if (event === 'text.add') {
      if (!isDebugSuccess) {
        isDebugSuccess = true;
        emits('success', true);
      }
      const c = conversations.value[conversations.value.length - 1];
      if (c) {
        c.answer[c.answerIndex].content += content.text;
        c.answer[c.answerIndex].metadata = metadata;
        shouldScroll = true;
      }
    }
    
    // 处理工作流进度事件（新增）
    if (event === 'progress') {
      const c = conversations.value[conversations.value.length - 1];
      if (c && c.flowdata) {
        // 更新进度信息，但不频繁滚动
        c.flowdata.progress = `${content.iteration}/${content.total}`;
        c.flowdata.status = content.status;
        // 只在重要进度节点滚动
        if (content.iteration % 3 === 0 || content.status === 'completed') {
          shouldScroll = true;
        }
      }
    }
    
    // 处理工作流事件
    if (event === 'flow.start') {
      const c = conversations.value[conversations.value.length - 1];
      if (c && flow) {
        c.flowdata = {
          id: flow.stepId || '',
          title: '工作流执行',
          status: 'running',
          display: true,
          data: [[]],
          progress: flow.stepProgress || '',
        };
        shouldScroll = true;
      }
    }
    

    if (event === 'step.input') {
      const c = conversations.value[conversations.value.length - 1];
      
      if (c && c.flowdata && flow) {
        const stepData = {
          id: flow.stepId,
          title: flow.stepName,
          status: flow.stepStatus,
          data: {
            input: content,
          },
        };
        
        c.flowdata.data[0].push(stepData);
        c.flowdata.progress = flow.stepProgress;
        c.flowdata.status = flow.stepStatus;
        // 步骤输入不频繁滚动
      }
    }
    
    if (event === 'step.output') {
      const c = conversations.value[conversations.value.length - 1];
      
      // 🔑 循环节点step.output特殊处理：只有当真正的循环节点完成时才处理
      if (flow?.stepName?.includes('循环')) {
      
        // 如果是子步骤的step.output（stepName包含"[循环N]"），跳过处理
        if (flow?.stepName?.includes('[循环')) {
          return { shouldScroll: false };
        }
      }
      
      if (c && c.flowdata && flow) {
        const target = c.flowdata.data[0].find((item) => item.id === flow.stepId);
        
        if (target) {
          
          // 🔑 统一的文件收集逻辑，带严格去重检查
          const addFileToCollector = (fileData: any) => {
            // 严格的去重检查：基于file_id和filename
            const existingFile = currentConversationAttachments.value.find((item: any) => 
              item.file_id === fileData.file_id && item.filename === fileData.filename
            );
            
            if (!existingFile) {
            currentConversationAttachments.value.push({
                file_id: fileData.file_id,
                filename: fileData.filename,
                file_type: fileData.file_type,
                file_size: fileData.file_size,
                variable_name: fileData.variable_name,
                content: fileData.content,
              step_name: target.stepName // 记录来源步骤
            });
              return true;
            } else {
              return false;
            }
          };
          
          // 🔑 检查不同的文件格式并收集
          let hasFileData = false;
          
          // 格式1：单个文件对象
          if (typeof content === 'object' && content.file_id && content.filename && content.content) {
            addFileToCollector(content);
            hasFileData = true;
          }
          // 格式2：多文件格式 {type: 'files', files: [...]}
          else if (typeof content === 'object' && content.type === 'files' && content.files && Array.isArray(content.files)) {
            content.files.forEach((fileData: any) => {
              if (fileData.file_id && fileData.filename && fileData.content) {
                addFileToCollector(fileData);
                hasFileData = true;
              }
            });
          }
          // 格式3：旧格式文件 {files: [...]}
          else if (typeof content === 'object' && content.files && Array.isArray(content.files)) {
            content.files.forEach((fileData: any) => {
              if (fileData.file_id && fileData.filename && fileData.content) {
                addFileToCollector(fileData);
                hasFileData = true;
              }
            });
          }
          
          // 设置步骤输出显示
          if (hasFileData) {
            // 在步骤输出中显示简要信息
            target.data.output = {
              type: 'file_reference',
              message: `文件附件已添加到对话回复中`,
              file_count: currentConversationAttachments.value.length
            };
          } else {
            // 普通数据输出
            target.data.output = content;
          }
          
          target.status = flow.stepStatus;
          target.costTime = metadata?.timeCost;
          
          // 如果是错误状态，设置错误信息
          if (flow.stepStatus === 'error') {
            // 从content中提取错误信息
            if (typeof content === 'object' && content) {
              target.error = content.error || content.message || '';
              target.message = content.message || content.error || '';
            }
          }
          
          // 更新单个步骤状态后，检查整体工作流状态
          if (flow.stepStatus === 'error') {
            c.flowdata.status = flow.stepStatus;
            shouldScroll = true; // 错误时滚动
          } else if (flow.stepStatus === 'success') {
            // 检查是否所有步骤都已完成
            const allSteps = c.flowdata.data[0];
            const allCompleted = allSteps.every(step => 
              step.status === 'success' || step.status === 'error'
            );
            
            // 如果所有步骤都完成了，更新整体状态
            if (allCompleted) {
              const hasError = allSteps.some(step => step.status === 'error');
              c.flowdata.status = hasError ? 'error' : 'success';
                        
              // 如果是循环节点或最后一个步骤完成，触发滚动
              if (flow.stepName?.includes('循环') || target === allSteps[allSteps.length - 1]) {
                shouldScroll = true;
              }
            }
          }
        }
      }
    }
    
    if (event === 'flow.stop') {
      const c = conversations.value[conversations.value.length - 1];
      if (c && c.flowdata && flow) {
        c.flowdata.status = flow.stepStatus || 'success';
        c.flowdata.title = '工作流执行完成';
        shouldScroll = true;
      }
    }
    
    return { shouldScroll };
  };

  const setConversations = (
    data: string,
    question: string,
    conversation?: Conversation,
  ) => {
    
    try {
      // 检查数据大小，避免处理过大的消息
      if (data.length > 100000) { // 100KB限制
        console.warn('消息过大，跳过处理');
        return;
      }
      
      // 🔑 处理特殊的控制字符串
      if (data.trim() === '[DONE]') {
        // 这里可以添加特殊的完成处理逻辑
        return;
      }
      
      // 🔑 重要修复：检查是否是ERROR消息（支持带详细信息的错误）
      if (data.trim().startsWith('[ERROR]')) {
        console.error('❌ [DebugApp.vue] 收到ERROR事件');
        
        // 提取错误信息并显示
        const errorMsg = data.trim().replace('[ERROR]', '').trim();
        ElMessage.error(errorMsg || '系统错误，请稍后再试');
        
        // 如果有对话对象，更新其内容
        if (conversation && conversation.answer && conversation.answer[conversation.answerIndex]) {
          conversation.answer[conversation.answerIndex].content = errorMsg || '系统错误，请稍后再试';
        }
        
        console.log('❌ 处理错误消息:', errorMsg);
        return;
      }
      
      let parsedData: StreamChunk;
      try {
        parsedData = JSON.parse(data) as StreamChunk;        
      } catch (parseError) {
        console.error('📨 [DebugApp.vue] JSON解析失败:', {
          rawData: data.substring(0, 200),
          error: parseError,
          dataLength: data.length
        });
        
        // 尝试修复可能的JSON格式问题
        const cleanData = data.trim().replace(/\n/g, '').replace(/\r/g, '');
        try {
          parsedData = JSON.parse(cleanData) as StreamChunk;
        } catch (retryError) {
          console.error('📨 [DebugApp.vue] JSON修复也失败，跳过此消息');
          return;
        }
      }
      
      // 检查消息队列大小，避免内存溢出
      if (messageQueue.length > 100) {
        messageQueue = messageQueue.slice(-50); // 只保留最新50条
      }
      
      // 添加到消息队列进行批处理
      messageQueue.push(parsedData);
      
      // 如果没有正在处理的定时器，启动批处理
      if (!processingTimer) {
        processingTimer = setTimeout(processBatchedMessages, MESSAGE_BATCH_INTERVAL);
      }
      
    } catch (error) {
      console.error('消息处理失败');
      
      // 紧急情况下清理内存
      if (messageQueue.length > 50) {
        messageQueue = [];
      }
    }
  };

  defineExpose({
    currentConversationAttachments // 导出附件收集器
  });

  return { conversations, setConversations, stopMemoryMonitoring, currentConversationAttachments };
}

// 🔑 计算属性：获取当前对话的附件（只在对话完成时显示）
const { conversations, setConversations, stopMemoryMonitoring, currentConversationAttachments } = useConversations();

const getCurrentAttachments = computed(() => {
  if (isStreaming.value) {
    return [];
  }
  
  return currentConversationAttachments.value || [];
});

const { isStreaming, queryStream, stopStream } = useStream();

async function onSend(q: string) {
  if (isStreaming.value) return;
  
  conversations.value.push({
    id: `user-${(conversations.value.length % 2) + 1}`,
    question: q,
    answer: [],
    answerIndex: 0,
    role: 'user',
  });
  scrollToBottom(true);
  
  const conversationId = currentSelectedSession.value;
  queryStream(q, conversationId, language.value as 'zh' | 'en');
  dialogueInput.value = '';
}

/**
 * 处理鼠标事件
 * @param event
 */
const handleKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (dialogueInput.value !== '') {
      await onSend(dialogueInput.value);
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
  (newVisible, oldVisible) => {
    if (!newVisible) {
      // 关闭时清理资源
      stopMemoryMonitoring();
      
      // 强制清理所有Monaco Editor实例
      try {
        // 清理所有Monaco Editor实例
        const monacoContainers = document.querySelectorAll('.monaco-editor');
        console.log(`清理Monaco Editor实例: ${monacoContainers.length}个`);
        
        monacoContainers.forEach((container, index) => {
          // 避免多次清理同一个容器
          if (container.getAttribute('data-cleaned') !== 'true') {
            container.setAttribute('data-cleaned', 'true');
            
            // 强制移除Monaco Editor容器
            try {
              const parentElement = container.parentElement;
              if (parentElement) {
                parentElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Monaco Editor已清理</div>';
              }
            } catch (e) {
              console.error(`清理Monaco容器${index}失败:`, e);
            }
          }
        });
        
        // 清理Monaco相关的全局状态
        if (typeof window !== 'undefined') {
          // 清理Monaco worker
          try {
            const workers = (window as any).MonacoEnvironment?.getWorkers?.() || [];
            workers.forEach((worker: Worker) => {
              worker.terminate?.();
            });
          } catch (e) {
            console.error('清理Monaco worker失败:', e);
          }
        }
        
        // 强制垃圾回收（如果支持）
        if ((window as any).gc && process.env.NODE_ENV === 'development') {
          setTimeout(() => (window as any).gc(), 1000);
        }
      } catch (error) {
        console.error('Monaco清理失败:', error);
      }
      
      deleteSession(currentSelectedSession.value);
      return;
    }
    
    if (newVisible && !oldVisible) {
      initDebugSession();
    }
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
              :avatar="config.icon?config.icon:DefaultAgentIcon"
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
              { id, role, question, answer, answerIndex, createdAt, flowdata }, idx
            ) in conversations"
            :key="id"
            :avatar="role === 'user' ? userAvatar : (config.icon?config.icon:robotAvatar)"
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
              <!-- 工作流显示 -->
              <div v-if="flowdata" class="workflow-container">
                <DialogueFlow 
                  :flowdata="flowdata" 
                  :isWorkFlowDebug="true"
                />
              </div>
              
              <!-- 🔑 附件显示 -->
              <FileAttachment 
                v-if="getCurrentAttachments.length > 0 && idx === conversations.length - 1"
                :files="getCurrentAttachments"
                style="margin-top: 16px; margin-bottom: 16px;"
              />
              
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
          <div class="send-button-group">
            <div class="upload-button">
              <img src="@/assets/svgs/upload_light.svg" alt="" />
            </div>
            <div class="send-button">
               <img
                v-if="
                  dialogueInput.length <= 0
                "
                src="@/assets/svgs/send_disabled.svg"
                alt=""
              />
              <img
                v-else
                :src="isStreaming ? SendDisabledIcon : SendEnableIcon"
                alt=""
                @click="async () => await onSend(dialogueInput)"
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

  .workflow-container {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--o-border-color-light);
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
