<template>
  <div class="dialogue-thought">
    <div class="thought-header" @click="toggleCollapse">
      <!-- <span class="think-label">think</span> -->
      <div class="collapse-control">
        <div :class="{ 'is-collapsed': isCollapsed }" class="collapse-icon">
          <el-icon>
            <IconCaretDown />
          </el-icon>
        </div>
        <span class="collapse-text">思考</span>
      </div>
    </div>
    <transition name="collapse">
      <div
        v-show="!isCollapsed"
        class="thought-content"
        v-html="contentAfterMark"
      ></div>
    </transition>
  </div>
</template>

<script setup>
import { IconCaretDown } from '@computing/opendesign-icons';
import { ref, computed } from 'vue';
import marked from 'src/utils/marked';
import xss from 'xss';
const props = defineProps({
  content: {
    type: String,
    required: true,
  },
});
const isCollapsed = ref(false);
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const contentAfterMark = computed(() => {
  if (!props.content) {
    return '';
  }
  //xxs将大于号转为html实体以防歧义；将< >替换为正常字符；
  let str = marked.parse(
    xss(props.content).replace(/&gt;/g, '>').replace(/&lt;/g, '<'),
  );
  return str;
});
</script>

<style lang="scss" scoped>
.dialogue-thought {
  background-color: var(--o-bg-color-base);
  position: relative;
  margin: 1rem 0;
  border: 2px dashed var(--o-think-border);
  border-radius: 8px;

  .thought-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    cursor: pointer;
    background-color: var(--o-think-header-bg);
    .think-label {
      font-weight: bold;
      position: absolute;
      top: -0.7rem;
      left: 1rem;
      padding: 0 0.5rem;
    }
    .collapse-control {
      display: flex;
      align-items: center;
      transform-origin: center center;
      .collapse-icon {
        width: 1.2rem;
        height: 1.2rem;
        transition: transform 0.3s ease;
        top: 6px;
        &.is-collapsed {
          top: 5px;
          transform: rotate(-90deg);
        }
      }
      .collapse-text {
        color: var(--o-think-header-text);
      }
    }
  }

  .thought-content {
    padding: 1rem;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
  }
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.3s ease-out;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px; // Adjust this value based on your content
}
</style>
