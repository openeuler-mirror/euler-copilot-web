<script setup>
import { ref, computed } from 'vue';

const isModalOpen = ref(false);
// 可选标签列表
const availableOptions = ref([
  '前端开发',
  'Vue.js',
  'React',
  'Angular',
  'JavaScript',
  'TypeScript',
  'HTML/CSS',
  'Node.js',
  '后端开发',
  '数据库',
]);

// 已选择的标签
const selectedTags = ref(['HTML/CSS', 'Node.js', '后端开发', '数据库']);

// 选择标签
const selectTag = (tag) => {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
  }else{
    selectedTags.value.splice(selectedTags.value.indexOf(tag), 1);
  }
};

// 移除标签
const removeTag = (index) => {
  selectedTags.value.splice(index, 1);
};

// 检查标签是否已被选中
const isSelected = (tag) => {
  return selectedTags.value.includes(tag);
};

const toggleModal = () => {
  isModalOpen.value = !isModalOpen.value;
};
</script>

<template>
  <div class="multi-select-container">
    <div class="multi-select-box" @click="toggleModal()">
      <div class="select-content">
        <div class="label-text">知识库</div>
        <div v-if="selectedTags.length === 0" class="placeholder">
          请选择标签
        </div>
        <div v-else class="tags-container">
          <div v-for="(tag, index) in selectedTags" :key="index" class="tag">
            <span class="tag-text">{{ tag }}</span>
            <button class="tag-delete" @click="removeTag(index)">×</button>
          </div>
          x
        </div>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <!-- 右侧模态框 -->
    <transition name="slide">
      <div v-if="isModalOpen" class="global-tag-modal">
        <div class="modal-header">
          <h3>选择标签</h3>
          <button class="close-button" @click="toggleModal">×</button>
        </div>
        <div class="modal-content">
          <div
            v-for="(option, index) in availableOptions"
            :key="index"
            class="option-item"
            :class="{ selected: isSelected(option) }"
            @click="selectTag(option)"
          >
            <span class="option-text">{{ option }}</span>
            <span v-if="isSelected(option)" class="check-mark">✓</span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.multi-select-container {
  max-height: 32px;
  display: inline-block;
  font-family: 'Arial', sans-serif;
  max-width: calc(100% - 148px);
  text-overflow: ellipsis;
  width: auto;
  margin: 0 0 8px 0;
}

.multi-select-box {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 5px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  background-color: #fff;
  cursor: pointer;
  max-height: 32px;
  &:hover {
    border-color: #c0c4cc;
  }

  &:focus-within {
    border-color: #409eff;
    outline: 0;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

.placeholder {
  color: #909399;
  padding: 0 8px;
}

.tags-wrapper {
  display: flex;
  align-items: center;
  overflow: hidden; /* 隐藏溢出的标签 */
  flex-grow: 1;
  height: 100%;
  white-space: nowrap; /* 防止标签换行 */
}

.select-content {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  white-space: nowrap; /* 确保内容不换行 */
}


.label-text {
  font-size: 14px;
  color: #303133;
  margin-right: 10px;
  white-space: nowrap;
  flex-shrink: 0; /* 防止文字被压缩 */
  display: inline-block;
  line-height: 32px;
}
.tags-container {
  display: inline-flex; /* 使用inline-flex确保在同一行 */
  align-items: center;
  overflow: hidden; /* 隐藏溢出的标签 */
  flex-grow: 1;
  height: 100%;
}

.tag {
  display: flex;
  align-items: center;
  background-color: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 12px;
  height: 24px;
  line-height: 24px;
  white-space: nowrap; /* 防止标签内容换行 */
  .tag-text {
    margin-right: 5px;
  }

  .tag-delete {
    background: none;
    border: none;
    color: #409eff;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;

    &:hover {
      color: #f56c6c;
      background-color: rgba(245, 108, 108, 0.1);
      border-radius: 50%;
    }
  }
}
</style>

<style lang="scss">
/* 全局样式，不使用scoped */
.global-tag-modal {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 250px;
  background-color: #fff;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 9999; /* 非常高的z-index确保在最上层 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #ebeef5;

  h3 {
    margin: 0;
    font-size: 16px;
    color: #303133;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 20px;
    color: #909399;
    cursor: pointer;

    &:hover {
      color: #f56c6c;
    }
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;

  &:hover {
    background-color: #f5f7fa;
  }

  &.selected {
    color: #409eff;
    background-color: #f0f9ff;
  }

  .check-mark {
    color: #409eff;
    font-weight: bold;
  }
}

.global-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 9998; /* 比模态框低一级，但仍然很高 */
}

/* 模态框动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}
</style>
