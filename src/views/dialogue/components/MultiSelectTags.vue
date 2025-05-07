<script setup>
import { api } from '@/apis';
import { ref, computed, onMounted } from 'vue';

const isModalOpen = ref(false);
const searchKey = ref('');
const activeNames = ref([]);
const filterKnowledgeList = computed(() => {
  // filter by searchKey
  console.log(searchKey.value);
  if (!searchKey.value) return availableitems.value;
  else {
    return availableitems.value
      .map((item) => {
        const filterList = item.kbList.filter((kb) =>
          kb.kbName.includes(searchKey.value),
        );
        return filterList.length > 0 ? { ...item, kbList: filterList } : null;
      })
      .filter((item) => item !== null);
  }
});
// 可选标签列表
const availableitems = ref([]);

// 已选择的标签
const selectedTags = ref([]);

// 选择标签
const selectTag = (tag) => {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(selectedTags.value.indexOf(tag), 1);
  }
};
onMounted(() => {
  console.log(selectedTags.value);
  getKnowledgeList();
});

const getKnowledgeList = async () => {
  console.log('getKnowledgeList');
  const [_, res] = await api.getKnowledgeList();
  if (!_ && res && res.code === 200) {
    // availableitems.value = res.result.tkbList[0].kbList;
    availableitems.value = res.result.tkbList;
    activeNames.value = res.result.tkbList.map((item) => item.teamName);
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
    <div class="multi-select-box">
      <div class="select-content">
        <div class="label-text" @click="toggleModal">知识库</div>
        <div v-if="selectedTags.length === 0" class="placeholder">
          请选择标签
        </div>
        <div v-else class="tags-container">
          <div v-for="(tag, index) in selectedTags" :key="index" class="tag">
            <span class="tag-text">{{ tag.kbName }}</span>
            <button class="tag-delete" @click="removeTag(index)">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <!-- 右侧模态框 -->
    <transition name="slide">
      <div v-if="isModalOpen" class="global-tag-modal">
        <div class="modal-header">
          <h3>知识库</h3>
          <button class="close-button" @click="toggleModal">×</button>
        </div>
        <ElInput
          v-model="searchKey"
          :placeholder="$t('history.find_recent_chats')"
          class="search-input"
        >
          <template #suffix>
            <img class="search-input__icon" src="@/assets/svgs/search.svg" />
          </template>
        </ElInput>
        <div class="multi-select-list">
          <ul v-if="filterKnowledgeList.length">
            <ElCollapse v-model="activeNames">
              <template v-for="item in filterKnowledgeList" :key="item.key">
                <ElCollapseItem :name="item.key">
                  <template #title>
                    {{ item.teamName }}
                  </template>
                  <template #icon="{ isActive }">
                    <el-icon v-if="isActive" :size="16">
                      <CaretBottom />
                    </el-icon>
                    <el-icon v-else :size="16">
                      <CaretRight />
                    </el-icon>
                  </template>
                  <template
                    v-for="(item, index) in item.kbList"
                    :key="index"
                    class="list-item"
                  >
                    <div
                      class="list-item"
                      :class="{ selected: isSelected(item) }"
                      @click="selectTag(item)"
                    >
                      <div class="item-content">
                        <div class="item-header">
                          <h3 class="item-name">{{ item.kbName }}</h3>
                          <span v-if="isSelected(item)" class="checkmark">
                            ✓
                          </span>
                        </div>
                        <p class="item-description">{{ item.description }}</p>
                        <div class="item-id">ID: {{ item.kbId }}</div>
                      </div>
                    </div>
                  </template>
                </ElCollapseItem>
              </template>
            </ElCollapse>
          </ul>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.search-input {
  margin-top: 8px;
  width: calc(100% - 18px);
  font-size: 12px;
  border-radius: 4px;
  border-color: var(--o-border-color-lighter);

  &__icon {
    width: 16px;
    height: 16px;
  }
}
.multi-select-container {
  max-height: 32px;
  display: inline-block;
  font-family: 'Arial', sans-serif;
  max-width: calc(100% - 148px);
  text-overflow: ellipsis;
  width: auto;
  position: relative;
  bottom: -8px;
}

.multi-select-box {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
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
  margin-left: 8px;
}
.tags-container {
  display: inline-flex; /* 使用inline-flex确保在同一行 */
  align-items: center;
  overflow: hidden; /* 隐藏溢出的标签 */
  flex-grow: 1;
  height: 100%;
  gap: 6px;
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
  width: 342px;
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

.multi-select-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  overflow: auto;
}

.list-item {
  position: relative;
  padding: 16px;
  border-radius: 8px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }

  &.selected {
    border-color: #3498db;
    background-color: rgba(52, 152, 219, 0.05);

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 24px 24px 0;
      border-color: transparent #3498db transparent transparent;
    }
  }
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.checkmark {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: white;
  font-weight: bold;
  font-size: 12px;
  z-index: 1;
}

.item-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.item-id {
  font-size: 12px;
  color: #999;
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
