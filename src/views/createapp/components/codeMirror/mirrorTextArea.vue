<template>
  <codemirror
    v-model="code"
    class="codeMirror"
    ref="mycodemirror"
    :autofocus="true"
    :extensions="extensions"
    :indent-with-tab="true"
    :disabled="isDisabled"
    @change="handleChange"
    @update="updateFunc"
    :tab-size="2"
  />
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { yaml } from '@codemirror/lang-yaml';

const emits = defineEmits(['update:updateVal']);
const code = ref('');
const isDisabled = ref(false);
const extensions = [yaml()];
const handleChange = (e: string) => {
  code.value = e;
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

const updateFunc = () => {
  const foldDoms = document.querySelectorAll('span[title="Fold line"]');
  foldDoms.forEach(dom => {
    dom.innerText = '';
  });

  const unFoldDoms = document.querySelectorAll('span[title="Unfold line"]');
  unFoldDoms.forEach(dom => {
    dom.innerText = '';
  });
};
</script>
<style lang="scss" scoped>
.v-codemirror {
  height: 100%;
  width: 100%;
  ::v-deep(.cm-editor) {
    height: 100%;
    border: 1px solid var(--o-time-text);
    .cm-gutters {
      background-color: var(--o-bash-bg);
      span[title='Fold line'] {
        width: 0;
        height: 0;
        display: block;
        border: 4px solid transparent;
        border-top: 4px solid #8d98aa;
        margin-top: 8px;
        padding: 0;
      }
      span[title='Unfold line'] {
        width: 0;
        height: 0;
        display: block;
        border: 4px solid transparent;
        border-left: 4px solid #8d98aa;
        margin-top: 6px;
        margin-left: 4px;
        padding: 0;
      }
    }
  }
  .cm-focused {
    outline: none;
  }
}
.outputYaml {
  .cm-editor {
    border: none;
    .cm-gutters {
      display: none;
    }
    .cm-content {
      .cm-activeLine {
        background-color: transparent;
      }
      .ͼl {
        color: var(--o-text-color-secondary);
      }
    }
  }
}
</style>
