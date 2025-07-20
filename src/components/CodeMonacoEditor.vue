<template>
  <div class="code-monaco-editor" :class="{ 'fullscreen': isFullScreen }">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <div class="language-selector">
          <label>语言：</label>
          <el-select 
            v-model="currentLanguage" 
            @change="handleLanguageChange"
            size="small"
            style="width: 120px"
          >
            <el-option label="Python" value="python" />
            <el-option label="JavaScript" value="javascript" />
            <el-option label="Bash" value="shell" />
          </el-select>
        </div>
                 <div class="toolbar-actions">
           <el-button size="small" type="text" @click="insertTemplate">
             插入模板
           </el-button>
           <el-button size="small" type="text" @click="formatCode">
             格式化
           </el-button>
           <el-button size="small" type="text" @click="copyCode" :icon="CopyDocument">
             复制
           </el-button>
           <el-button 
             size="small" 
             type="text" 
             @click="toggleFullScreen"
             :icon="isFullScreen ? Minus : FullScreen"
             :title="isFullScreen ? '退出全屏' : '全屏'"
           >
             {{ isFullScreen ? '退出全屏' : '全屏' }}
           </el-button>
         </div>
      </div>
      
      <div class="toolbar-right">
        <!-- Navigation -->
        <div class="navigation" v-if="symbols.length > 0">
          <el-select 
            v-model="selectedSymbol" 
            @change="navigateToSymbol"
            size="small"
            placeholder="跳转到..."
            style="width: 200px"
            clearable
            filterable
          >
            <el-option
              v-for="symbol in symbols"
              :key="symbol.id"
              :label="symbol.label"
              :value="symbol.id"
            >
              <div class="symbol-option">
                <i :class="getSymbolIcon(symbol.kind)" class="symbol-icon"></i>
                <span>{{ symbol.label }}</span>
              </div>
            </el-option>
          </el-select>
        </div>
      </div>
    </div>
    
    <!-- Monaco Editor -->
    <div 
      ref="editorContainer" 
      class="editor-container"
      :style="{ height: containerHeight }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { ElSelect, ElOption, ElButton, ElMessage } from 'element-plus'
import { CopyDocument, FullScreen, Minus } from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'

interface Props {
  modelValue?: string
  language?: string
  minHeight?: number
  maxHeight?: number
  placeholder?: string
  disabled?: boolean
  customTemplate?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'python',
  minHeight: 200,
  maxHeight: 600,
  placeholder: '请输入代码...',
  disabled: false,
  customTemplate: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:language': [language: string]
  'language-change': [language: string]
}>()

const editorContainer = ref<HTMLElement>()
const currentLanguage = ref(props.language)
const selectedSymbol = ref('')
const symbols = ref<any[]>([])
const isFullScreen = ref(false)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// 计算容器高度 - 弹性变化
const editorHeight = ref(props.minHeight)

const updateEditorHeight = () => {
  if (!editor) {
    editorHeight.value = props.minHeight
    return
  }
  
  const lineCount = editor.getModel()?.getLineCount() || 1
  const lineHeight = 19
  const padding = 40 // 增加padding为工具栏和边距留空间
  const calculatedHeight = Math.max(lineCount * lineHeight + padding, props.minHeight)
  editorHeight.value = Math.min(calculatedHeight, props.maxHeight)
}

const containerHeight = computed(() => {
  if (isFullScreen.value) {
    return 'calc(100vh - 60px)' // 全屏时减去工具栏高度
  }
  return `${editorHeight.value}px`
})

// 代码模板
const codeTemplates = {
  python: `def main(**kwargs):
    """
    代码执行主函数
    
    Args:
        **kwargs: 输入变量字典
        
    Returns:
        dict: 输出变量字典
    """
    # 获取输入变量
    # 示例：value = kwargs.get('input_variable_name', default_value)
    
    # 在这里编写您的 Python 代码
    result = {
        # 定义输出变量
        # 'output_variable_name': value
    }
    
    return result`,
    
  javascript: `function main(variables = {}) {
    /**
     * 代码执行主函数
     * 
     * @param {Object} variables - 输入变量对象
     * @returns {Object} 输出变量对象
     */
    
    // 获取输入变量
    // 示例：const value = variables.input_variable_name || default_value;
    
    // 在这里编写您的 JavaScript 代码
    const result = {
        // 定义输出变量
        // output_variable_name: value
    };
    
    return result;
}`,
    
  shell: `#!/bin/bash

# 代码执行主函数
# 输入变量通过环境变量传递：INPUT_VARIABLE_NAME
# 输出变量以JSON格式打印到stdout

main() {
    # 获取输入变量
    # 示例：local value="\${INPUT_VARIABLE_NAME:-default_value}"
    
    # 在这里编写您的 Bash 代码
    
    # 输出JSON格式结果
    cat << EOF
{
    "output_variable_name": "value"
}
EOF
}

# 调用主函数
main`
}

