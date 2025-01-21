<template>
  <div class="workFlowDebug" :class="debugTheme === 'light' ? 'debugThemeLight' : 'debugThemeDark'">
    <div class="workFlowDebugClose">
      <div class="closeBtn" @click="handleCloseDebugDialog"><IconX /></div>
    </div>
    <div class="divider"></div>
    <div class="debugContent">

    </div>
  </div>
</template>
<script setup lang="ts">
import '../../styles/workFlowDebug.scss';
import { watch, ref } from 'vue';
import { useChangeThemeStore } from 'src/store/conversation';
import { IconX } from '@computing/opendesign-icons';
interface DebugProps {
  handleDebugDialogOps:any
}
const themeStore = useChangeThemeStore();
const props = defineProps<DebugProps>();
const debugTheme = ref();
const handleCloseDebugDialog = ()=>{
  props.handleDebugDialogOps(false)
}
watch(
  () => themeStore.theme,
  () => {
    debugTheme.value = themeStore.theme;
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>
