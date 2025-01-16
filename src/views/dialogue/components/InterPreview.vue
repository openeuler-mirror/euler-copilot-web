<template>
  <div class="interPreviewBox">
    
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { IconUnfavorite } from '@computing/opendesign-icons';

interface InterPreProps {
  createAppForm: any;
}
const props = withDefaults(defineProps<InterPreProps>(), {});
const interPreviewInfo = ref();
const connnectLinkList = ref<any>([]);
watch(
  () => props.createAppForm,
  (newValue, oldValue) => {
    interPreviewInfo.value = props.createAppForm;
    connnectLinkList.value = props.createAppForm.connectList.filter(item => item.length);
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>
