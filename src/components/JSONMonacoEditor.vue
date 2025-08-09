<template>
  <div class="json-monaco-editor">
    <!-- 简化调试信息 -->
    <div v-if="props.modelValue && props.modelValue.trim() !== '{}'" style="background: #e0f7fa; padding: 2px; font-size: 9px; color: #666;">
      📝 {{ props.modelValue.length }}
    </div>
    
    <div 
      ref="editorContainer" 
      class="editor-container"
      :style="editorStyle"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import * as monaco from 'monaco-editor'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  autofocus?: boolean
  style?: Record<string, any>
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Code goes here...',
  disabled: false,
  autofocus: false,
  style: () => ({}),
  theme: 'light'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'ready': [payload: { view: any, editor: any }]
  'change': [value: string]
}>()

const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

const editorStyle = computed(() => {
  const defaultStyle = {
    width: '100%',
    height: '100%',
    minHeight: '120px', // 确保最小高度
    maxHeight: '200px',
    fontSize: '14px',
    lineHeight: '16px',
    overflow: 'hidden' // 防止内容溢出
  }
  return { ...defaultStyle, ...props.style }
})

// 初始化Monaco Editor
const initMonacoEditor = async () => {
  if (!editorContainer.value) return

  try {
    // 配置Worker - 禁用worker避免加载问题
    if (typeof window !== 'undefined') {
      (window as any).MonacoEnvironment = {
        getWorker: () => {
          // 返回一个空的worker来避免错误
          return {
            postMessage: () => {},
            terminate: () => {},
            addEventListener: () => {},
            removeEventListener: () => {}
          }
        }
      }
    }

  // 定义深色主题
  monaco.editor.defineTheme('json-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '9CDCFE' },
      { token: 'string.value.json', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'keyword.json', foreground: '569CD6' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#858585',
      'editor.selectionBackground': '#264F78',
      'editor.lineHighlightBackground': '#2A2D2E'
    }
  })

  // 创建编辑器
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: 'json',
    theme: props.theme === 'dark' ? 'json-dark' : 'vs',
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: '"Monaco", "Consolas", monospace',
    readOnly: props.disabled,
    minimap: {
      enabled: false
    },
    // JSON特定设置
    formatOnPaste: false, // 禁用可能需要worker的功能
    formatOnType: false,  // 禁用可能需要worker的功能
    // 禁用一些高级功能来避免worker问题
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    tabCompletion: 'off',
    wordBasedSuggestions: 'off',
    // 禁用语言服务相关功能
    foldingStrategy: 'indentation'
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    emit('update:modelValue', value)
    emit('change', value)
  })

  // 触发ready事件
  emit('ready', { 
    view: editor, 
    editor: editor 
  })

  // 强制布局刷新确保正确显示
  setTimeout(() => {
    if (editor) {
      editor.layout();
      // 移除详细日志
    }
  }, 100);

  // 自动聚焦
  if (props.autofocus) {
    editor.focus()
  }
  } catch (error) {
    console.error('Monaco Editor 初始化失败:', error)
    // 可以在这里添加降级方案，比如显示一个简单的 textarea
    if (editorContainer.value) {
      editorContainer.value.innerHTML = `
        <textarea 
          style="width: 100%; height: 100%; border: none; outline: none; resize: none; font-family: monospace; padding: 8px;"
          placeholder="${props.placeholder}"
          ${props.disabled ? 'readonly' : ''}
        >${props.modelValue}</textarea>
      `
      
      const textarea = editorContainer.value.querySelector('textarea')
      if (textarea) {
        textarea.addEventListener('input', (e) => {
          const value = (e.target as HTMLTextAreaElement).value
          emit('update:modelValue', value)
          emit('change', value)
        })
        
        emit('ready', { 
          view: textarea, 
          editor: textarea 
        })
      }
    }
  }
}

// 获取值
const getValue = () => {
  return editor?.getValue() || ''
}

// 设置值
const setValue = (value: string) => {
  if (editor) {
    editor.setValue(value)
  }
}

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  if (editor) {
    const currentValue = editor.getValue();
    // 只有在值真正不同时才更新
    if (currentValue !== (newVal || '')) {
      editor.setValue(newVal || '');
      // 减少频繁的layout调用
      setTimeout(() => {
        if (editor) {
          editor.layout();
          // 移除详细日志
        }
      }, 150); // 增加延迟，减少频率
    }
  } else if (!editor && editorContainer.value) {
    // 处理降级方案（textarea）
    const textarea = editorContainer.value.querySelector('textarea');
    if (textarea && textarea.value !== (newVal || '')) {
      textarea.value = newVal || '';
      // 触发输入事件确保显示更新
      textarea.dispatchEvent(new Event('input'));
    }
  }
}, { immediate: true })

watch(() => props.theme, (newTheme) => {
  if (editor) {
    editor.updateOptions({
      theme: newTheme === 'dark' ? 'json-dark' : 'vs'
    })
  }
})

watch(() => props.disabled, (newVal) => {
  if (editor) {
    editor.updateOptions({ readOnly: newVal })
  }
})

// 生命周期
onMounted(async () => {
  await nextTick()
  await initMonacoEditor()
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
})

// 暴露方法
defineExpose({
  getValue,
  setValue,
  focus: () => editor?.focus(),
  formatDocument: () => editor?.getAction('editor.action.formatDocument')?.run()
})
</script>

<style lang="scss" scoped>
.json-monaco-editor {
  .editor-container {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    overflow: hidden;
    min-height: 120px; // 确保最小高度
    
    :deep(.monaco-editor) {
      min-height: 120px !important; // 强制最小高度
      
      .margin {
        background-color: var(--el-fill-color-extra-light);
      }
      
      .monaco-editor-background {
        background-color: var(--el-bg-color);
      }
      
      // 确保文本内容可见
      .view-lines {
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      .view-line {
        opacity: 1 !important;
        visibility: visible !important;
      }
    }
  }
}

// 深色主题下的样式调整
:deep(.monaco-editor) {
  &.vs-dark {
    .margin {
      background-color: #1e1e1e;
    }
    
    .monaco-editor-background {
      background-color: #1e1e1e;
    }
  }
}
</style> 