// 初始化Monaco Editor
const initMonacoEditor = async () => {
  if (!editorContainer.value) return

  // 配置Worker - 不设置worker，使用默认配置
  // Monaco Editor会自动处理worker加载

  // 定义Atom One Dark Pro主题
  monaco.editor.defineTheme('atom-one-dark-pro', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C678DD' },
      { token: 'operator', foreground: '56B6C2' },
      { token: 'namespace', foreground: 'E06C75' },
      { token: 'type', foreground: 'E5C07B' },
      { token: 'struct', foreground: 'E5C07B' },
      { token: 'class', foreground: 'E5C07B' },
      { token: 'interface', foreground: 'E5C07B' },
      { token: 'parameter', foreground: 'D19A66' },
      { token: 'variable', foreground: 'E06C75' },
      { token: 'property', foreground: 'E06C75' },
      { token: 'enumMember', foreground: 'D19A66' },
      { token: 'function', foreground: '61AFEF' },
      { token: 'member', foreground: '61AFEF' },
      { token: 'macro', foreground: '61AFEF' },
      { token: 'label', foreground: 'E06C75' },
      { token: 'string', foreground: '98C379' },
      { token: 'number', foreground: 'D19A66' },
      { token: 'regexp', foreground: '98C379' },
      { token: 'delimiter', foreground: 'ABB2BF' },
    ],
    colors: {
      'editor.background': '#282C34',
      'editor.foreground': '#ABB2BF',
      'editorCursor.foreground': '#528BFF',
      'editor.lineHighlightBackground': '#2C313C',
      'editorLineNumber.foreground': '#636D83',
      'editorLineNumber.activeForeground': '#ABB2BF',
      'editor.selectionBackground': '#3E4451',
      'editor.selectionHighlightBackground': '#3E4451',
      'editorBracketMatch.background': '#3E4451',
      'editorBracketMatch.border': '#528BFF',
      'editorGutter.background': '#282C34',
      'editorGutter.addedBackground': '#109868',
      'editorGutter.deletedBackground': '#946EE5',
      'editorGutter.modifiedBackground': '#948B60',
      'editorScrollbar.shadow': '#23252B',
      'scrollbarSlider.background': '#4E5666',
      'scrollbarSlider.hoverBackground': '#5A637580',
      'scrollbarSlider.activeBackground': '#747D9180'
    }
  })

  // 创建编辑器
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue || codeTemplates[currentLanguage.value] || '',
    language: currentLanguage.value,
    theme: 'atom-one-dark-pro',
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: '"Fira Code", "JetBrains Mono", "Monaco", "Consolas", monospace',
    readOnly: props.disabled,
    // 启用代码折叠
    folding: true,
    foldingStrategy: 'auto',
    foldingHighlight: true,
    unfoldOnClickAfterEndOfLine: true,
    // 启用minimap和导航
    minimap: {
      enabled: false
    },
    // 启用语法高亮
    'semanticHighlighting.enabled': true,
         // 启用括号匹配
     matchBrackets: 'always',
     // 启用空白字符显示
     renderWhitespace: 'boundary'
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    emit('update:modelValue', value)
    // 更新符号导航
    updateSymbols()
    // 更新编辑器高度
    updateEditorHeight()
  })

  // 初始化符号导航和高度
  updateSymbols()
  updateEditorHeight()
}

