<template>
  <codemirror
    v-model="code"
    ref="mycodemirror"
    :autofocus="true"
    :extensions="extensions"
    :indent-with-tab="true"
    @change="handleChange"
    :tab-size="2"
  />
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { yaml } from '@codemirror/lang-yaml';

const emits = defineEmits(['update:updateVal']);
const code = ref('');
const extensions = [yaml()];
const handleChange = (e: string) => {
  code.value = e;
  emits('update:updateVal', code.value);
};
const props = defineProps<{
  yamlCode: any;
}>();
watch(
  () => props.yamlCode,
  () => {
    code.value = props.yamlCode;
  },
  { deep: true, immediate: true },
);
</script>
<style lang="scss">
.v-codemirror {
  height: 100%;
  width: 100%;
  .cm-editor {
    height: 100%;
    border: 1px solid var(--o-time-text);
    .cm-gutters {
      background-color: var(--o-bash-bg);
    }
  }
  .cm-focused {
    outline: none;
  }
}
</style>
