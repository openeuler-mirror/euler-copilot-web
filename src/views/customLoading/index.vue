<template>
    <!-- 公共loading -->
    <div
        class="commonLoading"
        v-loading="loading"
        :class="loading ? 'customLoading' : 'loadingNone'"
    ></div>
</template>

<script setup>
import { defineProps } from 'vue';
const props = defineProps({
    loading: {
        type: Boolean,
    }
})
</script>
<style scoped>
.customLoading {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 9999;
}
.loadingNone {
    display: none;
}
</style>