// 更新符号导航
const updateSymbols = async () => {
  if (!editor) return
  
  try {
    const model = editor.getModel()
    if (!model) return

    // 简化符号导航：基于函数、类等关键字搜索
    const content = model.getValue()
    const lines = content.split('\n')
    const foundSymbols: any[] = []
    
         lines.forEach((line, index) => {
       const trimmedLine = line.trim()
       let match: RegExpMatchArray | null = null
      
      // Python 函数和类
      if (currentLanguage.value === 'python') {
        if ((match = trimmedLine.match(/^(def|class)\s+(\w+)/))) {
          foundSymbols.push({
            id: `${match[2]}-${index}`,
            label: `${match[1]} ${match[2]}`,
            kind: match[1] === 'def' ? 12 : 5, // Function or Class
            range: {
              startLineNumber: index + 1,
              startColumn: 1
            }
          })
        }
      }
      // JavaScript 函数和类
      else if (currentLanguage.value === 'javascript') {
        if ((match = trimmedLine.match(/^(function|class)\s+(\w+)/))) {
          foundSymbols.push({
            id: `${match[2]}-${index}`,
            label: `${match[1]} ${match[2]}`,
            kind: match[1] === 'function' ? 12 : 5,
            range: {
              startLineNumber: index + 1,
              startColumn: 1
            }
          })
        }
        // 箭头函数
        else if ((match = trimmedLine.match(/^(const|let|var)\s+(\w+)\s*=\s*\(/))) {
          foundSymbols.push({
            id: `${match[2]}-${index}`,
            label: `function ${match[2]}`,
            kind: 12,
            range: {
              startLineNumber: index + 1,
              startColumn: 1
            }
          })
        }
      }
      // Bash 函数
      else if (currentLanguage.value === 'shell') {
        if ((match = trimmedLine.match(/^(\w+)\s*\(\s*\)\s*\{?/))) {
          foundSymbols.push({
            id: `${match[1]}-${index}`,
            label: `function ${match[1]}`,
            kind: 12,
            range: {
              startLineNumber: index + 1,
              startColumn: 1
            }
          })
        }
      }
    })
    
    symbols.value = foundSymbols
  } catch (error) {
    console.warn('获取文档符号失败:', error)
    symbols.value = []
  }
}

// 跳转到符号
const navigateToSymbol = (symbolId: string) => {
  if (!editor || !symbolId) return
  
  const symbol = symbols.value.find(s => s.id === symbolId)
  if (!symbol) return
  
  editor.setPosition({
    lineNumber: symbol.range.startLineNumber,
    column: symbol.range.startColumn
  })
  editor.revealLineInCenter(symbol.range.startLineNumber)
  editor.focus()
}

// 获取符号图标
const getSymbolIcon = (kind: number) => {
  const iconMap: Record<number, string> = {
    1: 'codicon codicon-file',          // File
    2: 'codicon codicon-symbol-module', // Module
    3: 'codicon codicon-symbol-namespace', // Namespace
    4: 'codicon codicon-symbol-package', // Package
    5: 'codicon codicon-symbol-class',   // Class
    6: 'codicon codicon-symbol-method',  // Method
    7: 'codicon codicon-symbol-property', // Property
    8: 'codicon codicon-symbol-field',   // Field
    9: 'codicon codicon-symbol-constructor', // Constructor
    10: 'codicon codicon-symbol-enum',   // Enum
    11: 'codicon codicon-symbol-interface', // Interface
    12: 'codicon codicon-symbol-function', // Function
    13: 'codicon codicon-symbol-variable', // Variable
    14: 'codicon codicon-symbol-constant', // Constant
    15: 'codicon codicon-symbol-string',  // String
    16: 'codicon codicon-symbol-number',  // Number
    17: 'codicon codicon-symbol-boolean', // Boolean
    18: 'codicon codicon-symbol-array',   // Array
  }
  return iconMap[kind] || 'codicon codicon-symbol-misc'
}

// 处理语言变化
const handleLanguageChange = (newLanguage: string) => {
  currentLanguage.value = newLanguage
  emit('update:language', newLanguage)
  emit('language-change', newLanguage)
  
  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel()!, newLanguage)
    updateSymbols()
  }
}

// 插入模板
const insertTemplate = () => {
  // 优先使用传入的自定义模板，否则使用默认模板
  const template = props.customTemplate || codeTemplates[currentLanguage.value]
  if (editor && template) {
    editor.setValue(template)
    emit('update:modelValue', template)
    ElMessage.success('模板已插入')
  }
}

// 格式化代码
const formatCode = () => {
  if (editor) {
    editor.getAction('editor.action.formatDocument')?.run()
    ElMessage.success('代码已格式化')
  }
}

