<template>
  <div class="variable-rich-text-editor">
    <!-- 编辑器容器 -->
    <div class="editor-container">
      <!-- 工具栏 -->
      <div class="editor-toolbar">
        <span class="toolbar-title">{{ $t('common.reply') }}</span>
        <div class="toolbar-actions">
          <el-tooltip content="输入 / 或 &#123;&#123; 插入变量" placement="top">
            <div
              class="variable-button-container"
              ref="variableButtonRef"
              @click.stop
            >
              <el-button
                size="small"
                type="text"
                @click.stop="toggleVariableDropdown"
                @mousedown.stop
                @mouseup.stop
                :class="{ active: showVariableDropdown }"
                class="toolbar-btn"
              >
                {x}
              </el-button>

              <!-- 变量插入下拉框 -->
              <teleport to="body">
                <div
                  v-if="showVariableDropdown"
                  class="variable-dropdown-wrapper"
                  :style="dropdownPosition"
                  @click.stop
                  @mousedown.stop.prevent
                  @mouseup.stop
                >
                  <VariableInsertDropdown
                    :supported-scopes="[
                      'conversation',
                      'system',
                      'env',
                      'user',
                    ]"
                    :flow-id="flowId"
                    :current-step-id="currentStepId"
                    @variable-selected="handleVariableSelection"
                    @variables-loaded="handleVariablesLoaded"
                  />
                </div>
              </teleport>
            </div>
          </el-tooltip>
          <el-tooltip content="复制内容" placement="top">
            <el-button
              size="small"
              type="text"
              @click="copyContent"
              class="toolbar-btn"
            >
              <el-icon><IconCopy /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- Tag模式编辑器 -->
      <div v-if="displayMode === 'tag'" class="tag-editor">
        <div
          ref="tagEditorRef"
          class="editor-content"
          contenteditable="true"
          :placeholder="placeholder"
          dir="ltr"
          @input="handleTagInput"
          @keydown="handleKeyDown"
          @focus="handleFocus"
          @blur="handleBlur"
          @paste="handlePaste"
          @compositionstart="handleCompositionStart"
          @compositionupdate="handleCompositionUpdate"
          @compositionend="handleCompositionEnd"
        ></div>
      </div>

      <!-- Text模式编辑器 -->
      <div v-else class="text-editor">
        <el-input
          ref="textEditorRef"
          v-model="textContent"
          type="textarea"
          :placeholder="placeholder"
          :rows="6"
          @input="handleTextInput"
          @focus="handleFocus"
          @blur="handleBlur"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { ElInput, ElMessage } from 'element-plus';
import { IconCopy } from '@computing/opendesign-icons';
import VariableInsertDropdown from '@/components/VariableInsertDropdown.vue';
import { type Variable } from '@/components/useVariables';

interface Props {
  modelValue: string;
  flowId?: string;
  currentStepId?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
});

const emit = defineEmits([
  'update:modelValue',
  'variable-inserted',
  'toggle-variable-selector',
  'toggle-display-mode',
  'copy-content',
]);

// 可用变量列表（从 VariableInsertDropdown 组件传递过来）
const availableVariables = ref<Variable[]>([]);

// 响应式数据
const tagEditorRef = ref<HTMLElement>();
const textEditorRef = ref();
const variableButtonRef = ref<HTMLElement>();
const textContent = ref('');
const showVariableDropdown = ref(false);
const isComposing = ref(false);
const displayMode = ref<'tag' | 'text'>('tag');
const isUpdatingTagEditor = ref(false);
const isEnterKeyPressed = ref(false);

// 工具函数
const getVariableDisplayName = (variable: Variable): string => {
  if (variable.scope === 'system') {
    const nameMap = {
      query: 'system.query',
      files: 'system.files',
      dialogue_count: 'system.dialogue_count',
      app_id: 'system.app_id',
      flow_id: 'system.flow_id',
      user_id: 'system.user_id',
      session_id: 'system.session_id',
      timestamp: 'system.timestamp',
    };
    return nameMap[variable.name] || `system.${variable.name}`;
  }

  // 特殊处理具备step_id的conversation变量
  if (variable.scope === 'conversation' && variable.step_id && variable.step) {
    return `${variable.step}.${variable.name}`;
  }

  return `${variable.scope}.${variable.name}`;
};

// 生成插入用的变量名格式
const getVariableInsertName = (variable: Variable): string => {
  if (variable.scope === 'system') {
    const nameMap = {
      query: 'system.query',
      files: 'system.files',
      dialogue_count: 'system.dialogue_count',
      app_id: 'system.app_id',
      flow_id: 'system.flow_id',
      user_id: 'system.user_id',
      session_id: 'system.session_id',
      timestamp: 'system.timestamp',
    };
    return nameMap[variable.name] || `system.${variable.name}`;
  }

  // 特殊处理具备step_id的conversation变量
  if (variable.scope === 'conversation' && variable.step_id) {
    return `conversation.${variable.step_id}.${variable.name}`;
  }

  return `${variable.scope}.${variable.name}`;
};

// 根据插入格式的变量名获取显示文本
const getDisplayTextFromInsertName = (insertName: string): string => {
  if (!availableVariables.value || availableVariables.value.length === 0) {
    return insertName;
  }

  // 查找匹配的变量对象
  const matchedVariable = availableVariables.value.find((variable) => {
    const expectedInsertName = getVariableInsertName(variable);
    return expectedInsertName === insertName;
  });

  if (matchedVariable) {
    return getVariableDisplayName(matchedVariable);
  }

  // 如果找不到匹配的变量，尝试解析conversation.step_id.variable_name格式
  if (insertName.includes('.')) {
    const parts = insertName.split('.');

    // 处理conversation.step_id.variable_name格式
    if (parts.length === 3 && parts[0] === 'conversation') {
      const [scope, stepId, varName] = parts;
      const conversationVariable = availableVariables.value.find(
        (variable) =>
          variable.scope === scope &&
          variable.step_id === stepId &&
          variable.name === varName,
      );

      if (conversationVariable && conversationVariable.step) {
        return `${conversationVariable.step}.${conversationVariable.name}`;
      }
    }
  }

  // fallback：返回原始名称
  return insertName;
};

// 检查变量是否在可用变量列表中
const isVariableValid = (variableName: string): boolean => {
  if (!availableVariables.value || availableVariables.value.length === 0) {
    return true;
  }

  return availableVariables.value.some((variable) => {
    // 检查插入格式是否匹配
    const expectedInsertName = getVariableInsertName(variable);
    if (expectedInsertName === variableName) {
      return true;
    }

    // 检查显示格式是否匹配（为了兼容性）
    const expectedDisplayName = getVariableDisplayName(variable);
    if (expectedDisplayName === variableName) {
      return true;
    }

    // 特殊处理conversation.step_id.variable_name格式
    if (variableName.includes('.')) {
      const parts = variableName.split('.');

      // 处理conversation.step_id.variable_name格式
      if (parts.length === 3 && parts[0] === 'conversation') {
        const [scope, stepId, varName] = parts;
        if (
          variable.scope === scope &&
          variable.step_id === stepId &&
          variable.name === varName
        ) {
          return true;
        }
      }

      // 处理scope.variable_name格式
      if (parts.length === 2) {
        const [scope, varName] = parts;
        if (variable.scope === scope && variable.name === varName) {
          return true;
        }
      }
    } else {
      // 没有scope的情况，仅通过变量名匹配
      if (variable.name === variableName) {
        return true;
      }
    }

    return false;
  });
};

