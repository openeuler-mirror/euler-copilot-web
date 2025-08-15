<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import JSONMonacoEditor from '@/components/JSONMonacoEditor.vue';
import FileAttachment from './FileAttachment.vue';
import { storeToRefs } from 'pinia';
import { useChangeThemeStore, useHistorySessionStore } from '@/store/';

const { params } = storeToRefs(useHistorySessionStore());
const themeStore = useChangeThemeStore();

const CODE_STYLE = {
  width: '100%',
  height: '100%',
  maxHeight: '200px',
  overflowY: 'auto',
  fontSize: '14px',
  lineHeight: '16px',
};

const props = withDefaults(
  defineProps<{
    code: object;
    title: string;
    disabled?: boolean;
    error?: string;  // 新增：错误信息
    stepStatus?: string;  // 新增：步骤状态
  }>(),
  {
    disabled: false,
    error: '',
    stepStatus: 'success',
  },
);

const code = ref('');
const monacoEditorRef = ref();
const showMonacoEditor = ref(false);
const useTextarea = ref(false);
const fileAttachments = ref<any[]>([]);

// 计算属性：判断是否为错误状态
const isErrorState = computed(() => {
  return props.stepStatus === 'error' || props.stepStatus === 'failed' || !!props.error;
});

// 计算属性：获取显示的错误信息
const displayError = computed(() => {
  if (props.error) {
    return props.error;
  }
  
  // 如果没有显式的错误信息，但状态是失败，尝试从code中提取错误信息
  if (isErrorState.value && typeof props.code === 'object' && props.code) {
    if ((props.code as any).message) {
      return (props.code as any).message;
    }
    if ((props.code as any).error) {
      return (props.code as any).error;
    }
  }
  
  return '';
});

// 🔑 获取当前对话ID的函数
const getCurrentConversationId = (): string => {
  // 尝试从多个可能的来源获取对话ID
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversation_id') || 
                         sessionStorage.getItem('currentConversationId') ||
                         localStorage.getItem('currentConversationId') ||
                         (window as any).currentConversationId ||
                         Date.now().toString(); // 如果都没有，生成一个基于时间的ID
  return conversationId;
};