// 复制代码
const copyCode = async () => {
  if (editor) {
    const code = editor.getValue()
    try {
      await navigator.clipboard.writeText(code)
      ElMessage.success('代码已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      ElMessage.error('复制失败，请手动复制')
    }
  }
}

// 切换全屏
const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value
  
  if (isFullScreen.value) {
    // 进入全屏模式 - 立即应用所有样式避免动画过程
    ElMessage.info('按 ESC 或 F11 键退出全屏模式')
    
    // 先应用全屏样式，再添加类名，确保无缝切换
    addFullscreenStyles()
    document.body.style.overflow = 'hidden' // 禁止页面滚动
    document.body.classList.add('monaco-editor-fullscreen') // 添加body class
    
    // 降低所有可能干扰的高层级元素的z-index
    const highLevelElements = document.querySelectorAll('.el-drawer, .el-overlay, .el-message-box__wrapper, .el-dialog__wrapper')
    highLevelElements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement
      htmlElement.style.zIndex = '1000'
    })
    
    // 立即调整编辑器布局到全屏尺寸，避免延迟
    if (editor) {
      // 直接设置编辑器到全屏尺寸，不使用 updateEditorHeight()
      editor.layout({
        width: window.innerWidth,
        height: window.innerHeight - 60 // 减去工具栏高度
      })
    }
  } else {
    // 退出全屏模式
    removeFullscreenStyles()
    document.body.style.overflow = '' // 恢复页面滚动
    document.body.classList.remove('monaco-editor-fullscreen') // 移除body class
    
    // 恢复所有高层级元素的 z-index
    const highLevelElements = document.querySelectorAll('.el-drawer, .el-overlay, .el-message-box__wrapper, .el-dialog__wrapper')
    highLevelElements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement
      htmlElement.style.zIndex = ''
    })
    
    // 清理编辑器容器的强制样式
    const editorElement = editorContainer.value
    if (editorElement) {
      editorElement.style.removeProperty('display')
      editorElement.style.removeProperty('visibility')
      editorElement.style.removeProperty('opacity')
    }
    
    // 退出全屏时才重新计算高度
    nextTick(() => {
      if (editor) {
        updateEditorHeight()
        editor.layout()
      }
    })
  }
}

// 添加全屏样式（通过JavaScript直接添加，避免Vue CSS限制）
const addFullscreenStyles = () => {
  // 创建style元素
  const styleId = 'monaco-editor-fullscreen-styles'
  let styleElement = document.getElementById(styleId) as HTMLStyleElement
  
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = styleId
    document.head.appendChild(styleElement)
  }
  
  styleElement.textContent = `
    /* 简化方案：直接让编辑器组件覆盖整个屏幕 */
    .code-monaco-editor.fullscreen {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      background: #282c34 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
    }
    
    /* 确保工具栏在正确位置 */
    .code-monaco-editor.fullscreen .editor-toolbar {
      position: relative !important;
      z-index: 1000000 !important;
      background: #1e2127 !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 100% !important;
      padding: 12px 16px !important;
    }
    
    /* 确保编辑器容器占满剩余空间 */
    .code-monaco-editor.fullscreen .editor-container {
      width: 100% !important;
      height: calc(100vh - 60px) !important;
      position: relative !important;
      visibility: visible !important;
      opacity: 1 !important;
      background: #282c34 !important;
    }
    
    /* 确保Monaco编辑器本身可见并占满容器 */
    .code-monaco-editor.fullscreen .monaco-editor {
      width: 100% !important;
      height: 100% !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* 隐藏所有其他内容 */
    body.monaco-editor-fullscreen > *:not(.code-monaco-editor) {
      visibility: hidden !important;
      pointer-events: none !important;
    }
    
    /* 强制显示编辑器 */
    body.monaco-editor-fullscreen .code-monaco-editor.fullscreen {
      visibility: visible !important;
      pointer-events: auto !important;
    }
    
    /* 确保编辑器内部所有元素可见 */
    .code-monaco-editor.fullscreen * {
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
  `
}

// 移除全屏样式
const removeFullscreenStyles = () => {
  const styleElement = document.getElementById('monaco-editor-fullscreen-styles')
  if (styleElement) {
    styleElement.remove()
  }
}