// 更新tag编辑器内容
const updateTagEditor = (content: string) => {
  if (!tagEditorRef.value) return;

  if (isUpdatingTagEditor.value) {
    return;
  }

  try {
    isUpdatingTagEditor.value = true;

    // 将 {{variable}} 格式转换为带样式的span标签
    const htmlContent = content.replace(
      /\{\{([^}]+)\}\}/g,
      (match, variableName) => {
        const escapedVariableName = variableName
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

        const isValid = isVariableValid(variableName);

        const tagClass = isValid
          ? 'variable-tag'
          : 'variable-tag variable-tag-invalid';
        const backgroundStyle = isValid
          ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;'
          : 'background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%) !important;';

        const titleAttribute = isValid
          ? ''
          : `title="变量 ${variableName} 不存在"`;

        return `<span class="${tagClass}" contenteditable="false" data-variable="${escapedVariableName}" data-original-name="${escapedVariableName}" data-valid="${isValid}" ${titleAttribute} style="display: inline-block !important; padding: 2px 8px !important; margin: 0 2px !important; ${backgroundStyle} color: white !important; border-radius: 4px !important; font-size: 12px !important; font-weight: 500 !important; cursor: pointer !important; user-select: none !important; vertical-align: middle !important; direction: ltr !important; unicode-bidi: normal !important; text-align: center !important; writing-mode: horizontal-tb !important;">${getDisplayTextFromInsertName(variableName)}</span>`;
      },
    );

    tagEditorRef.value.innerHTML = htmlContent;

    setTimeout(() => {
      isUpdatingTagEditor.value = false;
    }, 50);
  } catch (error) {
    isUpdatingTagEditor.value = false;
  }
};

const closeVariableDropdown = () => {
  if (isInsertingTriggerChar.value) {
    return;
  }

  if (showVariableDropdown.value) {
    showVariableDropdown.value = false;

    setTimeout(() => {
      if (availableVariables.value.length > 0 && displayMode.value === 'tag') {
        const cursorPos = saveCursorPosition();
        const currentContent = props.modelValue;
        updateTagEditor(currentContent);

        if (cursorPos !== null) {
          nextTick(() => {
            restoreCursorPosition(cursorPos);
          });
        }
      }
    }, 50);
  }
};

// 处理变量列表加载完成
const handleVariablesLoaded = (variables: Variable[]) => {
  availableVariables.value = variables;

  if (isUpdatingTagEditor.value) {
    return;
  }

  if (showVariableDropdown.value) {
    return;
  }

  if (displayMode.value === 'tag') {
    const currentContent = props.modelValue;
    updateTagEditor(currentContent);
  }
};

const handleVariableSelection = (variable: Variable) => {
  isSelectingVariable.value = true
  
  // 检查是否为文件类型变量
  if (variable.var_type === 'file' || variable.var_type === 'array[file]') {
    // 对于文件类型变量，需要删除触发字符，然后发送特殊事件给父组件
    
    // 删除触发字符的逻辑
    let triggerDeleted = false
    
    // 优先使用triggerCursorPosition（实时位置）
    if (displayMode.value === 'tag' && triggerCursorPosition && tagEditorRef.value) {
      try {
        if (triggerCursorPosition.node.parentNode) {
          const nodeText = triggerCursorPosition.node.textContent || ''
          const beforeOffset = nodeText.substring(0, triggerCursorPosition.offset)
          
          if (beforeOffset.endsWith(triggerCursorPosition.triggerChar)) {
            const range = document.createRange()
            const triggerLength = triggerCursorPosition.triggerChar.length
            
            range.setStart(triggerCursorPosition.node, triggerCursorPosition.offset - triggerLength)
            range.setEnd(triggerCursorPosition.node, triggerCursorPosition.offset)
            range.deleteContents()
            
            // 设置光标位置
            const selection = window.getSelection()
            if (selection) {
              selection.removeAllRanges()
              selection.addRange(range)
            }
            
            triggerDeleted = true
          }
        }
      } catch (error) {
        console.error('删除触发字符失败:', error)
      }
    }
    
    // 如果triggerCursorPosition删除失败，尝试使用blurCursorPosition
    if (!triggerDeleted && displayMode.value === 'tag' && blurCursorPosition !== null && tagEditorRef.value) {
      try {
        // 恢复到blur时的位置
        restoreCursorPosition(blurCursorPosition)
        
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const startContainer = range.startContainer
          
          if (startContainer.nodeType === Node.TEXT_NODE) {
            const nodeText = startContainer.textContent || ''
            const beforeOffset = nodeText.substring(0, range.startOffset)
            
            // 检查是否以触发字符结尾
            if (beforeOffset.endsWith('/') || beforeOffset.endsWith('{{')) {
              const triggerChar = beforeOffset.endsWith('{{') ? '{{' : '/'
              const triggerLength = triggerChar.length
              
              const deleteRange = document.createRange()
              deleteRange.setStart(startContainer, range.startOffset - triggerLength)
              deleteRange.setEnd(startContainer, range.startOffset)
              deleteRange.deleteContents()
              
              // 重新设置光标位置
              const newRange = document.createRange()
              newRange.setStart(startContainer, range.startOffset - triggerLength)
              newRange.setEnd(startContainer, range.startOffset - triggerLength)
              selection.removeAllRanges()
              selection.addRange(newRange)
              
              triggerDeleted = true
            }
          }
        }
      } catch (error) {
        console.error('使用保存位置删除触发字符失败:', error)
      }
    }
    
    // 处理文本模式
    if (!triggerDeleted && displayMode.value === 'text' && textEditorRef.value) {
      try {
        const textarea = textEditorRef.value.$refs?.textarea
        if (textarea) {
          const cursorPos = textarea.selectionStart
          const text = textContent.value
          const beforeCursor = text.substring(0, cursorPos)
          
          // 检查是否以触发字符结尾
          if (beforeCursor.endsWith('/') || beforeCursor.endsWith('{{')) {
            const triggerLength = beforeCursor.endsWith('{{') ? 2 : 1
            const newText = text.substring(0, cursorPos - triggerLength) + text.substring(cursorPos)
            textContent.value = newText
            emit('update:modelValue', newText)
            
            // 重新设置光标位置
            setTimeout(() => {
              textarea.setSelectionRange(cursorPos - triggerLength, cursorPos - triggerLength)
            }, 0)
            triggerDeleted = true
          }
        }
      } catch (error) {
        console.error('删除文本模式触发字符失败:', error)
      }
    }
    
    // 立即更新modelValue以确保删除生效
    if (triggerDeleted && displayMode.value === 'tag') {
      const updatedContent = getTagEditorContent()
      emit('update:modelValue', updatedContent)
    }
    
    emit('variable-inserted', variable)
    showVariableDropdown.value = false
    triggerCursorPosition = null
    blurCursorPosition = null
    isSelectingVariable.value = false
    ElMessage.success(`文件变量 ${variable.name} 已添加为附件`)
    return
  }
  
  const variableName = getVariableInsertName(variable)
  
  try {
    if (displayMode.value === 'tag') {
      if (tagEditorRef.value) {
        tagEditorRef.value.focus()
      }
      
      let insertSuccess = false
      
      if (triggerCursorPosition) {
        insertSuccess = insertVariableAtTriggerPosition(variableName)
      }
      
      if (!insertSuccess && blurCursorPosition !== null) {
        insertSuccess = insertVariableAtSavedPosition(variableName, blurCursorPosition)
      }
      
      if (!insertSuccess) {
        const currentContent = props.modelValue || ''
        const newContent = currentContent + (currentContent ? ' ' : '') + `{{${variableName}}}`
        emit('update:modelValue', newContent)
        emit('variable-inserted', variableName)
        
        setTimeout(() => {
          if (tagEditorRef.value) {
            tagEditorRef.value.focus()
            const range = document.createRange()
            range.selectNodeContents(tagEditorRef.value)
            range.collapse(false)
            const selection = window.getSelection()
            if (selection) {
              selection.removeAllRanges()
              selection.addRange(range)
            }
          }
        }, 50)
      }
    } else {
      const cursorPos = textEditorRef.value?.$refs?.textarea?.selectionStart || textContent.value.length
      const before = textContent.value.substring(0, cursorPos)
      const after = textContent.value.substring(cursorPos)
      textContent.value = before + `{{${variableName}}}` + after
      emit('update:modelValue', textContent.value)
      emit('variable-inserted', variableName)
    }
  } catch (error) {
    ElMessage.error('变量插入失败，请重试')
  }
  
  showVariableDropdown.value = false
  triggerCursorPosition = null
  blurCursorPosition = null
  isSelectingVariable.value = false
}

