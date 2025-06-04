<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { storeToRefs } from 'pinia';
import * as monaco from 'monaco-editor';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { useChangeThemeStore } from '@/store';

const props = defineProps<{
  code?: string;
}>();

defineExpose({
  getJsonValue,
  setJsonValue,
});

const { theme } = storeToRefs(useChangeThemeStore());

const monacoEditorRef = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | undefined = undefined;

function getJsonValue() {
  if (!editor) return '';
  return editor.getValue();
}

function setJsonValue(value: string) {
  if (!editor) return;
  editor.setValue(value);
}

function initMonacoEditor() {
  if (!monacoEditorRef.value) return;
  window.MonacoEnvironment = {
    getWorker(_: string, label: string) {
      if (label === 'json') {
        return new jsonWorker();
      }
      if (['typescript', 'javascript'].includes(label)) {
        return new tsWorker();
      }
      return new EditorWorker();
    },
  };

  editor = monaco.editor.create(monacoEditorRef.value, {
    value: props.code || '{\n  \n}',
    language: 'json',
    theme: theme.value === 'dark' ? 'vs-dark' : 'vs',
    tabSize: 4,
    automaticLayout: true,
    insertSpaces: true,
    folding: false,
    roundedSelection: true,
  });
}

watch(
  () => theme.value,
  () => {
    if (editor) {
      editor.updateOptions({
        theme: theme.value === 'dark' ? 'vs-dark' : 'vs',
      });
    }
  },
  {
    deep: true,
    immediate: true,
  },
);

onMounted(() => {
  initMonacoEditor();
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
    editor = undefined;
  }
});
</script>
<template>
  <div ref="monacoEditorRef" class="editor-container" />
</template>
<style lang="scss" scoped>
.editor-container {
  width: 100%;
  height: 355px;

  :deep(.monaco-editor) {
    outline: none;

    .overflow-guard {
      border: 1px solid rgb(195, 206, 223);
      border-radius: 4px;
    }
  }
}

.code-container {
  height: 100%;
}

.line-numbers {
  text-align: center !important;
}

.inputarea {
  position: absolute !important;
  left: unset !important;
  height: 1px !important;
  opacity: 0;
  margin-top: 20px;
}
</style>
