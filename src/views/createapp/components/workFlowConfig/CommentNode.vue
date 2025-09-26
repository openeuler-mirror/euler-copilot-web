<script lang="ts" setup>
import { ref, nextTick, watch } from 'vue';
import { Delete } from '@element-plus/icons-vue';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['delNode', 'updateNodeData']);

// 控制删除按钮文字显示
const showDeleteText = ref(false);

// 内联编辑相关
const isEditing = ref(false);
const editText = ref('');
const textareaRef = ref<HTMLTextAreaElement>();

// 大小调整相关
const commentWidth = ref(200);
const commentHeight = ref(120);
const minWidth = ref(150);
const minHeight = ref(80);
const isResizing = ref(false);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const resizeStartWidth = ref(0);
const resizeStartHeight = ref(0);

// 监听data变化，更新本地状态
watch(() => props.data, (newData) => {
  if (newData.width) commentWidth.value = newData.width;
  if (newData.height) commentHeight.value = newData.height;
}, { immediate: true });

// 删除节点
const delNode = () => {
  emits('delNode', props.id);
};

// 开始编辑
const startEdit = () => {
  if (props.disabled) return;
  isEditing.value = true;
  editText.value = props.data.description || '';
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
      textareaRef.value.select();
    }
  });
};

// 保存编辑
const saveEdit = () => {
  if (editText.value.trim() !== props.data.description) {
    emits('updateNodeData', props.id, {
      ...props.data,
      description: editText.value.trim()
    });
  }
  isEditing.value = false;
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  editText.value = props.data.description || '';
};

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && event.ctrlKey) {
    // Ctrl+Enter 保存
    event.preventDefault();
    saveEdit();
  } else if (event.key === 'Escape') {
    // Escape 取消编辑
    event.preventDefault();
    cancelEdit();
  }
  // 单独的 Enter 键允许换行，不做任何处理
};

// 大小调整相关方法
const startResize = (event: MouseEvent) => {
  if (props.disabled) return;
  
  isResizing.value = true;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
  resizeStartWidth.value = commentWidth.value;
  resizeStartHeight.value = commentHeight.value;
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', endResize);
  event.preventDefault();
  event.stopPropagation();
};

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return;
  
  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;
  
  const newWidth = Math.max(minWidth.value, resizeStartWidth.value + deltaX);
  const newHeight = Math.max(minHeight.value, resizeStartHeight.value + deltaY);
  
  commentWidth.value = newWidth;
  commentHeight.value = newHeight;
};

const endResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
  
  // 保存新的尺寸到节点数据
  emits('updateNodeData', props.id, {
    ...props.data,
    width: commentWidth.value,
    height: commentHeight.value
  });
};

// 阻止调整大小控件点击事件冒泡
const handleResizeHandleClick = (event: MouseEvent) => {
  event.stopPropagation();
  event.preventDefault();
};
</script>

<template>
  <div 
    class="comment-node" 
    :class="{ 'node-selected': selected, 'is-resizing': isResizing }"
    :style="{ width: commentWidth + 'px', height: commentHeight + 'px' }"
  >
    <!-- 注释内容 -->
    <div class="comment-content" @click="startEdit" v-if="!isEditing">
      <div class="comment-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M9 22a1 1 0 0 1-1-1v-3H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.1l-3.7 3.71c-.2.19-.45.29-.7.29H9z"/>
        </svg>
      </div>
      <div class="comment-text">{{ data.description || '点击编辑注释...' }}</div>
    </div>
    
    <!-- 编辑模式 -->
    <div class="comment-edit" v-if="isEditing">
      <div class="comment-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M9 22a1 1 0 0 1-1-1v-3H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.1l-3.7 3.71c-.2.19-.45.29-.7.29H9z"/>
        </svg>
      </div>
      <textarea
        ref="textareaRef"
        v-model="editText"
        class="comment-textarea"
        placeholder="输入注释内容... (Ctrl+Enter保存, Esc取消)"
        @blur="saveEdit"
        @keydown="handleKeydown"
      ></textarea>
    </div>
    
    <!-- 删除按钮 -->
    <div class="delete-wrapper" v-if="!disabled">
      <button
        class="delete-button"
        @click="delNode"
        :title="'删除注释'"
        @mouseenter="showDeleteText = true"
        @mouseleave="showDeleteText = false"
      >
        <el-icon class="delete-icon">
          <Delete />
        </el-icon>
        <span class="delete-text" v-show="showDeleteText">删除</span>
      </button>
    </div>
    
    <!-- 右下角大小调整控制点 -->
    <div 
      v-if="!disabled"
      class="resize-handle"
      @click="handleResizeHandleClick"
      @mousedown="startResize"
      :class="{ disabled: disabled }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12" height="12">
        <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="13" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
        <circle cx="13" cy="13" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="13" r="1.5" fill="currentColor"/>
        <circle cx="13" cy="7" r="1.5" fill="currentColor"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.comment-node {
  position: relative;
  background: #fffbf0;
  border: 1px solid #f0c53e;
  border-radius: 8px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  box-shadow: 0 2px 8px rgba(240, 197, 62, 0.15);
  transition: all 0.2s ease;
  overflow: visible; /* 改为visible，让删除按钮可以显示在外部 */
  resize: none;
}