// 在触发位置插入变量
const insertVariableAtTriggerPosition = (variableName: string) => {
  if (!triggerCursorPosition || !tagEditorRef.value) {
    return false
  }
  
  try {
    if (!triggerCursorPosition.node.parentNode) {
      return insertVariableByContentSearch(variableName)
    }
    
    const nodeText = triggerCursorPosition.node.textContent || ''
    const beforeOffset = nodeText.substring(0, triggerCursorPosition.offset)
    
    if (!beforeOffset.endsWith(triggerCursorPosition.triggerChar)) {
      return insertVariableByContentSearch(variableName)
    }
    
    const variableSpan = document.createElement('span')
    const isValid = isVariableValid(variableName)
    variableSpan.className = isValid ? 'variable-tag' : 'variable-tag variable-tag-invalid'
    variableSpan.contentEditable = 'false'
    
    variableSpan.setAttribute('data-variable', variableName)
    variableSpan.setAttribute('data-original-name', variableName)
    variableSpan.setAttribute('data-valid', isValid.toString())
    
    if (!isValid) {
      variableSpan.setAttribute('title', `变量 ${variableName} 不存在`)
    }
    
    variableSpan.textContent = getDisplayTextFromInsertName(variableName)
    
    const backgroundStyle = isValid 
      ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;'
      : 'background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%) !important;'
    
    variableSpan.style.cssText = `
      display: inline-block !important;
      padding: 2px 8px !important;
      margin: 0 2px !important;
      ${backgroundStyle}
      color: white !important;
      border-radius: 4px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      user-select: none !important;
      vertical-align: middle !important;
    `
    
    const range = document.createRange()
    const triggerLength = triggerCursorPosition.triggerChar.length
    
    range.setStart(triggerCursorPosition.node, triggerCursorPosition.offset - triggerLength)
    range.setEnd(triggerCursorPosition.node, triggerCursorPosition.offset)
    range.deleteContents()
    range.insertNode(variableSpan)
    
    const spaceNode = document.createTextNode(' ')
    range.setStartAfter(variableSpan)
    range.insertNode(spaceNode)
    range.setStartAfter(spaceNode)
    range.setEndAfter(spaceNode)
    
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    setTimeout(() => {
      const currentCursorPos = saveCursorPosition()
      
      const content = getTagEditorContent()
      emit('update:modelValue', content)
      emit('variable-inserted', variableName)
      
      if (currentCursorPos !== null) {
        setTimeout(() => {
          restoreCursorPosition(currentCursorPos)
        }, 20)
      }
    }, 10)
    
    return true
  } catch (error) {
    return false
  }
}

// 基于内容搜索插入变量（当DOM节点失效时的备用方案）
const insertVariableByContentSearch = (variableName: string) => {
  if (!tagEditorRef.value || !triggerCursorPosition) {
    return false
  }
  
  try {
    const structuredContent = getTagEditorContent()
    const plainText = tagEditorRef.value.textContent || ''
    
    const triggerChar = triggerCursorPosition.triggerChar
    const lastTriggerIndex = plainText.lastIndexOf(triggerChar)
    
    if (lastTriggerIndex === -1) {
      return false
    }
    
    const structuredTriggerIndex = structuredContent.lastIndexOf(triggerChar)
    if (structuredTriggerIndex === -1) {
      const newContent = structuredContent + `{{${variableName}}}`
      emit('update:modelValue', newContent)
      emit('variable-inserted', variableName)
      return true
    }
    
    const beforeTrigger = structuredContent.substring(0, structuredTriggerIndex)
    const afterTrigger = structuredContent.substring(structuredTriggerIndex + triggerChar.length)
    const newContent = beforeTrigger + `{{${variableName}}}` + afterTrigger
    
    emit('update:modelValue', newContent)
    emit('variable-inserted', variableName)
    
    setTimeout(() => {
      if (tagEditorRef.value) {
        const variableTags = tagEditorRef.value.querySelectorAll('.variable-tag')
        const lastTag = variableTags[variableTags.length - 1]
        if (lastTag) {
          const range = document.createRange()
          range.setStartAfter(lastTag)
          range.setEndAfter(lastTag)
          const selection = window.getSelection()
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
            tagEditorRef.value.focus()
          }
        }
      }
    }, 50)
    
    return true
  } catch (error) {
    return false
  }
}

// 在保存的位置插入变量
const insertVariableAtSavedPosition = (variableName: string, savedPosition: number) => {
  if (!tagEditorRef.value) {
    return false
  }
  
  try {
    restoreCursorPosition(savedPosition)
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return false
    }
    
    const range = selection.getRangeAt(0)
    
    const variableSpan = document.createElement('span')
    const isValid = isVariableValid(variableName)
    variableSpan.className = isValid ? 'variable-tag' : 'variable-tag variable-tag-invalid'
    variableSpan.contentEditable = 'false'
    
    variableSpan.setAttribute('data-variable', variableName)
    variableSpan.setAttribute('data-original-name', variableName)
    variableSpan.setAttribute('data-valid', isValid.toString())
    
    if (!isValid) {
      variableSpan.setAttribute('title', `变量 ${variableName} 不存在`)
    }
    
    variableSpan.textContent = getDisplayTextFromInsertName(variableName)
    
    const backgroundStyle = isValid 
      ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;'
      : 'background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%) !important;'
    
    variableSpan.style.cssText = `
      display: inline-block !important;
      padding: 2px 8px !important;
      margin: 0 2px !important;
      ${backgroundStyle}
      color: white !important;
      border-radius: 4px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      user-select: none !important;
      vertical-align: middle !important;
    `
    
    range.insertNode(variableSpan)
    
    const spaceNode = document.createTextNode(' ')
    range.setStartAfter(variableSpan)
    range.insertNode(spaceNode)
    range.setStartAfter(spaceNode)
    range.setEndAfter(spaceNode)
    
    selection.removeAllRanges()
    selection.addRange(range)
    
    setTimeout(() => {
      const currentCursorPos = saveCursorPosition()
      
      const content = getTagEditorContent()
      emit('update:modelValue', content)
      emit('variable-inserted', variableName)
      
      if (currentCursorPos !== null) {
        setTimeout(() => {
          restoreCursorPosition(currentCursorPos)
        }, 20)
      }
    }, 10)
    
    return true
  } catch (error) {
    return false
  }
}

// 点击外部关闭下拉框
const handleDocumentClick = (event: MouseEvent) => {
  if (!showVariableDropdown.value) {
    return
  }
  
  if (isInsertingTriggerChar.value) {
    return
  }
  
  const target = event.target as HTMLElement
  const buttonContainer = variableButtonRef.value
  
  const dropdown = document.querySelector('.variable-dropdown-wrapper')
  
  const isClickInButton = buttonContainer && buttonContainer.contains(target)
  const isClickInDropdown = dropdown && dropdown.contains(target)
  
  if (!isClickInButton && !isClickInDropdown) {
    setTimeout(() => {
      if (showVariableDropdown.value && !isSelectingVariable.value) {
        closeVariableDropdown()
        triggerCursorPosition = null
        blurCursorPosition = null
        isSelectingVariable.value = false
      }
    }, 10)
  }
}

// 监听器
watch(
  () => props.modelValue,
  (newVal) => {
    if (isUpdatingTagEditor.value) {
      return;
    }

    if (displayMode.value === 'text') {
      textContent.value = newVal;
    } else {
      updateTagEditor(newVal);
    }
  },
  { immediate: true },
);

watch(showVariableDropdown, (newValue) => {
  if (newValue) {
    nextTick(() => {
      updateDropdownPosition();
    });
  }
});

watch(displayMode, (newMode) => {
  if (newMode === 'text') {
    const currentContent = getTagEditorContent();
    textContent.value = currentContent;
    emit('update:modelValue', currentContent);
  } else {
    nextTick(() => {
      updateTagEditor(textContent.value);
      emit('update:modelValue', textContent.value);
    });
  }
});

watch(availableVariables, () => {
  if (isUpdatingTagEditor.value) {
    return
  }
  
  if (showVariableDropdown.value) {
    const unwatch = watch(showVariableDropdown, (newValue) => {
      if (!newValue && displayMode.value === 'tag') {
        setTimeout(() => {
          const cursorPos = saveCursorPosition()
          const currentContent = props.modelValue
          updateTagEditor(currentContent)
          
          if (cursorPos !== null) {
            nextTick(() => {
              restoreCursorPosition(cursorPos)
            })
          }
        }, 100)
        
        unwatch()
      }
    })
    return
  }
  
  if (displayMode.value === 'tag') {
    const currentContent = props.modelValue
    updateTagEditor(currentContent)
  }
}, { deep: true })

