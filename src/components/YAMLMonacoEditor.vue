<template>
  <div class="yaml-monaco-editor">
    <div 
      ref="editorContainer" 
      class="editor-container"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'

interface Props {
  modelValue?: string
  disabled?: boolean
  autofocus?: boolean
  theme?: 'light' | 'dark'
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  autofocus: false,
  theme: 'light',
  height: '100%'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:updateVal': [value: string]
  'change': [value: string]
}>()

const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// 初始化Monaco Editor
const initMonacoEditor = async () => {
  if (!editorContainer.value) return

  // 配置Worker - 不设置worker，使用默认配置
  // Monaco Editor会自动处理worker加载

  // 定义YAML语言支持
  monaco.languages.register({ id: 'yaml' })
  
  // 设置YAML语法高亮
  monaco.languages.setMonarchTokensProvider('yaml', {
    tokenizer: {
      root: [
        [/^(\s*)([\w-]+)(\s*)(:)/, ['white', 'key', 'white', 'delimiter']],
        [/^(\s*)(-)(\s*)/, ['white', 'delimiter', 'white']],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string."'],
        [/'/, 'string', "@string.'"],
        [/\|/, 'string', '@multistring'],
        [/[0-9]+/, 'number'],
        [/(true|false)/, 'keyword'],
        [/(null)/, 'keyword'],
        [/#.*/, 'comment'],
      ],
      string: [
        [/[^\\"']+/, 'string'],
        [/\\./, 'string.escape'],
        [/["']/, { cases: { '$#==$S2': { token: 'string', next: '@pop' }, '@default': 'string' } }]
      ],
      multistring: [
        [/.*/, 'string']
      ]
    }
  })

  // 定义深色主题
  monaco.editor.defineTheme('yaml-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'key', foreground: '9CDCFE' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'delimiter', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#282C34',
      'editor.foreground': '#ABB2BF',
      'editorLineNumber.foreground': '#636D83',
      'editor.selectionBackground': '#3E4451',
      'editor.lineHighlightBackground': '#2C313C'
    }
  })

  // 创建编辑器
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: 'yaml',
    theme: props.theme === 'dark' ? 'yaml-dark' : 'vs',
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
    // 启用代码折叠
    folding: true,
    foldingStrategy: 'indentation',
    foldingHighlight: true,
    showFoldingControls: 'always'
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    emit('update:modelValue', value)
    emit('update:updateVal', value)
    emit('change', value)
    
    // 处理折叠标记的显示
    updateFoldMarkers()
  })

  // 自动聚焦
  if (props.autofocus) {
    editor.focus()
  }

  // 初始化折叠标记
  setTimeout(() => {
    updateFoldMarkers()
  }, 100)
}

// 更新折叠标记样式
const updateFoldMarkers = () => {
  setTimeout(() => {
    // 清理折叠/展开标记的文本内容
    const foldMarkers = document.querySelectorAll('.codicon-chevron-down, .codicon-chevron-right')
    foldMarkers.forEach((marker: Element) => {
      if (marker.textContent && marker.textContent.trim()) {
        marker.textContent = ''
      }
    })
  }, 50)
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
      theme: newTheme === 'dark' ? 'yaml-dark' : 'vs'
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
.yaml-monaco-editor {
  height: 100%;
  width: 100%;
  
  .editor-container {
    height: 100%;
    width: 100%;
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
      
      // 代码折叠标记样式
      .codicon-chevron-down,
      .codicon-chevron-right {
        width: 0;
        height: 0;
        display: block;
        border: 4px solid transparent;
        padding: 0;
        margin-top: 6px;
        
        &.codicon-chevron-down {
          border-top: 4px solid #8d98aa;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: none;
          margin-left: 4px;
        }
        
        &.codicon-chevron-right {
          border-left: 4px solid #8d98aa;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
          border-right: none;
          margin-left: 6px;
          margin-top: 8px;
        }
      }
      
      .folding-icon {
        color: transparent !important;
        
        &::before {
          content: '';
        }
      }
    }
  }
}

// 深色主题下的样式调整
:deep(.monaco-editor) {
  &.vs-dark {
    .margin {
      background-color: #282c34;
    }
    
    .monaco-editor-background {
      background-color: #282c34;
    }
  }
}

// 聚焦状态样式
.yaml-monaco-editor :deep(.monaco-editor) {
  &.focused {
    outline: none;
  }
}
</style> 