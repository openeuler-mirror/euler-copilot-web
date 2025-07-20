<template>
  <YAMLMonacoEditor
    v-model="code"
    ref="myMonacoEditor"
    :autofocus="true"
    :disabled="isDisabled"
    :theme="currentTheme"
    @change="handleChange"
    class="yaml-monaco-wrapper"
  />
</template>
<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import YAMLMonacoEditor from '@/components/YAMLMonacoEditor.vue';
import { useChangeThemeStore } from '@/store';

const themeStore = useChangeThemeStore();

const emits = defineEmits(['update:updateVal']);
const code = ref('');
const isDisabled = ref(false);
const myMonacoEditor = ref();

const currentTheme = computed(() => {
  return themeStore.theme === 'dark' ? 'dark' : 'light';
});

const handleChange = (value: string) => {
  code.value = value;
  emits('update:updateVal', code.value);
};

const props = defineProps<{
  yamlCode: any;
  disabled: boolean;
}>();

watch(
  () => props.yamlCode,
  () => {
    code.value = props.yamlCode;
    isDisabled.value = props.disabled;
  },
  { deep: true, immediate: true },
);

// 为了保持与旧组件的兼容性，保留updateFunc方法
const updateFunc = () => {
  // Monaco Editor自动处理折叠标记，无需手动清理
};

// 暴露方法以保持兼容性
defineExpose({
  updateFunc
});
</script>
<style lang="scss">
.yaml-monaco-wrapper {
  height: 100%;
  width: 100%;
  
  :deep(.yaml-monaco-editor) {
    height: 100%;
    
    .editor-container {
      height: 100%;
      border: 1px solid var(--o-time-text);
    }
  }
}

// 保持原有的样式类名以兼容现有代码
.v-codemirror {
  height: 100%;
  width: 100%;
}

.outputYaml {
  background: var(--o-fill-color-extra-light);
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
}
</style>
