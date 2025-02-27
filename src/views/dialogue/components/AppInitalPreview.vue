<template>
    <InterPreview :create-app-form="createAppForm" />
</template>
<script setup lang="ts">
import '../../styles/InterPreview.scss';
import { ref, watch } from 'vue';
import InterPreview from './InterPreview.vue';
interface InterPreProps {
  createAppForm: any;
}
const props = withDefaults(defineProps<InterPreProps>(), {});
const interPreviewInfo = ref();
watch(
  () => props.createAppForm,
  (newValue, oldValue) => {
    interPreviewInfo.value = props.createAppForm;
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>
  