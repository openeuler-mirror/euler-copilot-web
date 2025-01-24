<template>
  <div class="workFlowDebug">
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
import { IconX } from '@computing/opendesign-icons';
interface DebugProps {
  handleDebugDialogOps:any
}
const props = defineProps<DebugProps>();
const handleCloseDebugDialog = ()=>{
  props.handleDebugDialogOps(false)
}
 
</script>
