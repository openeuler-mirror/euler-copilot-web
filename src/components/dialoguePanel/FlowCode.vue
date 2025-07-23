<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import JSONMonacoEditor from '@/components/JSONMonacoEditor.vue';
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
  }>(),
  {
    disabled: false,
  },
);

const code = ref('');

// 智能处理不同类型的数据
const formatCodeData = (data: any) => {
  console.log('🔧 FlowCode formatCodeData input:', data, 'type:', typeof data);
  
  if (data === null || data === undefined) {
    return '{}';
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
    return JSON.stringify(data, null, 2);
  }
  
  // 其他类型转为字符串
  return String(data);
};

// 初始化数据
code.value = formatCodeData(props.code);
const monacoEditorRef = ref();

const currentTheme = computed(() => {
  return themeStore.theme === 'dark' ? 'dark' : 'light';
});

const handleReady = (payload: any) => {
  monacoEditorRef.value = payload.editor;
  console.log('📝 Monaco editor ready, current code:', code.value);
  
  // 确保编辑器显示当前内容
  if (payload.editor && code.value) {
    setTimeout(() => {
      if (payload.editor && typeof payload.editor.setValue === 'function') {
        payload.editor.setValue(code.value);
        payload.editor.layout && payload.editor.layout();
        console.log('🔄 Monaco Editor forced update on ready with value:', code.value);
      }
    }, 100);
  }
};

const handleChange = (value: string) => {
  code.value = value;
  params.value = value;
};

// 强制刷新编辑器
const forceRefresh = () => {
  if (monacoEditorRef.value) {
    console.log('🔄 Force refreshing Monaco Editor');
    // 触发布局更新
    monacoEditorRef.value.layout && monacoEditorRef.value.layout();
    // 重新设置值
    const currentValue = code.value;
    nextTick(() => {
      if (monacoEditorRef.value && typeof monacoEditorRef.value.setValue === 'function') {
        monacoEditorRef.value.setValue(currentValue);
      }
    });
  }
};

const copy = () => {
  console.log('Copy button clicked, code.value:', code.value);
  console.log('monacoEditorRef.value:', monacoEditorRef.value);
  
  const textToCopy = code.value || JSON.stringify(props.code, null, 2);
  
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        console.log('文本已复制到剪切板:', textToCopy);
        // 可以在这里添加用户友好的提示
      })
      .catch((err) => {
        console.error('复制文本时出错:', err);
        // 降级到旧的复制方法
        fallbackCopy(textToCopy);
      });
  } else {
    // 不支持 navigator.clipboard 的浏览器降级方法
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
    console.log('文本已通过降级方法复制到剪切板');
  } catch (err) {
    console.error('降级复制方法也失败了:', err);
  }
  document.body.removeChild(textArea);
};

watch(
  () => props.code,
  (newCode) => {
    console.log('🔄 FlowCode props.code changed:', newCode);
    const formattedCode = formatCodeData(newCode);
    console.log('📝 FlowCode formatted result:', formattedCode);
    code.value = formattedCode;
    
    // 强制更新 Monaco Editor（如果存在）
    if (monacoEditorRef.value) {
      console.log('🔄 Force updating Monaco Editor with new value');
      // 使用 nextTick 确保更新在下一个 tick 执行
      nextTick(() => {
        if (monacoEditorRef.value && typeof monacoEditorRef.value.setValue === 'function') {
          monacoEditorRef.value.setValue(formattedCode);
          // 强制刷新布局
          forceRefresh();
        }
      });
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
</script>

<template>
  <div class="json-display">
    <div class="json-header">
      <span v-if="props.title === 'input'">{{ $t('flow.input')}}</span>
      <span v-else-if="props.title === 'output'">{{ $t('flow.output')}}</span>
      <span v-else-if="props.title === 'params'">{{ $t('flow.params')}}</span>
      <span v-else>{{ $t('flow.supplementaryParameters')}} {{ props.title }}</span>
      <span
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
    <div class="code-container">
      <!-- 调试信息：显示当前数据（仅当有内容时显示） -->
      <div v-if="code && code.trim() !== '{}'" style="background: #e8f5e8; padding: 4px; font-size: 10px; border-bottom: 1px solid #ccc; color: #666;">
        ✅ 数据: {{ code.length }} 字符
      </div>
      
      <JSONMonacoEditor
        v-model="code"
        placeholder="Code goes here..."
        :style="CODE_STYLE"
        :autofocus="true"
        :theme="currentTheme"
        :disabled="props.disabled"
        @ready="handleReady"
        @change="handleChange"
      />
    </div>
  </div>
  <div></div>
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
