<template>
  <div class="json-monaco-editor">
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
    maxHeight: '200px',
    fontSize: '14px',
    lineHeight: '16px'
  }
  return { ...defaultStyle, ...props.style }
})

// 初始化Monaco Editor
const initMonacoEditor = async () => {
  if (!editorContainer.value) return

  // 配置Worker - 不设置worker，使用默认配置
  // Monaco Editor会自动处理worker加载

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
     formatOnPaste: true,
     formatOnType: true
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

  // 自动聚焦
  if (props.autofocus) {
    editor.focus()
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
  if (editor && newVal !== editor.getValue()) {
    editor.setValue(newVal || '')
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
    
    :deep(.monaco-editor) {
      .margin {
        background-color: var(--el-fill-color-extra-light);
      }
      
      .monaco-editor-background {
        background-color: var(--el-bg-color);
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