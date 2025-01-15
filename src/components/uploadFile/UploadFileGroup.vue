<template>
  <div class="upload-group">
    <upload-card class="upload-card" :file-params="item" @delete="handleDelete" v-for="item in props.fileList"></upload-card>
  </div>
</template> 
<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

import UploadCard from './UploadCard.vue';
import type { UploadFileCard } from './type';

// 创建props
const props = defineProps<{
  fileList: Array<UploadFileCard>;
}>();

// 创建emit
const emit = defineEmits(['deleteFile']);

// emit删除事件
const handleDelete = (file) => {
  emit('deleteFile', file);
}
</script>
<style lang="scss">
.upload-group {
  display: flex;

  .upload-card {
    margin-left: 8px;
  }
}
</style>