// 监听键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  // ESC键退出全屏
  if (event.key === 'Escape' && isFullScreen.value) {
    toggleFullScreen()
    event.preventDefault()
    event.stopPropagation() // 阻止事件冒泡
    return false
  }
  // F11键切换全屏
  if (event.key === 'F11') {
    toggleFullScreen()
    event.preventDefault()
    event.stopPropagation()
    return false
  }
}

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  if (editor && newVal !== editor.getValue()) {
    editor.setValue(newVal)
    // 内容变化后更新高度
    nextTick(() => {
      updateEditorHeight()
    })
  }
}, { immediate: true })

watch(() => props.language, (newVal) => {
  if (newVal !== currentLanguage.value) {
    currentLanguage.value = newVal
    if (editor) {
      monaco.editor.setModelLanguage(editor.getModel()!, newVal)
      updateSymbols()
    }
  }
}, { immediate: true })

watch(() => props.disabled, (newVal) => {
  if (editor) {
    editor.updateOptions({ readOnly: newVal })
  }
})

// 监听高度相关props变化
watch([() => props.minHeight, () => props.maxHeight], () => {
  updateEditorHeight()
})

// 生命周期
onMounted(async () => {
  await nextTick()
  await initMonacoEditor()
  // 确保编辑器初始化后正确设置高度
  await nextTick()
  updateEditorHeight()
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
  
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
  
  // 恢复页面滚动
  document.body.style.overflow = ''
  document.body.classList.remove('monaco-editor-fullscreen')
  
  // 清理全屏样式
  removeFullscreenStyles()
  
  // 恢复所有元素的 z-index
  const highLevelElements = document.querySelectorAll('.el-drawer, .el-overlay, .el-message-box__wrapper, .el-dialog__wrapper')
  highLevelElements.forEach((element: Element) => {
    const htmlElement = element as HTMLElement
    htmlElement.style.zIndex = ''
  })
  
  // 清理编辑器容器的强制样式
  const editorElement = editorContainer.value
  if (editorElement) {
    editorElement.style.removeProperty('display')
    editorElement.style.removeProperty('visibility')
    editorElement.style.removeProperty('opacity')
  }
})

// 暴露方法
defineExpose({
  focus: () => editor?.focus(),
  getValue: () => editor?.getValue() || '',
  setValue: (value: string) => editor?.setValue(value),
  formatCode,
  insertTemplate,
  toggleFullScreen
})
</script>

<style lang="scss" scoped>
.code-monaco-editor {
  border: 1px solid #3e4451;
  border-radius: 8px;
  overflow: hidden;
  background: #282c34;
  
  &.fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 999999 !important; // 提高到比 ElementPlus drawer 更高
    border: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #282c34 !important;
    box-shadow: none !important;
    transform: none !important;
    
    // 添加全屏遮罩，确保覆盖所有内容
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: #282c34;
      z-index: -1; // 放到最底层，只作为背景
    }
  }
  
  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #21252b;
    border-bottom: 1px solid #3e4451;
    
    .fullscreen & {
      padding: 12px 16px;
      background: #1e2127;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 10; // 简化层级
      
      .toolbar-actions {
        .el-button {
          font-size: 14px !important;
          padding: 8px 16px !important;
        }
      }
    }
    
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .language-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        
        label {
          color: #abb2bf;
          font-size: 12px;
          font-weight: 500;
        }
      }
      
      .toolbar-actions {
        display: flex;
        gap: 8px;
        
        :deep(.el-button) {
          color: #ffffff !important; // 使用白色文字确保清晰可见
          font-size: 13px !important; // 稍微增大字体
          font-weight: 500 !important; // 增加字体粗细
          padding: 6px 12px !important; // 增加内边距提升点击体验
          border-radius: 4px !important; // 添加圆角
          transition: all 0.2s ease !important; // 添加过渡动画
          border: 1px solid transparent !important; // 透明边框便于添加悬停效果
          background: transparent !important;
          
          span {
            color: #ffffff !important;
          }
          
          &:hover {
            color: #61afef !important; // 悬停时使用主题蓝色
            background: rgba(97, 175, 239, 0.15) !important; // 稍微增加背景透明度
            border-color: rgba(97, 175, 239, 0.3) !important; // 添加边框效果
            transform: translateY(-1px) !important; // 轻微上移效果
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important; // 添加阴影
            
            span {
              color: #61afef !important;
            }
          }
          
          &:active {
            transform: translateY(0) !important; // 点击时回到原位
            background: rgba(97, 175, 239, 0.25) !important;
          }
          
          &:focus {
            outline: none !important;
            border-color: #61afef !important;
            box-shadow: 0 0 0 2px rgba(97, 175, 239, 0.2) !important;
          }
        }
      }
    }
    
          .toolbar-right {
        .navigation {
          // 修复导航选择框的文字颜色
          :deep(.el-select) {
            .el-select__wrapper:not(.is-disabled) .el-select__selected-item {
              color: #ffffff !important;
              font-weight: 500;
            }
            
            .el-select__wrapper .el-select__selected-item {
              color: #ffffff !important;
              font-weight: 500;
            }
            
            .el-select__wrapper .el-select__placeholder {
              color: #8b949e !important;
            }
          }
          
          .symbol-option {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .symbol-icon {
              font-size: 14px;
              color: #61afef;
            }
          }
        }
      }
  }
  
  .editor-container {
    position: relative;
    width: 100%;
    transition: height 0.2s ease-in-out;
    
    :deep(.monaco-editor) {
      width: 100% !important;
      height: 100% !important;
      
      .margin {
        background-color: #282c34;
      }
      
      .monaco-editor-background {
        background-color: #282c34;
      }
      
      .current-line {
        background-color: #2c313c;
      }
      
      .view-lines {
        overflow: visible;
      }
      
      // 代码折叠样式
      .cldr {
        background: transparent;
        
        &.folded {
          background: #3e4451;
          border-radius: 3px;
        }
      }
      
      .monaco-icon-label::before {
        color: #61afef;
      }
      
      // 确保内容区域正确显示
      .monaco-scrollable-element {
        overflow: visible;
      }
      
      .overflow-guard {
        overflow: visible;
      }
    }
  }
  
  .editor-container {
    .fullscreen & {
      width: 100% !important;
      height: calc(100vh - 60px) !important;
      position: relative !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      overflow: hidden !important;
      
      .monaco-editor {
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }
    }
  }
}