// 获取tag编辑器的纯文本内容（包含变量引用）
const getTagEditorContent = (): string => {
  if (!tagEditorRef.value) return ''
  
  let content = ''
  const nodes = tagEditorRef.value.childNodes
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    
    if (node.nodeType === Node.TEXT_NODE) {
      content += node.textContent || ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      if (element.classList.contains('variable-tag')) {
        const dataVariable = element.getAttribute('data-variable')
        const originalName = element.getAttribute('data-original-name')
        const textContent = element.textContent || ''
        
        let variableName = ''
        if (dataVariable) {
          variableName = dataVariable.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        } else if (originalName) {
          variableName = originalName.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        } else {
          variableName = textContent
        }
        
        content += `{{${variableName}}}`
      } else {
        content += element.textContent || ''
      }
    }
  }
  
  return content
}

const handleTagInput = () => {
  if (isComposing.value || isSelectingVariable.value) return
  
  const triggerInfo = checkAndSaveVariableTrigger()
  const cursorPos = saveCursorPosition()
  
  isUpdatingTagEditor.value = true
  
  const conversionResult = autoConvertVariableSyntaxInDOM()
  const hasVariableConversion = conversionResult.hasConversions
  
  const content = getTagEditorContent()
  emit('update:modelValue', content)
  
  nextTick(() => {
    if (hasVariableConversion && conversionResult.newCursorNode && conversionResult.newCursorOffset !== undefined) {
      const selection = window.getSelection()
      if (selection) {
        const range = document.createRange()
        range.setStart(conversionResult.newCursorNode, conversionResult.newCursorOffset)
        range.setEnd(conversionResult.newCursorNode, conversionResult.newCursorOffset)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    } else if (cursorPos !== null && !isEnterKeyPressed.value) {
      restoreCursorPosition(cursorPos)
    }
    
    applyVariableTrigger(triggerInfo)
    
    if (hasVariableConversion) {
      const updatedContent = getTagEditorContent()
      emit('update:modelValue', updatedContent)
    }
    
    isUpdatingTagEditor.value = false
  })
}

const handleTextInput = () => {
  emit('update:modelValue', textContent.value)
}

// 查找光标前面的变量标签
const findVariableTagBeforeCursor = (range: Range): HTMLElement | null => {
  const startContainer = range.startContainer
  const startOffset = range.startOffset
  
  if (startContainer.nodeType === Node.TEXT_NODE) {
    if (startOffset > 0) {
      return null
    }
    
    if (startOffset === 0) {
      const previousSibling = startContainer.previousSibling
      if (previousSibling && previousSibling.nodeType === Node.ELEMENT_NODE) {
        const element = previousSibling as HTMLElement
        if (element.classList.contains('variable-tag')) {
          return element
        }
      }
      
      let currentNode = startContainer.previousSibling
      let searchDepth = 0
      const maxSearchDepth = 3
      
      while (currentNode && searchDepth < maxSearchDepth) {
        searchDepth++
        
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const element = currentNode as HTMLElement
          if (element.classList.contains('variable-tag')) {
            return element
          }
          if (element.tagName === 'BR') {
            break
          }
        } else if (currentNode.nodeType === Node.TEXT_NODE) {
          const textContent = currentNode.textContent || ''
          if (textContent.includes('\n')) {
            break
          }
          if (textContent.length > 10) {
            break
          }
        }
        
        currentNode = currentNode.previousSibling
      }
    }
  }
  
  if (startContainer.nodeType === Node.ELEMENT_NODE) {
    const element = startContainer as HTMLElement
    const childNodes = element.childNodes
    
    for (let i = startOffset - 1; i >= 0; i--) {
      const node = childNodes[i]
      if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as HTMLElement
        if (childElement.classList.contains('variable-tag')) {
          return childElement
        }
      }
    }
  }
  
  return null
}

// 查找光标后面的变量标签
const findVariableTagAfterCursor = (range: Range): HTMLElement | null => {
  const startContainer = range.startContainer
  const startOffset = range.startOffset
  
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textContent = startContainer.textContent || ''
    
    if (startOffset < textContent.length) {
      return null
    }
    
    if (startOffset === textContent.length) {
      const nextSibling = startContainer.nextSibling
      if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE) {
        const element = nextSibling as HTMLElement
        if (element.classList.contains('variable-tag')) {
          return element
        }
        if (element.tagName === 'BR') {
          return null
        }
      } else if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
        const textContent = nextSibling.textContent || ''
        if (textContent.includes('\n')) {
          return null
        }
      }
    }
  }
  
  if (startContainer.nodeType === Node.ELEMENT_NODE) {
    const element = startContainer as HTMLElement
    const childNodes = element.childNodes
    
    for (let i = startOffset; i < childNodes.length; i++) {
      const node = childNodes[i]
      if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as HTMLElement
        if (childElement.classList.contains('variable-tag')) {
          return childElement
        }
        if (childElement.tagName === 'BR') {
          break
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent || ''
        if (textContent.includes('\n')) {
          break
        }
      }
    }
  }
  
  return null
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showVariableDropdown.value = false
    return
  }
  
  if (event.key === 'Enter') {
    const selection = window.getSelection()
    let isBeforeVariableTag = false
    let nextVariableTag: HTMLElement | null = null
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const startContainer = range.startContainer
      const startOffset = range.startOffset
      
      if (startContainer.nodeType === Node.TEXT_NODE) {
        const nextSibling = startContainer.nextSibling
        if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE) {
          const element = nextSibling as HTMLElement
          if (element.classList.contains('variable-tag')) {
            isBeforeVariableTag = true
            nextVariableTag = element
          }
        }
      } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
        const childNodes = (startContainer as HTMLElement).childNodes
        if (startOffset < childNodes.length) {
          const nextNode = childNodes[startOffset]
          if (nextNode.nodeType === Node.ELEMENT_NODE) {
            const element = nextNode as HTMLElement
            if (element.classList.contains('variable-tag')) {
              isBeforeVariableTag = true
              nextVariableTag = element
            }
          }
        }
      }
    }
    
    if (isBeforeVariableTag && nextVariableTag) {
      event.preventDefault()
      
      const range = selection?.getRangeAt(0)
      if (range) {
        const br = document.createElement('br')
        range.insertNode(br)
        
        const emptyTextNode = document.createTextNode('')
        range.setStartAfter(br)
        range.insertNode(emptyTextNode)
        
        range.setStart(emptyTextNode, 0)
        range.setEnd(emptyTextNode, 0)
        selection?.removeAllRanges()
        selection?.addRange(range)
        
        setTimeout(() => {
          cleanupDOMStructure()
        }, 20)
      }
      
      isEnterKeyPressed.value = true
      setTimeout(() => {
        isEnterKeyPressed.value = false
      }, 10)
      return
    }
    
    isEnterKeyPressed.value = true
    
    const hasUnprocessedVariables = tagEditorRef.value && 
      (tagEditorRef.value.textContent || '').includes('{{') &&
      (tagEditorRef.value.textContent || '').includes('}}')
    
    if (hasUnprocessedVariables) {
      setTimeout(() => {
        const conversionResult = autoConvertVariableSyntaxInDOM()
        if (conversionResult.hasConversions) {
          const content = getTagEditorContent()
          emit('update:modelValue', content)
        }
        isEnterKeyPressed.value = false
      }, 10)
    } else {
      setTimeout(() => {
        isEnterKeyPressed.value = false
      }, 10)
    }
    return
  }
  
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const startContainer = range.startContainer
      const startOffset = range.startOffset
      
      if (event.key === 'ArrowLeft') {
        if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
          const prevSibling = startContainer.previousSibling
          if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
            const element = prevSibling as HTMLElement
            if (element.classList.contains('variable-tag')) {
              const beforeVariableTag = element.previousSibling
              if (beforeVariableTag && beforeVariableTag.nodeType === Node.TEXT_NODE) {
                event.preventDefault()
                const newRange = document.createRange()
                const textLength = beforeVariableTag.textContent?.length || 0
                newRange.setStart(beforeVariableTag, textLength)
                newRange.setEnd(beforeVariableTag, textLength)
                selection.removeAllRanges()
                selection.addRange(newRange)
                return
              } else {
                const emptyTextNode = document.createTextNode('')
                element.parentNode?.insertBefore(emptyTextNode, element)
                
                event.preventDefault()
                const newRange = document.createRange()
                newRange.setStart(emptyTextNode, 0)
                newRange.setEnd(emptyTextNode, 0)
                selection.removeAllRanges()
                selection.addRange(newRange)
                return
              }
            }
          }
        }
      }
      
      else if (event.key === 'ArrowRight') {
        if (startContainer.nodeType === Node.TEXT_NODE) {
          const textContent = startContainer.textContent || ''
          if (startOffset === textContent.length) {
            const nextSibling = startContainer.nextSibling
            if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE) {
              const element = nextSibling as HTMLElement
              if (element.classList.contains('variable-tag')) {
                const afterVariableTag = element.nextSibling
                if (afterVariableTag && afterVariableTag.nodeType === Node.TEXT_NODE) {
                  event.preventDefault()
                  const newRange = document.createRange()
                  newRange.setStart(afterVariableTag, 0)
                  newRange.setEnd(afterVariableTag, 0)
                  selection.removeAllRanges()
                  selection.addRange(newRange)
                  return
                } else {
                  const emptyTextNode = document.createTextNode('')
                  element.parentNode?.insertBefore(emptyTextNode, element.nextSibling)
                  
                  event.preventDefault()
                  const newRange = document.createRange()
                  newRange.setStart(emptyTextNode, 0)
                  newRange.setEnd(emptyTextNode, 0)
                  selection.removeAllRanges()
                  selection.addRange(newRange)
                  return
                }
              }
            }
          }
        }
      }
    }
  }
  
  if (event.key === 'Backspace' || event.key === 'Delete') {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      
      let targetVariableTag: HTMLElement | null = null
      
      const startContainer = range.startContainer
      if (startContainer.nodeType === Node.TEXT_NODE && startContainer.parentNode) {
        const parentElement = startContainer.parentNode as HTMLElement
        if (parentElement.classList?.contains('variable-tag')) {
          targetVariableTag = parentElement
        }
      }
      
      if (!targetVariableTag) {
        if (event.key === 'Backspace') {
          targetVariableTag = findVariableTagBeforeCursor(range)
        } else {
          targetVariableTag = findVariableTagAfterCursor(range)
        }
      }
      
      if (targetVariableTag) {
        event.preventDefault()
        
        const newRange = document.createRange()
        newRange.setStartBefore(targetVariableTag)
        newRange.setEndBefore(targetVariableTag)
        
        targetVariableTag.remove()
        
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
        
        handleTagInput()
        return
      }
      // 对于普通字符删除，让默认行为发生，不设置任何标志
      // handleTagInput会通过input事件自动被调用，并会检查触发条件
    }
  }
}

