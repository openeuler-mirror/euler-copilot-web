<template>
  <teleport to="body">
    <transition name="drop">
      <div
        class="document-list"
        ref="documents"
        v-show="isVisible"
        @mouseover="handleHover"
        @mouseleave="handleLeave"
      >
        <div class="document-wrapper" ref="documentsWrapper">
          <upload-card
            class="document"
            mode="mini"
            v-for="file in fileList"
            :file-params="file"
            :deletable="false"
          ></upload-card>
        </div>
      </div>
    </transition>
  </teleport>
</template>
<script lang="ts" setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import UploadCard from 'src/components/uploadFile/UploadCard.vue';

export type DropPostion = {
  x: number;
  y: number;
};

// 创建props
const props = defineProps<{
  // 下拉文件列表
  fileList: Array<any>;
  // dropdown 挂载位置
  dropPostion: DropPostion | undefined;
  // 是否可见
  isFileVisible: boolean;
}>();

// 偏移量
const offset = {
  x: 30,
  y: 24,
};
// 是否显示
const isVisible = ref(false);
// 是否处于hover状态
const isHover = ref(false);
// 文本列表dom
const documents = ref();
// 文本列表内层dom
const documentsWrapper = ref<HTMLInputElement | null>();

watch(
  () => props.dropPostion,
  (newVal: DropPostion) => {
    documents.value.style.left = `${newVal.x + offset.x}px`;
    documents.value.style.top = `${newVal.y + offset.y}px`;
  },
);

watch(
  () => props.isFileVisible,
  (newVal: boolean) => {
    scrollTop();
    if (!newVal && isHover.value) {
      return;
    }
    isVisible.value = newVal;
  },
);

const scrollTop = () => {
  const tiomeout = setTimeout(() => {
    documentsWrapper.value && (documentsWrapper.value.scrollTop = 0);
    clearTimeout(tiomeout);
  }, 100);
};

const handleHover = () => {
  isVisible.value ? null : (isVisible.value = true);
  isHover.value = true;
};

const handleLeave = () => {
  isVisible.value ? (isVisible.value = false) : null;
  isHover.value = false;
};
</script>
<style lang="scss">
.document-list {
  position: absolute;
  width: 232px;
  max-height: 208px;
  padding: 16px 8px;

  background-color: var(--o-bg-color-base);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1;
  cursor: default;

  .document-wrapper {
    max-height: 176px;
    padding: 0 8px;
    overflow: scroll;
  }

  .document {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

/* 滚动条轨道样式 */
::-webkit-scrollbar-track {
  background-image: linear-gradient(180deg, #e7f0fd 1%, #daeafc 40%) !important;
  display: none;
}

::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

/* 滚动条的滑块 */
::-webkit-scrollbar-thumb {
  background-color: #c3cedf;
  border-radius: 3px;
}
::-webkit-scrollbar-corner {
  background: transparent;
}

/* transition 动画 */
.drop-enter-from {
  max-height: 0px;
  opacity: 0;
}

.drop-enter-active {
  transition: all 0.25s ease-in-out;
}

.drop-leave-active {
  transition: all 0.25s ease-in-out;
}

.drop-leave-to {
  max-height: 0px;
  opacity: 0;
}
</style>
