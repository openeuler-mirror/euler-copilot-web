<script setup>
import * as monaco from 'monaco-editor';
import { onMounted, ref, toRaw, watch } from 'vue';
import { configureMonacoYaml } from 'monaco-yaml';
import YamlWorker from './yaml.worker.js?worker';
import { useChangeThemeStore } from '@/store/';
const editorContainer = ref();
const editor = ref();
const themeStore = useChangeThemeStore();

const props = defineProps({
  readOnly: {
    type: Boolean,
    default: true,
  },
  yamlContent: {
    type: String,
    default: '',
  },
  handleQueryYamlValue: {
    type: Function,
    default: () => {},
  },
});

watch(
  () => props.readOnly,
  (oldVal, newVal) => {
    editor.value.updateOptions({
      readOnly: !newVal,
    });
  },
);

watch(
  () => themeStore.theme,
  () => {
    if (editor.value) {
      editor.value.updateOptions({
        theme: themeStore.theme === 'dark' ? 'vs-dark' : 'vs',
      });
    }
  },
  {
    deep: true,
    immediate: true,
  },
);
let prettierc = null;
onMounted(() => {
  if (editorContainer.value) {
    window.MonacoEnvironment = {
      getWorker(moduleId, label) {
        switch (label) {
          case 'yaml':
            return new YamlWorker();
          default:
            throw new Error(`Unknown label ${label}`);
        }
      },
    };
    configureMonacoYaml(monaco, {
      enableSchemaRequest: true,
      isKubernetes: true,
    });

    editor.value = monaco.editor.create(editorContainer.value, {
      value: props.yamlContent || '',
      language: 'yaml',
      theme: themeStore.theme === 'dark' ? 'vs-dark' : 'vs',
      glyphMargin: true,
      lineNumbersMinChars: 7,
      wordWrap: 'on',
      wordWrapColumn: 2,
      wrappingIndent: 'same',
      tabSize: 2, // 设置Tab大小为2
      insertSpaces: true, // 使用空格进行缩进
      automaticLayout: true,
      lineNumbersMinChars: 2, // 设置行号的最小字符数，间接影响宽度
      lineDecorationsWidth: 10,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true,
      },
      readOnly: props.readOnly,
    });
  }

  editor.value.onDidChangeModelContent(() => {
    props.handleQueryYamlValue(toRaw(editor.value).getValue());
  });
});
</script>

<template>
  <div ref="editorContainer" class="container"></div>
</template>
<style>
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
<style scoped>
.container {
  width: 100%;
  height: 100%;
}
</style>