const handleFocus = () => {
  // 聚焦时的处理
}

// 保存blur时的光标位置
let blurCursorPosition: any = null

const handleBlur = () => {
  if (isInsertingTriggerChar.value) {
    return
  }
  
  blurCursorPosition = saveCursorPosition()
  
  setTimeout(() => {
    if (!isSelectingVariable.value && !isInsertingTriggerChar.value) {
      closeVariableDropdown()
      triggerCursorPosition = null
    }
  }, 200)
}

// 添加变量选择状态追踪
const isSelectingVariable = ref(false)

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  handleTagInput()
}

// 中文输入法事件处理
const handleCompositionStart = (event: CompositionEvent) => {
  isComposing.value = true
}

const handleCompositionUpdate = (event: CompositionEvent) => {
  // 在输入过程中，保持 isComposing 状态
}

const handleCompositionEnd = (event: CompositionEvent) => {
  isComposing.value = false
  
  const savedPosition = saveCursorPosition()
  
  nextTick(() => {
    const content = getTagEditorContent()
    emit('update:modelValue', content)
    
    if (savedPosition !== null) {
      nextTick(() => {
        restoreCursorPosition(savedPosition)
      })
    }
    
    checkForVariableTrigger()
  })
}

// 保存触发时的光标位置和屏幕坐标
let triggerCursorPosition: { 
  node: Node; 
  offset: number; 
  triggerChar: string; 
  screenX: number;
  screenY: number;
} | null = null

// 检查变量触发
const checkForVariableTrigger = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return
  }
  
  const range = selection.getRangeAt(0)
  const textNode = range.startContainer
  
  if (textNode.nodeType === Node.TEXT_NODE) {
    const text = textNode.textContent || ''
    const cursorPos = range.startOffset
    
    const beforeCursor = text.substring(0, cursorPos)
    
    if (beforeCursor.endsWith('/') || beforeCursor.endsWith('{{')) {
      const rangeRect = range.getBoundingClientRect()
      triggerCursorPosition = {
        node: textNode,
        offset: cursorPos,
        triggerChar: beforeCursor.endsWith('{{') ? '{{' : '/',
        screenX: rangeRect.left,
        screenY: rangeRect.top
      }
      showVariableDropdown.value = true
    } else {
      triggerCursorPosition = null
      showVariableDropdown.value = false
    }
  }
}

// 清理DOM结构，移除可能导致变量标签显示异常的不规范元素
const cleanupDOMStructure = () => {
  if (!tagEditorRef.value) return
  
  const childNodes = Array.from(tagEditorRef.value.childNodes)
  let hasChanges = false
  
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i]
    
    if (node.nodeName === 'BR') {
      let consecutiveBrCount = 0
      let j = i
      
      while (j < childNodes.length && childNodes[j].nodeName === 'BR') {
        consecutiveBrCount++
        j++
      }
      
      if (consecutiveBrCount > 1) {
        for (let k = i + 1; k < i + consecutiveBrCount; k++) {
          if (childNodes[k] && childNodes[k].parentNode) {
            childNodes[k].parentNode?.removeChild(childNodes[k])
            hasChanges = true
          }
        }
        
        i = j - 1
      }
    }
    
    else if (node.nodeName === 'DIV' && node.nodeType === Node.ELEMENT_NODE) {
      const divElement = node as HTMLElement
      
      if (!divElement.textContent?.trim() || (divElement.innerHTML === '<br>' || divElement.innerHTML === '<br/>')) {
        const br = document.createElement('br')
        divElement.parentNode?.replaceChild(br, divElement)
        hasChanges = true
      }
    }
  }
  
  if (hasChanges) {
    setTimeout(() => {
      const content = getTagEditorContent()
      emit('update:modelValue', content)
    }, 10)
  }
}

