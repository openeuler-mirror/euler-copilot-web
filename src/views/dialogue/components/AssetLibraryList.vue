<script setup>
import { id } from 'element-plus/es/locale';
import { ref, onMounted } from 'vue';
const selectedItems = ref([]);

const toggleSelection = () => {
  // 在这里实现选中效果的逻辑
  selectedItems.value.push(id);
  console.log('toggleSelection');
  console.log(selectedItems.value);
};
const AssetLibraryList = [
  {
    title: '项目标题 1',
    content: '这里是第一个项目的内容描述，点击我可以选中我。',
    id: 1,
  },
  {
    title: '项目标题 2',
    content: '这里是第二个项目的内容描述，点击我可以选中我。',
    id: 2,
  },
  {
    title: '项目标题 3',
    content: '这里是第三个项目的内容描述，点击我可以选中我。',
    id: 3,
  },
  {
    title: '项目标题 3',
    content: '这里是第三个项目的内容描述，点击我可以选中我。',
  },
];
// onMounted(() => {
//   // 在这里实现组件挂载后的逻辑 获取列表数据，现在使用静态数据
// }),
</script>
<template>
  <div class="container">
    <div class="assetLibraryList">
      <div v-for="item in AssetLibraryList" :key="item.title" :class="selectedItems.find(item.id) ? 'selectable-item' : ''" @click="toggleSelection(item)">
        <div class="item-title">{{ item.title }}</div>
        <div class="item-content">
          {{ item.content }}
        </div>
        <div class="item-id">
          {{ item.id }}
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 500px;
  margin: 20px auto;
  font-family: Arial, sans-serif;
}

.selectable-item {
  position: relative;
  padding: 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
}

.selectable-item:hover {
  border-color: #aaa;
}

.selectable-item.selected {
  border-color: #4285f4;
}

.selectable-item.selected::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 30px 30px 0;
  border-color: transparent #4285f4 transparent transparent;
}

.selectable-item.selected::after {
  content: '✓';
  position: absolute;
  top: 2px;
  right: 2px;
  color: white;
  font-size: 14px;
}

.item-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 18px;
}

.item-content {
  color: #555;
  font-size: 14px;
}
.item-id {
  color: #555;
  font-size: 14px;
}
</style>