// 🔑 每个FlowCode组件实例的唯一ID（只生成一次）
const panelInstanceId = `panel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 🔑 获取当前DialoguePanel实例ID的函数
const getCurrentPanelInstanceId = (): string => {
  return panelInstanceId;
};

let updateTimer: NodeJS.Timeout | null = null;
let lastUpdateTime = 0;
const UPDATE_DEBOUNCE_DELAY = 300; // 防抖延迟
const MIN_UPDATE_INTERVAL = 100; // 最小更新间隔

// 全局Monaco Editor实例计数器和限制
const MAX_MONACO_INSTANCES = 5; // 最大同时存在的Monaco Editor实例数
let globalMonacoInstanceCount = 0;

// 获取全局实例计数
const getGlobalMonacoCount = () => {
  const containers = document.querySelectorAll('.monaco-editor');
  return containers.length;
};

// 智能处理不同类型的数据
const formatCodeData = (data: any) => {
  
  if (data === null || data === undefined) {
    return '{}';
  }
  
  // 🔑 新增：检测DirectReply输出中的文件附件（多文件格式）
  if (typeof data === 'object' && data.type === 'files' && data.files && Array.isArray(data.files)) {
    
    // 将文件数据添加到本地文件附件列表（仅用于FlowCode组件内显示）
    data.files.forEach((fileData: any) => {
      if (fileData.file_id && fileData.filename && fileData.content) {
        fileAttachments.value.push({
          file_id: fileData.file_id,
          filename: fileData.filename,
          file_type: fileData.file_type,
          file_size: fileData.file_size,
          variable_name: fileData.variable_name,
          content: fileData.content
        });
      }
    });
    
    // 🔑 移除全局收集器添加逻辑，文件收集统一由DebugApp的step.output事件处理
    // 避免重复添加到全局收集器
    
    // 创建一个不含base64内容的显示版本
    const displayData = {
      type: 'files',
      variable_name: data.variable_name,
      file_count: data.files.length,
      files: data.files.map((file: any) => ({
        file_id: file.file_id,
        filename: file.filename,
        file_type: file.file_type,
        file_size: file.file_size,
        variable_name: file.variable_name,
        _note: `文件内容已在下方文件附件区域显示`
      }))
    };
    
    return JSON.stringify(displayData, null, 2);
  }

  // 🔑 保留：检测DirectReply输出中的文件附件（旧格式兼容）
  if (typeof data === 'object' && data.files && Array.isArray(data.files)) {
    // 将文件数据添加到本地文件附件列表（仅用于FlowCode组件内显示）
    data.files.forEach((fileData: any) => {
      if (fileData.file_id && fileData.filename && fileData.content) {
        fileAttachments.value.push({
          file_id: fileData.file_id,
          filename: fileData.filename,
          file_type: fileData.file_type,
          file_size: fileData.file_size,
          variable_name: fileData.variable_name,
          content: fileData.content
        });
      }
    });
    
    // 🔑 移除全局收集器添加逻辑，避免重复
    
    // 创建一个不含base64内容的显示版本
    const displayData = {
      ...data,
      files: data.files.map((file: any) => ({
        file_id: file.file_id,
        filename: file.filename,
        file_type: file.file_type,
        file_size: file.file_size,
        variable_name: file.variable_name,
        _note: `文件内容已在下方文件附件区域显示`
      }))
    };
    
    return JSON.stringify(displayData, null, 2);
  }
  
  // 🔑 新增：检测单个文件对象（DirectReply FILE类型输出）
  if (typeof data === 'object' && data.file_id && data.filename && data.content) {

    
    // 将文件数据添加到本地文件附件列表（仅用于FlowCode组件内显示）
    fileAttachments.value.push({
      file_id: data.file_id,
      filename: data.filename,
      file_type: data.file_type,
      file_size: data.file_size,
      variable_name: data.variable_name,
      content: data.content
    });
    
    // 🔑 移除全局收集器添加逻辑，文件收集统一由DebugApp的step.output事件处理
    // 避免重复添加到全局收集器
    
    // 返回文件信息的摘要，不显示base64内容
    return JSON.stringify({
      type: 'file',
      file_id: data.file_id,
      filename: data.filename,
      file_type: data.file_type,
      file_size: data.file_size,
      variable_name: data.variable_name,
      _note: '文件内容已在下方文件附件区域显示'
    }, null, 2);
  }
  
  // 🔑 新增：检测旧格式的FILE类型输出（向后兼容）
  if (typeof data === 'object' && data.type === 'file' && data.content) {
    // 将文件数据添加到文件附件列表
    const fileData = data.content;
    if (fileData.file_id && fileData.filename && fileData.content) {
      fileAttachments.value.push(fileData);
    }
    
    // 返回文件信息的摘要，不显示base64内容
    return JSON.stringify({
      type: 'file',
      file_id: fileData.file_id,
      filename: fileData.filename,
      file_type: fileData.file_type,
      file_size: fileData.file_size,
      variable_name: fileData.variable_name,
      _note: '文件内容已在下方文件附件区域显示'
    }, null, 2);
  }
  
  if (typeof data === 'string') {
    // 如果是字符串，检查是否是有效的JSON
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // 如果不是JSON，直接返回字符串
      return data;
    }
  }
  
  if (typeof data === 'object') {
    try {
      // 检查对象大小，避免序列化过大的对象
      const jsonString = JSON.stringify(data, null, 2);
      if (jsonString.length > 50000) { // 50KB限制
        return JSON.stringify({ 
          _notice: '数据过大，已截断显示',
          _size: `${jsonString.length} 字符`,
          _preview: JSON.stringify(data).substring(0, 1000) + '...'
        }, null, 2);
      }
      return jsonString;
    } catch (error) {
      console.error('JSON序列化失败:', error);
      return '{ "_error": "序列化失败" }';
    }
  }
  
  // 其他类型转为字符串
  return String(data);
};

// 检查是否应该使用Monaco Editor
const shouldUseMonacoEditor = () => {
  const currentCount = getGlobalMonacoCount();
  const codeLength = code.value?.length || 0;
  
  // 如果当前Monaco实例太多，或代码量小，使用textarea
  if (currentCount >= MAX_MONACO_INSTANCES || codeLength < 100) {
    return false;
  }
  
  return true;
};

// 防抖更新Monaco编辑器
const debouncedUpdateEditor = (newValue: string) => {
  const now = Date.now();
  
  // 清除之前的定时器
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  
  // 如果距离上次更新时间太短，延迟更新
  const timeSinceLastUpdate = now - lastUpdateTime;
  const delay = timeSinceLastUpdate < MIN_UPDATE_INTERVAL ? 
    UPDATE_DEBOUNCE_DELAY : 
    Math.max(50, UPDATE_DEBOUNCE_DELAY - timeSinceLastUpdate);
  
  updateTimer = setTimeout(() => {
    if (monacoEditorRef.value && typeof monacoEditorRef.value.setValue === 'function') {
      try {
        const currentValue = monacoEditorRef.value.getValue();
        // 只有在值真正不同时才更新
        if (currentValue !== newValue) {
          monacoEditorRef.value.setValue(newValue);
          lastUpdateTime = Date.now();
        }
      } catch (error) {
        console.error('Monaco编辑器更新失败:', error);
      }
    }
    updateTimer = null;
  }, delay);
};

// 初始化数据
code.value = formatCodeData(props.code);

// 延迟决定是否显示Monaco Editor
onMounted(() => {
  // 延迟100ms后决定使用哪种编辑器
  setTimeout(() => {
    if (shouldUseMonacoEditor()) {
      showMonacoEditor.value = true;
      useTextarea.value = false;
    } else {
      showMonacoEditor.value = false;
      useTextarea.value = true;
    }
  }, 100);
});

const currentTheme = computed(() => {
  return themeStore.theme === 'dark' ? 'dark' : 'light';
});

const handleReady = (payload: any) => {
  monacoEditorRef.value = payload.editor;
  globalMonacoInstanceCount++;
  
  // 确保编辑器显示当前内容（初始化时不需要防抖）
  if (payload.editor && code.value) {
    setTimeout(() => {
      if (payload.editor && typeof payload.editor.setValue === 'function') {
        try {
          payload.editor.setValue(code.value);
          payload.editor.layout && payload.editor.layout();
        } catch (error) {
          console.error('Monaco编辑器初始化失败:', error);
        }
      }
    }, 50); // 减少延迟
  }
};

const handleChange = (value: string) => {
  code.value = value;
  params.value = value;
};

// 安全的强制刷新编辑器
const forceRefresh = () => {
  if (monacoEditorRef.value) {
    try {
      // 只触发布局更新，不重新设置值
      monacoEditorRef.value.layout && monacoEditorRef.value.layout();
    } catch (error) {
      console.error('Monaco编辑器刷新失败:', error);
    }
  }
};

const copy = () => {
  const textToCopy = code.value || JSON.stringify(props.code, null, 2);
  
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        // 移除成功日志
      })
      .catch((err) => {
        console.error('复制文本时出错:', err);
        fallbackCopy(textToCopy);
      });
  } else {
    fallbackCopy(textToCopy);
  }
};

const fallbackCopy = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('降级复制方法也失败了:', err);
  }
  document.body.removeChild(textArea);
};

watch(
  () => props.code,
  (newCode) => {
    // 重置文件附件
    fileAttachments.value = [];
    
    const formattedCode = formatCodeData(newCode);
    code.value = formattedCode;
    
    // 使用防抖更新Monaco Editor
    if (showMonacoEditor.value && monacoEditorRef.value) {
      debouncedUpdateEditor(formattedCode);
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => code.value,
  () => {
    params.value = code.value;
  },
);

// 组件卸载时清理定时器和实例计数
onBeforeUnmount(() => {
  if (updateTimer) {
    clearTimeout(updateTimer);
    updateTimer = null;
  }
  
  if (monacoEditorRef.value) {
    globalMonacoInstanceCount = Math.max(0, globalMonacoInstanceCount - 1);
  }
});
</script>

<template>
  <div class="json-display">
    <div class="json-header" :class="{ 'error-header': isErrorState }">
      <span v-if="props.title === 'input'">{{ $t('flow.input')}}</span>
      <span v-else-if="props.title === 'output'">
        {{ $t('flow.output')}}
        <span v-if="isErrorState" class="error-badge">❌ 失败</span>
      </span>
      <span v-else-if="props.title === 'params'">{{ $t('flow.params')}}</span>
      <span v-else>{{ $t('flow.supplementaryParameters')}} {{ props.title }}</span>
      <span
        v-if="showMonacoEditor"
        @click="forceRefresh()"
        style="cursor: pointer; margin-right: 8px; font-size: 12px; color: #666; padding: 2px 4px; border-radius: 3px; background: #f0f0f0;"
        title="刷新编辑器"
      >🔄</span>
      <span
        @click="copy()"
        class="copyIcon"
        :class="themeStore.theme === 'light' ? 'lightCopy' : 'darkCopy'"
      ></span>
    </div>
    
    <!-- 错误信息显示区域 -->
    <div v-if="isErrorState && displayError" class="error-container">
      <div class="error-header">
        <span class="error-icon">⚠️</span>
        <span class="error-title">执行失败</span>
      </div>
      <div class="error-content">
        {{ displayError }}
      </div>
    </div>
    
    <div class="code-container" :class="{ 'error-state': isErrorState }">
      <!-- 调试信息：显示当前数据和编辑器类型 -->
      <div v-if="code && code.trim() !== '{}'" style="background: #e8f5e8; padding: 4px; font-size: 10px; border-bottom: 1px solid #ccc; color: #666;">
        {{ isErrorState ? '❌' : '✅' }} 数据: {{ code.length }} 字符 | {{ showMonacoEditor ? 'Monaco' : 'Textarea' }}
      </div>
      
      <!-- Monaco Editor（当实例数量允许时） -->
      <JSONMonacoEditor
        v-if="showMonacoEditor"
        v-model="code"
        placeholder="Code goes here..."
        :style="CODE_STYLE"
        :autofocus="true"
        :theme="currentTheme"
        :disabled="props.disabled"
        @ready="handleReady"
        @change="handleChange"
      />
      
      <!-- 降级Textarea（当Monaco实例太多时） -->
      <textarea
        v-else-if="useTextarea"
        v-model="code"
        :disabled="props.disabled"
        placeholder="Code goes here..."
        style="width: 100%; height: 100%; max-height: 200px; overflow-y: auto; font-size: 14px; line-height: 16px; border: none; outline: none; resize: none; font-family: monospace; padding: 8px; background-color: transparent;"
        @input="handleChange(($event.target as HTMLTextAreaElement).value)"
      />
      
      <!-- 加载状态 -->
      <div v-else style="padding: 20px; text-align: center; color: #666;">
        加载中...
      </div>
    </div>
    
    <!-- 🔑 新增：文件附件区域 -->
    <FileAttachment
      v-if="fileAttachments.length > 0"
      :files="fileAttachments"
    />
  </div>
</template>

<style scoped>
.code-container {
  background-color: white;
  background: white !important;
}
.json-display {
  font-family: Arial, sans-serif;
  margin: 0 auto;
}

.copyIcon {
  width: 16px;
  cursor: pointer;
}
.lightCopy {
  background: url(@/assets/svgs/light_copy.svg) center center no-repeat;
}
.darkCopy {
  background: url(@/assets/svgs/light_copy.svg) center center no-repeat;
}

h2 {
  color: #333;
  text-align: center;
}

.copy-button {
  position: relative;
  border: none;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.copy-button:disabled {
  cursor: not-allowed;
}
.json-header {
  display: flex;
  position: relative;
  justify-content: space-between;
  background-color: var(--o-bg-color-light2) !important;
  border: var(--o-flow-code-border) 1px solid;
  border-radius: 4px 4px 0px 0px;
  margin-top: 12px;
  bottom: -2px;
  padding: 0px 16px;
  height: 32px;
  span {
    color: var(--o-text-color-primarys);
    height: 32px;
    align-items: center;
    align-content: center;
  }
}

.json-header.error-header {
  background-color: #fef2f2 !important;
  border-color: #fecaca;
  color: #dc2626;
}

.error-badge {
  font-size: 12px;
  color: #dc2626;
  background-color: #fee2e2;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;
}

.error-container {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-top: none;
  padding: 12px 16px;
  font-size: 14px;
}

.error-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  color: #dc2626;
}

.error-icon {
  margin-right: 8px;
  font-size: 16px;
}

.error-title {
  font-size: 14px;
}

.error-content {
  color: #dc2626;
  line-height: 1.5;
  background-color: #fee2e2;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 4px solid #dc2626;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

.code-container.error-state {
  border-color: #fecaca;
}
pre {
  overflow-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap; /* 保持缩进同时允许换行 */
  margin: 8px 0px;
  border: 1px solid black;
  overflow-y: scroll;
  .code-toolbar {
    user-select: none;
    background-color: var(--o-bash-bg);
    color: var(--o-text-color-primarys);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 8px 8px 0 0;
    padding: 8px 12px 0 12px;
    font-family:
      Inter,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      sans-serif;
    .pre-copy {
      cursor: pointer;
      svg {
        vertical-align: middle;
      }
      &:hover {
        color: var(--o-text-color-secondary);
      }
    }
  }
  code {
    background-color: var(--o-bash-bg);
    border-radius: 0 0 8px 8px;
  }
}
</style>