// 自动转换DOM中的{{variable}}格式为变量标签
const autoConvertVariableSyntaxInDOM = (): { hasConversions: boolean, newCursorNode?: Node, newCursorOffset?: number } => {
  if (!tagEditorRef.value) return { hasConversions: false }
  
  let hasConversions = false
  let newCursorNode: Node | undefined
  let newCursorOffset: number | undefined
  
  const selection = window.getSelection()
  let currentCursorNode: Node | null = null
  let currentCursorOffset = 0
  
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    currentCursorNode = range.startContainer
    currentCursorOffset = range.startOffset
  }
  
  const walker = document.createTreeWalker(
    tagEditorRef.value,
    NodeFilter.SHOW_TEXT,
    null
  )
  
  let targetTextNode: Text | null = null
  let targetText = ''
  
  let node
  while (node = walker.nextNode()) {
    const textNode = node as Text
    const text = textNode.textContent || ''
    
    if (text.includes('{{') && text.includes('}}')) {
      if (currentCursorNode === textNode) {
        targetTextNode = textNode
        targetText = text
        break
      }
      if (!targetTextNode) {
        targetTextNode = textNode
        targetText = text
      }
    }
  }
  
  if (targetTextNode && targetText) {
    const node = targetTextNode
    const text = targetText
    const regex = /\{\{([^}]+)\}\}/g
    let match
    const fragments: (string | { type: 'variable', name: string })[] = []
    let lastIndex = 0
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragments.push(text.substring(lastIndex, match.index))
      }
      
      const variableName = match[1].trim()
      if (variableName) {
        fragments.push({ type: 'variable', name: variableName })
        hasConversions = true
      }
      
      lastIndex = match.index + match[0].length
    }
    
    if (lastIndex < text.length) {
      fragments.push(text.substring(lastIndex))
    }
    
    if (hasConversions && fragments.length > 1) {
      const parentNode = node.parentNode
      if (parentNode) {
        const isCurrentCursorNode = currentCursorNode === node
        
        const fragment = document.createDocumentFragment()
        let currentTextOffset = 0
        let lastTextNode: Text | null = null
        
        fragments.forEach((item, index) => {
          if (typeof item === 'string') {
            if (item) {
              const textNode = document.createTextNode(item)
              fragment.appendChild(textNode)
              lastTextNode = textNode as Text
              
              if (isCurrentCursorNode && currentCursorOffset >= currentTextOffset && currentCursorOffset < currentTextOffset + item.length) {
                newCursorNode = textNode
                newCursorOffset = currentCursorOffset - currentTextOffset
              }
              
              currentTextOffset += item.length
            }
          } else {
            const variableSpan = document.createElement('span')
            const isValid = isVariableValid(item.name)
            
            variableSpan.className = isValid ? 'variable-tag' : 'variable-tag variable-tag-invalid'
            variableSpan.contentEditable = 'false'
            variableSpan.setAttribute('data-variable', item.name)
            variableSpan.setAttribute('data-original-name', item.name)
            variableSpan.setAttribute('data-valid', isValid.toString())
            
            if (!isValid) {
              variableSpan.setAttribute('title', `变量 ${item.name} 不存在`)
              variableSpan.style.pointerEvents = 'auto'
            }
            
            variableSpan.textContent = getDisplayTextFromInsertName(item.name)
            
            const backgroundStyle = isValid 
              ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;'
              : 'background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%) !important;'
            
            variableSpan.style.cssText = `
              display: inline-block !important;
              padding: 2px 8px !important;
              margin: 0 2px !important;
              ${backgroundStyle}
              color: white !important;
              border-radius: 4px !important;
              font-size: 12px !important;
              font-weight: 500 !important;
              cursor: ${isValid ? 'pointer' : 'help'} !important;
              user-select: ${isValid ? 'none' : 'auto'} !important;
              vertical-align: middle !important;
              pointer-events: all !important;
            `
            
            fragment.appendChild(variableSpan)
            
            const variableTextLength = `{{${item.name}}}`.length
            currentTextOffset += variableTextLength
          }
        })
        
        if (isCurrentCursorNode && !newCursorNode) {
          if (currentCursorOffset >= text.length) {
            const emptyTextNode = document.createTextNode('')
            fragment.appendChild(emptyTextNode)
            newCursorNode = emptyTextNode
            newCursorOffset = 0
          } else if (lastTextNode) {
            newCursorNode = lastTextNode
            newCursorOffset = 0
          } else {
            const emptyTextNode = document.createTextNode('')
            fragment.appendChild(emptyTextNode)
            newCursorNode = emptyTextNode
            newCursorOffset = 0
          }
        }
        
        parentNode.replaceChild(fragment, node)
      }
    }
  }
  
  return { hasConversions, newCursorNode, newCursorOffset }
}

// 检查变量触发并返回触发信息（不改变状态）
const checkAndSaveVariableTrigger = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return null
  }
  
  const range = selection.getRangeAt(0)
  const textNode = range.startContainer
  
  if (textNode.nodeType === Node.TEXT_NODE) {
    const text = textNode.textContent || ''
    const cursorPos = range.startOffset
    
    const beforeCursor = text.substring(0, cursorPos)
    
    if (beforeCursor.endsWith('/') || beforeCursor.endsWith('{{')) {
      const rangeRect = range.getBoundingClientRect()
      const triggerInfo = {
        node: textNode,
        offset: cursorPos,
        triggerChar: beforeCursor.endsWith('{{') ? '{{' : '/',
        screenX: rangeRect.left,
        screenY: rangeRect.top,
        shouldShow: true
      }
      return triggerInfo
    }
  }
  
  return { shouldShow: false }
}

// 应用触发信息
const applyVariableTrigger = (triggerInfo: any) => {
  if (!triggerInfo) {
    return
  }
  
  if (triggerInfo.shouldShow) {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const currentNode = range.startContainer
      
      triggerCursorPosition = {
        node: currentNode,
        offset: range.startOffset,
        triggerChar: triggerInfo.triggerChar,
        screenX: triggerInfo.screenX,
        screenY: triggerInfo.screenY
      }
      showVariableDropdown.value = true
    }
  } else {
    triggerCursorPosition = null
    showVariableDropdown.value = false
  }
}

// 在光标位置插入变量
const insertVariableAtCursor = (variableName: string, variable: Variable) => {
  if (displayMode.value === 'text') {
    const cursorPos = textEditorRef.value?.$refs?.textarea?.selectionStart || textContent.value.length
    const before = textContent.value.substring(0, cursorPos)
    const after = textContent.value.substring(cursorPos)
    textContent.value = before + `{{${variableName}}}` + after
    emit('update:modelValue', textContent.value)
    emit('variable-inserted', variableName)
    return
  }

  if (!tagEditorRef.value) {
    return
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    tagEditorRef.value.focus()
    const range = document.createRange()
    range.selectNodeContents(tagEditorRef.value)
    range.collapse(false)
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
  
  if (!selection) return
  const range = selection.getRangeAt(0)
  
  const variableSpan = document.createElement('span')
  const isValid = isVariableValid(variableName)
  variableSpan.className = isValid ? 'variable-tag' : 'variable-tag variable-tag-invalid'
  variableSpan.contentEditable = 'false'
  
  variableSpan.setAttribute('data-variable', variableName)
  variableSpan.setAttribute('data-original-name', variableName)
  variableSpan.setAttribute('data-valid', isValid.toString())
  
  if (!isValid) {
    variableSpan.setAttribute('title', `变量 ${variableName} 不存在`)
  }
  
  variableSpan.textContent = getDisplayTextFromInsertName(variableName)
  
  const backgroundStyle = isValid 
    ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;'
    : 'background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%) !important;'
  
  variableSpan.style.cssText = `
    display: inline-block !important;
    padding: 2px 8px !important;
    margin: 0 2px !important;
    ${backgroundStyle}
    color: white !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    user-select: none !important;
    vertical-align: middle !important;
    direction: ltr !important;
    unicode-bidi: normal !important;
    text-align: center !important;
    writing-mode: horizontal-tb !important;
  `
  
  const textNode = range.startContainer
  if (textNode.nodeType === Node.TEXT_NODE) {
    const text = textNode.textContent || ''
    const cursorPos = range.startOffset
    const beforeCursor = text.substring(0, cursorPos)
    
    if (beforeCursor.endsWith('/') || beforeCursor.endsWith('{{')) {
      const triggerLength = beforeCursor.endsWith('{{') ? 2 : 1
      range.setStart(textNode, cursorPos - triggerLength)
      range.setEnd(textNode, cursorPos)
      range.deleteContents()
    }
  }
  
  range.insertNode(variableSpan)
  
  const spaceNode = document.createTextNode(' ')
  range.setStartAfter(variableSpan)
  range.insertNode(spaceNode)
  
  range.setStartAfter(spaceNode)
  range.setEndAfter(spaceNode)
  if (selection) {
  selection.removeAllRanges()
  selection.addRange(range)
  }
  
  const currentContent = props.modelValue || ''
  
  let newContent = ''
  try {
    if (selection && range && range.startContainer.nodeType === Node.TEXT_NODE) {
      const textContent = range.startContainer.textContent || ''
      const cursorPos = range.startOffset
      const beforeCursor = textContent.substring(0, cursorPos)
      const afterCursor = textContent.substring(cursorPos)
      
      let cleanBeforeCursor = beforeCursor
      if (beforeCursor.endsWith('/') || beforeCursor.endsWith('{{')) {
        const triggerLength = beforeCursor.endsWith('{{') ? 2 : 1
        cleanBeforeCursor = beforeCursor.substring(0, beforeCursor.length - triggerLength)
      }
      
      newContent = cleanBeforeCursor + `{{${variableName}}}` + afterCursor
    } else {
      newContent = currentContent + ` {{${variableName}}}`
    }
  } catch (error) {
    newContent = currentContent + ` {{${variableName}}}`
  }
  
  emit('update:modelValue', newContent)
  emit('variable-inserted', variableName)
  
  setTimeout(() => {
    const insertedTag = tagEditorRef.value?.querySelector(`[data-variable="${variableName}"]`)
    if (!insertedTag) {
      updateTagEditor(newContent)
    }
  }, 100)
}

// 计算下拉框位置
const dropdownPosition = computed(() => {
  if (!showVariableDropdown.value) {
    return { display: 'none' }
  }
  
  const dropdownWidth = 320
  const dropdownHeight = 400
  
  let baseX = 0
  let baseY = 0
  
  if (triggerCursorPosition) {
    baseX = triggerCursorPosition.screenX
    baseY = triggerCursorPosition.screenY + 20
  } else if (variableButtonRef.value) {
    const rect = variableButtonRef.value.getBoundingClientRect()
    baseX = rect.right - dropdownWidth
    baseY = rect.bottom + 4
  } else {
    return { display: 'none' }
  }
  
  let left = baseX
  if (left < 8) {
    left = 8
  }
  if (left + dropdownWidth > window.innerWidth - 8) {
    left = window.innerWidth - dropdownWidth - 8
  }
  
  let top = baseY
  if (top + dropdownHeight > window.innerHeight - 8) {
    top = baseY - dropdownHeight - 25
    if (top < 8) {
      top = window.innerHeight - dropdownHeight - 8
    }
  }
  
  return {
    position: 'fixed' as const,
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 9999
  }
})

// 防抖控制
const isToggling = ref(false)
const isInsertingTriggerChar = ref(false)

// 工具栏事件处理 - 在光标位置插入/字符触发变量选择
const toggleVariableDropdown = (event?: Event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  if (isToggling.value || isSelectingVariable.value) {
    return
  }
  
  isToggling.value = true
  
  insertTriggerCharacterAtCursor()
  
  setTimeout(() => {
    isToggling.value = false
  }, 100)
}

// 在光标位置插入/字符并触发变量选择
const insertTriggerCharacterAtCursor = () => {
  isInsertingTriggerChar.value = true
  
  if (displayMode.value === 'text') {
    const textarea = textEditorRef.value?.$refs?.textarea
    if (textarea) {
      const cursorPos = textarea.selectionStart || textContent.value.length
      const before = textContent.value.substring(0, cursorPos)
      const after = textContent.value.substring(cursorPos)
      textContent.value = before + '/' + after
      
      nextTick(() => {
        textarea.selectionStart = cursorPos + 1
        textarea.selectionEnd = cursorPos + 1
        textarea.focus()
      })
      
      handleTextInput()
      
      setTimeout(() => {
        isInsertingTriggerChar.value = false
      }, 200)
    }
    return
  }
  
  if (!tagEditorRef.value) {
    isInsertingTriggerChar.value = false
    return
  }
  
  tagEditorRef.value.focus()
  
  const selection = window.getSelection()
  if (!selection) {
    isInsertingTriggerChar.value = false
    return
  }
  
  let range: Range
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0)
  } else {
    range = document.createRange()
    range.selectNodeContents(tagEditorRef.value)
    range.collapse(false)
  }
  
  const triggerTextNode = document.createTextNode('/')
  range.insertNode(triggerTextNode)
  
  range.setStart(triggerTextNode, 1)
  range.setEnd(triggerTextNode, 1)
  selection.removeAllRanges()
  selection.addRange(range)
  
  nextTick(() => {
    setTimeout(() => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const textNode = range.startContainer
      }
      
      checkForVariableTrigger()
      
      handleTagInput()
      
      setTimeout(() => {
        isInsertingTriggerChar.value = false
      }, 200)
    }, 10)
  })
}