.comment-node:hover {
  box-shadow: 0 4px 12px rgba(240, 197, 62, 0.25);
  border-color: #e6b800;
}

.comment-node.node-selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.comment-node.is-resizing {
  user-select: none;
}

.comment-content, .comment-edit {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  height: 100%;
  cursor: pointer;
  overflow: hidden; /* 内容区域保持隐藏溢出 */
}

.comment-edit {
  cursor: default;
}

.comment-icon {
  flex-shrink: 0;
  color: #f0c53e;
  margin-top: 2px;
}

.comment-text {
  color: #5d4e00;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
  flex: 1;
  min-height: 20px;
}

.comment-text:empty::before {
  content: '点击编辑注释...';
  color: #bbb;
  font-style: italic;
}

.comment-textarea {
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-size: 14px;
  line-height: 1.4;
  color: #5d4e00;
  font-family: inherit;
  padding: 0;
  margin: 0;
  height: calc(100% - 24px);
  min-height: 60px;
}

.comment-textarea::placeholder {
  color: #bbb;
  font-style: italic;
}

/* 删除按钮样式 */
.delete-wrapper {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1000; /* 提高z-index确保在最上层 */
  opacity: 0;
  transition: opacity 0.2s ease;
}

.comment-node:hover .delete-wrapper {
  opacity: 1;
}

.delete-button {
  border: none;
  background-color: #f56c6c;
  color: #ffffff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  
  /* 圆形按钮尺寸 */
  width: 28px;
  height: 28px;
  border-radius: 50%;
  
  /* 布局样式 */
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  
  /* 悬浮效果 */
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
  
  /* 动画效果 */
  transition: 
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s ease;
  
  /* 移除默认按钮样式 */
  outline: none;
  text-decoration: none;
  box-sizing: border-box;
}

.delete-button:hover {
  background-color: #f56c6c;
  
  /* 展开为圆角矩形 */
  width: 64px;
  height: 28px;
  border-radius: 14px;
  padding: 0 8px;
  
  /* 增强悬浮效果 */
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}

.delete-button:active {
  background-color: #e6a23c;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.5);
}

.delete-icon {
  font-size: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
}

.delete-button:hover .delete-icon {
  transform: scale(0.9);
}

.delete-text {
  font-size: 11px;
  margin-left: 4px;
  opacity: 0;
  transform: translateX(-4px) scale(0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.delete-button:hover .delete-text {
  opacity: 1;
  transform: translateX(0) scale(1);
}

/* 大小调整控制点样式 */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  border-radius: 0 0 8px 0;
  cursor: se-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.6;
  color: #f0c53e;
}

.resize-handle:hover {
  opacity: 1;
  background: rgba(240, 197, 62, 0.1);
  color: #e6b800;
}

.resize-handle.disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.resize-handle:active {
  background: rgba(240, 197, 62, 0.2);
  color: #d4a017;
}

/* 暗色主题支持 */
.dark .comment-node {
  background: linear-gradient(135deg, #2a2d3a 0%, #242832 100%);
  border: 1px solid #4a5568;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 
              0 2px 8px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.dark .comment-node:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 
              0 3px 12px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
  border-color: #718096;
  background: linear-gradient(135deg, #2d3748 0%, #2a2d3a 100%);
}

.dark .comment-node.node-selected {
  border-color: #63b3ed;
  box-shadow: 0 0 0 2px rgba(99, 179, 237, 0.3),
              0 6px 20px rgba(0, 0, 0, 0.4);
  background: linear-gradient(135deg, #2d3748 0%, #2a2d3a 100%);
}

.dark .comment-icon {
  color: #ffd89b;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.dark .comment-text {
  color: #e2e8f0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dark .delete-button {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(220, 38, 38, 0.6);
}

.dark .delete-button:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
  border-color: rgba(239, 68, 68, 0.8);
  transform: translateY(-1px);
}

.dark .delete-button:active {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.6),
              inset 0 1px 3px rgba(0, 0, 0, 0.3);
  transform: translateY(0);
}

.dark .resize-handle {
  color: #ffd89b;
  background: linear-gradient(135deg, #2a2d3a 0%, #242832 100%);
  border: none;
  backdrop-filter: blur(4px);
}

.dark .resize-handle:hover {
  background: linear-gradient(135deg, #2d3748 0%, #2a2d3a 100%);
  color: #ffed4e;
  border: none;
  box-shadow: 0 2px 8px rgba(255, 216, 155, 0.3);
}

.dark .resize-handle:active {
  background: linear-gradient(135deg, #2a2d3a 0%, #242832 100%);
  color: #ffd700;
  border: none;
  box-shadow: 0 1px 4px rgba(255, 216, 155, 0.4);
}

.dark .comment-textarea {
  color: #e2e8f0;
  background: rgba(45, 55, 72, 0.3);
  border-radius: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dark .comment-textarea::placeholder {
  color: #a0aec0;
  text-shadow: none;
}

.dark .comment-textarea:focus {
  background: rgba(45, 55, 72, 0.5);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 深色主题下的状态样式 */
.dark .comment-node.is-resizing {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5),
              0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
</style>
