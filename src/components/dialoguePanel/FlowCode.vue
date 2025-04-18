<script setup lang="ts">
import { ref, onMounted, watch, shallowRef } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { storeToRefs } from 'pinia';
import { useChangeThemeStore, useHistorySessionStore } from '@/store/';
const { params } = storeToRefs(useHistorySessionStore());
const themeStore = useChangeThemeStore();
const CODE_STYLE = {
  width: '100%',
  height: '100%',
  maxHeight: '200px',
  overflowY: 'auto',
  // backgroundColor: '#f4f6fa',
  fontSize: '14px',
  lineHeight: '16px',
};
const props = withDefaults(
  defineProps<{
    code: object; // 添加jsonData属性
    title: string;
    disabled?: boolean;
  }>(),
  {
    needCheck: true,
  },
);

const code = ref(JSON.stringify(props.code, null, 2));

const codeMirrorView = shallowRef();
// const extensions = [StreamLanguage.define(json)];
const extensions = ref([json()]);
const handleReady = (payload) => {
  codeMirrorView.value = payload.view;
  setTimeout(() => {
    payload.view.scrollDOM.scrollTop = 0;
  }, 100);
};
const handleChange = (payload) => {
  params.value = payload;
};

const copy = () => {
  if (codeMirrorView.value) {
    navigator.clipboard
      .writeText(code.value)
      .then(() => {
        console.log('文本已复制到剪切板');
      })
      .catch((err) => {
        console.error('复制文本时出错:', err);
      });
  }
};

watch(
  () => code,
  () => {
    params.value = code;
  },
);

watch(
  () => themeStore.theme,
  () => {
    if (themeStore.theme === 'dark') {
      extensions.value = [json(), oneDark];
    } else {
      extensions.value = [json()];
    }
  },
);
onMounted(() => {
  if (themeStore.theme === 'dark') {
    extensions.value = [json(), oneDark];
  } else {
    extensions.value = [json()];
  }
});
</script>

<template>
  <div class="json-display">
    <div class="json-header">
      <span v-if="props.title === 'input'">输入</span>
      <span v-else-if="props.title === 'output'">输出</span>
      <span v-else-if="props.title === 'params'">参数</span>
      <span v-else>补充参数 {{ props.title }}</span>
      <span
        @click="copy()"
        class="copyIcon"
        :class="themeStore.theme === 'light' ? 'lightCopy' : 'darkCopy'"
      ></span>
    </div>
    <div class="code-container">
      <Codemirror
        v-model="code"
        placeholder="Code goes here..."
        :style="CODE_STYLE"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
        :disabled="disabled"
        @ready="handleReady"
        @change="handleChange"
      />
    </div>
  </div>
  <div></div>
</template>

<style scoped>
.code-container {
  background-color: white;
  background: white !important;
}
.json-display {
  font-family: Arial, sans-serif;
  margin: 0 auto;
}

.copyIcon {
  width: 16px;
  cursor: pointer;
}
.lightCopy {
  background: url(@/assets/svgs/light_copy.svg) center center no-repeat;
}
.darkCopy {
  background: url(@/assets/svgs/light_copy.svg) center center no-repeat;
}

h2 {
  color: #333;
  text-align: center;
}

.copy-button {
  position: relative;
  border: none;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.copy-button:disabled {
  cursor: not-allowed;
}
.json-header {
  display: flex;
  position: relative;
  justify-content: space-between;
  background-color: var(--o-bg-color-light2) !important;
  border: var(--o-flow-code-border) 1px solid;
  border-radius: 4px 4px 0px 0px;
  margin-top: 12px;
  bottom: -2px;
  padding: 0px 16px;
  height: 32px;
  span {
    color: var(--o-text-color-primarys);
    height: 32px;
    align-items: center;
    align-content: center;
  }
}
pre {
  overflow-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap; /* 保持缩进同时允许换行 */
  margin: 8px 0px;
  border: 1px solid black;
  overflow-y: scroll;
  .code-toolbar {
    user-select: none;
    background-color: var(--o-bash-bg);
    color: var(--o-text-color-primarys);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 8px 8px 0 0;
    padding: 8px 12px 0 12px;
    font-family:
      Inter,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      sans-serif;
    .pre-copy {
      cursor: pointer;
      svg {
        vertical-align: middle;
      }
      &:hover {
        color: var(--o-text-color-secondary);
      }
    }
  }
  code {
    background-color: var(--o-bash-bg);
    border-radius: 0 0 8px 8px;
  }
}
</style>