// 监听页面滚动和窗口大小变化，更新浮层位置
const updateDropdownPosition = () => {
  if (showVariableDropdown.value && variableButtonRef.value) {
    nextTick(() => {
      // 计算属性会自动重新计算
    })
  }
}

const handleScroll = () => {
  if (showVariableDropdown.value) {
    updateDropdownPosition()
  }
}

const handleResize = () => {
  if (showVariableDropdown.value) {
    updateDropdownPosition()
  }
}

const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === 'tag' ? 'text' : 'tag'
}

const copyContent = async () => {
  const content = displayMode.value === 'tag' ? getTagEditorContent() : textContent.value
  
  try {
    // 检查是否支持现代的 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content)
      ElMessage.success('内容已复制到剪贴板')
    } else {
      // 回退到传统的 document.execCommand 方法
      fallbackCopyTextToClipboard(content)
    }
  } catch (error) {
    // 如果现代 API 失败，尝试回退方法
    try {
      fallbackCopyTextToClipboard(content)
    } catch (fallbackError) {
      ElMessage.error('复制失败，请手动选择文本复制')
    }
  }
}

// 回退的复制方法
const fallbackCopyTextToClipboard = (text: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  
  // 避免滚动到底部
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    const successful = document.execCommand('copy')
    if (successful) {
      ElMessage.success('内容已复制到剪贴板')
    } else {
      throw new Error('execCommand failed')
    }
  } catch (err) {
    console.error('Fallback: Could not copy text: ', err)
    ElMessage.error('复制失败，请手动选择文本复制')
  }
  
  document.body.removeChild(textArea)
}

// 外部调用的插入变量方法
const insertVariable = (variableName: string, variable: Variable) => {
  // 使用插入格式而不是传入的variableName
  const insertName = getVariableInsertName(variable)
  
  if (displayMode.value === 'tag') {
    insertVariableAtCursor(insertName, variable)
  } else {
    const cursorPos = textEditorRef.value?.$refs?.textarea?.selectionStart || textContent.value.length
    const before = textContent.value.substring(0, cursorPos)
    const after = textContent.value.substring(cursorPos)
    textContent.value = before + `{{${insertName}}}` + after
    emit('update:modelValue', textContent.value)
    emit('variable-inserted', insertName)
  }
}

// 暴露方法给父组件
defineExpose({
  insertVariable,
});

// 保存和恢复光标位置
const saveCursorPosition = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !tagEditorRef.value) return null
  
  const range = selection.getRangeAt(0)
  const startContainer = range.startContainer
  const startOffset = range.startOffset
  
  const positionInfo = {
    nodeType: startContainer.nodeType,
    nodeIndex: -1,
    offsetInNode: startOffset,
    isInVariableTag: false,
    variableTagData: null as string | null,
    textOffset: 0
  }
  
  if (startContainer.parentNode === tagEditorRef.value) {
    positionInfo.nodeIndex = Array.from(tagEditorRef.value.childNodes).indexOf(startContainer as ChildNode)
  } else if (startContainer.nodeType === Node.TEXT_NODE && startContainer.parentNode) {
    const parentElement = startContainer.parentNode as HTMLElement
    if (parentElement.classList?.contains('variable-tag')) {
      positionInfo.isInVariableTag = true
      positionInfo.variableTagData = parentElement.getAttribute('data-variable')
      positionInfo.nodeIndex = Array.from(tagEditorRef.value.childNodes).indexOf(parentElement)
    }
  }
  
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(tagEditorRef.value)
  preCaretRange.setEnd(range.startContainer, range.startOffset)
  positionInfo.textOffset = preCaretRange.toString().length
  
  return positionInfo
}

const restoreCursorPosition = (savedPosition: any) => {
  if (!tagEditorRef.value || savedPosition === null) return
  
  const selection = window.getSelection()
  if (!selection) return
  
  if (typeof savedPosition === 'number') {
    restoreCursorPositionByOffset(savedPosition)
    return
  }
  
  try {
    const childNodes = Array.from(tagEditorRef.value.childNodes)
    
    if (savedPosition.isInVariableTag && savedPosition.variableTagData) {
      const variableTag = tagEditorRef.value.querySelector(`[data-variable="${savedPosition.variableTagData}"]`) as HTMLElement
      if (variableTag) {
        let targetNode = variableTag.nextSibling
        
        if (!targetNode || targetNode.nodeType !== Node.TEXT_NODE) {
          const textNode = document.createTextNode('')
          if (variableTag.parentNode) {
            variableTag.parentNode.insertBefore(textNode, variableTag.nextSibling)
            targetNode = textNode
          }
        }
        
        if (targetNode && targetNode.nodeType === Node.TEXT_NODE) {
          const range = document.createRange()
          range.setStart(targetNode, 0)
          range.setEnd(targetNode, 0)
          selection.removeAllRanges()
          selection.addRange(range)
          return
        }
      }
    }
    
    if (savedPosition.nodeIndex >= 0 && savedPosition.nodeIndex < childNodes.length) {
      const targetNode = childNodes[savedPosition.nodeIndex]
      
      if (targetNode.nodeType === Node.TEXT_NODE) {
        const textLength = targetNode.textContent?.length || 0
        const offset = Math.min(savedPosition.offsetInNode, textLength)
        
        const range = document.createRange()
        range.setStart(targetNode, offset)
        range.setEnd(targetNode, offset)
        selection.removeAllRanges()
        selection.addRange(range)
        return
      }
    }
    
    restoreCursorPositionByOffset(savedPosition.textOffset)
  } catch (error) {
    restoreCursorPositionByOffset(savedPosition.textOffset || 0)
  }
}