// 下拉选择器样式 - 适配暗色主题
.code-monaco-editor {
  :deep(.el-select) {
    .el-input__wrapper {
      background-color: #3e4451;
      border: 1px solid #5c6370;
      
      .el-input__inner {
        color: #ffffff !important; // 使用白色文字确保在暗色背景下清晰可见
        font-weight: 500;
      }
      
      .el-select__suffix {
        color: #abb2bf;
      }
    }
    
    // 修复选中项的文字颜色
    .el-select__wrapper:not(.is-disabled) .el-select__selected-item {
      color: #ffffff !important;
      font-weight: 500;
    }
    
    // 修复输入框中的选中文字
    .el-select__wrapper .el-select__selected-item {
      color: #ffffff !important;
      font-weight: 500;
    }
    
    // 修复占位符文字颜色
    .el-select__wrapper .el-select__placeholder {
      color: #8b949e !important;
    }
    
    &:hover .el-input__wrapper {
      border-color: #61afef;
    }
    
    &.is-focus .el-input__wrapper {
      border-color: #61afef;
      box-shadow: 0 0 0 2px rgba(97, 175, 239, 0.2);
    }
  }
}

// 全局选择框下拉菜单样式
:deep(.el-select-dropdown) {
  background-color: #282c34;
  border: 1px solid #3e4451;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  .el-select-dropdown__item {
    color: #ffffff !important; // 使用白色文字
    font-weight: 500;
    
    &:hover {
      background-color: #3e4451;
      color: #61afef !important;
    }
    
    &.selected {
      background-color: #61afef;
      color: #ffffff !important;
    }
  }
}

// 全局选择框输入项样式修复
:deep(.el-select) {
  .el-select__wrapper {
    .el-select__selected-item {
      color: #ffffff !important;
      font-weight: 500;
    }
    
    .el-select__placeholder {
      color: #8b949e !important;
    }
    
    .el-input__inner {
      color: #ffffff !important;
    }
  }
  
  .el-select__wrapper:not(.is-disabled) {
    .el-select__selected-item {
      color: #ffffff !important;
      font-weight: 500;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .code-monaco-editor {
    .editor-toolbar {
      flex-direction: column;
      gap: 8px;
      
      .toolbar-left,
      .toolbar-right {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
}

// 全屏相关样式通过JavaScript动态管理，解决Vue CSS限制问题
</style> 