// 备用的基于文本偏移量的光标恢复方法
const restoreCursorPositionByOffset = (savedPosition: number) => {
  if (!tagEditorRef.value) return
  
  const selection = window.getSelection()
  if (!selection) return
  
  const walker = document.createTreeWalker(
    tagEditorRef.value,
    NodeFilter.SHOW_TEXT,
    null
  )
  
  let currentOffset = 0
  let targetNode: Node | null = null
  let targetOffset = 0
  
  while (walker.nextNode()) {
    const node = walker.currentNode
    const nodeLength = node.textContent?.length || 0
    
    if (currentOffset + nodeLength >= savedPosition) {
      targetNode = node
      targetOffset = savedPosition - currentOffset
      break
    }
    currentOffset += nodeLength
  }
  
  if (targetNode) {
    const range = document.createRange()
    range.setStart(targetNode, targetOffset)
    range.setEnd(targetNode, targetOffset)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

// 生命周期
onMounted(() => {
  if (displayMode.value === 'tag') {
    updateTagEditor(props.modelValue);
  } else {
    textContent.value = props.modelValue;
  }

  nextTick(() => {});

  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.variable-rich-text-editor {
  position: relative;

  .editor-container {
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    background-color: var(--el-bg-color);
    overflow: hidden;
    transition: border-color 0.2s ease;
    
    body[theme='dark'] & {
      background-color: #1f2329;
      border-color: var(--el-border-color);
    }
    
    &:focus-within {
      border-color: var(--el-color-primary);
    }
    
    &:hover {
      border-color: var(--el-border-color);
    }

    .editor-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: var(--el-fill-color-extra-light);
      
      body[theme='dark'] & {
        background-color: #1f2329;
      };

      .toolbar-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        
        body[theme='dark'] & {
          color: #e4e8ee;
        }
      }

      .toolbar-actions {
        display: flex;
        gap: 4px;
        position: relative;
      }

      .toolbar-btn {
        padding: 4px 8px;
        width: 30px;
        color: var(--el-text-color-secondary);
        background-color: transparent;
        border: none;
        border-radius: 3px;
        font-size: 12px;
        
        body[theme='dark'] & {
          color: #d3dce9;
        }
        
        &:hover {
          background-color: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
          
          body[theme='dark'] & {
            background-color: var(--flow-node-default-over-color, #25303e);
          }
        }

        &.active {
          background-color: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
          
          body[theme='dark'] & {
            background-color: var(--flow-node-default-over-color, #25303e);
          }
        }

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .tag-editor {
      .editor-content {
        min-height: 120px;
        max-height: 300px;
        overflow-y: auto;
        padding: 12px;
        line-height: 1.5;
        font-size: 14px;
        background-color: var(--el-bg-color);
        color: var(--el-text-color-primary);
        cursor: text;
        border: none;
        box-sizing: border-box;
        width: 100%;
        resize: none;
        
        body[theme='dark'] & {
          background-color: #1f2329;
          color: #e4e8ee;
        };
        
        /* 确保正确的文本方向 */
        direction: ltr !important;
        text-align: left !important;
        
        &:focus {
          outline: none;
        }

        &[contenteditable]:empty:before {
          content: attr(placeholder);
          color: var(--el-text-color-placeholder);
          direction: ltr !important;
          text-align: left !important;
          
          body[theme='dark'] & {
            color: #8d98aa;
          }
        }

        :deep(.variable-tag) {
          display: inline-block !important;
          padding: 2px 8px !important;
          margin: 0 2px !important;
          background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%) !important;
          color: white !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          user-select: none !important;
          vertical-align: middle !important;
          pointer-events: auto !important; // 确保可以响应hover事件
          
          body[theme='dark'] & {
            background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%) !important;
          }
          
          &:hover {
            opacity: 0.8 !important;
          }
          
          // 无效变量的警告样式
          &.variable-tag-invalid {
            background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-dark-2) 100%) !important;
            position: relative;
            cursor: help !important; // 使用help光标提示有tooltip
            pointer-events: all !important; // 强制允许所有指针事件
            user-select: auto !important; // 允许选择以支持tooltip
            
            body[theme='dark'] & {
              background: linear-gradient(135deg, var(--el-color-danger-light-3) 0%, var(--el-color-danger) 100%) !important;
            }
            
            &:hover {
              opacity: 0.9 !important;
            }
            
            // 添加警告图标
            &::after {
              content: " ⚠️";
              font-size: 10px;
              margin-left: 2px;
            }
          }
        }
      }
    }

    .text-editor {
      :deep(.el-input) {
        .el-textarea__inner {
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          border: none;
          border-radius: 0;
          box-shadow: none;
          padding: 12px;
          background-color: var(--el-bg-color);
          color: var(--el-text-color-primary);
          min-height: 120px;
          max-height: 300px;
          resize: none;
          box-sizing: border-box;
          
          body[theme='dark'] & {
            background-color: #1f2329;
            color: #e4e8ee;
          }
          
          /* 修复文本方向问题 */
          direction: ltr !important;
          unicode-bidi: normal !important;
          text-align: left !important;
          writing-mode: horizontal-tb !important;
          
          &:focus {
            border-color: transparent;
            box-shadow: none;
            background-color: var(--el-bg-color);
            
            body[theme='dark'] & {
              background-color: #1f2329;
            }
          }
        }
      }
    }
  }

  .variable-button-container {
    display: inline-flex;
    align-items: center;
  }

  // 临时测试样式
  .textarea-fallback {
    .fallback-notice {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
      padding: 8px;
      background-color: var(--el-color-info-light-9);
      border: 1px solid var(--el-color-info-light-7);
      border-radius: 4px;
      font-size: 12px;
      color: var(--el-color-info);
      
      body[theme='dark'] & {
        background-color: var(--flow-node-default-over-color, #25303e);
        border-color: var(--el-border-color);
        color: #d3dce9;
      }
    }
  }

  .test-notice {
    margin-top: 8px;
    text-align: center;
  }


}
</style>

<style lang="scss">
/* 全局样式：确保teleport的下拉框正确显示 */
.variable-dropdown-wrapper {
  /* 确保在最顶层显示 */
  z-index: 9999 !important;
  
  body[theme='dark'] & {
    /* 下拉框深色主题样式由 VariableInsertDropdown 组件处理 */
    color: inherit;
  }
}

/* 简化的全局变量标签样式 */
.variable-tag {
  display: inline-block !important;
  padding: 2px 8px !important;
  margin: 0 2px !important;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%) !important;
  color: white !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  user-select: none !important;
  vertical-align: middle !important;
  pointer-events: auto !important; // 确保可以响应hover事件
  
  body[theme='dark'] & {
    background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%) !important;
  }
  
  &:hover {
    opacity: 0.8 !important;
  }
  
  // 无效变量的警告样式
  &.variable-tag-invalid {
    background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-dark-2) 100%) !important;
    position: relative;
    cursor: help !important; // 使用help光标提示有tooltip
    pointer-events: all !important; // 强制允许所有指针事件
    user-select: auto !important; // 允许选择以支持tooltip
    
    body[theme='dark'] & {
      background: linear-gradient(135deg, var(--el-color-danger-light-3) 0%, var(--el-color-danger) 100%) !important;
    }
    
    &:hover {
      opacity: 0.9 !important;
    }
    
    // 添加警告图标
    &::after {
      content: " ⚠️";
      font-size: 10px;
      margin-left: 2px;
    }
  }
}
</style> 